import type { AccountStatus, User, VerificationKind } from "@prisma/client";
import { db } from "../db";
import { AppError } from "../errors";
import { audit } from "../audit";
import { rateLimit } from "../rate-limit";
import { notify } from "./notifications";
import { putObject, deleteObject } from "../storage";
import { parse, reportSchema, verificationSubmitSchema } from "../validation";
import { randomToken } from "../crypto";
import { hashPassword, verifyPassword } from "../auth/password";
import { recomputeDerived } from "./ventures";

type Actor = Pick<User, "id" | "role" | "emailVerifiedAt">;

function requireAdmin(actor: Actor) {
  if (actor.role !== "ADMIN") throw new AppError("FORBIDDEN", "Administrator access required.");
}

// ─── Verification ───────────────────────────────────────────────────────────

const KIND_FOR_ROLE: Record<VerificationKind, User["role"]> = {
  IDENTITY: "FOUNDER",
  OWNERSHIP: "FOUNDER",
  FINANCIAL: "FOUNDER",
  BUYER_FUNDS: "BUYER",
};

/**
 * Submitting evidence creates a PENDING request. It never changes a badge on its own:
 * only reviewVerification() with an APPROVED decision does.
 */
export async function submitVerification(actor: Actor, input: unknown, files: File[]) {
  const data = parse(verificationSubmitSchema, input);
  if (KIND_FOR_ROLE[data.kind] !== actor.role) throw new AppError("FORBIDDEN", "This verification does not apply to your account.");
  if (!actor.emailVerifiedAt) throw new AppError("FORBIDDEN", "Verify your email address first (level 1).");
  const perVenture = data.kind === "OWNERSHIP" || data.kind === "FINANCIAL";
  if (perVenture) {
    const v = data.ventureId ? await db.venture.findUnique({ where: { id: data.ventureId } }) : null;
    if (!v || v.founderId !== actor.id) throw new AppError("VALIDATION", "Choose one of your ventures.", { ventureId: "Required" });
  }
  const ventureId = perVenture ? data.ventureId : null;
  const prior = await db.verificationRequest.findMany({ where: { userId: actor.id } });
  if (data.kind === "OWNERSHIP" || data.kind === "FINANCIAL") {
    const identityOk = prior.some((p) => p.kind === "IDENTITY" && p.status === "APPROVED");
    if (!identityOk) throw new AppError("VALIDATION", "Identity verification (level 2) must be approved first.");
  }
  if (data.kind === "FINANCIAL" && !prior.some((p) => p.kind === "OWNERSHIP" && p.ventureId === ventureId && p.status === "APPROVED"))
    throw new AppError("VALIDATION", "Ownership verification (level 3) for this venture must be approved first.");
  if (prior.some((p) => p.kind === data.kind && p.ventureId === ventureId && p.status === "PENDING"))
    throw new AppError("CONFLICT", "You already have a pending submission for this step.");
  const realFiles = files.filter((f) => f && f.size > 0);
  if (realFiles.length === 0) throw new AppError("VALIDATION", "Attach at least one supporting document.", { files: "Required" });
  if (realFiles.length > 5) throw new AppError("VALIDATION", "Attach up to 5 documents.", { files: "Too many files" });
  await rateLimit(`verify:${actor.id}`, 10, 86400);

  const stored: { key: string; size: number; mimeType: string; name: string }[] = [];
  try {
    for (const f of realFiles) stored.push({ ...(await putObject(`verification/${actor.id}`, f)), name: f.name });
  } catch (e) {
    await Promise.all(stored.map((s) => deleteObject(s.key)));
    throw e;
  }
  const req = await db.verificationRequest.create({
    data: {
      userId: actor.id,
      ventureId,
      kind: data.kind,
      statement: data.statement,
      documents: {
        create: stored.map((s) => ({ filename: s.name.slice(0, 160), mimeType: s.mimeType, size: s.size, storageKey: s.key })),
      },
    },
  });
  if (data.kind === "BUYER_FUNDS") await db.buyerProfile.updateMany({ where: { userId: actor.id }, data: { verification: "PENDING" } });
  await audit({ actorId: actor.id, action: "verification.submitted", targetType: "verification", targetId: req.id, metadata: { kind: data.kind } });
  return req;
}

const DEFAULT_VALIDITY_DAYS: Record<VerificationKind, number> = { IDENTITY: 730, OWNERSHIP: 365, FINANCIAL: 180, BUYER_FUNDS: 180 };

export async function reviewVerification(
  actor: Actor,
  requestId: string,
  input: { decision: "APPROVED" | "REJECTED"; note?: string | null; markMetricsVerified?: boolean },
) {
  requireAdmin(actor);
  const req = await db.verificationRequest.findUnique({ where: { id: requestId }, include: { venture: true } });
  if (!req) throw new AppError("NOT_FOUND", "Request not found.");
  if (req.status !== "PENDING") throw new AppError("CONFLICT", "This request has already been reviewed.");
  if (req.userId === actor.id) throw new AppError("FORBIDDEN", "You cannot review your own submission.");
  if (input.decision === "REJECTED" && !input.note?.trim())
    throw new AppError("VALIDATION", "Explain the rejection so the user can fix it.", { note: "Required" });
  const approved = input.decision === "APPROVED";
  await db.verificationRequest.update({
    where: { id: requestId },
    data: {
      status: input.decision,
      reviewerId: actor.id,
      reviewNote: input.note?.slice(0, 1000) || null,
      reviewedAt: new Date(),
      expiresAt: approved ? new Date(Date.now() + DEFAULT_VALIDITY_DAYS[req.kind] * 86400_000) : null,
    },
  });
  if (req.kind === "BUYER_FUNDS")
    await db.buyerProfile.updateMany({ where: { userId: req.userId }, data: { verification: approved ? "VERIFIED" : "UNVERIFIED" } });
  if (approved && req.kind === "FINANCIAL" && req.ventureId && input.markMetricsVerified) {
    await db.metric.updateMany({
      where: {
        ventureId: req.ventureId,
        nature: "HISTORICAL",
        value: { not: null },
        source: { in: ["FOUNDER_REPORTED", "ESTIMATED"] },
      },
      data: { source: "VERIFIED", evidence: `Reviewed by ${"platform"} on ${new Date().toISOString().slice(0, 10)} (manual document review)` },
    });
    await recomputeDerived(req.ventureId);
  }
  await audit({
    actorId: actor.id,
    action: `verification.${input.decision.toLowerCase()}`,
    targetType: "verification",
    targetId: requestId,
    metadata: { kind: req.kind, subject: req.userId, markMetricsVerified: !!input.markMetricsVerified },
  });
  await notify(req.userId, {
    type: "verification.reviewed",
    title: approved ? "Your verification was approved" : "Your verification needs attention",
    body: input.note ?? undefined,
    link: req.kind === "BUYER_FUNDS" ? "/settings" : "/founder/verification",
  });
}

/** Marks approvals past their expiry as EXPIRED. Safe to run on every admin page load or from a cron. */
export async function expireVerifications() {
  const r = await db.verificationRequest.updateMany({
    where: { status: "APPROVED", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
  return r.count;
}

export async function authorizeVerificationDocument(actor: Actor, documentId: string, ip?: string | null) {
  const doc = await db.verificationDocument.findUnique({ where: { id: documentId }, include: { request: true } });
  // Only admins may open identity/ownership evidence. The submitting user cannot re-download it either,
  // which limits damage from a hijacked session.
  if (!doc || actor.role !== "ADMIN") {
    await audit({ actorId: actor.id, action: "verification_document.access_denied", targetType: "verification_document", targetId: documentId, ip });
    throw new AppError("NOT_FOUND", "Document not found.");
  }
  await audit({ actorId: actor.id, action: "verification_document.viewed", targetType: "verification_document", targetId: documentId, ip });
  return doc;
}

// ─── Moderation ─────────────────────────────────────────────────────────────

export async function createReport(actor: Actor, input: unknown) {
  const data = parse(reportSchema, input);
  await rateLimit(`report:${actor.id}`, 10, 86400);
  const report = await db.report.create({ data: { ...data, reporterId: actor.id } });
  if (data.targetType === "VENTURE") await db.venture.updateMany({ where: { id: data.targetId }, data: { flagged: true } });
  await audit({ actorId: actor.id, action: "report.created", targetType: data.targetType.toLowerCase(), targetId: data.targetId });
  return report;
}

export async function resolveReport(actor: Actor, reportId: string, status: "RESOLVED" | "DISMISSED", resolution?: string) {
  requireAdmin(actor);
  await db.report.update({ where: { id: reportId }, data: { status, resolution: resolution?.slice(0, 1000), resolvedAt: new Date() } });
  await audit({ actorId: actor.id, action: `report.${status.toLowerCase()}`, targetType: "report", targetId: reportId });
}

export async function moderateVenture(
  actor: Actor,
  ventureId: string,
  action: "remove" | "restore" | "feature" | "unfeature" | "clear_flag",
  note?: string,
) {
  requireAdmin(actor);
  const v = await db.venture.findUnique({ where: { id: ventureId } });
  if (!v) throw new AppError("NOT_FOUND", "Venture not found.");
  const data =
    action === "remove"
      ? { status: "REMOVED" as const, moderationNote: note?.slice(0, 500) || "Removed by moderation" }
      : action === "restore"
        ? { status: "PAUSED" as const, moderationNote: null }
        : action === "feature"
          ? { featured: true }
          : action === "unfeature"
            ? { featured: false }
            : { flagged: false };
  if (action === "remove" && !note?.trim()) throw new AppError("VALIDATION", "Give a reason for removal.");
  await db.venture.update({ where: { id: ventureId }, data });
  await audit({ actorId: actor.id, action: `venture.${action}`, targetType: "venture", targetId: ventureId, metadata: { note: note ?? null } });
  if (action === "remove" || action === "restore")
    await notify(v.founderId, {
      type: "venture.moderated",
      title: action === "remove" ? `${v.alias} was removed by moderation` : `${v.alias} was restored (paused — publish it again when ready)`,
      body: note,
      link: "/founder",
    });
}

export async function setUserStatus(actor: Actor, userId: string, status: Extract<AccountStatus, "ACTIVE" | "SUSPENDED">) {
  requireAdmin(actor);
  if (userId === actor.id) throw new AppError("FORBIDDEN", "You cannot change your own account status.");
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || target.status === "DELETED") throw new AppError("NOT_FOUND", "User not found.");
  if (target.role === "ADMIN") throw new AppError("FORBIDDEN", "Administrator accounts are managed from the command line.");
  await db.user.update({ where: { id: userId }, data: { status } });
  if (status === "SUSPENDED") {
    await db.session.deleteMany({ where: { userId } });
    await db.venture.updateMany({ where: { founderId: userId, status: "PUBLISHED" }, data: { status: "PAUSED" } });
  }
  await audit({ actorId: actor.id, action: `user.${status.toLowerCase()}`, targetType: "user", targetId: userId });
}

// ─── Account: export & deletion ─────────────────────────────────────────────

export async function exportAccountData(userId: string) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true, email: true, role: true, createdAt: true, emailVerifiedAt: true, lastLoginAt: true,
      privacyAcceptedAt: true, privacyVersion: true,
      notifyEmailMessages: true, notifyEmailRequests: true, notifyEmailUpdates: true,
      founderProfile: true,
      buyerProfile: true,
      ventures: { include: { metrics: true, documents: { select: { id: true, title: true, filename: true, tier: true, createdAt: true } } } },
      verificationRequests: { select: { id: true, kind: true, status: true, statement: true, createdAt: true, reviewedAt: true, expiresAt: true, documents: { select: { filename: true, createdAt: true } } } },
      interactions: true,
      views: true,
      accessRequests: true,
      pipeline: true,
      messages: { select: { id: true, conversationId: true, body: true, kind: true, createdAt: true } },
      offers: true,
      notifications: true,
    },
  });
  await audit({ actorId: userId, action: "user.data_exported", targetType: "user", targetId: userId });
  return { exportedAt: new Date().toISOString(), note: "Personal data export. Audit logs are retained separately for security and legal purposes.", user };
}

export async function deleteAccount(userId: string, password: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await verifyPassword(password, user.passwordHash)))
    throw new AppError("VALIDATION", "Password is incorrect.", { password: "Incorrect password" });
  if (user.role === "ADMIN") throw new AppError("FORBIDDEN", "Administrator accounts are removed from the command line.");

  const [verDocs, ventureDocs] = await Promise.all([
    db.verificationDocument.findMany({ where: { request: { userId } }, select: { storageKey: true } }),
    db.ventureDocument.findMany({ where: { venture: { founderId: userId } }, select: { storageKey: true } }),
  ]);

  await db.$transaction([
    db.verificationRequest.deleteMany({ where: { userId } }),
    db.venture.deleteMany({ where: { founderId: userId } }),
    db.founderProfile.deleteMany({ where: { userId } }),
    db.buyerProfile.deleteMany({ where: { userId } }),
    db.ventureInteraction.deleteMany({ where: { userId } }),
    db.ventureView.deleteMany({ where: { userId } }),
    db.pipelineEntry.deleteMany({ where: { buyerId: userId } }),
    db.notification.deleteMany({ where: { userId } }),
    db.session.deleteMany({ where: { userId } }),
    db.authToken.deleteMany({ where: { userId } }),
    db.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@deleted.invalid`,
        passwordHash: await hashPassword(randomToken(24)),
        status: "DELETED",
        emailVerifiedAt: null,
      },
    }),
  ]);
  await Promise.all([...verDocs, ...ventureDocs].map((d) => deleteObject(d.storageKey)));
  await audit({ actorId: null, action: "user.deleted", targetType: "user", targetId: userId });
}

import type { BuyerProfile, PipelineStage, User } from "@prisma/client";
import { db } from "../db";
import { AppError } from "../errors";
import { audit } from "../audit";
import { rateLimit } from "../rate-limit";
import { notify } from "./notifications";
import { canRequestAccess, canViewDataRoom, canViewDetails, isAdmin, isOwner } from "../authz";
import { BRAND } from "../brand";
import { formatMoney } from "../format";
import { PIPELINE_LABEL, BUYER_CATEGORY_LABEL } from "../labels";
import { parse, accessRequestSchema, messageSchema, offerSchema } from "../validation";

type Actor = Pick<User, "id" | "role" | "emailVerifiedAt">;

const STAGE_ORDER: PipelineStage[] = [
  "DISCOVERED", "INTERESTED", "INFO_REQUESTED", "IN_DISCUSSION", "DUE_DILIGENCE", "OFFER_SUBMITTED", "COMPLETED", "ARCHIVED",
];

/** Moves a pipeline entry forward automatically, never backwards. */
async function advancePipeline(buyerId: string, ventureId: string, stage: PipelineStage) {
  const entry = await db.pipelineEntry.findUnique({ where: { buyerId_ventureId: { buyerId, ventureId } } });
  if (!entry) {
    await db.pipelineEntry.create({ data: { buyerId, ventureId, stage } });
  } else if (entry.stage !== "ARCHIVED" && STAGE_ORDER.indexOf(stage) > STAGE_ORDER.indexOf(entry.stage)) {
    await db.pipelineEntry.update({ where: { id: entry.id }, data: { stage } });
  }
}

/**
 * What a founder sees about a buyer: the alias, verification status, and only the
 * profile fields the buyer chose to disclose. Never the email or legal identity.
 */
export function buyerPublicCard(p: BuyerProfile | null) {
  if (!p) return { alias: "Anonymous buyer", verification: "UNVERIFIED" as const, disclosed: [] as { label: string; value: string }[] };
  const disclosed: { label: string; value: string }[] = [];
  if (p.discloseCategory) disclosed.push({ label: "Buyer type", value: BUYER_CATEGORY_LABEL[p.category] });
  if (p.discloseBudget && (p.budgetMin != null || p.budgetMax != null))
    disclosed.push({
      label: "Budget",
      value: `${p.budgetMin != null ? formatMoney(p.budgetMin) : "—"} – ${p.budgetMax != null ? formatMoney(p.budgetMax) : "—"}`,
    });
  if (p.discloseExperience && p.experience) disclosed.push({ label: "Experience", value: p.experience });
  if (p.discloseThesis && p.thesis) disclosed.push({ label: "Thesis", value: p.thesis });
  return { alias: p.alias, verification: p.verification, disclosed };
}

// ─── Access requests ────────────────────────────────────────────────────────

export async function requestAccess(actor: Actor, ventureId: string, input: unknown) {
  if (actor.role !== "BUYER") throw new AppError("FORBIDDEN", "Only buyer accounts can request information.");
  if (!actor.emailVerifiedAt)
    throw new AppError("FORBIDDEN", "Verify your email before contacting founders. Anonymous, but accountable.");
  const profile = await db.buyerProfile.findUnique({ where: { userId: actor.id } });
  if (!profile) throw new AppError("FORBIDDEN", "Create your buyer profile (alias) before contacting founders.");
  const data = parse(accessRequestSchema, input);
  const venture = await db.venture.findUnique({ where: { id: ventureId } });
  if (!venture || !canRequestAccess(venture, actor)) throw new AppError("NOT_FOUND", "Venture not available.");
  if (venture.requireNda && !data.acceptNda)
    throw new AppError("VALIDATION", "This founder requires the platform NDA before sharing information.", {
      acceptNda: "Accept the NDA to continue.",
    });
  await rateLimit(`access:${actor.id}`, 20, 86400);

  const existing = await db.accessRequest.findUnique({
    where: { ventureId_buyerId_level: { ventureId, buyerId: actor.id, level: data.level } },
  });
  if (existing && (existing.status === "PENDING" || existing.status === "APPROVED"))
    throw new AppError("CONFLICT", existing.status === "PENDING" ? "Your request is already pending." : "You already have access.");
  if (existing?.status === "REJECTED" && existing.decidedAt && Date.now() - existing.decidedAt.getTime() < 14 * 86400_000)
    throw new AppError("CONFLICT", "The founder declined this request recently. You can ask again 14 days after the decision.");

  const fields = {
    status: "PENDING" as const,
    message: data.message,
    ndaAcceptedAt: data.acceptNda ? new Date() : null,
    ndaVersion: data.acceptNda ? BRAND.ndaVersion : null,
    decidedAt: null,
    decisionNote: null,
    expiresAt: null,
  };
  const request = existing
    ? await db.accessRequest.update({ where: { id: existing.id }, data: fields })
    : await db.accessRequest.create({ data: { ventureId, buyerId: actor.id, level: data.level, ...fields } });

  await advancePipeline(actor.id, ventureId, "INFO_REQUESTED");
  await audit({
    actorId: actor.id,
    action: "access.requested",
    targetType: "venture",
    targetId: ventureId,
    metadata: { level: data.level, nda: !!data.acceptNda },
  });
  await notify(venture.founderId, {
    type: "access.requested",
    title: `${profile.alias} requested ${data.level === "DATA_ROOM" ? "data-room access" : "more information"} on ${venture.alias}`,
    link: "/founder/requests",
  });
  return request;
}

export async function withdrawAccessRequest(actor: Actor, requestId: string) {
  const r = await db.accessRequest.findUnique({ where: { id: requestId } });
  if (!r || r.buyerId !== actor.id) throw new AppError("NOT_FOUND", "Request not found.");
  if (r.status !== "PENDING") throw new AppError("CONFLICT", "Only pending requests can be withdrawn.");
  await db.accessRequest.update({ where: { id: requestId }, data: { status: "WITHDRAWN" } });
}

export async function decideAccess(
  actor: Actor,
  requestId: string,
  decision: "APPROVE" | "REJECT" | "REVOKE",
  note?: string | null,
) {
  const r = await db.accessRequest.findUnique({ where: { id: requestId }, include: { venture: true } });
  if (!r || !isOwner(r.venture, actor)) throw new AppError("NOT_FOUND", "Request not found.");
  if (decision === "REVOKE" ? r.status !== "APPROVED" : r.status !== "PENDING")
    throw new AppError("CONFLICT", "This request has already been handled.");
  const status = decision === "APPROVE" ? "APPROVED" : decision === "REJECT" ? "REJECTED" : "REVOKED";
  const expiresAt = decision === "APPROVE" && r.level === "DATA_ROOM" ? new Date(Date.now() + 90 * 86400_000) : null;
  const updated = await db.accessRequest.update({
    where: { id: requestId },
    data: { status, decidedAt: new Date(), decisionNote: note?.slice(0, 500) || null, expiresAt: decision === "APPROVE" ? expiresAt : r.expiresAt },
  });

  if (decision === "APPROVE") {
    const convo = await db.conversation.upsert({
      where: { ventureId_buyerId: { ventureId: r.ventureId, buyerId: r.buyerId } },
      create: { ventureId: r.ventureId, buyerId: r.buyerId, founderId: r.venture.founderId },
      update: { closed: false },
    });
    const hasMessages = await db.message.count({ where: { conversationId: convo.id } });
    if (!hasMessages) {
      await db.message.create({ data: { conversationId: convo.id, senderId: r.buyerId, body: r.message } });
    }
    await db.message.create({
      data: {
        conversationId: convo.id,
        kind: "SYSTEM",
        body:
          r.level === "DATA_ROOM"
            ? "The founder approved data-room access for 90 days. Access is logged."
            : "The founder approved the information request. Detailed listing information is now visible.",
      },
    });
    await advancePipeline(r.buyerId, r.ventureId, r.level === "DATA_ROOM" ? "DUE_DILIGENCE" : "IN_DISCUSSION");
  }
  if (decision === "REVOKE") {
    const convo = await db.conversation.findUnique({ where: { ventureId_buyerId: { ventureId: r.ventureId, buyerId: r.buyerId } } });
    if (convo)
      await db.message.create({
        data: { conversationId: convo.id, kind: "SYSTEM", body: `The founder revoked ${r.level === "DATA_ROOM" ? "data-room" : "information"} access.` },
      });
  }

  await audit({
    actorId: actor.id,
    action: `access.${status.toLowerCase()}`,
    targetType: "access_request",
    targetId: requestId,
    metadata: { ventureId: r.ventureId, level: r.level },
  });
  const verb = { APPROVE: "approved", REJECT: "declined", REVOKE: "revoked" }[decision];
  await notify(r.buyerId, {
    type: `access.${verb}`,
    title: `The founder of ${r.venture.alias} ${verb} your ${r.level === "DATA_ROOM" ? "data-room" : "information"} request`,
    link: decision === "APPROVE" ? `/ventures/${r.venture.slug}` : "/buyer/requests",
  });
  return updated;
}

export async function founderRequests(actor: Actor) {
  const rows = await db.accessRequest.findMany({
    where: { venture: { founderId: actor.id } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      venture: { select: { id: true, alias: true, slug: true } },
      buyer: { select: { buyerProfile: true } }, // email deliberately NOT selected
    },
  });
  return rows.map((r) => ({
    id: r.id,
    venture: r.venture,
    level: r.level,
    status: r.status,
    message: r.message,
    ndaAcceptedAt: r.ndaAcceptedAt,
    createdAt: r.createdAt,
    decidedAt: r.decidedAt,
    expiresAt: r.expiresAt,
    buyer: buyerPublicCard(r.buyer.buyerProfile),
  }));
}

// ─── Messaging ──────────────────────────────────────────────────────────────

async function participantConversation(actor: Actor, conversationId: string) {
  const c = await db.conversation.findUnique({
    where: { id: conversationId },
    include: { venture: { select: { id: true, alias: true, slug: true, founderId: true } } },
  });
  if (!c || (c.buyerId !== actor.id && c.founderId !== actor.id)) throw new AppError("NOT_FOUND", "Conversation not found.");
  return c;
}

export async function listConversations(actor: Actor) {
  const rows = await db.conversation.findMany({
    where: { OR: [{ buyerId: actor.id }, { founderId: actor.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      venture: { select: { alias: true, slug: true, coverSeed: true } },
      buyer: { select: { buyerProfile: { select: { alias: true } } } },
      founder: { select: { founderProfile: { select: { displayName: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: { where: { readAt: null, NOT: { senderId: actor.id } } } } },
    },
  });
  return rows.map((c) => ({
    id: c.id,
    venture: c.venture,
    counterpart: c.buyerId === actor.id ? c.founder.founderProfile?.displayName ?? "Founder" : c.buyer.buyerProfile?.alias ?? "Buyer",
    last: c.messages[0] ?? null,
    unread: c._count.messages,
    updatedAt: c.updatedAt,
    closed: c.closed,
  }));
}

export async function getConversation(actor: Actor, conversationId: string) {
  const c = await participantConversation(actor, conversationId);
  await db.message.updateMany({
    where: { conversationId, readAt: null, NOT: { senderId: actor.id } },
    data: { readAt: new Date() },
  });
  const [messages, offers, buyerProfile, founderProfile] = await Promise.all([
    db.message.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" } }),
    db.offer.findMany({ where: { conversationId }, orderBy: { createdAt: "desc" } }),
    db.buyerProfile.findUnique({ where: { userId: c.buyerId } }),
    db.founderProfile.findUnique({ where: { userId: c.founderId }, select: { displayName: true, companyRole: true } }),
  ]);
  return {
    id: c.id,
    closed: c.closed,
    venture: c.venture,
    role: c.buyerId === actor.id ? ("BUYER" as const) : ("FOUNDER" as const),
    buyer: buyerPublicCard(buyerProfile),
    buyerId: c.buyerId,
    founderName: founderProfile?.displayName ?? "Founder",
    founderRole: founderProfile?.companyRole ?? null,
    messages: messages.map((m) => ({
      id: m.id,
      kind: m.kind,
      body: m.body,
      createdAt: m.createdAt,
      mine: m.senderId === actor.id,
      from: m.kind === "SYSTEM" ? "System" : m.senderId === c.buyerId ? buyerProfile?.alias ?? "Buyer" : founderProfile?.displayName ?? "Founder",
    })),
    offers,
  };
}

export async function sendMessage(actor: Actor, conversationId: string, input: unknown) {
  const c = await participantConversation(actor, conversationId);
  if (c.closed) throw new AppError("CONFLICT", "This conversation is closed.");
  const { body } = parse(messageSchema, input);
  await rateLimit(`msg:${actor.id}`, 30, 600);
  const m = await db.message.create({ data: { conversationId, senderId: actor.id, body } });
  await db.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  const recipient = c.buyerId === actor.id ? c.founderId : c.buyerId;
  // Don't send one notification per message: only if the recipient has no unread message notice.
  const pending = await db.notification.count({
    where: { userId: recipient, type: "message.new", link: `/messages/${conversationId}`, readAt: null },
  });
  if (!pending)
    await notify(recipient, { type: "message.new", title: `New message about ${c.venture.alias}`, link: `/messages/${conversationId}` });
  return m;
}

// ─── Offers (non-binding only) ──────────────────────────────────────────────

export async function submitOffer(actor: Actor, conversationId: string, input: unknown) {
  const c = await participantConversation(actor, conversationId);
  if (c.buyerId !== actor.id) throw new AppError("FORBIDDEN", "Only the buyer can submit an offer.");
  if (c.closed) throw new AppError("CONFLICT", "This conversation is closed.");
  const data = parse(offerSchema, input);
  if (data.type === "INDICATIVE_OFFER" && data.amount == null)
    throw new AppError("VALIDATION", "An indicative offer needs an amount.", { amount: "Enter an amount." });
  await rateLimit(`offer:${actor.id}`, 10, 86400);
  const offer = await db.offer.create({
    data: {
      conversationId,
      ventureId: c.ventureId,
      buyerId: actor.id,
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      structure: data.structure,
      conditions: data.conditions,
    },
  });
  const label = data.type === "INDICATIVE_OFFER" ? "Indicative offer (non-binding)" : "Expression of interest (non-binding)";
  await db.message.create({
    data: {
      conversationId,
      senderId: actor.id,
      kind: "OFFER",
      body: `${label}${data.amount != null ? ` — ${formatMoney(data.amount, data.currency, false)}` : ""}\n\n${data.structure}${data.conditions ? `\n\nConditions: ${data.conditions}` : ""}`,
    },
  });
  await advancePipeline(actor.id, c.ventureId, "OFFER_SUBMITTED");
  await audit({ actorId: actor.id, action: "offer.submitted", targetType: "offer", targetId: offer.id, metadata: { type: data.type } });
  await notify(c.founderId, { type: "offer.new", title: `${label} received for ${c.venture.alias}`, link: `/messages/${conversationId}` });
  return offer;
}

export async function respondToOffer(actor: Actor, offerId: string, response: "ACKNOWLEDGED" | "DECLINED" | "WITHDRAWN") {
  const offer = await db.offer.findUnique({ where: { id: offerId }, include: { conversation: { include: { venture: true } } } });
  if (!offer) throw new AppError("NOT_FOUND", "Offer not found.");
  const c = offer.conversation;
  const allowed = response === "WITHDRAWN" ? offer.buyerId === actor.id : c.founderId === actor.id;
  if (!allowed) throw new AppError("NOT_FOUND", "Offer not found.");
  if (offer.status !== "OPEN") throw new AppError("CONFLICT", "This offer is no longer open.");
  await db.offer.update({ where: { id: offerId }, data: { status: response } });
  const text = { ACKNOWLEDGED: "acknowledged", DECLINED: "declined", WITHDRAWN: "withdrew" }[response];
  await db.message.create({
    data: {
      conversationId: c.id,
      kind: "SYSTEM",
      body: response === "WITHDRAWN" ? "The buyer withdrew their offer." : `The founder ${text} the offer. This is not an acceptance or a binding agreement.`,
    },
  });
  await audit({ actorId: actor.id, action: `offer.${response.toLowerCase()}`, targetType: "offer", targetId: offerId });
  await notify(response === "WITHDRAWN" ? c.founderId : c.buyerId, {
    type: "offer.updated",
    title: `Offer on ${c.venture.alias}: ${response.toLowerCase()}`,
    link: `/messages/${c.id}`,
  });
}

// ─── Buyer pipeline ─────────────────────────────────────────────────────────

export async function updatePipeline(actor: Actor, ventureId: string, input: { stage?: string; notes?: string | null }) {
  if (actor.role !== "BUYER") throw new AppError("FORBIDDEN", "Pipelines are for buyer accounts.");
  const entry = await db.pipelineEntry.findUnique({ where: { buyerId_ventureId: { buyerId: actor.id, ventureId } } });
  if (!entry) throw new AppError("NOT_FOUND", "This venture is not in your pipeline.");
  const stage = input.stage && (STAGE_ORDER as string[]).includes(input.stage) ? (input.stage as PipelineStage) : undefined;
  if (input.stage && !stage) throw new AppError("VALIDATION", "Unknown pipeline stage.");
  const notes = input.notes === undefined ? undefined : input.notes?.slice(0, 4000) || null;
  return db.pipelineEntry.update({ where: { id: entry.id }, data: { stage, notes } });
}

export const PIPELINE_STAGES = STAGE_ORDER.map((s) => ({ value: s, label: PIPELINE_LABEL[s] }));

// ─── Documents ──────────────────────────────────────────────────────────────

/** Server-side gate for every document download. Logs each successful access. */
export async function authorizeDocumentDownload(actor: Actor, documentId: string, ip?: string | null) {
  const doc = await db.ventureDocument.findUnique({ where: { id: documentId }, include: { venture: true } });
  if (!doc) throw new AppError("NOT_FOUND", "Document not found.");
  const grants = await db.accessRequest.findMany({ where: { ventureId: doc.ventureId, buyerId: actor.id } });
  const allowed =
    doc.tier === "DATA_ROOM" ? canViewDataRoom(doc.venture, actor, grants) : canViewDetails(doc.venture, actor, grants);
  if (!allowed) {
    await audit({ actorId: actor.id, action: "document.access_denied", targetType: "venture_document", targetId: documentId, ip });
    throw new AppError("NOT_FOUND", "Document not found.");
  }
  await audit({
    actorId: actor.id,
    action: isAdmin(actor) && !isOwner(doc.venture, actor) ? "document.admin_access" : "document.downloaded",
    targetType: "venture_document",
    targetId: documentId,
    metadata: { ventureId: doc.ventureId, tier: doc.tier },
    ip,
  });
  return doc;
}

export async function dataRoomFor(actor: Actor, ventureId: string) {
  const venture = await db.venture.findUnique({ where: { id: ventureId } });
  if (!venture) throw new AppError("NOT_FOUND", "Data room not found.");
  const grants = await db.accessRequest.findMany({ where: { ventureId, buyerId: actor.id } });
  if (!canViewDataRoom(venture, actor, grants)) throw new AppError("NOT_FOUND", "Data room not found.");
  const [documents, metrics] = await Promise.all([
    db.ventureDocument.findMany({ where: { ventureId }, orderBy: [{ category: "asc" }, { createdAt: "desc" }] }),
    db.metric.findMany({ where: { ventureId, tier: "DATA_ROOM" } }),
  ]);
  const grant = grants.find((g) => g.level === "DATA_ROOM" && g.status === "APPROVED");
  await audit({ actorId: actor.id, action: "dataroom.viewed", targetType: "venture", targetId: ventureId });
  return {
    venture,
    documents: documents.map((d) => ({ id: d.id, title: d.title, category: d.category, tier: d.tier, filename: d.filename, mimeType: d.mimeType, size: d.size, createdAt: d.createdAt })),
    metrics,
    expiresAt: grant?.expiresAt ?? null,
    viewerIsOwner: isOwner(venture, actor),
  };
}

import type { MetricKey, Prisma, User, Venture } from "@prisma/client";
import { db } from "../db";
import { AppError } from "../errors";
import { audit } from "../audit";
import { slugify } from "../format";
import { randomToken } from "../crypto";
import { canEditVenture } from "../authz";
import { recomputeDerived } from "./ventures";
import { notifyMany } from "./notifications";
import {
  FINANCIAL_KEYS,
  TRACTION_KEYS,
  parse,
  parseMetricFields,
  step10Schema,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  step7Schema,
  step8Schema,
  type MetricInput,
} from "../validation";
import { putObject, deleteObject } from "../storage";

export const WIZARD_STEPS = [
  { n: 1, title: "Identity & category" },
  { n: 2, title: "Problem & value" },
  { n: 3, title: "Product & MVP" },
  { n: 4, title: "Business model" },
  { n: 5, title: "Revenue & traction" },
  { n: 6, title: "Customers & partners" },
  { n: 7, title: "Technology & assets" },
  { n: 8, title: "Price & structure" },
  { n: 9, title: "Documents" },
  { n: 10, title: "Confidentiality" },
  { n: 11, title: "Preview & publish" },
] as const;

type Actor = Pick<User, "id" | "role" | "emailVerifiedAt">;

async function ownedOrThrow(actor: Actor, ventureId: string) {
  const v = await db.venture.findUnique({ where: { id: ventureId } });
  if (!v || !canEditVenture(v, actor)) throw new AppError("NOT_FOUND", "Venture not found.");
  return v;
}

export async function createDraft(actor: Actor, input: unknown) {
  if (actor.role !== "FOUNDER") throw new AppError("FORBIDDEN", "Only founder accounts can list ventures.");
  const data = parse(step1Schema, input);
  const base = slugify(data.alias) || "venture";
  const slug = `${base}-${randomToken(4).toLowerCase().replace(/[^a-z0-9]/g, "x")}`;
  const venture = await db.venture.create({
    data: {
      ...data,
      slug,
      founderId: actor.id,
      summary: "",
      stage: "IDEA",
      coverSeed: Math.floor(Math.random() * 10_000),
      wizardStep: 2,
    },
  });
  await audit({ actorId: actor.id, action: "venture.created", targetType: "venture", targetId: venture.id });
  return venture;
}

async function upsertMetrics(ventureId: string, metrics: Record<string, MetricInput>) {
  const existing = await db.metric.findMany({ where: { ventureId, nature: "HISTORICAL" } });
  for (const [key, m] of Object.entries(metrics)) {
    const prev = existing.find((e) => e.key === key);
    // A verified figure keeps its status only while its value and period are unchanged.
    const keepVerified = prev?.source === "VERIFIED" && prev.value === m.value && prev.period === m.period && m.source !== "NOT_DISCLOSED";
    const data = {
      value: m.source === "NOT_APPLICABLE" ? null : m.value,
      period: m.period,
      source: keepVerified ? ("VERIFIED" as const) : m.source,
      tier: m.tier,
      evidence: keepVerified ? prev!.evidence : m.evidence,
    };
    await db.metric.upsert({
      where: { ventureId_key_nature: { ventureId, key: key as MetricKey, nature: "HISTORICAL" } },
      create: { ventureId, key: key as MetricKey, nature: "HISTORICAL", ...data },
      update: data,
    });
  }
}

/** Saves one wizard step. Steps 9 (documents) and 11 (publish) have their own functions. */
export async function saveStep(actor: Actor, ventureId: string, step: number, input: Record<string, string | string[]>) {
  const venture = await ownedOrThrow(actor, ventureId);
  let data: Prisma.VentureUpdateInput = {};
  switch (step) {
    case 1:
      data = parse(step1Schema, input);
      break;
    case 2:
      data = parse(step2Schema, input);
      break;
    case 3:
      data = parse(step3Schema, input);
      break;
    case 4:
      data = parse(step4Schema, input);
      break;
    case 5: {
      const metrics = parseMetricFields(input, FINANCIAL_KEYS);
      const extra = parse(step5Schema, input);
      const status = venture.revenueStatus;
      for (const k of ["MRR", "MONTHLY_REVENUE", "ANNUAL_REVENUE"] as const) {
        if (status === "PRE_REVENUE" && (metrics[k]?.value ?? 0) > 0)
          throw new AppError("VALIDATION", "A pre-revenue venture cannot report revenue. Update the revenue status in step 4.", {
            [`${k}.value`]: "Pre-revenue ventures report no revenue.",
          });
      }
      if (metrics.MRR?.value && venture.revenueStatus !== "RECURRING" && venture.revenueStatus !== "PROFITABLE")
        throw new AppError("VALIDATION", "MRR only applies to recurring revenue. Update the revenue status in step 4.", {
          "MRR.value": "Only for recurring revenue.",
        });
      await upsertMetrics(ventureId, metrics);
      if (extra.projectionValue != null) {
        if (!extra.projectionPeriod)
          throw new AppError("VALIDATION", "State the period of your projection.", { projectionPeriod: "Required with a projection." });
        await db.metric.upsert({
          where: { ventureId_key_nature: { ventureId, key: "ANNUAL_REVENUE", nature: "PROJECTION" } },
          create: { ventureId, key: "ANNUAL_REVENUE", nature: "PROJECTION", value: extra.projectionValue, period: extra.projectionPeriod, source: "ESTIMATED", tier: "DETAILS" },
          update: { value: extra.projectionValue, period: extra.projectionPeriod, source: "ESTIMATED" },
        });
      } else {
        await db.metric.deleteMany({ where: { ventureId, key: "ANNUAL_REVENUE", nature: "PROJECTION" } });
      }
      data = { tractionHeadline: extra.tractionHeadline };
      break;
    }
    case 6: {
      const metrics = parseMetricFields(input, TRACTION_KEYS);
      await upsertMetrics(ventureId, metrics);
      data = parse(step6Schema, input);
      break;
    }
    case 7:
      data = parse(step7Schema, input);
      break;
    case 8:
      data = parse(step8Schema, input);
      break;
    case 10:
      data = parse(step10Schema, input);
      // Confidential and stealth listings always require the NDA.
      if (data.confidentiality !== "STANDARD") data.requireNda = true;
      break;
    default:
      throw new AppError("VALIDATION", "Unknown step.");
  }
  const updated = await db.venture.update({
    where: { id: ventureId },
    data: { ...data, wizardStep: Math.max(venture.wizardStep, Math.min(step + 1, 11)) },
  });
  await recomputeDerived(ventureId);
  if (updated.status === "PUBLISHED" && step !== 10) await notifyWatchers(updated, "updated");
  return updated;
}

async function notifyWatchers(v: Venture, what: "updated" | "sold" | "paused") {
  const watchers = await db.venture.findUnique({
    where: { id: v.id },
    select: {
      interactions: { where: { kind: "SAVED" }, select: { userId: true } },
      accessRequests: { where: { status: "APPROVED" }, select: { buyerId: true } },
    },
  });
  if (!watchers) return;
  // Throttle "updated" notices to one per listing per 12h per user.
  const ids = [...new Set([...watchers.interactions.map((i) => i.userId), ...watchers.accessRequests.map((a) => a.buyerId)])];
  const since = new Date(Date.now() - 12 * 3600_000);
  const recent = what === "updated"
    ? new Set(
        (await db.notification.findMany({
          where: { userId: { in: ids }, type: "venture.updated", link: `/ventures/${v.slug}`, createdAt: { gte: since } },
          select: { userId: true },
        })).map((n) => n.userId),
      )
    : new Set<string>();
  const titles = { updated: `${v.alias} updated its listing`, sold: `${v.alias} is marked as sold`, paused: `${v.alias} paused its listing` };
  await notifyMany(
    ids.filter((id) => !recent.has(id)),
    { type: `venture.${what}`, title: titles[what], link: `/ventures/${v.slug}` },
  );
}

export function publishReadiness(v: Venture & { metrics?: { key: string; value: number | null; source: string }[] }, actor: Actor) {
  const missing: string[] = [];
  if (!actor.emailVerifiedAt) missing.push("Verify your email address");
  if (!v.alias) missing.push("Venture name or alias (step 1)");
  if (!v.tagline) missing.push("Tagline (step 1)");
  if (!v.summary || v.summary.length < 40) missing.push("Public description (step 2)");
  if (v.wizardStep < 4) missing.push("Product status (step 3)");
  if ((v.stage === "REVENUE" || v.stage === "PROFITABLE") && v.revenueStatus === "PRE_REVENUE")
    missing.push("A revenue-stage venture cannot be marked pre-revenue (steps 3–4)");
  if (v.revenueStatus === "PROFITABLE" && !["REVENUE", "PROFITABLE", "EARLY_TRACTION"].includes(v.stage))
    missing.push("A profitable venture must be at revenue or profitable stage (steps 3–4)");
  if (v.wizardStep < 9) missing.push("Asking price & structure (step 8)");
  return missing;
}

export async function publishVenture(actor: Actor, ventureId: string) {
  const v = await ownedOrThrow(actor, ventureId);
  if (v.status === "SOLD") throw new AppError("CONFLICT", "Sold ventures cannot be re-published.");
  const missing = publishReadiness(v, actor);
  if (missing.length) throw new AppError("VALIDATION", `Before publishing: ${missing.join("; ")}.`);
  const updated = await db.venture.update({
    where: { id: ventureId },
    data: { status: "PUBLISHED", publishedAt: v.publishedAt ?? new Date(), wizardStep: 11 },
  });
  await recomputeDerived(ventureId);
  await audit({ actorId: actor.id, action: "venture.published", targetType: "venture", targetId: ventureId });
  return updated;
}

export async function setVentureStatus(actor: Actor, ventureId: string, status: "PAUSED" | "PUBLISHED" | "SOLD") {
  const v = await ownedOrThrow(actor, ventureId);
  if (v.status === "SOLD") throw new AppError("CONFLICT", "This venture is already marked as sold.");
  if (status === "PUBLISHED") return publishVenture(actor, ventureId);
  if (status === "PAUSED" && v.status !== "PUBLISHED") throw new AppError("CONFLICT", "Only published listings can be paused.");
  const updated = await db.venture.update({
    where: { id: ventureId },
    data: { status, soldAt: status === "SOLD" ? new Date() : undefined },
  });
  await audit({ actorId: actor.id, action: `venture.${status.toLowerCase()}`, targetType: "venture", targetId: ventureId });
  await notifyWatchers(updated, status === "SOLD" ? "sold" : "paused");
  return updated;
}

export async function deleteDraft(actor: Actor, ventureId: string) {
  const v = await ownedOrThrow(actor, ventureId);
  if (v.status !== "DRAFT") throw new AppError("CONFLICT", "Only drafts can be deleted. Pause or mark the listing as sold instead.");
  const docs = await db.ventureDocument.findMany({ where: { ventureId } });
  await db.venture.delete({ where: { id: ventureId } });
  await Promise.all(docs.map((d) => deleteObject(d.storageKey)));
  await audit({ actorId: actor.id, action: "venture.draft_deleted", targetType: "venture", targetId: ventureId });
}

export async function uploadVentureDocument(
  actor: Actor,
  ventureId: string,
  input: { file: File; title: string; category: string; tier: "DETAILS" | "DATA_ROOM" },
) {
  await ownedOrThrow(actor, ventureId);
  const count = await db.ventureDocument.count({ where: { ventureId } });
  if (count >= 40) throw new AppError("VALIDATION", "A venture can hold up to 40 documents.");
  const title = input.title.trim().slice(0, 120);
  if (title.length < 2) throw new AppError("VALIDATION", "Give the document a title.", { title: "Required" });
  const categories = ["financials", "contracts", "ip", "technical", "product", "other"];
  if (!categories.includes(input.category)) throw new AppError("VALIDATION", "Choose a category.");
  if (!["DETAILS", "DATA_ROOM"].includes(input.tier)) throw new AppError("VALIDATION", "Choose who can see the document.");
  const stored = await putObject(`ventures/${ventureId}`, input.file);
  const doc = await db.ventureDocument.create({
    data: {
      ventureId,
      title,
      category: input.category,
      tier: input.tier,
      filename: input.file.name.slice(0, 160),
      mimeType: stored.mimeType,
      size: stored.size,
      storageKey: stored.key,
    },
  });
  await audit({ actorId: actor.id, action: "document.uploaded", targetType: "venture_document", targetId: doc.id, metadata: { ventureId, tier: input.tier } });
  return doc;
}

export async function deleteVentureDocument(actor: Actor, documentId: string) {
  const doc = await db.ventureDocument.findUnique({ where: { id: documentId } });
  if (!doc) throw new AppError("NOT_FOUND", "Document not found.");
  await ownedOrThrow(actor, doc.ventureId);
  await db.ventureDocument.delete({ where: { id: documentId } });
  await deleteObject(doc.storageKey);
  await audit({ actorId: actor.id, action: "document.deleted", targetType: "venture_document", targetId: documentId });
}

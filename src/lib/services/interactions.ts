import type { User } from "@prisma/client";
import { db } from "../db";
import { AppError } from "../errors";
import { canViewTeaser } from "../authz";

type Actor = Pick<User, "id" | "role" | "emailVerifiedAt">;

async function visibleVenture(actor: Actor, ventureId: string) {
  const v = await db.venture.findUnique({ where: { id: ventureId } });
  if (!v || !canViewTeaser(v, actor)) throw new AppError("NOT_FOUND", "Venture not found.");
  if (v.founderId === actor.id) throw new AppError("VALIDATION", "You cannot save your own listing.");
  return v;
}

/**
 * Saving records interest only. It never contacts the founder, never reveals the buyer and
 * never creates an offer. It adds the venture to the buyer's private pipeline.
 */
export async function saveVenture(actor: Actor, ventureId: string) {
  if (actor.role !== "BUYER") throw new AppError("FORBIDDEN", "Saving ventures requires a buyer account.");
  await visibleVenture(actor, ventureId);
  await db.ventureInteraction.upsert({
    where: { userId_ventureId: { userId: actor.id, ventureId } },
    create: { userId: actor.id, ventureId, kind: "SAVED" },
    update: { kind: "SAVED" },
  });
  await db.pipelineEntry.upsert({
    where: { buyerId_ventureId: { buyerId: actor.id, ventureId } },
    create: { buyerId: actor.id, ventureId, stage: "INTERESTED" },
    update: {},
  });
}

export async function passVenture(actor: Actor, ventureId: string) {
  await visibleVenture(actor, ventureId);
  await db.ventureInteraction.upsert({
    where: { userId_ventureId: { userId: actor.id, ventureId } },
    create: { userId: actor.id, ventureId, kind: "PASSED" },
    update: { kind: "PASSED" },
  });
}

/** Removes the save/pass decision entirely (used by "undo" and "restore"). */
export async function clearInteraction(actor: Actor, ventureId: string) {
  await db.ventureInteraction.deleteMany({ where: { userId: actor.id, ventureId } });
  // Only drop the pipeline entry if nothing has happened beyond the initial save.
  await db.pipelineEntry.deleteMany({
    where: { buyerId: actor.id, ventureId, stage: "INTERESTED", notes: null },
  });
}

export async function recordView(actor: Actor, ventureId: string) {
  await db.ventureView.upsert({
    where: { userId_ventureId: { userId: actor.id, ventureId } },
    create: { userId: actor.id, ventureId },
    update: { viewedAt: new Date() },
  });
}

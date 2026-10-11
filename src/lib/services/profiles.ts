import type { User } from "@prisma/client";
import { db } from "../db";
import { AppError } from "../errors";
import { audit } from "../audit";
import { buyerProfileSchema, founderProfileSchema, parse } from "../validation";

type Actor = Pick<User, "id" | "role">;

export async function saveFounderProfile(actor: Actor, input: unknown) {
  if (actor.role !== "FOUNDER") throw new AppError("FORBIDDEN", "Founder accounts only.");
  const data = parse(founderProfileSchema, input);
  const p = await db.founderProfile.upsert({ where: { userId: actor.id }, create: { userId: actor.id, ...data }, update: data });
  await audit({ actorId: actor.id, action: "profile.founder_saved", targetType: "user", targetId: actor.id });
  return p;
}

export async function saveBuyerProfile(actor: Actor, input: unknown) {
  if (actor.role !== "BUYER") throw new AppError("FORBIDDEN", "Buyer accounts only.");
  const data = parse(buyerProfileSchema, input);
  const clash = await db.buyerProfile.findFirst({
    where: { alias: { equals: data.alias, mode: "insensitive" }, NOT: { userId: actor.id } },
  });
  if (clash) throw new AppError("VALIDATION", "That alias is taken.", { alias: "Choose another alias." });
  const p = await db.buyerProfile.upsert({ where: { userId: actor.id }, create: { userId: actor.id, ...data }, update: data });
  await audit({ actorId: actor.id, action: "profile.buyer_saved", targetType: "user", targetId: actor.id });
  return p;
}

export async function saveNotificationPrefs(actor: Actor, prefs: { requests: boolean; messages: boolean; updates: boolean }) {
  await db.user.update({
    where: { id: actor.id },
    data: { notifyEmailRequests: prefs.requests, notifyEmailMessages: prefs.messages, notifyEmailUpdates: prefs.updates },
  });
}

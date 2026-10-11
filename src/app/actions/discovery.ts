"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { clearInteraction, passVenture, saveVenture } from "@/lib/services/interactions";
import { discoverQueue, parseFilters, type VentureTeaser } from "@/lib/services/ventures";
import { rateLimit } from "@/lib/rate-limit";

export type SwipeResult = { ok: true } | { ok: false; needsAuth?: boolean; message: string };

async function guarded(fn: (user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) => Promise<void>): Promise<SwipeResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, needsAuth: true, message: "Sign in to keep track of ventures." };
  try {
    await rateLimit(`swipe:${user.id}`, 300, 600);
    await fn(user);
    return { ok: true };
  } catch (e) {
    if (e instanceof AppError) return { ok: false, message: e.message };
    console.error(e);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

export async function saveVentureAction(ventureId: string) {
  return guarded((u) => saveVenture(u, String(ventureId)));
}

export async function passVentureAction(ventureId: string) {
  return guarded((u) => passVenture(u, String(ventureId)));
}

export async function undoInteractionAction(ventureId: string) {
  return guarded((u) => clearInteraction(u, String(ventureId)));
}

export async function loadMoreAction(query: string, excludeIds: string[]): Promise<VentureTeaser[]> {
  const user = await getCurrentUser();
  const sp = Object.fromEntries(
    [...new URLSearchParams(String(query)).entries()].reduce((m, [k, v]) => m.set(k, [...(m.get(k) ?? []), v]), new Map<string, string[]>()),
  );
  const ids = Array.isArray(excludeIds) ? excludeIds.filter((x) => typeof x === "string").slice(0, 500) : [];
  return discoverQueue(parseFilters(sp), user, ids, 12);
}

import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { createSessionToken, revokeSessionToken, userFromSessionToken, SESSION_TTL_DAYS } from "../services/auth";
import { env } from "../env";

export const SESSION_COOKIE = env.isProd ? "__Host-sequel_session" : "sequel_session";

export async function startSession(userId: string) {
  const ua = (await headers()).get("user-agent");
  const { token } = await createSessionToken(userId, ua);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 86400,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await revokeSessionToken(token);
  jar.delete(SESSION_COOKIE);
}

/** Current user for this request (memoised per request). */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return userFromSessionToken(token);
});

export async function requireUser(returnTo?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login${returnTo ? `?next=${encodeURIComponent(returnTo)}` : ""}`);
  return user;
}

export async function requireRole(roles: Role[], returnTo?: string): Promise<User> {
  const user = await requireUser(returnTo);
  if (!roles.includes(user.role)) redirect("/forbidden");
  return user;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
}

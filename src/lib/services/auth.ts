import type { Role } from "@prisma/client";
import { db } from "../db";
import { AppError } from "../errors";
import { randomToken, sha256 } from "../crypto";
import { hashPassword, verifyPassword, DUMMY_HASH } from "../auth/password";
import { sendEmail } from "../email";
import { env } from "../env";
import { audit } from "../audit";
import { BRAND } from "../brand";

export const SESSION_TTL_DAYS = 14;

export async function createSessionToken(userId: string, userAgent?: string | null) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400_000);
  await db.session.create({
    data: { id: sha256(token), userId, expiresAt, userAgent: userAgent?.slice(0, 200) },
  });
  return { token, expiresAt };
}

export async function userFromSessionToken(token: string | undefined | null) {
  if (!token) return null;
  const session = await db.session.findUnique({ where: { id: sha256(token) }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt < new Date() || session.user.status !== "ACTIVE") {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session.user;
}

export async function revokeSessionToken(token: string) {
  await db.session.deleteMany({ where: { id: sha256(token) } });
}

async function issueToken(userId: string, type: "EMAIL_VERIFY" | "PASSWORD_RESET", ttlMinutes: number) {
  await db.authToken.updateMany({ where: { userId, type, usedAt: null }, data: { usedAt: new Date() } });
  const token = randomToken(32);
  await db.authToken.create({
    data: { userId, type, tokenHash: sha256(token), expiresAt: new Date(Date.now() + ttlMinutes * 60_000) },
  });
  return token;
}

async function consumeToken(token: string, type: "EMAIL_VERIFY" | "PASSWORD_RESET") {
  const row = await db.authToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!row || row.type !== type || row.usedAt || row.expiresAt < new Date())
    throw new AppError("VALIDATION", "This link is invalid or has expired.");
  await db.authToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  return row;
}

export async function sendVerificationEmail(userId: string, email: string) {
  const token = await issueToken(userId, "EMAIL_VERIFY", 60 * 24);
  await sendEmail({
    to: email,
    subject: `Confirm your email for ${BRAND.name}`,
    text: `Confirm your email address to finish setting up your ${BRAND.name} account:\n\n${env.appUrl}/verify-email?token=${token}\n\nThis link expires in 24 hours. If you did not create an account, ignore this email.`,
  });
  return token;
}

export async function registerUser(input: { email: string; password: string; role: Role }) {
  if (input.role === "ADMIN") throw new AppError("FORBIDDEN", "Administrator accounts cannot be self-registered.");
  const email = input.email.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new AppError("CONFLICT", "An account with this email already exists. Try signing in.");
  const user = await db.user.create({
    data: {
      email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      privacyAcceptedAt: new Date(),
      privacyVersion: BRAND.privacyVersion,
    },
  });
  await sendVerificationEmail(user.id, email);
  await audit({ actorId: user.id, action: "user.registered", targetType: "user", targetId: user.id, metadata: { role: user.role } });
  return user;
}

export async function authenticate(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || user.status !== "ACTIVE") {
    throw new AppError("UNAUTHENTICATED", "Email or password is incorrect.");
  }
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return user;
}

export async function verifyEmail(token: string) {
  const row = await consumeToken(token, "EMAIL_VERIFY");
  const user = await db.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } });
  await audit({ actorId: user.id, action: "user.email_verified", targetType: "user", targetId: user.id });
  return user;
}

/** Always resolves the same way so the response does not reveal whether the email exists. */
export async function requestPasswordReset(emailInput: string) {
  const email = emailInput.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE") return null;
  const token = await issueToken(user.id, "PASSWORD_RESET", 60);
  await sendEmail({
    to: email,
    subject: `Reset your ${BRAND.name} password`,
    text: `Use this link to choose a new password:\n\n${env.appUrl}/reset-password?token=${token}\n\nThe link expires in 1 hour and can be used once. If you did not ask for this, ignore this email — your password stays unchanged.`,
  });
  return token;
}

export async function resetPassword(token: string, newPassword: string) {
  const row = await consumeToken(token, "PASSWORD_RESET");
  await db.user.update({ where: { id: row.userId }, data: { passwordHash: await hashPassword(newPassword) } });
  // Sign out every existing session after a password change.
  await db.session.deleteMany({ where: { userId: row.userId } });
  await audit({ actorId: row.userId, action: "user.password_reset", targetType: "user", targetId: row.userId });
}

export async function changePassword(userId: string, current: string, next: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await verifyPassword(current, user.passwordHash)))
    throw new AppError("VALIDATION", "Your current password is incorrect.", { currentPassword: "Incorrect password" });
  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(next) } });
  await audit({ actorId: userId, action: "user.password_changed", targetType: "user", targetId: userId });
}

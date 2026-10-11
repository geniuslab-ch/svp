"use server";

import { redirect } from "next/navigation";
import { runAction, type ActionState } from "@/lib/action";
import { clientIp, endSession, getCurrentUser, startSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { formToObject, loginSchema, parse, passwordSchema, signupSchema, emailSchema } from "@/lib/validation";
import {
  authenticate,
  changePassword,
  registerUser,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
} from "@/lib/services/auth";
import { AppError } from "@/lib/errors";
import { db } from "@/lib/db";

function safeNext(next: unknown, fallback: string) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

async function landingFor(userId: string, role: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "FOUNDER") {
    const p = await db.founderProfile.findUnique({ where: { userId } });
    return p ? "/founder" : "/onboarding/founder";
  }
  const p = await db.buyerProfile.findUnique({ where: { userId } });
  return p ? "/discover" : "/onboarding/buyer";
}

export async function signupAction(_: ActionState, fd: FormData): Promise<ActionState> {
  let target = "/";
  const res = await runAction(async () => {
    const data = parse(signupSchema, formToObject(fd));
    await rateLimit(`signup:${await clientIp()}`, 8, 3600);
    const user = await registerUser(data);
    await startSession(user.id);
    target = data.role === "FOUNDER" ? "/onboarding/founder" : "/onboarding/buyer";
  });
  if (res.ok) redirect(target);
  return res;
}

export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  let target = "/";
  const res = await runAction(async () => {
    const data = parse(loginSchema, formToObject(fd));
    await rateLimit(`login:ip:${await clientIp()}`, 30, 900);
    await rateLimit(`login:email:${data.email}`, 8, 900);
    const user = await authenticate(data.email, data.password);
    await startSession(user.id);
    target = safeNext(fd.get("next"), await landingFor(user.id, user.role));
  });
  if (res.ok) redirect(target);
  return res;
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}

export async function resendVerificationAction(): Promise<ActionState> {
  return runAction(async () => {
    const user = await getCurrentUser();
    if (!user) throw new AppError("UNAUTHENTICATED", "Sign in first.");
    if (user.emailVerifiedAt) return "Your email is already verified.";
    await rateLimit(`resend:${user.id}`, 3, 3600);
    await sendVerificationEmail(user.id, user.email);
    return "We sent a new confirmation link. Check your inbox.";
  });
}

export async function forgotPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const email = parse(emailSchema, fd.get("email"));
    await rateLimit(`forgot:${await clientIp()}`, 5, 3600);
    await rateLimit(`forgot:${email}`, 3, 3600);
    await requestPasswordReset(email);
    return "If an account exists for that address, a reset link is on its way. It expires in one hour.";
  });
}

export async function resetPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const res = await runAction(async () => {
    const password = String(fd.get("password") ?? "");
    const r = passwordSchema.safeParse(password);
    if (!r.success) throw new AppError("VALIDATION", "Please choose a stronger password.", { password: r.error.issues[0].message });
    if (password !== fd.get("confirm")) throw new AppError("VALIDATION", "Passwords do not match.", { confirm: "Passwords do not match." });
    await rateLimit(`reset:${await clientIp()}`, 10, 3600);
    await resetPassword(String(fd.get("token") ?? ""), password);
  });
  if (res.ok) redirect("/login?reset=1");
  return res;
}

export async function changePasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await getCurrentUser();
    if (!user) throw new AppError("UNAUTHENTICATED", "Sign in first.");
    const next = String(fd.get("newPassword") ?? "");
    const r = passwordSchema.safeParse(next);
    if (!r.success) throw new AppError("VALIDATION", "Please choose a stronger password.", { newPassword: r.error.issues[0].message });
    await rateLimit(`pw:${user.id}`, 5, 3600);
    await changePassword(user.id, String(fd.get("currentPassword") ?? ""), next);
    return "Password updated.";
  });
}

export async function confirmEmailAction(fd: FormData) {
  let ok = false;
  try {
    await rateLimit(`confirm:${await clientIp()}`, 20, 3600);
    const { verifyEmail } = await import("@/lib/services/auth");
    await verifyEmail(String(fd.get("token") ?? ""));
    ok = true;
  } catch {
    ok = false;
  }
  redirect(ok ? "/verify-email?done=1" : "/verify-email?failed=1");
}

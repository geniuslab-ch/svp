"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { runAction, type ActionState } from "@/lib/action";
import { endSession, getCurrentUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { formToObject } from "@/lib/validation";
import { saveBuyerProfile, saveFounderProfile, saveNotificationPrefs } from "@/lib/services/profiles";
import { deleteAccount, submitVerification } from "@/lib/services/trust";
import { markAllRead } from "@/lib/services/notifications";
import { db } from "@/lib/db";

async function actor() {
  const user = await getCurrentUser();
  if (!user) throw new AppError("UNAUTHENTICATED", "Please sign in to continue.");
  return user;
}

export async function founderProfileAction(_: ActionState, fd: FormData): Promise<ActionState> {
  let go: string | null = null;
  const res = await runAction(async () => {
    const user = await actor();
    await saveFounderProfile(user, formToObject(fd));
    if (fd.get("onboarding")) go = "/founder?welcome=1";
    revalidatePath("/settings");
    return "Profile saved.";
  });
  if (res.ok && go) redirect(go);
  return res;
}

export async function buyerProfileAction(_: ActionState, fd: FormData): Promise<ActionState> {
  let go: string | null = null;
  const res = await runAction(async () => {
    const user = await actor();
    await saveBuyerProfile(user, formToObject(fd));
    if (fd.get("onboarding")) go = "/discover";
    revalidatePath("/settings");
    return "Profile saved.";
  });
  if (res.ok && go) redirect(go);
  return res;
}

export async function notificationPrefsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await actor();
    await saveNotificationPrefs(user, { requests: fd.get("requests") === "on", messages: fd.get("messages") === "on", updates: fd.get("updates") === "on" });
    return "Notification preferences saved.";
  });
}

export async function deleteAccountAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const res = await runAction(async () => {
    const user = await actor();
    if (fd.get("confirm") !== "DELETE") throw new AppError("VALIDATION", "Type DELETE to confirm.", { confirm: "Type DELETE in capitals." });
    await deleteAccount(user.id, String(fd.get("password") ?? ""));
    await endSession();
  });
  if (res.ok) redirect("/?deleted=1");
  return res;
}

export async function submitVerificationAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await actor();
    const files = fd.getAll("files").filter((f): f is File => f instanceof File);
    await submitVerification(user, formToObject(fd), files);
    revalidatePath("/founder/verification");
    return "Submitted for review. Your badge changes only once a reviewer approves it.";
  });
}

export async function markNotificationsReadAction() {
  const user = await actor();
  await markAllRead(user.id);
  revalidatePath("/notifications");
}

export async function openNotificationAction(fd: FormData) {
  const user = await actor();
  const id = String(fd.get("id"));
  const n = await db.notification.findFirst({ where: { id, userId: user.id } });
  if (n) await db.notification.update({ where: { id }, data: { readAt: n.readAt ?? new Date() } });
  redirect(n?.link && n.link.startsWith("/") ? n.link : "/notifications");
}

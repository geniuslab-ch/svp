"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionState } from "@/lib/action";
import { getCurrentUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { moderateVenture, resolveReport, reviewVerification, setUserStatus } from "@/lib/services/trust";

async function admin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new AppError("FORBIDDEN", "Administrator access required.");
  return user;
}

export async function reviewVerificationAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const decision = String(fd.get("decision"));
    if (decision !== "APPROVED" && decision !== "REJECTED") throw new AppError("VALIDATION", "Choose a decision.");
    await reviewVerification(await admin(), String(fd.get("requestId")), {
      decision,
      note: String(fd.get("note") ?? ""),
      markMetricsVerified: fd.get("markMetricsVerified") === "on",
    });
    revalidatePath("/admin/verifications");
    return decision === "APPROVED" ? "Approved." : "Rejected — the user has been notified.";
  });
}

export async function moderateVentureAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const action = String(fd.get("action"));
    if (!["remove", "restore", "feature", "unfeature", "clear_flag"].includes(action)) throw new AppError("VALIDATION", "Unknown action.");
    await moderateVenture(await admin(), String(fd.get("ventureId")), action as "remove", String(fd.get("note") ?? ""));
    revalidatePath("/admin/ventures");
    return "Listing updated.";
  });
}

export async function userStatusAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const status = String(fd.get("status"));
    if (status !== "ACTIVE" && status !== "SUSPENDED") throw new AppError("VALIDATION", "Unknown status.");
    await setUserStatus(await admin(), String(fd.get("userId")), status);
    revalidatePath("/admin/users");
    return status === "SUSPENDED" ? "User suspended and signed out." : "User reactivated.";
  });
}

export async function resolveReportAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const status = String(fd.get("status"));
    if (status !== "RESOLVED" && status !== "DISMISSED") throw new AppError("VALIDATION", "Unknown status.");
    await resolveReport(await admin(), String(fd.get("reportId")), status, String(fd.get("resolution") ?? ""));
    revalidatePath("/admin/reports");
    return "Report closed.";
  });
}

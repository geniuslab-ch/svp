"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionState } from "@/lib/action";
import { getCurrentUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { formToObject } from "@/lib/validation";
import {
  decideAccess,
  requestAccess,
  respondToOffer,
  sendMessage,
  submitOffer,
  updatePipeline,
  withdrawAccessRequest,
} from "@/lib/services/deals";
import { createReport } from "@/lib/services/trust";

async function actor() {
  const user = await getCurrentUser();
  if (!user) throw new AppError("UNAUTHENTICATED", "Please sign in to continue.");
  return user;
}

export async function requestAccessAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await actor();
    const obj = formToObject(fd);
    await requestAccess(user, String(obj.ventureId), obj);
    revalidatePath("/ventures/[slug]", "page");
    return "Request sent under your alias. The founder will review it — you’ll be notified of the decision.";
  });
}

export async function withdrawRequestAction(fd: FormData) {
  const user = await actor();
  await withdrawAccessRequest(user, String(fd.get("requestId")));
  revalidatePath("/buyer/requests");
}

export async function decideAccessAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await actor();
    const decision = String(fd.get("decision"));
    if (!["APPROVE", "REJECT", "REVOKE"].includes(decision)) throw new AppError("VALIDATION", "Unknown decision.");
    await decideAccess(user, String(fd.get("requestId")), decision as "APPROVE" | "REJECT" | "REVOKE", String(fd.get("note") ?? ""));
    revalidatePath("/founder/requests");
    return { APPROVE: "Access approved. A private conversation is now open.", REJECT: "Request declined.", REVOKE: "Access revoked." }[decision];
  });
}

export async function sendMessageAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await actor();
    const id = String(fd.get("conversationId"));
    await sendMessage(user, id, formToObject(fd));
    revalidatePath(`/messages/${id}`);
  });
}

export async function submitOfferAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await actor();
    const id = String(fd.get("conversationId"));
    await submitOffer(user, id, formToObject(fd));
    revalidatePath(`/messages/${id}`);
    return "Non-binding offer sent.";
  });
}

export async function respondOfferAction(fd: FormData) {
  const user = await actor();
  const response = String(fd.get("response"));
  if (!["ACKNOWLEDGED", "DECLINED", "WITHDRAWN"].includes(response)) throw new AppError("VALIDATION", "Unknown response.");
  await respondToOffer(user, String(fd.get("offerId")), response as "ACKNOWLEDGED" | "DECLINED" | "WITHDRAWN");
  revalidatePath(`/messages/${fd.get("conversationId")}`);
}

export async function updatePipelineAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await actor();
    const notes = fd.get("notes");
    await updatePipeline(user, String(fd.get("ventureId")), {
      stage: fd.get("stage") ? String(fd.get("stage")) : undefined,
      notes: notes === null ? undefined : String(notes),
    });
    revalidatePath("/buyer");
    return "Saved";
  });
}

export async function reportAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await actor();
    await createReport(user, formToObject(fd));
    return "Thank you. Our moderators will review this report.";
  });
}

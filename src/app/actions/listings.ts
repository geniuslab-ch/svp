"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { runAction, type ActionState } from "@/lib/action";
import { getCurrentUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { formToObject } from "@/lib/validation";
import {
  createDraft,
  deleteDraft,
  deleteVentureDocument,
  publishVenture,
  saveStep,
  setVentureStatus,
  uploadVentureDocument,
} from "@/lib/services/listings";

async function founder() {
  const user = await getCurrentUser();
  if (!user) throw new AppError("UNAUTHENTICATED", "Please sign in to continue.");
  if (user.role !== "FOUNDER") throw new AppError("FORBIDDEN", "Founder accounts only.");
  return user;
}

export async function createDraftAction(_: ActionState, fd: FormData): Promise<ActionState> {
  let id = "";
  const res = await runAction(async () => {
    const v = await createDraft(await founder(), formToObject(fd));
    id = v.id;
  });
  if (res.ok) redirect(`/founder/ventures/${id}/edit?step=2`);
  return res;
}

export async function saveStepAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get("ventureId"));
  const step = Number(fd.get("step"));
  const intent = String(fd.get("intent") ?? "next");
  const res = await runAction(async () => {
    await saveStep(await founder(), id, step, formToObject(fd));
    revalidatePath("/founder");
    return "Saved";
  });
  if (res.ok && intent === "next") redirect(`/founder/ventures/${id}/edit?step=${step + 1}`);
  return res;
}

export async function publishAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get("ventureId"));
  let slug = "";
  const res = await runAction(async () => {
    const v = await publishVenture(await founder(), id);
    slug = v.slug;
  });
  if (res.ok) redirect(`/ventures/${slug}?published=1`);
  return res;
}

export async function setStatusAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const status = String(fd.get("status"));
    if (!["PAUSED", "PUBLISHED", "SOLD"].includes(status)) throw new AppError("VALIDATION", "Unknown status.");
    await setVentureStatus(await founder(), String(fd.get("ventureId")), status as "PAUSED" | "PUBLISHED" | "SOLD");
    revalidatePath("/founder");
    return { PAUSED: "Listing paused.", PUBLISHED: "Listing is live again.", SOLD: "Marked as sold. Congratulations." }[status];
  });
}

export async function deleteDraftAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    await deleteDraft(await founder(), String(fd.get("ventureId")));
    revalidatePath("/founder");
    return "Draft deleted.";
  });
}

export async function uploadDocumentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const file = fd.get("file");
    if (!(file instanceof File)) throw new AppError("VALIDATION", "Please choose a file.", { file: "Required" });
    const id = String(fd.get("ventureId"));
    await uploadVentureDocument(await founder(), id, {
      file,
      title: String(fd.get("title") ?? ""),
      category: String(fd.get("category") ?? ""),
      tier: String(fd.get("tier")) === "DETAILS" ? "DETAILS" : "DATA_ROOM",
    });
    revalidatePath(`/founder/ventures/${id}/edit`);
    return "Document uploaded privately.";
  });
}

export async function deleteDocumentAction(fd: FormData) {
  await deleteVentureDocument(await founder(), String(fd.get("documentId")));
  revalidatePath(`/founder/ventures/${fd.get("ventureId")}/edit`);
}

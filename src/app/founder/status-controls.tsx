"use client";

import type { VentureStatus } from "@prisma/client";
import { deleteDraftAction, setStatusAction } from "@/app/actions/listings";
import { ConfirmAction } from "@/components/ui/confirm-form";

export function VentureStatusControls({ id, status }: { id: string; status: VentureStatus }) {
  return (
    <>
      {status === "PUBLISHED" && (
        <ConfirmAction action={setStatusAction} fields={{ ventureId: id, status: "PAUSED" }} label="Pause" title="Pause this listing?" body="It disappears from discovery and search. Buyers with approved access keep it. You can resume any time." confirmLabel="Pause listing" />
      )}
      {status === "PAUSED" && (
        <ConfirmAction action={setStatusAction} fields={{ ventureId: id, status: "PUBLISHED" }} label="Resume" title="Resume this listing?" body="It becomes visible in discovery again." confirmLabel="Resume" />
      )}
      {(status === "PUBLISHED" || status === "PAUSED") && (
        <ConfirmAction action={setStatusAction} fields={{ ventureId: id, status: "SOLD" }} label="Mark sold" title="Mark as sold?" body="This cannot be undone. The listing leaves the marketplace and buyers who saved it are notified." confirmLabel="Mark as sold" danger />
      )}
      {status === "DRAFT" && (
        <ConfirmAction action={deleteDraftAction} fields={{ ventureId: id }} label="Delete" title="Delete this draft?" body="The draft and any uploaded documents are permanently deleted." confirmLabel="Delete draft" danger />
      )}
    </>
  );
}

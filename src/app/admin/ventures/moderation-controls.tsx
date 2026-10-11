"use client";

import { moderateVentureAction } from "@/app/actions/admin";
import { ConfirmAction } from "@/components/ui/confirm-form";

export function ModerationControls({ id, status, featured, flagged }: { id: string; status: string; featured: boolean; flagged: boolean }) {
  return (
    <div className="flex flex-wrap gap-1">
      {status !== "REMOVED" ? (
        <ConfirmAction action={moderateVentureAction} fields={{ ventureId: id, action: "remove" }} label="Remove" variant="danger" danger title="Remove this listing?" body="It disappears from the marketplace and all buyer access is suspended. The founder is notified with your reason." confirmLabel="Remove listing">
          <label className="block text-[13px] text-ivory-300">Reason (sent to the founder)
            <textarea name="note" required rows={2} className="mt-1.5 w-full rounded-xl border border-ink-700 bg-ink-850 px-3 py-2 text-sm" />
          </label>
        </ConfirmAction>
      ) : (
        <ConfirmAction action={moderateVentureAction} fields={{ ventureId: id, action: "restore" }} label="Restore" title="Restore listing?" body="It returns as paused; the founder decides when to republish." confirmLabel="Restore" />
      )}
      {status === "PUBLISHED" && (
        <ConfirmAction action={moderateVentureAction} fields={{ ventureId: id, action: featured ? "unfeature" : "feature" }} label={featured ? "Unfeature" : "Feature"} title={featured ? "Remove featured placement?" : "Feature this listing?"} body="Featured listings are shown first by default." confirmLabel="Confirm" />
      )}
      {flagged && <ConfirmAction action={moderateVentureAction} fields={{ ventureId: id, action: "clear_flag" }} label="Clear flag" title="Clear the flag?" body="Do this after reviewing open reports for this listing." confirmLabel="Clear flag" />}
    </div>
  );
}

"use client";

import { resolveReportAction } from "@/app/actions/admin";
import { ConfirmAction } from "@/components/ui/confirm-form";

const note = (
  <label className="block text-[13px] text-ivory-300">Resolution note
    <textarea name="resolution" rows={2} className="mt-1.5 w-full rounded-xl border border-ink-700 bg-ink-850 px-3 py-2 text-sm" />
  </label>
);

export function ReportControls({ id }: { id: string }) {
  return (
    <div className="mt-4 flex gap-2 border-t border-ink-700/70 pt-3">
      <ConfirmAction action={resolveReportAction} fields={{ reportId: id, status: "RESOLVED" }} label="Resolve" variant="outline" title="Mark resolved?" body="Use after taking action (e.g. removing a listing)." confirmLabel="Resolve">{note}</ConfirmAction>
      <ConfirmAction action={resolveReportAction} fields={{ reportId: id, status: "DISMISSED" }} label="Dismiss" title="Dismiss report?" body="No action needed." confirmLabel="Dismiss">{note}</ConfirmAction>
    </div>
  );
}

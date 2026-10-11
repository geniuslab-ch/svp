"use client";

import { useState } from "react";
import { updatePipelineAction } from "@/app/actions/deals";
import { ActionForm, SubmitButton } from "@/components/ui/form";
import { PIPELINE_LABEL } from "@/lib/labels";

export function PipelineEditor({ ventureId, stage, notes }: { ventureId: string; stage: string; notes: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 border-t border-ink-700/70 pt-3">
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-[13px] text-ivory-400 hover:text-ivory">
          {notes ? `Private notes: ${notes.slice(0, 90)}${notes.length > 90 ? "…" : ""}` : "+ Add private notes / change stage"}
        </button>
      ) : (
        <ActionForm action={updatePipelineAction} successToast="Pipeline updated" className="grid gap-3 sm:grid-cols-[200px_1fr_auto] sm:items-start">
          <input type="hidden" name="ventureId" value={ventureId} />
          <select name="stage" defaultValue={stage} aria-label="Pipeline stage" className="rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-sm">
            {Object.entries(PIPELINE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <textarea name="notes" defaultValue={notes} rows={2} placeholder="Private notes — never shared" aria-label="Private notes" className="rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <SubmitButton size="sm" pendingText="…">Save</SubmitButton>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-ivory-400">Close</button>
          </div>
        </ActionForm>
      )}
    </div>
  );
}

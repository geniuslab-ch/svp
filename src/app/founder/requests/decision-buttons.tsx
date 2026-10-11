"use client";

import { decideAccessAction } from "@/app/actions/deals";
import { ConfirmAction } from "@/components/ui/confirm-form";

export function DecisionButtons({ id, status, level }: { id: string; status: string; level: string }) {
  const note = (
    <label className="block text-[13px] text-ivory-300">
      Note to the buyer (optional)
      <textarea name="note" rows={2} maxLength={500} className="mt-1.5 w-full rounded-xl border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-ivory focus:border-lime/60 focus:outline-none" />
    </label>
  );
  return (
    <div className="mt-5 flex flex-wrap gap-2 border-t border-ink-700/70 pt-4">
      {status === "PENDING" ? (
        <>
          <ConfirmAction
            action={decideAccessAction}
            fields={{ requestId: id, decision: "APPROVE" }}
            variant="primary"
            label="Approve"
            title="Approve access?"
            body={level === "DATA_ROOM" ? "The buyer can open every document in your data room for 90 days. Each access is logged." : "The buyer sees your approved-buyer information and documents marked for approved buyers. A private conversation opens."}
            confirmLabel="Approve"
          >
            {note}
          </ConfirmAction>
          <ConfirmAction action={decideAccessAction} fields={{ requestId: id, decision: "REJECT" }} variant="outline" label="Decline" title="Decline this request?" body="The buyer is told the request was declined. They can ask again after 14 days." confirmLabel="Decline" danger>
            {note}
          </ConfirmAction>
        </>
      ) : (
        <ConfirmAction action={decideAccessAction} fields={{ requestId: id, decision: "REVOKE" }} variant="danger" label="Revoke access" title="Revoke access?" body="The buyer immediately loses access to this tier. Information they already saw cannot be recalled." confirmLabel="Revoke" danger>
          {note}
        </ConfirmAction>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestAccessAction, reportAction } from "@/app/actions/deals";
import { saveVentureAction, undoInteractionAction } from "@/app/actions/discovery";
import { ActionForm, Checkbox, Field, Select, SubmitButton, Textarea, useFormState } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { BRAND } from "@/lib/brand";

export function SaveButton({ ventureId, saved, signedIn, isBuyer }: { ventureId: string; saved: boolean; signedIn: boolean; isBuyer: boolean }) {
  const [isSaved, setSaved] = useState(saved);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  if (signedIn && !isBuyer) return null;
  return (
    <Button
      variant={isSaved ? "outline" : "secondary"}
      disabled={pending}
      onClick={() => {
        if (!signedIn) return router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
        start(async () => {
          const res = isSaved ? await undoInteractionAction(ventureId) : await saveVentureAction(ventureId);
          if (res.ok) {
            setSaved(!isSaved);
            toast(isSaved ? "Removed from saved" : "Saved to your pipeline — the founder is not notified");
          } else toast(res.message, { tone: "error" });
        });
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M6 4h12v17l-6-4-6 4z" />
      </svg>
      {isSaved ? "Saved" : "Save"}
    </Button>
  );
}

function NdaError() {
  const { fieldErrors } = useFormState();
  return fieldErrors?.acceptNda ? <p className="text-[12.5px] text-clay">{fieldErrors.acceptNda}</p> : null;
}

export function RequestAccessForm({
  ventureId,
  requireNda,
  levels,
  alias,
}: {
  ventureId: string;
  requireNda: boolean;
  levels: ("DETAILS" | "DATA_ROOM")[];
  alias: string;
}) {
  return (
    <ActionForm action={requestAccessAction} className="space-y-4" resetOnSuccess>
      <input type="hidden" name="ventureId" value={ventureId} />
      <Field name="level" label="What would you like?">
        <Select name="level" defaultValue={levels[0]}>
          {levels.includes("DETAILS") && <option value="DETAILS">Detailed information (approved-buyer tier)</option>}
          {levels.includes("DATA_ROOM") && <option value="DATA_ROOM">Due-diligence data room</option>}
        </Select>
      </Field>
      <Field name="message" label="Message to the founder" hint={`Sent as “${alias}”. Your email and legal identity are not shared.`}>
        <Textarea name="message" rows={4} placeholder="Who you are (in general terms), why this venture fits, and what you’d like to learn." />
      </Field>
      {requireNda && (
        <div className="rounded-xl border border-ink-700 bg-ink-850 p-4">
          <Checkbox
            name="acceptNda"
            label="I accept the platform confidentiality undertaking"
            description={`I will keep information shared through ${BRAND.name} confidential and use it only to evaluate this acquisition. Draft wording pending legal review (version ${BRAND.ndaVersion}).`}
          />
          <NdaError />
        </div>
      )}
      <SubmitButton className="w-full" pendingText="Sending…">Send request</SubmitButton>
      <p className="text-[12px] text-ivory-500">A request is an expression of interest only. It is not an offer and creates no obligation.</p>
    </ActionForm>
  );
}

export function ReportDialog({ targetType, targetId, signedIn }: { targetType: "VENTURE" | "MESSAGE" | "USER"; targetId: string; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  if (!signedIn)
    return (
      <Link href="/login" className="text-[12.5px] text-ivory-500 hover:text-ivory-300">
        Report listing
      </Link>
    );
  return (
    <>
      <button onClick={() => setOpen(true)} className="text-[12.5px] text-ivory-500 hover:text-ivory-300">
        Report {targetType.toLowerCase()}
      </button>
      {open && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Report" className="surface w-full max-w-md p-7" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif text-3xl">Report to moderators</h2>
            <p className="mt-1 text-sm text-ivory-400">Reports are confidential. The other party is not told who reported.</p>
            <ActionForm action={reportAction} className="mt-5 space-y-4">
              <input type="hidden" name="targetType" value={targetType} />
              <input type="hidden" name="targetId" value={targetId} />
              <Field name="reason" label="Reason">
                <Select name="reason" defaultValue="Misleading information">
                  {["Misleading information", "Suspected fraud", "Spam", "Harassment", "Confidentiality breach", "Other"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </Select>
              </Field>
              <Field name="details" label="Details" optional>
                <Textarea name="details" rows={3} />
              </Field>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Close</Button>
                <SubmitButton pendingText="Sending…">Submit report</SubmitButton>
              </div>
            </ActionForm>
          </div>
        </div>
      )}
    </>
  );
}

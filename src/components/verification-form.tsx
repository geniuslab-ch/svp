"use client";

import { useState } from "react";
import { submitVerificationAction } from "@/app/actions/account";
import { ActionForm, Field, Select, SubmitButton, Textarea } from "@/components/ui/form";

export function VerificationForm({ ventures, role, canSubmit }: { ventures: { id: string; alias: string }[]; role: "FOUNDER" | "BUYER"; canSubmit: boolean }) {
  const [kind, setKind] = useState(role === "BUYER" ? "BUYER_FUNDS" : "IDENTITY");
  if (!canSubmit) return <p className="mt-3 text-sm text-amber">Confirm your email address first (level 1).</p>;
  const perVenture = kind === "OWNERSHIP" || kind === "FINANCIAL";
  return (
    <ActionForm action={submitVerificationAction} className="mt-5 space-y-5" resetOnSuccess>
      {role === "FOUNDER" ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="kind" label="Verification">
            <Select name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="IDENTITY">Level 2 · Identity</option>
              <option value="OWNERSHIP">Level 3 · Ownership / authority to sell</option>
              <option value="FINANCIAL">Level 4 · Business & financials</option>
            </Select>
          </Field>
          {perVenture && (
            <Field name="ventureId" label="Venture">
              <Select name="ventureId" defaultValue="">
                <option value="" disabled>Choose…</option>
                {ventures.map((v) => <option key={v.id} value={v.id}>{v.alias}</option>)}
              </Select>
            </Field>
          )}
        </div>
      ) : (
        <input type="hidden" name="kind" value="BUYER_FUNDS" />
      )}
      <Field name="statement" label="Describe what you are submitting" hint="e.g. “Swiss ID card (front/back). Legal name matches my profile.”">
        <Textarea name="statement" rows={3} />
      </Field>
      <Field name="files" label="Documents" hint="Up to 5 files · PDF, PNG, JPEG, WebP · max 10 MB each. Stored privately; only reviewers can open them.">
        <input name="files" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp" className="block w-full text-sm text-ivory-300 file:mr-3 file:rounded-full file:border-0 file:bg-ink-700 file:px-4 file:py-2 file:text-sm file:text-ivory hover:file:bg-ink-600" />
      </Field>
      <SubmitButton pendingText="Uploading…">Submit for review</SubmitButton>
    </ActionForm>
  );
}

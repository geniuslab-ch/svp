"use client";

import { reviewVerificationAction } from "@/app/actions/admin";
import { ActionForm, Checkbox, Field, SubmitButton, Textarea } from "@/components/ui/form";

export function ReviewForm({ requestId, financial }: { requestId: string; financial: boolean }) {
  return (
    <ActionForm action={reviewVerificationAction} successToast className="mt-5 space-y-3 border-t border-ink-700/70 pt-4">
      <input type="hidden" name="requestId" value={requestId} />
      <Field name="note" label="Note to the user" hint="Required when rejecting. Explain what is missing.">
        <Textarea name="note" rows={2} />
      </Field>
      {financial && (
        <Checkbox
          name="markMetricsVerified"
          label="Mark this venture’s disclosed historical figures as Verified"
          description="Only if the submitted documents support every disclosed figure."
        />
      )}
      <div className="flex gap-2">
        <SubmitButton name="decision" value="APPROVED" size="sm" pendingText="…">Approve</SubmitButton>
        <SubmitButton name="decision" value="REJECTED" size="sm" variant="danger" pendingText="…">Reject</SubmitButton>
      </div>
    </ActionForm>
  );
}

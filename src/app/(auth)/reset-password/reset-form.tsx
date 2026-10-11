"use client";

import { resetPasswordAction } from "@/app/actions/auth";
import { ActionForm, Field, Input, SubmitButton } from "@/components/ui/form";

export function ResetForm({ token }: { token: string }) {
  return (
    <ActionForm action={resetPasswordAction} className="mt-7 space-y-5">
      <input type="hidden" name="token" value={token} />
      <Field name="password" label="New password" hint="At least 10 characters, with a letter and a number.">
        <Input name="password" type="password" autoComplete="new-password" required />
      </Field>
      <Field name="confirm" label="Confirm password">
        <Input name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton className="w-full" pendingText="Saving…">Update password</SubmitButton>
    </ActionForm>
  );
}

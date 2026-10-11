"use client";

import Link from "next/link";
import { signupAction } from "@/app/actions/auth";
import { ActionForm, Field, Input, RadioCards, SubmitButton, useFormState } from "@/components/ui/form";

function TermsError() {
  const { fieldErrors } = useFormState();
  return fieldErrors?.acceptTerms ? <p className="text-[12.5px] text-clay">{fieldErrors.acceptTerms}</p> : null;
}

export function SignupForm({ defaultRole }: { defaultRole?: "FOUNDER" | "BUYER" }) {
  return (
    <ActionForm action={signupAction} className="mt-7 space-y-5">
      <Field name="role" label="I want to">
        <RadioCards
          name="role"
          defaultValue={defaultRole}
          options={[
            { value: "BUYER", label: "Acquire", description: "Explore under an alias. Founders never see your identity by default." },
            { value: "FOUNDER", label: "Sell", description: "List an idea, MVP or business. Verify ownership to build trust." },
          ]}
        />
      </Field>
      <Field name="email" label="Email" hint="Private. Never shown on listings or to other members.">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field name="password" label="Password" hint="At least 10 characters, with a letter and a number.">
        <Input name="password" type="password" autoComplete="new-password" required />
      </Field>
      <div className="space-y-1">
        <label className="flex cursor-pointer items-start gap-3 text-[13px] text-ivory-300">
          <input type="checkbox" name="acceptTerms" className="mt-0.5 h-4 w-4 shrink-0 appearance-none rounded border border-ink-600 bg-ink-850 checked:border-lime checked:bg-lime" />
          <span>
            I accept the <Link className="link" href="/legal/terms" target="_blank">terms</Link> and have read the{" "}
            <Link className="link" href="/legal/privacy" target="_blank">privacy notice</Link>, including how identity information is processed for verification.
          </span>
        </label>
        <TermsError />
      </div>
      <SubmitButton className="w-full" size="lg" pendingText="Creating account…">
        Create account
      </SubmitButton>
    </ActionForm>
  );
}

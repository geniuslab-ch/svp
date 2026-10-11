"use client";

import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions/auth";
import { ActionForm, Field, Input, SubmitButton } from "@/components/ui/form";

export default function ForgotPasswordPage() {
  return (
    <div className="surface p-7 sm:p-9">
      <h1 className="serif text-4xl">Reset your password</h1>
      <p className="mt-2 text-sm text-ivory-400">We’ll email you a single-use link that expires in one hour.</p>
      <ActionForm action={forgotPasswordAction} className="mt-7 space-y-5">
        <Field name="email" label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <div className="flex items-center justify-between">
          <Link href="/login" className="text-sm text-ivory-400 hover:text-ivory">Back to sign in</Link>
          <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}

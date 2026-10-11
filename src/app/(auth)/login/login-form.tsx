"use client";

import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { ActionForm, Field, Input, SubmitButton } from "@/components/ui/form";

export function LoginForm({ next }: { next?: string }) {
  return (
    <ActionForm action={loginAction} className="mt-7 space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <Field name="email" label="Email">
        <Input name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
      </Field>
      <Field name="password" label="Password">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <div className="flex items-center justify-between pt-1">
        <Link href="/forgot-password" className="text-sm text-ivory-400 hover:text-ivory">
          Forgot password?
        </Link>
        <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
      </div>
    </ActionForm>
  );
}

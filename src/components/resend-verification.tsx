"use client";

import { useActionState } from "react";
import { resendVerificationAction } from "@/app/actions/auth";
import { Button } from "./ui/button";

export function ResendVerification({ compact }: { compact?: boolean }) {
  const [state, action, pending] = useActionState(resendVerificationAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <Button variant="outline" size={compact ? "sm" : "md"} disabled={pending}>
        {pending ? "Sending…" : "Resend confirmation email"}
      </Button>
      {state.message && <span className={`text-sm ${state.ok ? "text-lime" : "text-clay"}`}>{state.message}</span>}
    </form>
  );
}

"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Button } from "./button";
import { useToast } from "./toast";
import type { ActionState } from "./form";

/** A button that asks for confirmation before submitting a destructive or irreversible action. */
export function ConfirmAction({
  action,
  fields,
  label,
  title,
  body,
  confirmLabel = "Confirm",
  variant = "ghost",
  danger,
  children,
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  label: ReactNode;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  variant?: "ghost" | "outline" | "danger" | "primary" | "secondary";
  danger?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  // Toast from the submit handler (not an effect) so feedback survives the row unmounting on refresh.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await action({}, fd);
      setOpen(false);
      toast(res.message ?? (res.ok ? "Done" : "Something went wrong"), { tone: res.ok ? "ok" : "error" });
    });
  };
  return (
    <>
      <Button type="button" variant={variant} size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      {open && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="surface w-full max-w-md p-7" onClick={(e) => e.stopPropagation()}>
            <h2 id="confirm-title" className="serif text-3xl">{title}</h2>
            <div className="mt-2 text-sm text-ivory-300">{body}</div>
            <form onSubmit={onSubmit} className="mt-6">
              {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
              {children}
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" variant={danger ? "danger" : "primary"} disabled={pending} autoFocus>
                  {pending ? "Working…" : confirmLabel}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

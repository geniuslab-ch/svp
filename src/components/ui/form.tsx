"use client";

import { createContext, useContext, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button, type buttonClass } from "./button";
import { useToast } from "./toast";

export interface ActionState {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  at?: number;
}

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

const FormCtx = createContext<ActionState>({});
const PendingCtx = createContext(false);
export const useFormState = () => useContext(FormCtx);

/**
 * Form bound to a server action. Submits inside a transition instead of using React's
 * built-in form actions, because those reset every uncontrolled field after the action —
 * which would wipe what the user typed whenever validation fails.
 */
export function ActionForm({
  action,
  children,
  className,
  successToast,
  resetOnSuccess,
  showMessage = true,
  id,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  successToast?: string | boolean;
  resetOnSuccess?: boolean;
  showMessage?: boolean;
  id?: string;
}) {
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  const toast = useToast();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const form = e.currentTarget;
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const fd = new FormData(form, submitter);
    startTransition(async () => {
      const res = await action(state, fd);
      setState(res);
      if (res.ok) {
        if (successToast) toast(typeof successToast === "string" ? successToast : res.message || "Saved");
        if (resetOnSuccess) form.reset();
      } else if (res.fieldErrors) {
        const first = Object.keys(res.fieldErrors)[0];
        form.querySelector<HTMLElement>(`[name="${CSS.escape(first)}"], [name="${CSS.escape(first)}[]"]`)?.focus();
      } else if (res.message && !showMessage) {
        toast(res.message, { tone: "error" });
      }
    });
  };

  return (
    <FormCtx.Provider value={state}>
      <PendingCtx.Provider value={pending}>
        <form ref={ref} onSubmit={onSubmit} className={className} id={id} noValidate aria-busy={pending}>
          {showMessage && state.message && !state.ok && (
            <div role="alert" className="mb-5 rounded-xl border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-clay">
              {state.message}
            </div>
          )}
          {showMessage && state.message && state.ok && !successToast && (
            <div role="status" className="mb-5 rounded-xl border border-lime/30 bg-lime/10 px-4 py-3 text-sm text-lime">
              {state.message}
            </div>
          )}
          {children}
        </form>
      </PendingCtx.Provider>
    </FormCtx.Provider>
  );
}

export function SubmitButton({
  children,
  pendingText,
  variant,
  size,
  className,
  name,
  value,
  formNoValidate,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: Parameters<typeof buttonClass>[0];
  size?: Parameters<typeof buttonClass>[1];
  className?: string;
  name?: string;
  value?: string;
  formNoValidate?: boolean;
}) {
  const pending = useContext(PendingCtx);
  return (
    <Button type="submit" variant={variant} size={size} className={className} disabled={pending} name={name} value={value} formNoValidate={formNoValidate} aria-busy={pending}>
      {pending && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {pending ? pendingText ?? children : children}
    </Button>
  );
}

export function Field({
  name,
  label,
  hint,
  children,
  className,
  optional,
}: {
  name: string;
  label?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  optional?: boolean;
}) {
  const { fieldErrors } = useFormState();
  const error = fieldErrors?.[name];
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={name} className="flex items-baseline justify-between text-[13px] font-medium text-ivory-200">
          <span>{label}</span>
          {optional && <span className="text-[11px] font-normal text-ivory-500">Optional</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${name}-error`} className="text-[12.5px] text-clay">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12.5px] text-ivory-400">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-ink-700 bg-ink-850 px-3.5 py-2.5 text-[14.5px] text-ivory placeholder:text-ivory-500 transition focus:border-lime/60 focus:bg-ink-800 focus:outline-none aria-[invalid=true]:border-clay/60";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { name: string }) {
  const { fieldErrors } = useFormState();
  const invalid = !!fieldErrors?.[props.name];
  return <input id={props.id ?? props.name} aria-invalid={invalid} aria-describedby={invalid ? `${props.name}-error` : undefined} {...props} className={cn(inputClass, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { name: string }) {
  const { fieldErrors } = useFormState();
  const invalid = !!fieldErrors?.[props.name];
  return <textarea id={props.id ?? props.name} rows={4} aria-invalid={invalid} {...props} className={cn(inputClass, "resize-y leading-relaxed", props.className)} />;
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { name: string }) {
  const { fieldErrors } = useFormState();
  const invalid = !!fieldErrors?.[props.name];
  return (
    <div className="relative">
      <select id={props.id ?? props.name} aria-invalid={invalid} {...props} className={cn(inputClass, "appearance-none pr-9", props.className)}>
        {children}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

export function Checkbox({ name, label, defaultChecked, value, description }: { name: string; label: ReactNode; defaultChecked?: boolean; value?: string; description?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl py-1 text-sm text-ivory-200">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none rounded border border-ink-600 bg-ink-850 transition checked:border-lime checked:bg-lime focus-visible:ring-2 focus-visible:ring-lime/60"
        style={{ backgroundImage: "none" }}
      />
      <span>
        {label}
        {description && <span className="mt-0.5 block text-[12.5px] text-ivory-400">{description}</span>}
      </span>
    </label>
  );
}

/** Pill-style multi-select backed by checkboxes named `${name}[]`. */
export function ChipGroup({ name, options, defaultValue = [] }: { name: string; options: { value: string; label: string }[]; defaultValue?: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label key={o.value} className="cursor-pointer">
          <input type="checkbox" name={`${name}[]`} value={o.value} defaultChecked={defaultValue.includes(o.value)} className="peer sr-only" />
          <span className="inline-flex rounded-full border border-ink-700 px-3 py-1.5 text-[13px] text-ivory-300 transition hover:border-ivory-400 peer-checked:border-lime/60 peer-checked:bg-lime/10 peer-checked:text-lime peer-focus-visible:ring-2 peer-focus-visible:ring-lime/60">
            {o.label}
          </span>
        </label>
      ))}
    </div>
  );
}

/** Radio cards. */
export function RadioCards({
  name,
  options,
  defaultValue,
  columns = 2,
}: {
  name: string;
  options: { value: string; label: string; description?: string }[];
  defaultValue?: string;
  columns?: 1 | 2 | 3;
}) {
  return (
    <div className={cn("grid gap-2.5", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-3")}>
      {options.map((o) => (
        <label key={o.value} className="cursor-pointer">
          <input type="radio" name={name} value={o.value} defaultChecked={defaultValue === o.value} className="peer sr-only" />
          <span className="block h-full rounded-xl border border-ink-700 bg-ink-850 px-4 py-3 transition hover:border-ivory-500 peer-checked:border-lime/60 peer-checked:bg-lime/[.06] peer-focus-visible:ring-2 peer-focus-visible:ring-lime/60">
            <span className="block text-sm font-medium text-ivory">{o.label}</span>
            {o.description && <span className="mt-0.5 block text-[12.5px] leading-snug text-ivory-400">{o.description}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}

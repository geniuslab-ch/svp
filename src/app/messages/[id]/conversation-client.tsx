"use client";

import { useState } from "react";
import { respondOfferAction, sendMessageAction, submitOfferAction } from "@/app/actions/deals";
import { ActionForm, Checkbox, Field, Input, Select, SubmitButton, Textarea, useFormState } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

export function Composer({ conversationId }: { conversationId: string }) {
  return (
    <ActionForm action={sendMessageAction} resetOnSuccess className="flex items-end gap-2 rounded-2xl border border-ink-700 bg-ink-900 p-2">
      <input type="hidden" name="conversationId" value={conversationId} />
      <label htmlFor="body" className="sr-only">Message</label>
      <textarea
        id="body"
        name="body"
        rows={2}
        maxLength={4000}
        placeholder="Write a message…"
        className="max-h-48 flex-1 resize-none bg-transparent px-3 py-2 text-[14.5px] placeholder:text-ivory-500 focus:outline-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
        }}
      />
      <SubmitButton size="md" pendingText="Sending…">Send</SubmitButton>
    </ActionForm>
  );
}

function AckError() {
  const { fieldErrors } = useFormState();
  return fieldErrors?.acknowledge ? <p className="text-[12.5px] text-clay">{fieldErrors.acknowledge}</p> : null;
}

export function OfferForm({ conversationId }: { conversationId: string }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setOpen(true)}>
        Make a non-binding offer
      </Button>
    );
  return (
    <ActionForm action={submitOfferAction} className="mt-4 space-y-3" successToast>
      <input type="hidden" name="conversationId" value={conversationId} />
      <Field name="type" label="Type">
        <Select name="type" defaultValue="INDICATIVE_OFFER">
          <option value="EXPRESSION_OF_INTEREST">Expression of interest</option>
          <option value="INDICATIVE_OFFER">Indicative offer</option>
        </Select>
      </Field>
      <div className="grid grid-cols-[1fr_90px] gap-2">
        <Field name="amount" label="Amount">
          <Input name="amount" inputMode="numeric" />
        </Field>
        <Field name="currency" label="Currency">
          <Select name="currency" defaultValue="CHF">{["CHF", "EUR", "USD", "GBP"].map((c) => <option key={c}>{c}</option>)}</Select>
        </Field>
      </div>
      <Field name="structure" label="Structure">
        <Textarea name="structure" rows={3} placeholder="e.g. Asset deal, 80% at close, 20% after 3-month handover" />
      </Field>
      <Field name="conditions" label="Conditions" optional>
        <Textarea name="conditions" rows={2} placeholder="e.g. Subject to due diligence and contract" />
      </Field>
      <Checkbox name="acknowledge" label="I understand this offer is non-binding and subject to due diligence and a signed agreement." />
      <AckError />
      <div className="flex gap-2">
        <SubmitButton size="sm" pendingText="Sending…">Send offer</SubmitButton>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </ActionForm>
  );
}

export function OfferResponse({ offerId, conversationId, role }: { offerId: string; conversationId: string; role: "BUYER" | "FOUNDER" }) {
  const options: [string, string][] = role === "FOUNDER" ? [["ACKNOWLEDGED", "Acknowledge"], ["DECLINED", "Decline"]] : [["WITHDRAWN", "Withdraw"]];
  return (
    <div className="mt-2 flex gap-2">
      {options.map(([value, label]) => (
        <form key={value} action={respondOfferAction}>
          <input type="hidden" name="offerId" value={offerId} />
          <input type="hidden" name="conversationId" value={conversationId} />
          <input type="hidden" name="response" value={value} />
          <button className="rounded-full border border-ink-600 px-3 py-1 text-[12.5px] hover:border-ivory-400">{label}</button>
        </form>
      ))}
    </div>
  );
}

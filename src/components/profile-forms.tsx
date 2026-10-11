"use client";

import type { BuyerProfile, FounderProfile } from "@prisma/client";
import { buyerProfileAction, founderProfileAction } from "@/app/actions/account";
import { ActionForm, Checkbox, ChipGroup, Field, Input, Select, SubmitButton, Textarea } from "@/components/ui/form";
import { BUYER_CATEGORY_LABEL, INDUSTRIES, STAGE_LABEL } from "@/lib/labels";

export function FounderProfileForm({ profile, onboarding }: { profile?: FounderProfile | null; onboarding?: boolean }) {
  return (
    <ActionForm action={founderProfileAction} className="space-y-5" successToast={!onboarding}>
      {onboarding && <input type="hidden" name="onboarding" value="1" />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="legalName" label="Full legal name" hint="Private. Used only for identity verification.">
          <Input name="legalName" defaultValue={profile?.legalName} autoComplete="name" />
        </Field>
        <Field name="displayName" label="Display name" hint="Shown only to buyers you approve.">
          <Input name="displayName" defaultValue={profile?.displayName} placeholder="e.g. Mara D." />
        </Field>
        <Field name="companyRole" label="Your role">
          <Input name="companyRole" defaultValue={profile?.companyRole} placeholder="Founder & CEO" />
        </Field>
        <Field name="country" label="Country of residence">
          <Input name="country" defaultValue={profile?.country} autoComplete="country-name" />
        </Field>
      </div>
      <Field name="linkedinUrl" label="LinkedIn or professional profile" optional hint="Helps reviewers; never shown publicly.">
        <Input name="linkedinUrl" defaultValue={profile?.linkedinUrl ?? ""} placeholder="https://" />
      </Field>
      <Field name="bio" label="Short bio" optional hint="Shared with approved buyers.">
        <Textarea name="bio" defaultValue={profile?.bio ?? ""} rows={3} />
      </Field>
      <SubmitButton pendingText="Saving…">{onboarding ? "Continue to dashboard" : "Save profile"}</SubmitButton>
    </ActionForm>
  );
}

export function BuyerProfileForm({ profile, onboarding }: { profile?: BuyerProfile | null; onboarding?: boolean }) {
  return (
    <ActionForm action={buyerProfileAction} className="space-y-6" successToast={!onboarding}>
      {onboarding && <input type="hidden" name="onboarding" value="1" />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="alias" label="Acquisition alias" hint="The only name founders see. Not your legal name.">
          <Input name="alias" defaultValue={profile?.alias} placeholder="e.g. Northwind Holdings" />
        </Field>
        <Field name="category" label="Buyer type">
          <Select name="category" defaultValue={profile?.category ?? "ENTREPRENEUR"}>
            {Object.entries(BUYER_CATEGORY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <Field name="budgetMin" label="Budget from" optional>
          <Input name="budgetMin" inputMode="numeric" defaultValue={profile?.budgetMin ?? ""} placeholder="CHF" />
        </Field>
        <Field name="budgetMax" label="Budget up to" optional>
          <Input name="budgetMax" inputMode="numeric" defaultValue={profile?.budgetMax ?? ""} placeholder="CHF" />
        </Field>
      </div>
      <Field name="industries" label="Preferred industries" optional>
        <ChipGroup name="industries" options={INDUSTRIES.map((i) => ({ value: i, label: i }))} defaultValue={profile?.industries} />
      </Field>
      <Field name="stages" label="Preferred stages" optional>
        <ChipGroup name="stages" options={Object.entries(STAGE_LABEL).map(([value, label]) => ({ value, label }))} defaultValue={profile?.stages} />
      </Field>
      <Field name="experience" label="Acquisition experience" optional>
        <Textarea name="experience" rows={2} defaultValue={profile?.experience ?? ""} placeholder="e.g. Operated two SaaS products after acquisition." />
      </Field>
      <Field name="thesis" label="Acquisition thesis" optional>
        <Textarea name="thesis" rows={2} defaultValue={profile?.thesis ?? ""} />
      </Field>
      <fieldset className="rounded-xl border border-ink-700 p-4">
        <legend className="px-2 text-[13px] font-medium text-ivory-200">What founders can see with your alias</legend>
        <div className="grid gap-1 sm:grid-cols-2">
          <Checkbox name="discloseCategory" label="Buyer type" defaultChecked={profile?.discloseCategory ?? true} />
          <Checkbox name="discloseBudget" label="Budget range" defaultChecked={profile?.discloseBudget ?? false} />
          <Checkbox name="discloseExperience" label="Experience" defaultChecked={profile?.discloseExperience ?? false} />
          <Checkbox name="discloseThesis" label="Thesis" defaultChecked={profile?.discloseThesis ?? false} />
        </div>
        <p className="mt-2 text-[12px] text-ivory-500">Your email and any verification documents are never shown to founders.</p>
      </fieldset>
      <SubmitButton pendingText="Saving…">{onboarding ? "Start discovering" : "Save profile"}</SubmitButton>
    </ActionForm>
  );
}

"use client";

import type { Metric, Venture, VentureDocument } from "@prisma/client";
import Link from "next/link";
import { createDraftAction, deleteDocumentAction, publishAction, saveStepAction, uploadDocumentAction } from "@/app/actions/listings";
import { ActionForm, Checkbox, ChipGroup, Field, Input, RadioCards, Select, SubmitButton, Textarea, useFormState } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  ACQUISITION_LABEL,
  ASSET_TYPES,
  CONFIDENTIALITY_DESCRIPTION,
  CONFIDENTIALITY_LABEL,
  GEOGRAPHIES,
  INDUSTRIES,
  METRIC_LABEL,
  MODEL_LABEL,
  REVENUE_LABEL,
  STAGE_DESCRIPTION,
  STAGE_LABEL,
} from "@/lib/labels";

type V = Venture & { metrics: Metric[]; documents: VentureDocument[] };

function Nav({ step, ventureId }: { step: number; ventureId?: string }) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-ink-700/70 pt-6">
      {step > 1 && ventureId ? (
        <Link href={`/founder/ventures/${ventureId}/edit?step=${step - 1}`} className="text-sm text-ivory-400 hover:text-ivory">← Back</Link>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        {ventureId && (
          <SubmitButton variant="ghost" name="intent" value="save" pendingText="Saving…">Save draft</SubmitButton>
        )}
        <SubmitButton name="intent" value="next" pendingText="Saving…">Save & continue</SubmitButton>
      </div>
    </div>
  );
}

function StepForm({ v, step, children }: { v: V; step: number; children: React.ReactNode }) {
  return (
    <ActionForm action={saveStepAction} className="space-y-6" successToast="Draft saved">
      <input type="hidden" name="ventureId" value={v.id} />
      <input type="hidden" name="step" value={step} />
      {children}
      <Nav step={step} ventureId={v.id} />
    </ActionForm>
  );
}

// ─── Step 1 ─────────────────────────────────────────────────────────────────

function IdentityFields({ v }: { v?: V }) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="alias" label="Venture name or confidential alias" hint="Shown publicly. Use an alias (e.g. “Project Alder”) to stay confidential.">
          <Input name="alias" defaultValue={v?.alias} />
        </Field>
        <Field name="legalName" label="Legal company name" optional hint="Never public. Shared only if you allow it below.">
          <Input name="legalName" defaultValue={v?.legalName ?? ""} />
        </Field>
      </div>
      <Checkbox name="showLegalName" defaultChecked={v?.showLegalName} label="Reveal the legal company name to buyers I approve" />
      <Field name="tagline" label="One-line tagline" hint="Max 110 characters. What it is, for whom.">
        <Input name="tagline" defaultValue={v?.tagline} maxLength={110} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field name="industry" label="Industry">
          <Select name="industry" defaultValue={v?.industry ?? ""}>
            <option value="" disabled>Choose…</option>
            {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
          </Select>
        </Field>
        <Field name="businessModel" label="Business model">
          <Select name="businessModel" defaultValue={v?.businessModel ?? "SAAS"}>
            {Object.entries(MODEL_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
        </Field>
        <Field name="geography" label="Main market">
          <Select name="geography" defaultValue={v?.geography ?? ""}>
            <option value="" disabled>Choose…</option>
            {GEOGRAPHIES.map((g) => <option key={g}>{g}</option>)}
          </Select>
        </Field>
        <Field name="foundedYear" label="Year started" optional>
          <Input name="foundedYear" inputMode="numeric" defaultValue={v?.foundedYear ?? ""} />
        </Field>
        <Field name="teamSize" label="Team size">
          <Input name="teamSize" inputMode="numeric" defaultValue={v?.teamSize ?? 1} />
        </Field>
      </div>
    </>
  );
}

export function NewVentureForm() {
  return (
    <ActionForm action={createDraftAction} className="space-y-6">
      <IdentityFields />
      <Nav step={1} />
    </ActionForm>
  );
}

// ─── Metric editor ──────────────────────────────────────────────────────────

const VISIBILITY = [
  ["TEASER", "Public teaser"],
  ["DETAILS", "Approved buyers"],
  ["DATA_ROOM", "Data room only"],
] as const;

function MetricRow({ k, m, money, currency }: { k: Metric["key"]; m?: Metric; money?: boolean; currency: string }) {
  const { fieldErrors } = useFormState();
  const err = (f: string) => fieldErrors?.[`${k}.${f}`];
  const verified = m?.source === "VERIFIED";
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-850 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{METRIC_LABEL[k]}</div>
        {verified && <span className="text-[11px] font-medium uppercase tracking-wider text-lime">✓ Verified — changing the value removes this label</span>}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1.3fr_1.2fr_1.1fr]">
        <div>
          <input name={`${k}.value`} defaultValue={m?.value ?? ""} inputMode="decimal" placeholder={k === "GROWTH_RATE" ? "% per month" : money ? currency : "Count"} aria-label={`${METRIC_LABEL[k]} value`} className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm focus:border-lime/60 focus:outline-none" />
          {err("value") && <p className="mt-1 text-[12px] text-clay">{err("value")}</p>}
        </div>
        <div>
          <input name={`${k}.period`} defaultValue={m?.period ?? ""} placeholder="Period, e.g. Aug 2026" aria-label={`${METRIC_LABEL[k]} reporting period`} className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm focus:border-lime/60 focus:outline-none" />
          {err("period") && <p className="mt-1 text-[12px] text-clay">{err("period")}</p>}
        </div>
        <select name={`${k}.source`} defaultValue={verified ? "FOUNDER_REPORTED" : m?.source ?? "NOT_DISCLOSED"} aria-label={`${METRIC_LABEL[k]} source`} className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm focus:border-lime/60 focus:outline-none">
          <option value="FOUNDER_REPORTED">Founder-reported</option>
          <option value="ESTIMATED">Estimated</option>
          <option value="NOT_DISCLOSED">Not disclosed</option>
          <option value="NOT_APPLICABLE">Not applicable</option>
        </select>
        <select name={`${k}.tier`} defaultValue={m?.tier ?? "DETAILS"} aria-label={`${METRIC_LABEL[k]} visibility`} className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm focus:border-lime/60 focus:outline-none">
          {VISIBILITY.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
    </div>
  );
}

// ─── Steps 2–10 ─────────────────────────────────────────────────────────────

export function StepContent({ v, step }: { v: V; step: number }) {
  const hist = (k: Metric["key"]) => v.metrics.find((m) => m.key === k && m.nature === "HISTORICAL");
  switch (step) {
    case 1:
      return (
        <StepForm v={v} step={1}>
          <IdentityFields v={v} />
        </StepForm>
      );
    case 2:
      return (
        <StepForm v={v} step={2}>
          <Field name="summary" label="Public description" hint="40–600 characters. Visible to everyone — avoid confidential details.">
            <Textarea name="summary" rows={4} defaultValue={v.summary} maxLength={600} />
          </Field>
          <Field name="problem" label="The problem you solve" optional hint="Approved buyers only.">
            <Textarea name="problem" rows={4} defaultValue={v.problem ?? ""} />
          </Field>
          <Field name="valueProposition" label="Value proposition" optional hint="Approved buyers only.">
            <Textarea name="valueProposition" rows={4} defaultValue={v.valueProposition ?? ""} />
          </Field>
        </StepForm>
      );
    case 3:
      return (
        <StepForm v={v} step={3}>
          <Field name="stage" label="Stage">
            <RadioCards name="stage" defaultValue={v.stage} columns={3} options={Object.entries(STAGE_LABEL).map(([value, label]) => ({ value, label, description: STAGE_DESCRIPTION[value as keyof typeof STAGE_DESCRIPTION] }))} />
          </Field>
          <Field name="productStatus" label="Product status" optional hint="What exists today and how it is used.">
            <Textarea name="productStatus" rows={3} defaultValue={v.productStatus ?? ""} />
          </Field>
          <Field name="mvpDescription" label="MVP description" optional>
            <Textarea name="mvpDescription" rows={3} defaultValue={v.mvpDescription ?? ""} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="demoUrl" label="Demo link" optional hint="Approved buyers only.">
              <Input name="demoUrl" defaultValue={v.demoUrl ?? ""} placeholder="https://" />
            </Field>
            <Field name="websiteUrl" label="Website" optional hint="Approved buyers only.">
              <Input name="websiteUrl" defaultValue={v.websiteUrl ?? ""} placeholder="https://" />
            </Field>
          </div>
        </StepForm>
      );
    case 4:
      return (
        <StepForm v={v} step={4}>
          <Field name="revenueStatus" label="Revenue status" hint="Pre-revenue is a perfectly good answer. It is shown honestly, not as a defect.">
            <RadioCards
              name="revenueStatus"
              defaultValue={v.revenueStatus}
              options={[
                { value: "PRE_REVENUE", label: REVENUE_LABEL.PRE_REVENUE, description: "No revenue yet." },
                { value: "OCCASIONAL", label: REVENUE_LABEL.OCCASIONAL, description: "One-off, project or irregular sales." },
                { value: "RECURRING", label: REVENUE_LABEL.RECURRING, description: "Subscriptions or contracted recurring revenue." },
                { value: "PROFITABLE", label: REVENUE_LABEL.PROFITABLE, description: "Revenue exceeds operating costs." },
              ]}
            />
          </Field>
          <Field name="monetization" label="How it makes (or will make) money" optional>
            <Textarea name="monetization" rows={4} defaultValue={v.monetization ?? ""} />
          </Field>
        </StepForm>
      );
    case 5: {
      const proj = v.metrics.find((m) => m.key === "ANNUAL_REVENUE" && m.nature === "PROJECTION");
      return (
        <StepForm v={v} step={5}>
          <div className="rounded-xl border border-ink-700 p-4 text-[13px] text-ivory-300">
            Enter <strong className="text-ivory">historical</strong> figures only, each with its reporting period. Choose who can see each number. You cannot mark figures as verified yourself — that happens through a financial verification review (level 4).
            {v.revenueStatus === "PRE_REVENUE" && <span className="mt-2 block text-amber">This venture is marked pre-revenue: leave revenue empty or set “Not applicable”.</span>}
          </div>
          <MetricRow k="MRR" m={hist("MRR")} money currency={v.currency} />
          <MetricRow k="MONTHLY_REVENUE" m={hist("MONTHLY_REVENUE")} money currency={v.currency} />
          <MetricRow k="ANNUAL_REVENUE" m={hist("ANNUAL_REVENUE")} money currency={v.currency} />
          <MetricRow k="MONTHLY_EXPENSES" m={hist("MONTHLY_EXPENSES")} money currency={v.currency} />
          <MetricRow k="MONTHLY_NET_PROFIT" m={hist("MONTHLY_NET_PROFIT")} money currency={v.currency} />
          <MetricRow k="GROWTH_RATE" m={hist("GROWTH_RATE")} currency={v.currency} />
          <Field name="tractionHeadline" label="Public traction headline" optional hint="A general indicator for the teaser, e.g. “380 waitlist sign-ups”. Keep it factual.">
            <Input name="tractionHeadline" defaultValue={v.tractionHeadline ?? ""} maxLength={80} />
          </Field>
          <fieldset className="rounded-xl border border-amber/30 bg-amber/5 p-4">
            <legend className="px-2 text-[13px] font-medium text-amber">Optional projection (always labelled as a projection)</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field name="projectionValue" label="Projected annual revenue">
                <Input name="projectionValue" inputMode="numeric" defaultValue={proj?.value ?? ""} />
              </Field>
              <Field name="projectionPeriod" label="For period">
                <Input name="projectionPeriod" defaultValue={proj?.period ?? ""} placeholder="e.g. FY 2027" />
              </Field>
            </div>
          </fieldset>
        </StepForm>
      );
    }
    case 6:
      return (
        <StepForm v={v} step={6}>
          <p className="text-[13px] text-ivory-400">No customers yet? Mark the counts as “Not applicable”.</p>
          <MetricRow k="CUSTOMERS" m={hist("CUSTOMERS")} currency={v.currency} />
          <MetricRow k="ACTIVE_USERS" m={hist("ACTIVE_USERS")} currency={v.currency} />
          <Field name="customersDescription" label="Customers & users" optional hint="Segments, concentration, retention. Approved buyers only.">
            <Textarea name="customersDescription" rows={4} defaultValue={v.customersDescription ?? ""} />
          </Field>
          <Field name="partnerships" label="Partnerships" optional>
            <Textarea name="partnerships" rows={3} defaultValue={v.partnerships ?? ""} />
          </Field>
        </StepForm>
      );
    case 7:
      return (
        <StepForm v={v} step={7}>
          <Field name="assetsIncluded" label="Assets included in the sale" hint="Shown on the public teaser.">
            <ChipGroup name="assetsIncluded" options={ASSET_TYPES.map((a) => ({ value: a, label: a }))} defaultValue={v.assetsIncluded} />
          </Field>
          <Field name="techStack" label="Technology stack" optional hint="Comma-separated. Approved buyers only.">
            <Input name="techStack" defaultValue={v.techStack.join(", ")} placeholder="Next.js, PostgreSQL, Python" />
          </Field>
          <Field name="intellectualProperty" label="Intellectual property" optional>
            <Textarea name="intellectualProperty" rows={3} defaultValue={v.intellectualProperty ?? ""} />
          </Field>
          <Field name="growthOpportunities" label="Growth opportunities" optional>
            <Textarea name="growthOpportunities" rows={3} defaultValue={v.growthOpportunities ?? ""} />
          </Field>
        </StepForm>
      );
    case 8:
      return (
        <StepForm v={v} step={8}>
          <div className="rounded-xl border border-ink-700 p-4 text-[13px] text-ivory-300">
            Your asking price is a seller expectation, not an independent valuation, and buyers will see it labelled that way. You can also keep it confidential.
          </div>
          <Field name="priceType" label="Pricing">
            <RadioCards
              name="priceType"
              defaultValue={v.priceType}
              columns={3}
              options={[
                { value: "FIXED", label: "Fixed price" },
                { value: "RANGE", label: "Price range" },
                { value: "ON_REQUEST", label: "Confidential", description: "Shown as “Price on request”." },
              ]}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-4">
            <Field name="currency" label="Currency">
              <Select name="currency" defaultValue={v.currency}>
                {["CHF", "EUR", "USD", "GBP"].map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field name="askingPrice" label="Fixed price">
              <Input name="askingPrice" inputMode="numeric" defaultValue={v.askingPrice ?? ""} />
            </Field>
            <Field name="askingPriceMin" label="Range from">
              <Input name="askingPriceMin" inputMode="numeric" defaultValue={v.askingPriceMin ?? ""} />
            </Field>
            <Field name="askingPriceMax" label="Range to">
              <Input name="askingPriceMax" inputMode="numeric" defaultValue={v.askingPriceMax ?? ""} />
            </Field>
          </div>
          <Field name="acquisitionType" label="What is for sale">
            <RadioCards name="acquisitionType" defaultValue={v.acquisitionType} options={Object.entries(ACQUISITION_LABEL).map(([value, label]) => ({ value, label }))} />
          </Field>
          <Field name="saleStructure" label="Preferred structure" optional hint="e.g. share deal, asset deal, earn-out, transition support.">
            <Textarea name="saleStructure" rows={3} defaultValue={v.saleStructure ?? ""} />
          </Field>
          <Field name="saleRationale" label="Why are you selling?" optional>
            <Textarea name="saleRationale" rows={3} defaultValue={v.saleRationale ?? ""} />
          </Field>
        </StepForm>
      );
    case 10:
      return (
        <StepForm v={v} step={10}>
          <Field name="confidentiality" label="Confidentiality level">
            <RadioCards
              name="confidentiality"
              defaultValue={v.confidentiality}
              columns={3}
              options={(["STANDARD", "CONFIDENTIAL", "STEALTH"] as const).map((c) => ({ value: c, label: CONFIDENTIALITY_LABEL[c], description: CONFIDENTIALITY_DESCRIPTION[c] }))}
            />
          </Field>
          <Checkbox
            name="requireNda"
            defaultChecked={v.requireNda}
            label="Require the platform confidentiality undertaking before sharing details"
            description="Always on for Confidential and Stealth listings."
          />
        </StepForm>
      );
    default:
      return null;
  }
}

// ─── Step 9: documents ──────────────────────────────────────────────────────

export function DocumentsStep({ v }: { v: V }) {
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-ink-700 p-4 text-[13px] text-ivory-300">
        Documents are stored privately and never get a public link. Each download is checked against the buyer’s permission on the server and logged. Allowed: PDF, PNG, JPEG, WebP, CSV, XLSX, DOCX up to 10&nbsp;MB.
      </div>
      <ActionForm action={uploadDocumentAction} className="grid gap-4 rounded-xl border border-ink-700 bg-ink-850 p-5 sm:grid-cols-2" successToast resetOnSuccess>
        <input type="hidden" name="ventureId" value={v.id} />
        <Field name="title" label="Title">
          <Input name="title" placeholder="e.g. 2025 P&L" />
        </Field>
        <Field name="category" label="Category">
          <Select name="category" defaultValue="financials">
            {[["financials", "Financials"], ["contracts", "Contracts"], ["ip", "Intellectual property"], ["technical", "Technical"], ["product", "Product & screenshots"], ["other", "Other"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <Field name="tier" label="Who can see it">
          <Select name="tier" defaultValue="DATA_ROOM">
            <option value="DETAILS">Approved buyers (details tier)</option>
            <option value="DATA_ROOM">Data room only</option>
          </Select>
        </Field>
        <Field name="file" label="File">
          <input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.xlsx,.docx" className="block w-full text-sm text-ivory-300 file:mr-3 file:rounded-full file:border-0 file:bg-ink-700 file:px-4 file:py-2 file:text-sm file:text-ivory hover:file:bg-ink-600" />
        </Field>
        <div className="sm:col-span-2">
          <SubmitButton pendingText="Uploading…" variant="secondary">Upload privately</SubmitButton>
        </div>
      </ActionForm>
      <div>
        <h3 className="text-sm font-medium">Uploaded ({v.documents.length})</h3>
        {v.documents.length === 0 ? (
          <p className="mt-2 text-sm text-ivory-400">No documents yet. This step is optional — you can add documents later.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-700/70 rounded-xl border border-ink-700/70">
            {v.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0 truncate">
                  {d.title} <span className="text-ivory-500">· {d.category} · {d.tier === "DATA_ROOM" ? "data room" : "approved buyers"}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <a href={`/api/documents/${d.id}`} className="link">Open</a>
                  <form action={deleteDocumentAction}>
                    <input type="hidden" name="documentId" value={d.id} />
                    <input type="hidden" name="ventureId" value={v.id} />
                    <button className="text-clay hover:underline" onClick={(e) => !confirm("Delete this document permanently?") && e.preventDefault()}>Delete</button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex justify-between border-t border-ink-700/70 pt-6">
        <Link href={`/founder/ventures/${v.id}/edit?step=8`} className="text-sm text-ivory-400 hover:text-ivory">← Back</Link>
        <Link href={`/founder/ventures/${v.id}/edit?step=10`} className="inline-flex h-10 items-center rounded-full bg-lime px-5 text-sm font-medium text-ink-950 hover:bg-lime-300">Continue</Link>
      </div>
    </div>
  );
}

// ─── Step 11: publish ───────────────────────────────────────────────────────

export function PublishStep({ v, missing }: { v: V; missing: string[] }) {
  const live = v.status === "PUBLISHED";
  return (
    <ActionForm action={publishAction} className="space-y-5">
      <input type="hidden" name="ventureId" value={v.id} />
      {missing.length > 0 ? (
        <div className="rounded-xl border border-amber/30 bg-amber/5 p-5">
          <div className="font-medium text-amber">Almost there</div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ivory-300">
            {missing.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl border border-lime/30 bg-lime/5 p-5 text-sm text-ivory-200">
          {live ? "This listing is live. Your edits are already published." : "Everything needed is in place. Publishing makes the teaser visible according to your confidentiality setting."}
        </div>
      )}
      <ul className="space-y-1.5 text-[13px] text-ivory-400">
        <li>• Publishing does not reveal your identity or any approved-buyer information.</li>
        <li>• You approve every buyer before details or documents are shared, and can revoke access.</li>
        <li>• Listing information must be accurate. Misleading listings are removed.</li>
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-700/70 pt-6">
        <Link href={`/founder/ventures/${v.id}/edit?step=10`} className="text-sm text-ivory-400 hover:text-ivory">← Back</Link>
        <div className="flex gap-2">
          {live ? (
            <Link href={`/ventures/${v.slug}`} className="inline-flex h-10 items-center rounded-full bg-lime px-5 text-sm font-medium text-ink-950">View live listing</Link>
          ) : (
            <SubmitButton pendingText="Publishing…">Publish listing</SubmitButton>
          )}
        </div>
      </div>
      {!live && missing.length > 0 && <Button type="button" variant="ghost" size="sm" disabled>Fix the items above to publish</Button>}
    </ActionForm>
  );
}

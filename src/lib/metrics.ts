import type { BusinessModel, MetricKey, MetricSource, RevenueStatus } from "@prisma/client";

export interface MetricLike {
  key: MetricKey;
  value: number | null;
  period: string | null;
  source: MetricSource;
  nature: "HISTORICAL" | "PROJECTION";
}

const RECURRING_MODELS: BusinessModel[] = ["SAAS", "SUBSCRIPTION"];

/**
 * ARR is only shown when the revenue is genuinely recurring: a recurring-revenue status,
 * a subscription-type model, a historical (not projected) MRR figure that is disclosed.
 * The result is always labelled "annualised" — it is MRR × 12, not booked annual revenue.
 */
export function annualizedRunRate(input: {
  revenueStatus: RevenueStatus;
  businessModel: BusinessModel;
  metrics: MetricLike[];
}): { value: number; basis: string; source: MetricSource } | null {
  const mrr = input.metrics.find((m) => m.key === "MRR" && m.nature === "HISTORICAL");
  if (!mrr || mrr.value == null || mrr.value <= 0) return null;
  if (mrr.source === "NOT_DISCLOSED" || mrr.source === "NOT_APPLICABLE") return null;
  const recurringStatus = input.revenueStatus === "RECURRING" || input.revenueStatus === "PROFITABLE";
  if (!recurringStatus || !RECURRING_MODELS.includes(input.businessModel)) return null;
  return {
    value: Math.round(mrr.value * 12),
    basis: `Annualised from MRR${mrr.period ? ` (${mrr.period})` : ""} × 12`,
    source: mrr.source,
  };
}

/** A metric value may only be displayed as a number when it is actually disclosed. */
export function isDisclosed(m: Pick<MetricLike, "source" | "value">): boolean {
  return m.value != null && m.source !== "NOT_DISCLOSED" && m.source !== "NOT_APPLICABLE";
}

export const CURRENCY_METRICS: MetricKey[] = [
  "MRR",
  "MONTHLY_REVENUE",
  "ANNUAL_REVENUE",
  "MONTHLY_EXPENSES",
  "MONTHLY_NET_PROFIT",
];

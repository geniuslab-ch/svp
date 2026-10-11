import { z } from "zod";
import { AppError } from "./errors";
import { INDUSTRIES } from "./labels";

// ─── Helpers ────────────────────────────────────────────────────────────────

const trimmed = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);
const optionalText = (max: number) =>
  trimmed(max)
    .optional()
    .transform((v) => (v ? v : null));
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https:\/\/[^\s]+$/i.test(v), "Use a full https:// link.");
const optionalInt = (min: number, max: number) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === undefined || v === "" ? null : Number(String(v).replace(/[’',\s]/g, ""))))
    .refine((v) => v === null || (Number.isInteger(v) && v >= min && v <= max), `Enter a whole number between ${min} and ${max}.`);
const optionalNum = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => (v === undefined || v === "" ? null : Number(String(v).replace(/[’',\s]/g, ""))))
  .refine((v) => v === null || Number.isFinite(v), "Enter a number.");

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128)
  .refine((p) => /[A-Za-z]/.test(p) && /[0-9]/.test(p), "Include at least one letter and one number.");

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(200);

/** Converts zod errors into { field: message } and throws a VALIDATION AppError. */
export function parse<T extends z.ZodTypeAny>(schema: T, data: unknown): z.output<T> {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  const fieldErrors: Record<string, string> = {};
  for (const issue of r.error.issues) {
    const k = issue.path.join(".") || "_form";
    if (!fieldErrors[k]) fieldErrors[k] = issue.message;
  }
  throw new AppError("VALIDATION", "Please check the highlighted fields.", fieldErrors);
}

export function formToObject(fd: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v !== "string" || k.startsWith("$ACTION")) continue;
    if (k.endsWith("[]")) {
      const key = k.slice(0, -2);
      out[key] = [...((out[key] as string[]) ?? []), v];
    } else out[k] = v;
  }
  return out;
}

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("1"), z.literal(""), z.undefined()])
  .transform((v) => v === "on" || v === "true" || v === "1");

// ─── Auth ───────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["FOUNDER", "BUYER"], { message: "Choose how you will use the platform." }),
  acceptTerms: z.literal("on", { errorMap: () => ({ message: "Please accept the terms and privacy notice." }) }),
});

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password.").max(128) });

// ─── Profiles ───────────────────────────────────────────────────────────────

export const founderProfileSchema = z.object({
  legalName: trimmed(120).min(2, "Enter your full legal name."),
  displayName: trimmed(60).min(2, "Enter the name buyers will see once approved."),
  companyRole: trimmed(80).min(2, "Enter your role, e.g. Founder & CEO."),
  country: trimmed(60).min(2, "Enter your country of residence."),
  linkedinUrl: optionalUrl,
  bio: optionalText(600),
});

export const buyerProfileSchema = z
  .object({
    alias: trimmed(40)
      .min(3, "Aliases need at least 3 characters.")
      .regex(/^[A-Za-z0-9][A-Za-z0-9 ._-]+$/, "Use letters, numbers, spaces, dots, dashes or underscores."),
    category: z.enum(["ENTREPRENEUR", "HOLDING_COMPANY", "STRATEGIC_BUYER", "INVESTOR", "OTHER"]),
    industries: z.array(z.string().refine((s) => INDUSTRIES.includes(s))).max(18).default([]),
    stages: z.array(z.enum(["IDEA", "PROTOTYPE", "MVP", "EARLY_TRACTION", "REVENUE", "PROFITABLE"])).default([]),
    budgetMin: optionalInt(0, 1_000_000_000),
    budgetMax: optionalInt(0, 1_000_000_000),
    experience: optionalText(600),
    thesis: optionalText(600),
    discloseCategory: checkbox,
    discloseBudget: checkbox,
    discloseExperience: checkbox,
    discloseThesis: checkbox,
  })
  .refine((d) => d.budgetMin == null || d.budgetMax == null || d.budgetMin <= d.budgetMax, {
    message: "Minimum budget must be below the maximum.",
    path: ["budgetMax"],
  });

// ─── Venture wizard ─────────────────────────────────────────────────────────

const stageEnum = z.enum(["IDEA", "PROTOTYPE", "MVP", "EARLY_TRACTION", "REVENUE", "PROFITABLE"]);
const modelEnum = z.enum([
  "SAAS", "MARKETPLACE", "ECOMMERCE", "SUBSCRIPTION", "TRANSACTIONAL", "ADVERTISING", "SERVICES", "HARDWARE", "LICENSING", "OTHER",
]);

export const step1Schema = z.object({
  alias: trimmed(60).min(2, "Give the venture a name or a confidential alias."),
  legalName: optionalText(120),
  showLegalName: checkbox,
  tagline: trimmed(110).min(8, "Write a one-line tagline (8+ characters)."),
  industry: z.string().refine((s) => INDUSTRIES.includes(s), "Choose an industry."),
  businessModel: modelEnum,
  geography: trimmed(60).min(2, "Choose a geography."),
  foundedYear: optionalInt(1950, 2100),
  teamSize: optionalInt(0, 10_000).transform((v) => v ?? 1),
});

export const step2Schema = z.object({
  summary: trimmed(600).min(40, "The public description needs at least 40 characters."),
  problem: optionalText(2000),
  valueProposition: optionalText(2000),
});

export const step3Schema = z.object({
  stage: stageEnum,
  productStatus: optionalText(2000),
  mvpDescription: optionalText(2000),
  demoUrl: optionalUrl,
  websiteUrl: optionalUrl,
});

export const step4Schema = z.object({
  revenueStatus: z.enum(["PRE_REVENUE", "OCCASIONAL", "RECURRING", "PROFITABLE"]),
  monetization: optionalText(2000),
});

/** Founders can never self-label a metric as VERIFIED — only an admin review can. */
export const FOUNDER_SOURCES = ["FOUNDER_REPORTED", "ESTIMATED", "NOT_DISCLOSED", "NOT_APPLICABLE"] as const;

export const metricInputSchema = z
  .object({
    value: optionalNum,
    period: optionalText(60),
    source: z.enum(FOUNDER_SOURCES).default("NOT_DISCLOSED"),
    tier: z.enum(["TEASER", "DETAILS", "DATA_ROOM"]).default("DETAILS"),
    evidence: optionalText(300),
  })
  .refine((m) => !(m.source === "FOUNDER_REPORTED" || m.source === "ESTIMATED") || m.value != null, {
    message: "Enter a value or mark it as not disclosed.",
    path: ["value"],
  })
  .refine((m) => m.value == null || m.period, { message: "State the reporting period.", path: ["period"] });

export type MetricInput = z.output<typeof metricInputSchema>;

export const FINANCIAL_KEYS = ["MRR", "MONTHLY_REVENUE", "ANNUAL_REVENUE", "MONTHLY_EXPENSES", "MONTHLY_NET_PROFIT", "GROWTH_RATE"] as const;
export const TRACTION_KEYS = ["CUSTOMERS", "ACTIVE_USERS"] as const;

export function parseMetricFields(obj: Record<string, string | string[]>, keys: readonly string[]) {
  const out: Record<string, MetricInput> = {};
  const errors: Record<string, string> = {};
  for (const key of keys) {
    const raw = {
      value: obj[`${key}.value`],
      period: obj[`${key}.period`],
      source: obj[`${key}.source`] || undefined,
      tier: obj[`${key}.tier`] || undefined,
      evidence: obj[`${key}.evidence`],
    };
    const r = metricInputSchema.safeParse(raw);
    if (r.success) out[key] = r.data;
    else for (const i of r.error.issues) errors[`${key}.${i.path.join(".")}`] = i.message;
  }
  if (Object.keys(errors).length) throw new AppError("VALIDATION", "Please check the highlighted metrics.", errors);
  return out;
}

export const step5Schema = z.object({
  tractionHeadline: optionalText(80),
  projectionValue: optionalNum,
  projectionPeriod: optionalText(60),
});

export const step6Schema = z.object({
  customersDescription: optionalText(2000),
  partnerships: optionalText(1500),
});

export const step7Schema = z.object({
  techStack: z.string().max(300).optional().transform((s) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 20) : [])),
  intellectualProperty: optionalText(2000),
  growthOpportunities: optionalText(2000),
  assetsIncluded: z.array(trimmed(40)).max(15).default([]),
});

export const step8Schema = z
  .object({
    priceType: z.enum(["FIXED", "RANGE", "ON_REQUEST"]),
    askingPrice: optionalInt(0, 2_000_000_000),
    askingPriceMin: optionalInt(0, 2_000_000_000),
    askingPriceMax: optionalInt(0, 2_000_000_000),
    currency: z.enum(["CHF", "EUR", "USD", "GBP"]),
    acquisitionType: z.enum(["FULL_COMPANY", "ASSET_ACQUISITION", "INTELLECTUAL_PROPERTY", "PROJECT_TRANSFER"]),
    saleStructure: optionalText(1500),
    saleRationale: optionalText(1500),
  })
  .superRefine((d, ctx) => {
    if (d.priceType === "FIXED" && d.askingPrice == null)
      ctx.addIssue({ code: "custom", path: ["askingPrice"], message: "Enter the asking price." });
    if (d.priceType === "RANGE") {
      if (d.askingPriceMin == null) ctx.addIssue({ code: "custom", path: ["askingPriceMin"], message: "Enter the lower bound." });
      if (d.askingPriceMax == null) ctx.addIssue({ code: "custom", path: ["askingPriceMax"], message: "Enter the upper bound." });
      if (d.askingPriceMin != null && d.askingPriceMax != null && d.askingPriceMin > d.askingPriceMax)
        ctx.addIssue({ code: "custom", path: ["askingPriceMax"], message: "Upper bound must exceed the lower bound." });
    }
  });

export const step10Schema = z.object({
  confidentiality: z.enum(["STANDARD", "CONFIDENTIAL", "STEALTH"]),
  requireNda: checkbox,
});

// ─── Requests, messages, offers ─────────────────────────────────────────────

export const accessRequestSchema = z.object({
  level: z.enum(["DETAILS", "DATA_ROOM"]),
  message: trimmed(1500).min(20, "Tell the founder briefly why you are interested (20+ characters)."),
  acceptNda: checkbox,
});

export const messageSchema = z.object({ body: trimmed(4000).min(1, "Write a message.") });

export const offerSchema = z.object({
  type: z.enum(["EXPRESSION_OF_INTEREST", "INDICATIVE_OFFER"]),
  amount: optionalInt(0, 2_000_000_000),
  currency: z.enum(["CHF", "EUR", "USD", "GBP"]),
  structure: trimmed(1500).min(10, "Describe the proposed structure."),
  conditions: optionalText(1500),
  acknowledge: z.literal("on", { errorMap: () => ({ message: "Please confirm that this offer is non-binding." }) }),
});

export const reportSchema = z.object({
  targetType: z.enum(["VENTURE", "MESSAGE", "USER"]),
  targetId: z.string().min(1).max(40),
  reason: z.enum(["Misleading information", "Suspected fraud", "Spam", "Harassment", "Confidentiality breach", "Other"]),
  details: optionalText(1500),
});

export const verificationSubmitSchema = z.object({
  kind: z.enum(["IDENTITY", "OWNERSHIP", "FINANCIAL", "BUYER_FUNDS"]),
  ventureId: z.string().max(40).optional().transform((v) => v || null),
  statement: trimmed(1500).min(20, "Describe what you are submitting (20+ characters)."),
});

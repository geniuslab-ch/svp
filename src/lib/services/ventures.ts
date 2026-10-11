import type {
  AcquisitionType,
  BusinessModel,
  Metric,
  Prisma,
  RevenueStatus,
  Venture,
  VentureStage,
  VerificationRequest,
} from "@prisma/client";
import { db } from "../db";
import { AppError } from "../errors";
import { canViewDataRoom, canViewDetails, canViewTeaser, canRequestAccess, isOwner, type Viewer } from "../authz";
import { founderLevel, type FounderLevel } from "../verification";
import { annualizedRunRate, isDisclosed } from "../metrics";

// ─── Selects ────────────────────────────────────────────────────────────────
// The teaser select is the ONLY shape used for public listings. Confidential columns are
// never loaded for list views, so they cannot leak through a serializer mistake.

const VERIFICATION_SELECT = {
  select: { kind: true, status: true, ventureId: true, expiresAt: true },
} as const;

export const TEASER_SELECT = {
  id: true,
  slug: true,
  founderId: true,
  alias: true,
  tagline: true,
  summary: true,
  industry: true,
  businessModel: true,
  stage: true,
  revenueStatus: true,
  acquisitionType: true,
  assetsIncluded: true,
  geography: true,
  teamSize: true,
  foundedYear: true,
  priceType: true,
  askingPrice: true,
  askingPriceMin: true,
  askingPriceMax: true,
  currency: true,
  tractionHeadline: true,
  coverSeed: true,
  confidentiality: true,
  requireNda: true,
  status: true,
  featured: true,
  publishedAt: true,
  isDemo: true,
  metrics: { where: { tier: "TEASER" as const } },
  founder: { select: { emailVerifiedAt: true, verificationRequests: VERIFICATION_SELECT } },
} satisfies Prisma.VentureSelect;

type TeaserRow = Prisma.VentureGetPayload<{ select: typeof TEASER_SELECT }>;

export interface PublicMetric {
  key: Metric["key"];
  value: number | null;
  period: string | null;
  source: Metric["source"];
  nature: Metric["nature"];
  evidence: string | null;
}

export interface VentureTeaser {
  id: string;
  slug: string;
  alias: string;
  tagline: string;
  summary: string;
  industry: string;
  businessModel: BusinessModel;
  stage: VentureStage;
  revenueStatus: RevenueStatus;
  acquisitionType: AcquisitionType;
  assetsIncluded: string[];
  geography: string;
  teamSize: number;
  foundedYear: number | null;
  priceType: Venture["priceType"];
  askingPrice: number | null;
  askingPriceMin: number | null;
  askingPriceMax: number | null;
  currency: string;
  tractionHeadline: string | null;
  coverSeed: number;
  confidentiality: Venture["confidentiality"];
  requireNda: boolean;
  status: Venture["status"];
  featured: boolean;
  publishedAt: Date | null;
  isDemo: boolean;
  founderLevel: FounderLevel;
  metrics: PublicMetric[];
  arr: { value: number; basis: string; source: Metric["source"] } | null;
}

function publicMetric(m: Metric): PublicMetric {
  // Undisclosed metrics keep their label but never their number.
  return {
    key: m.key,
    value: isDisclosed(m) ? m.value : null,
    period: m.period,
    source: m.source,
    nature: m.nature,
    evidence: m.evidence,
  };
}

export function toTeaser(row: TeaserRow): VentureTeaser {
  const metrics = row.metrics.map(publicMetric);
  return {
    id: row.id,
    slug: row.slug,
    alias: row.alias,
    tagline: row.tagline,
    summary: row.summary,
    industry: row.industry,
    businessModel: row.businessModel,
    stage: row.stage,
    revenueStatus: row.revenueStatus,
    acquisitionType: row.acquisitionType,
    assetsIncluded: row.assetsIncluded,
    geography: row.geography,
    teamSize: row.teamSize,
    foundedYear: row.foundedYear,
    priceType: row.priceType,
    askingPrice: row.askingPrice,
    askingPriceMin: row.askingPriceMin,
    askingPriceMax: row.askingPriceMax,
    currency: row.currency,
    tractionHeadline: row.tractionHeadline,
    coverSeed: row.coverSeed,
    confidentiality: row.confidentiality,
    requireNda: row.requireNda,
    status: row.status,
    featured: row.featured,
    publishedAt: row.publishedAt,
    isDemo: row.isDemo,
    founderLevel: founderLevel({
      emailVerifiedAt: row.founder.emailVerifiedAt,
      verifications: row.founder.verificationRequests,
      ventureId: row.id,
    }),
    metrics,
    arr: annualizedRunRate({ revenueStatus: row.revenueStatus, businessModel: row.businessModel, metrics }),
  };
}

// ─── Derived, public-only fields ────────────────────────────────────────────

export async function recomputeDerived(ventureId: string) {
  const v = await db.venture.findUniqueOrThrow({
    where: { id: ventureId },
    include: { metrics: { where: { tier: "TEASER", nature: "HISTORICAL" } } },
  });
  const pub = v.metrics.filter(isDisclosed);
  const get = (k: Metric["key"]) => pub.find((m) => m.key === k)?.value ?? null;
  const monthly = get("MRR") ?? get("MONTHLY_REVENUE");
  const priceFloor =
    v.priceType === "FIXED" ? v.askingPrice : v.priceType === "RANGE" ? v.askingPriceMin : null;
  const tractionScore =
    Math.log10(1 + (monthly ?? 0)) * 3 +
    Math.log10(1 + (get("CUSTOMERS") ?? 0)) * 2 +
    Math.log10(1 + (get("ACTIVE_USERS") ?? 0)) +
    (get("GROWTH_RATE") ?? 0) / 20;
  await db.venture.update({
    where: { id: ventureId },
    data: { priceFloor, publicMonthlyRevenue: monthly, tractionScore },
  });
}

// ─── Listing queries ────────────────────────────────────────────────────────

export interface VentureFilters {
  q?: string;
  industry?: string[];
  stage?: VentureStage[];
  revenueStatus?: RevenueStatus[];
  businessModel?: BusinessModel[];
  geography?: string[];
  acquisitionType?: AcquisitionType[];
  assets?: string[];
  priceMin?: number;
  priceMax?: number;
  revenueMin?: number;
  revenueMax?: number;
  profitable?: boolean;
  teamMax?: number;
  verifiedOnly?: boolean;
  sort?: "recent" | "price_asc" | "price_desc" | "traction" | "relevance";
}

const STAGES: VentureStage[] = ["IDEA", "PROTOTYPE", "MVP", "EARLY_TRACTION", "REVENUE", "PROFITABLE"];
const REVENUES: RevenueStatus[] = ["PRE_REVENUE", "OCCASIONAL", "RECURRING", "PROFITABLE"];
const MODELS: BusinessModel[] = [
  "SAAS", "MARKETPLACE", "ECOMMERCE", "SUBSCRIPTION", "TRANSACTIONAL", "ADVERTISING", "SERVICES", "HARDWARE", "LICENSING", "OTHER",
];
const ACQ: AcquisitionType[] = ["FULL_COMPANY", "ASSET_ACQUISITION", "INTELLECTUAL_PROPERTY", "PROJECT_TRANSFER"];

/** Parses URL search params into validated filters; unknown values are dropped. */
export function parseFilters(sp: Record<string, string | string[] | undefined>): VentureFilters {
  const list = (k: string) => {
    const v = sp[k];
    const arr = Array.isArray(v) ? v : v ? v.split(",") : [];
    return arr.map((s) => s.trim()).filter(Boolean).slice(0, 20);
  };
  const num = (k: string) => {
    const v = Array.isArray(sp[k]) ? sp[k]![0] : sp[k];
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]) || undefined;
  const sort = one("sort");
  return {
    q: one("q")?.slice(0, 100),
    industry: list("industry"),
    stage: list("stage").filter((s): s is VentureStage => STAGES.includes(s as VentureStage)),
    revenueStatus: list("revenue").filter((s): s is RevenueStatus => REVENUES.includes(s as RevenueStatus)),
    businessModel: list("model").filter((s): s is BusinessModel => MODELS.includes(s as BusinessModel)),
    geography: list("geo"),
    acquisitionType: list("acq").filter((s): s is AcquisitionType => ACQ.includes(s as AcquisitionType)),
    assets: list("asset"),
    priceMin: num("priceMin"),
    priceMax: num("priceMax"),
    revenueMin: num("revMin"),
    revenueMax: num("revMax"),
    profitable: one("profitable") === "1",
    teamMax: num("teamMax"),
    verifiedOnly: one("verified") === "1",
    sort: (["recent", "price_asc", "price_desc", "traction", "relevance"] as const).find((s) => s === sort),
  };
}

export function buildWhere(f: VentureFilters, viewer: Viewer): Prisma.VentureWhereInput {
  const and: Prisma.VentureWhereInput[] = [{ status: "PUBLISHED" }];
  if (!viewer?.emailVerifiedAt) and.push({ confidentiality: { not: "STEALTH" } });
  if (f.q) {
    const q = f.q;
    and.push({
      OR: [
        { alias: { contains: q, mode: "insensitive" } },
        { tagline: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
        { industry: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (f.industry?.length) and.push({ industry: { in: f.industry } });
  if (f.stage?.length) and.push({ stage: { in: f.stage } });
  if (f.revenueStatus?.length) and.push({ revenueStatus: { in: f.revenueStatus } });
  if (f.businessModel?.length) and.push({ businessModel: { in: f.businessModel } });
  if (f.geography?.length) and.push({ geography: { in: f.geography } });
  if (f.acquisitionType?.length) and.push({ acquisitionType: { in: f.acquisitionType } });
  if (f.assets?.length) and.push({ assetsIncluded: { hasSome: f.assets } });
  if (f.priceMin != null) and.push({ priceFloor: { gte: f.priceMin } });
  if (f.priceMax != null) and.push({ priceFloor: { lte: f.priceMax } });
  if (f.revenueMin != null) and.push({ publicMonthlyRevenue: { gte: f.revenueMin } });
  if (f.revenueMax != null) and.push({ publicMonthlyRevenue: { lte: f.revenueMax } });
  if (f.profitable) and.push({ revenueStatus: "PROFITABLE" });
  if (f.teamMax != null) and.push({ teamSize: { lte: f.teamMax } });
  return { AND: and };
}

function orderBy(sort: VentureFilters["sort"]): Prisma.VentureOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ priceFloor: { sort: "asc", nulls: "last" } }, { publishedAt: "desc" }];
    case "price_desc":
      return [{ priceFloor: { sort: "desc", nulls: "last" } }, { publishedAt: "desc" }];
    case "traction":
      return [{ tractionScore: "desc" }, { publishedAt: "desc" }];
    default:
      return [{ featured: "desc" }, { publishedAt: "desc" }];
  }
}

async function relevanceProfile(viewer: Viewer) {
  if (!viewer || viewer.role !== "BUYER") return null;
  return db.buyerProfile.findUnique({ where: { userId: viewer.id } });
}

function relevanceScore(t: VentureTeaser, p: { industries: string[]; stages: string[]; budgetMax: number | null }) {
  let s = 0;
  if (p.industries.includes(t.industry)) s += 3;
  if (p.stages.includes(t.stage)) s += 2;
  const floor = t.askingPrice ?? t.askingPriceMin;
  if (p.budgetMax != null && floor != null && floor <= p.budgetMax) s += 1.5;
  s += t.founderLevel * 0.4;
  if (t.featured) s += 0.5;
  return s;
}

export async function listVentures(f: VentureFilters, viewer: Viewer, opts: { page?: number; pageSize?: number } = {}) {
  const pageSize = opts.pageSize ?? 24;
  const page = Math.max(1, opts.page ?? 1);
  const where = buildWhere(f, viewer);
  const [total, rows] = await Promise.all([
    db.venture.count({ where }),
    db.venture.findMany({
      where,
      select: TEASER_SELECT,
      orderBy: orderBy(f.sort),
      take: f.sort === "relevance" || f.verifiedOnly ? 300 : pageSize,
      skip: f.sort === "relevance" || f.verifiedOnly ? 0 : (page - 1) * pageSize,
    }),
  ]);
  let items = rows.map(toTeaser);
  let count = total;
  if (f.verifiedOnly) {
    items = items.filter((t) => t.founderLevel >= 2);
    count = items.length;
  }
  if (f.sort === "relevance") {
    const profile = await relevanceProfile(viewer);
    if (profile) items.sort((a, b) => relevanceScore(b, profile) - relevanceScore(a, profile));
  }
  if (f.sort === "relevance" || f.verifiedOnly) items = items.slice((page - 1) * pageSize, page * pageSize);
  return { items, total: count, page, pageSize };
}

/** Swipe queue: published ventures the viewer has not saved or passed, excluding their own. */
export async function discoverQueue(f: VentureFilters, viewer: Viewer, excludeIds: string[] = [], take = 20) {
  const where = buildWhere(f, viewer);
  const extra: Prisma.VentureWhereInput[] = [];
  if (viewer) {
    extra.push({ founderId: { not: viewer.id } });
    extra.push({ interactions: { none: { userId: viewer.id } } });
  }
  if (excludeIds.length) extra.push({ id: { notIn: excludeIds.slice(0, 500) } });
  const rows = await db.venture.findMany({
    where: { AND: [where, ...extra] },
    select: TEASER_SELECT,
    orderBy: orderBy(f.sort),
    take: f.sort === "relevance" ? 200 : take,
  });
  let items = rows.map(toTeaser);
  if (f.verifiedOnly) items = items.filter((t) => t.founderLevel >= 2);
  if (f.sort === "relevance" || !f.sort) {
    const profile = await relevanceProfile(viewer);
    if (profile) items.sort((a, b) => relevanceScore(b, profile) - relevanceScore(a, profile));
  }
  return items.slice(0, take);
}

// ─── Single venture, tiered by permission ───────────────────────────────────

export async function getVentureForViewer(slugOrId: string, viewer: Viewer) {
  const venture = await db.venture.findFirst({
    where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
    include: {
      metrics: true,
      documents: { orderBy: { createdAt: "desc" } },
      founder: {
        select: {
          id: true,
          emailVerifiedAt: true,
          founderProfile: { select: { displayName: true, companyRole: true, country: true } },
          verificationRequests: VERIFICATION_SELECT,
        },
      },
    },
  });
  if (!venture) throw new AppError("NOT_FOUND", "Venture not found.");

  const grants = viewer
    ? await db.accessRequest.findMany({ where: { ventureId: venture.id, buyerId: viewer.id } })
    : [];

  if (!canViewTeaser(venture, viewer, grants)) throw new AppError("NOT_FOUND", "Venture not found.");

  const teaser = toTeaser({
    ...venture,
    metrics: venture.metrics.filter((m) => m.tier === "TEASER"),
  } as unknown as TeaserRow);

  const detailsAllowed = canViewDetails(venture, viewer, grants);
  const dataRoomAllowed = canViewDataRoom(venture, viewer, grants);

  const details = detailsAllowed
    ? {
        legalName: venture.showLegalName || isOwner(venture, viewer) || viewer?.role === "ADMIN" ? venture.legalName : null,
        founderName: venture.founder.founderProfile?.displayName ?? null,
        founderRole: venture.founder.founderProfile?.companyRole ?? null,
        problem: venture.problem,
        valueProposition: venture.valueProposition,
        productStatus: venture.productStatus,
        mvpDescription: venture.mvpDescription,
        monetization: venture.monetization,
        customersDescription: venture.customersDescription,
        partnerships: venture.partnerships,
        techStack: venture.techStack,
        intellectualProperty: venture.intellectualProperty,
        growthOpportunities: venture.growthOpportunities,
        saleRationale: venture.saleRationale,
        saleStructure: venture.saleStructure,
        demoUrl: venture.demoUrl,
        websiteUrl: venture.websiteUrl,
        metrics: venture.metrics.filter((m) => m.tier !== "DATA_ROOM" || dataRoomAllowed).map(publicMetric),
        documents: venture.documents
          .filter((d) => d.tier === "DETAILS" || (d.tier === "TEASER"))
          .map(({ id, title, category, filename, mimeType, size, createdAt }) => ({ id, title, category, filename, mimeType, size, createdAt })),
      }
    : null;

  const arrAll = details
    ? annualizedRunRate({ revenueStatus: venture.revenueStatus, businessModel: venture.businessModel, metrics: details.metrics })
    : null;

  return {
    venture: teaser,
    details,
    detailsArr: arrAll,
    viewerIsOwner: isOwner(venture, viewer),
    access: {
      details: detailsAllowed,
      dataRoom: dataRoomAllowed,
      canRequest: canRequestAccess(venture, viewer),
      requests: grants.map((g) => ({
        id: g.id,
        level: g.level,
        status: g.status,
        ndaAcceptedAt: g.ndaAcceptedAt,
        expiresAt: g.expiresAt,
        createdAt: g.createdAt,
      })),
    },
  };
}

/** Raw (owner-only) record for the edit wizard. */
export async function getOwnedVenture(ventureId: string, viewer: Viewer) {
  const v = await db.venture.findUnique({ where: { id: ventureId }, include: { metrics: true, documents: true } });
  if (!v || !viewer || (v.founderId !== viewer.id && viewer.role !== "ADMIN")) throw new AppError("NOT_FOUND", "Venture not found.");
  return v;
}

export type VerificationRow = Pick<VerificationRequest, "kind" | "status" | "ventureId" | "expiresAt">;

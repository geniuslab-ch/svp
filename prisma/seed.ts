/**
 * DEMO DATA ONLY. Every venture, person and figure below is fictional and is flagged
 * `isDemo = true`, which renders a visible "Demo" label in the UI.
 * Run with `npm run db:seed`. Re-running replaces previous demo records.
 */
import { PrismaClient, type MetricKey, type MetricSource, type InfoTier, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const DEMO_PASSWORD = "demo-password-1";
const DEMO_DOMAIN = "demo.sequel.test";

type M = [MetricKey, number | null, string | null, MetricSource, InfoTier];

interface DemoVenture {
  alias: string;
  founder: "founder" | "founder2";
  data: Omit<Prisma.VentureUncheckedCreateInput, "slug" | "founderId" | "alias">;
  metrics?: M[];
  verified?: ("OWNERSHIP" | "FINANCIAL")[];
}

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86400_000);

const ventures: DemoVenture[] = [
  {
    alias: "Ledgerline",
    founder: "founder",
    verified: ["OWNERSHIP", "FINANCIAL"],
    data: {
      tagline: "Bookkeeping autopilot for Swiss sole traders",
      summary: "A SaaS that reconciles bank feeds into VAT-ready books for freelancers and sole traders. Paying customers in German-speaking Switzerland, low churn, and a clean, documented codebase.",
      industry: "Fintech", businessModel: "SAAS", stage: "PROFITABLE", revenueStatus: "PROFITABLE",
      acquisitionType: "FULL_COMPANY", assetsIncluded: ["Source code", "Domain", "Brand & trademarks", "User base"],
      geography: "Switzerland", teamSize: 2, foundedYear: 2022,
      priceType: "RANGE", askingPriceMin: 380000, askingPriceMax: 450000, currency: "CHF",
      tractionHeadline: "Profitable for 9 consecutive months",
      legalName: "Ledgerline GmbH (demo)", showLegalName: true,
      problem: "Sole traders spend 4–6 hours a month categorising transactions and preparing VAT returns.",
      valueProposition: "Automatic categorisation tuned for Swiss VAT rates, with an accountant hand-off export.",
      productStatus: "Live product, web + iOS. 99.9% uptime over the last 12 months.",
      monetization: "Monthly subscription, CHF 19–49 per seat.",
      customersDescription: "Freelancers, consultants and small trades. No customer above 2% of revenue.",
      techStack: ["Next.js", "PostgreSQL", "Python", "AWS"],
      intellectualProperty: "Categorisation model trained on anonymised data; brand registered in CH.",
      growthOpportunities: "French-speaking cantons, accountant channel partnerships, payroll add-on.",
      saleRationale: "Founders are moving to a new venture and want a careful handover.",
      saleStructure: "Share deal preferred; 3-month transition support included.",
      confidentiality: "STANDARD", requireNda: true, featured: true,
    },
    metrics: [
      ["MRR", 14200, "Aug 2026", "FOUNDER_REPORTED", "TEASER"],
      ["CUSTOMERS", 610, "Aug 2026", "FOUNDER_REPORTED", "TEASER"],
      ["MONTHLY_EXPENSES", 6100, "Aug 2026", "FOUNDER_REPORTED", "DETAILS"],
      ["MONTHLY_NET_PROFIT", 8100, "Aug 2026", "FOUNDER_REPORTED", "DETAILS"],
      ["GROWTH_RATE", 4.2, "Avg monthly, Mar–Aug 2026", "FOUNDER_REPORTED", "DETAILS"],
    ],
  },
  {
    alias: "Project Alder",
    founder: "founder",
    verified: ["OWNERSHIP"],
    data: {
      tagline: "Carbon accounting for mid-size manufacturers",
      summary: "A working MVP that turns ERP purchase data into Scope 3 estimates. Two paid pilots with industrial SMEs and a waitlist from a cantonal business association.",
      industry: "Climate & Energy", businessModel: "SAAS", stage: "EARLY_TRACTION", revenueStatus: "OCCASIONAL",
      acquisitionType: "FULL_COMPANY", assetsIncluded: ["Source code", "Data & models", "Customer contracts"],
      geography: "Switzerland", teamSize: 3, foundedYear: 2024,
      priceType: "ON_REQUEST", currency: "CHF",
      tractionHeadline: "2 paid pilots · 40-company waitlist",
      problem: "Mid-size manufacturers face Scope 3 reporting duties but can’t afford consultants.",
      valueProposition: "Connects to common ERPs and produces auditable emission estimates in days.",
      productStatus: "MVP live with pilot customers.",
      monetization: "Pilot fees today; planned annual licence.",
      techStack: ["TypeScript", "Python", "PostgreSQL"],
      saleRationale: "Founding team splitting; the technical founder would join an acquirer.",
      confidentiality: "CONFIDENTIAL", requireNda: true, featured: true,
    },
    metrics: [
      ["CUSTOMERS", 2, "Sep 2026", "FOUNDER_REPORTED", "TEASER"],
      ["MONTHLY_REVENUE", 3500, "Avg. Jun–Aug 2026 (pilot fees)", "FOUNDER_REPORTED", "DETAILS"],
    ],
  },
  {
    alias: "Pausa",
    founder: "founder2",
    data: {
      tagline: "Booking app for independent wellness studios",
      summary: "A mobile-first booking and membership tool built for yoga and pilates studios. Polished MVP used by 11 studios on a free plan; no revenue yet.",
      industry: "Health & Wellness", businessModel: "SUBSCRIPTION", stage: "MVP", revenueStatus: "PRE_REVENUE",
      acquisitionType: "ASSET_ACQUISITION", assetsIncluded: ["Source code", "Mobile apps", "Domain", "Designs & prototypes"],
      geography: "Germany", teamSize: 1, foundedYear: 2025,
      priceType: "FIXED", askingPrice: 45000, currency: "EUR",
      tractionHeadline: "11 studios onboarded (free plan)",
      productStatus: "iOS and Android apps live in stores; studio dashboard in beta.",
      monetization: "Planned: €39/month per studio.",
      techStack: ["React Native", "Supabase", "Stripe"],
      saleRationale: "Solo founder taking a full-time role.",
      confidentiality: "STANDARD", requireNda: false,
    },
    metrics: [
      ["ACTIVE_USERS", 740, "Monthly active, Aug 2026", "FOUNDER_REPORTED", "TEASER"],
      ["MONTHLY_REVENUE", null, null, "NOT_APPLICABLE", "TEASER"],
    ],
  },
  {
    alias: "Fieldnote",
    founder: "founder2",
    data: {
      tagline: "Voice-to-report for field service technicians",
      summary: "A prototype that turns spoken notes into structured service reports. Validated with 25 technician interviews; clickable prototype and speech pipeline proof of concept.",
      industry: "AI & Automation", businessModel: "SAAS", stage: "PROTOTYPE", revenueStatus: "PRE_REVENUE",
      acquisitionType: "INTELLECTUAL_PROPERTY", assetsIncluded: ["Designs & prototypes", "Source code", "Domain"],
      geography: "Austria", teamSize: 1, foundedYear: 2026,
      priceType: "FIXED", askingPrice: 18000, currency: "EUR",
      tractionHeadline: "25 user interviews documented",
      confidentiality: "STANDARD", requireNda: false,
    },
  },
  {
    alias: "Harbor & Twine",
    founder: "founder",
    data: {
      tagline: "Direct-to-consumer sustainable home textiles",
      summary: "An e-commerce brand selling organic linen bedding. Established supplier in Portugal, repeat customers, and seasonal revenue with a strong Q4.",
      industry: "E-commerce", businessModel: "ECOMMERCE", stage: "REVENUE", revenueStatus: "OCCASIONAL",
      acquisitionType: "FULL_COMPANY", assetsIncluded: ["Brand & trademarks", "Inventory", "Supplier relationships", "Social accounts", "Domain"],
      geography: "Benelux", teamSize: 2, foundedYear: 2021,
      priceType: "FIXED", askingPrice: 160000, currency: "EUR",
      tractionHeadline: "38% repeat-purchase rate",
      confidentiality: "STANDARD", requireNda: true,
    },
    metrics: [
      ["ANNUAL_REVENUE", 212000, "FY 2025", "FOUNDER_REPORTED", "TEASER"],
      ["MONTHLY_REVENUE", 17600, "Avg. FY 2025", "FOUNDER_REPORTED", "TEASER"],
      ["CUSTOMERS", 3900, "Lifetime, to Aug 2026", "FOUNDER_REPORTED", "DETAILS"],
    ],
  },
  {
    alias: "Stealth — Legal workflow",
    founder: "founder",
    data: {
      tagline: "Contract intake automation for in-house legal teams",
      summary: "Confidential listing. An MVP automating contract request triage for in-house legal teams, with one enterprise design partner.",
      industry: "Legal & Compliance", businessModel: "SAAS", stage: "MVP", revenueStatus: "PRE_REVENUE",
      acquisitionType: "FULL_COMPANY", assetsIncluded: ["Source code", "Customer contracts"],
      geography: "United Kingdom", teamSize: 2, foundedYear: 2025,
      priceType: "ON_REQUEST", currency: "GBP",
      confidentiality: "STEALTH", requireNda: true,
    },
  },
  {
    alias: "Trailhead Maps",
    founder: "founder2",
    data: {
      tagline: "Offline trail maps for alpine hut-to-hut trekking",
      summary: "A niche mobile app with curated offline routes for Swiss and Italian hut treks. Paid downloads with steady seasonal sales and an engaged community.",
      industry: "Sports & Outdoors", businessModel: "TRANSACTIONAL", stage: "REVENUE", revenueStatus: "OCCASIONAL",
      acquisitionType: "PROJECT_TRANSFER", assetsIncluded: ["Mobile apps", "Content library", "Domain", "Social accounts"],
      geography: "Switzerland", teamSize: 1, foundedYear: 2020,
      priceType: "FIXED", askingPrice: 70000, currency: "CHF",
      tractionHeadline: "4.8★ average across 1,100 reviews",
      confidentiality: "STANDARD", requireNda: false,
    },
    metrics: [
      ["ANNUAL_REVENUE", 41000, "Calendar 2025", "FOUNDER_REPORTED", "TEASER"],
      ["ACTIVE_USERS", 9800, "Monthly active, Jul 2026", "FOUNDER_REPORTED", "TEASER"],
    ],
  },
  {
    alias: "Cadence HR",
    founder: "founder",
    data: {
      tagline: "Shift scheduling for multi-site restaurants",
      summary: "Recurring-revenue SaaS replacing spreadsheets for restaurant groups with 3–20 locations. Integrates with two POS systems.",
      industry: "Food & Hospitality", businessModel: "SAAS", stage: "REVENUE", revenueStatus: "RECURRING",
      acquisitionType: "FULL_COMPANY", assetsIncluded: ["Source code", "User base", "Customer contracts", "Domain"],
      geography: "France", teamSize: 4, foundedYear: 2023,
      priceType: "RANGE", askingPriceMin: 250000, askingPriceMax: 320000, currency: "EUR",
      tractionHeadline: "31 restaurant groups on annual plans",
      confidentiality: "CONFIDENTIAL", requireNda: true,
    },
    metrics: [
      ["MRR", 8900, "Aug 2026", "FOUNDER_REPORTED", "TEASER"],
      ["CUSTOMERS", 31, "Aug 2026", "FOUNDER_REPORTED", "TEASER"],
      ["MONTHLY_EXPENSES", 9700, "Aug 2026", "FOUNDER_REPORTED", "DETAILS"],
    ],
  },
  {
    alias: "Kindling",
    founder: "founder2",
    data: {
      tagline: "Validated concept: tutoring marketplace for vocational apprentices",
      summary: "An idea-stage concept with a landing page, 380 waitlist sign-ups and a research report on apprentice exam pass rates. No product built yet.",
      industry: "Education", businessModel: "MARKETPLACE", stage: "IDEA", revenueStatus: "PRE_REVENUE",
      acquisitionType: "PROJECT_TRANSFER", assetsIncluded: ["Domain", "Brand & trademarks", "Designs & prototypes"],
      geography: "Switzerland", teamSize: 1, foundedYear: 2026,
      priceType: "FIXED", askingPrice: 6000, currency: "CHF",
      tractionHeadline: "380 waitlist sign-ups",
      confidentiality: "STANDARD", requireNda: false,
    },
  },
  {
    alias: "Quayside",
    founder: "founder",
    data: {
      tagline: "Property-maintenance ticketing for small landlords",
      summary: "A web MVP letting tenants report issues with photos and landlords dispatch tradespeople. Live with 60 units; first paying landlord signed.",
      industry: "Proptech", businessModel: "SAAS", stage: "EARLY_TRACTION", revenueStatus: "RECURRING",
      acquisitionType: "ASSET_ACQUISITION", assetsIncluded: ["Source code", "Domain", "User base"],
      geography: "Nordics", teamSize: 2, foundedYear: 2025,
      priceType: "FIXED", askingPrice: 55000, currency: "EUR",
      confidentiality: "STANDARD", requireNda: true,
    },
    metrics: [["MRR", 390, "Sep 2026", "FOUNDER_REPORTED", "TEASER"]],
  },
  {
    alias: "Signal Garden",
    founder: "founder2",
    data: {
      tagline: "Newsletter + job board for climate-tech operators",
      summary: "A weekly newsletter with an engaged audience of climate-tech professionals and a paid job board. Advertising and job-post revenue.",
      industry: "Media & Content", businessModel: "ADVERTISING", stage: "PROFITABLE", revenueStatus: "PROFITABLE",
      acquisitionType: "FULL_COMPANY", assetsIncluded: ["Content library", "Brand & trademarks", "Social accounts", "Domain"],
      geography: "Global / remote", teamSize: 1, foundedYear: 2021,
      priceType: "FIXED", askingPrice: 120000, currency: "USD",
      tractionHeadline: "21k subscribers · 48% open rate",
      confidentiality: "STANDARD", requireNda: false,
    },
    metrics: [
      ["MONTHLY_REVENUE", 5200, "Avg. Mar–Aug 2026", "ESTIMATED", "TEASER"],
      ["ACTIVE_USERS", 21000, "Subscribers, Sep 2026", "FOUNDER_REPORTED", "TEASER"],
      ["MONTHLY_NET_PROFIT", 3900, "Avg. Mar–Aug 2026", "FOUNDER_REPORTED", "DETAILS"],
    ],
  },
  {
    alias: "Velo Courier OS",
    founder: "founder",
    data: {
      tagline: "Dispatch software for urban bike-courier cooperatives",
      summary: "A route-batching and dispatch MVP running in production at one courier co-op. Hardware-free, works on any phone.",
      industry: "Mobility", businessModel: "SAAS", stage: "MVP", revenueStatus: "PRE_REVENUE",
      acquisitionType: "FULL_COMPANY", assetsIncluded: ["Source code", "Mobile apps"],
      geography: "Italy", teamSize: 2, foundedYear: 2025,
      priceType: "ON_REQUEST", currency: "EUR",
      confidentiality: "STANDARD", requireNda: true,
    },
    metrics: [["ACTIVE_USERS", 54, "Riders, Sep 2026", "FOUNDER_REPORTED", "TEASER"]],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // Remove previous demo data (cascade deletes their ventures, requests, etc.)
  await db.user.deleteMany({ where: { email: { endsWith: `@${DEMO_DOMAIN}` } } });

  const mk = (local: string, role: "FOUNDER" | "BUYER" | "ADMIN") =>
    db.user.create({
      data: {
        email: `${local}@${DEMO_DOMAIN}`,
        passwordHash,
        role,
        emailVerifiedAt: new Date(),
        privacyAcceptedAt: new Date(),
        privacyVersion: "demo",
      },
    });

  const founder = await mk("founder", "FOUNDER");
  const founder2 = await mk("founder2", "FOUNDER");
  const buyer = await mk("buyer", "BUYER");
  const buyer2 = await mk("buyer2", "BUYER");
  const admin = await mk("admin", "ADMIN");

  await db.founderProfile.create({ data: { userId: founder.id, legalName: "Mara Demo", displayName: "Mara D.", companyRole: "Co-founder & CEO", country: "Switzerland", bio: "Demo founder account." } });
  await db.founderProfile.create({ data: { userId: founder2.id, legalName: "Jonas Demo", displayName: "Jonas", companyRole: "Founder", country: "Germany" } });
  await db.buyerProfile.create({
    data: {
      userId: buyer.id, alias: "Northwind Holdings", category: "HOLDING_COMPANY",
      industries: ["Fintech", "Productivity", "Food & Hospitality"], stages: ["MVP", "REVENUE", "PROFITABLE"],
      budgetMin: 50000, budgetMax: 500000, experience: "Acquired and operated two SaaS products.", thesis: "Boring, profitable B2B software in DACH.",
      discloseCategory: true, discloseBudget: true, discloseExperience: true, verification: "VERIFIED",
    },
  });
  await db.buyerProfile.create({
    data: { userId: buyer2.id, alias: "Cobalt Operator", category: "ENTREPRENEUR", industries: ["Health & Wellness"], stages: ["IDEA", "MVP"], budgetMax: 60000 },
  });

  // Founder 1: identity verified (level 2). Founder 2: identity pending (stays level 1).
  await db.verificationRequest.create({
    data: { userId: founder.id, kind: "IDENTITY", status: "APPROVED", statement: "Demo identity submission.", reviewerId: admin.id, reviewedAt: daysAgo(40), expiresAt: daysAgo(-690) },
  });
  await db.verificationRequest.create({
    data: { userId: founder2.id, kind: "IDENTITY", status: "PENDING", statement: "Demo: passport scan and proof of address (no real file attached)." },
  });

  const created: Record<string, string> = {};
  for (const [i, v] of ventures.entries()) {
    const owner = v.founder === "founder" ? founder : founder2;
    const slug = `${v.alias.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-demo`;
    const venture = await db.venture.create({
      data: {
        ...v.data,
        alias: v.alias,
        slug,
        founderId: owner.id,
        status: "PUBLISHED",
        publishedAt: daysAgo(i * 2 + 1),
        wizardStep: 11,
        coverSeed: 101 + i * 37,
        isDemo: true,
      },
    });
    created[v.alias] = venture.id;
    for (const [key, value, period, source, tier] of v.metrics ?? []) {
      await db.metric.upsert({
        where: { ventureId_key_nature: { ventureId: venture.id, key, nature: "HISTORICAL" } },
        create: { ventureId: venture.id, key, value, period, source, tier },
        update: { value, period, source, tier },
      });
    }
    for (const kind of v.verified ?? []) {
      await db.verificationRequest.create({
        data: { userId: owner.id, ventureId: venture.id, kind, status: "APPROVED", statement: `Demo ${kind.toLowerCase()} review.`, reviewerId: admin.id, reviewedAt: daysAgo(20), expiresAt: daysAgo(-160) },
      });
    }
    if (v.verified?.includes("FINANCIAL")) {
      await db.metric.updateMany({
        where: { ventureId: venture.id, value: { not: null } },
        data: { source: "VERIFIED", evidence: "Demo: platform review of bank statements and accounting exports" },
      });
    }
    // Derived public fields
    const pub = await db.metric.findMany({ where: { ventureId: venture.id, tier: "TEASER", nature: "HISTORICAL", value: { not: null }, source: { notIn: ["NOT_DISCLOSED", "NOT_APPLICABLE"] } } });
    const get = (k: MetricKey) => pub.find((m) => m.key === k)?.value ?? null;
    const monthly = get("MRR") ?? get("MONTHLY_REVENUE");
    await db.venture.update({
      where: { id: venture.id },
      data: {
        priceFloor: venture.priceType === "FIXED" ? venture.askingPrice : venture.priceType === "RANGE" ? venture.askingPriceMin : null,
        publicMonthlyRevenue: monthly,
        tractionScore: Math.log10(1 + (monthly ?? 0)) * 3 + Math.log10(1 + (get("CUSTOMERS") ?? 0)) * 2 + Math.log10(1 + (get("ACTIVE_USERS") ?? 0)),
      },
    });
  }

  // A draft venture for the founder dashboard
  await db.venture.create({
    data: {
      slug: "untitled-draft-demo", founderId: founder.id, alias: "Untitled booking tool", tagline: "Draft — not yet published",
      summary: "", industry: "Productivity", businessModel: "SAAS", stage: "IDEA", geography: "Switzerland", wizardStep: 3, coverSeed: 999, isDemo: true,
    },
  });

  // Buyer activity: saved, passed, an approved request with a conversation, a pending request.
  const ledger = created["Ledgerline"];
  const cadence = created["Cadence HR"];
  const alder = created["Project Alder"];
  await db.ventureInteraction.createMany({
    data: [
      { userId: buyer.id, ventureId: ledger, kind: "SAVED" },
      { userId: buyer.id, ventureId: cadence, kind: "SAVED" },
      { userId: buyer.id, ventureId: created["Kindling"], kind: "PASSED" },
    ],
  });
  await db.ventureView.createMany({ data: [ledger, cadence, alder].map((ventureId) => ({ userId: buyer.id, ventureId })) });

  await db.accessRequest.create({
    data: {
      ventureId: ledger, buyerId: buyer.id, level: "DETAILS", status: "APPROVED",
      message: "We operate two B2B SaaS products in DACH and would love to understand churn and the support load.",
      ndaAcceptedAt: daysAgo(6), ndaVersion: "demo", decidedAt: daysAgo(5),
    },
  });
  await db.accessRequest.create({
    data: {
      ventureId: cadence, buyerId: buyer.id, level: "DETAILS", status: "PENDING",
      message: "Hospitality software is a focus for us. Could you share the POS integration roadmap and churn by cohort?",
      ndaAcceptedAt: daysAgo(1), ndaVersion: "demo",
    },
  });
  await db.accessRequest.create({
    data: {
      ventureId: ledger, buyerId: buyer2.id, level: "DETAILS", status: "PENDING",
      message: "Solo operator looking for a first acquisition. Interested in the handover plan and the support workload.",
      ndaAcceptedAt: daysAgo(0), ndaVersion: "demo",
    },
  });

  const convo = await db.conversation.create({ data: { ventureId: ledger, buyerId: buyer.id, founderId: founder.id } });
  await db.message.createMany({
    data: [
      { conversationId: convo.id, senderId: buyer.id, body: "We operate two B2B SaaS products in DACH and would love to understand churn and the support load.", createdAt: daysAgo(6) },
      { conversationId: convo.id, kind: "SYSTEM", body: "The founder approved the information request. Detailed listing information is now visible.", createdAt: daysAgo(5) },
      { conversationId: convo.id, senderId: founder.id, body: "Thanks for reaching out. Monthly logo churn has been 1.1–1.6% this year; support is about 5 hours a week. Happy to set up a call.", createdAt: daysAgo(5) },
      { conversationId: convo.id, senderId: buyer.id, body: "Very helpful. Could we also get data-room access to review the P&L?", createdAt: daysAgo(4) },
    ],
  });

  await db.pipelineEntry.createMany({
    data: [
      { buyerId: buyer.id, ventureId: ledger, stage: "IN_DISCUSSION", notes: "Strong fit. Check VAT-rule maintenance effort." },
      { buyerId: buyer.id, ventureId: cadence, stage: "INFO_REQUESTED" },
    ],
  });

  await db.notification.createMany({
    data: [
      { userId: founder.id, type: "access.requested", title: "Northwind Holdings requested more information on Cadence HR", link: "/founder/requests" },
      { userId: founder.id, type: "access.requested", title: "Cobalt Operator requested more information on Ledgerline", link: "/founder/requests" },
      { userId: buyer.id, type: "access.approved", title: "The founder of Ledgerline approved your information request", link: "/ventures/ledgerline-demo", readAt: daysAgo(4) },
    ],
  });

  await db.report.create({
    data: { reporterId: buyer2.id, targetType: "VENTURE", targetId: created["Signal Garden"], reason: "Misleading information", details: "Demo report: subscriber count seems inconsistent with open rate." },
  });

  console.log(`Seeded ${ventures.length} demo ventures. Demo password: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

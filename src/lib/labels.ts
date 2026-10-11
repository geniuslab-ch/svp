import type {
  AccessStatus,
  AcquisitionType,
  BusinessModel,
  BuyerCategory,
  Confidentiality,
  MetricKey,
  MetricSource,
  PipelineStage,
  RevenueStatus,
  VentureStage,
  VentureStatus,
  VerificationStatus,
} from "@prisma/client";

export const STAGE_LABEL: Record<VentureStage, string> = {
  IDEA: "Idea",
  PROTOTYPE: "Prototype",
  MVP: "MVP",
  EARLY_TRACTION: "Early traction",
  REVENUE: "Revenue-generating",
  PROFITABLE: "Profitable",
};

export const STAGE_DESCRIPTION: Record<VentureStage, string> = {
  IDEA: "A business concept, validated or not. No working product.",
  PROTOTYPE: "Designs, a demo or a proof of concept.",
  MVP: "A minimum viable product that can be used or tested.",
  EARLY_TRACTION: "First users, customers or partnerships.",
  REVENUE: "Generates actual revenue.",
  PROFITABLE: "Profitable or growing, with operating history.",
};

export const REVENUE_LABEL: Record<RevenueStatus, string> = {
  PRE_REVENUE: "Pre-revenue",
  OCCASIONAL: "Occasional revenue",
  RECURRING: "Recurring revenue",
  PROFITABLE: "Profitable",
};

export const MODEL_LABEL: Record<BusinessModel, string> = {
  SAAS: "SaaS",
  MARKETPLACE: "Marketplace",
  ECOMMERCE: "E-commerce",
  SUBSCRIPTION: "Subscription",
  TRANSACTIONAL: "Transactional",
  ADVERTISING: "Advertising",
  SERVICES: "Services",
  HARDWARE: "Hardware",
  LICENSING: "Licensing",
  OTHER: "Other",
};

export const ACQUISITION_LABEL: Record<AcquisitionType, string> = {
  FULL_COMPANY: "Full company",
  ASSET_ACQUISITION: "Asset acquisition",
  INTELLECTUAL_PROPERTY: "Intellectual property",
  PROJECT_TRANSFER: "Project transfer",
};

export const CONFIDENTIALITY_LABEL: Record<Confidentiality, string> = {
  STANDARD: "Standard",
  CONFIDENTIAL: "Confidential",
  STEALTH: "Stealth",
};

export const CONFIDENTIALITY_DESCRIPTION: Record<Confidentiality, string> = {
  STANDARD: "Teaser is public. Details are shared with buyers you approve.",
  CONFIDENTIAL: "Teaser is public under an alias. Details require your approval and the platform NDA.",
  STEALTH: "Teaser is only shown to signed-in, email-verified members. Details require approval and NDA.",
};

export const METRIC_LABEL: Record<MetricKey, string> = {
  MRR: "Monthly recurring revenue",
  MONTHLY_REVENUE: "Monthly revenue",
  ANNUAL_REVENUE: "Annual revenue",
  MONTHLY_EXPENSES: "Monthly operating expenses",
  MONTHLY_NET_PROFIT: "Monthly net profit",
  CUSTOMERS: "Paying customers",
  ACTIVE_USERS: "Active users",
  GROWTH_RATE: "Growth rate",
};

export const METRIC_SHORT: Record<MetricKey, string> = {
  MRR: "MRR",
  MONTHLY_REVENUE: "Revenue / mo",
  ANNUAL_REVENUE: "Revenue / yr",
  MONTHLY_EXPENSES: "Expenses / mo",
  MONTHLY_NET_PROFIT: "Net profit / mo",
  CUSTOMERS: "Customers",
  ACTIVE_USERS: "Active users",
  GROWTH_RATE: "Growth",
};

export const SOURCE_LABEL: Record<MetricSource, string> = {
  VERIFIED: "Verified",
  FOUNDER_REPORTED: "Founder-reported",
  ESTIMATED: "Estimated",
  NOT_DISCLOSED: "Not disclosed",
  NOT_APPLICABLE: "Not applicable",
};

export const BUYER_CATEGORY_LABEL: Record<BuyerCategory, string> = {
  ENTREPRENEUR: "Entrepreneur",
  HOLDING_COMPANY: "Holding company",
  STRATEGIC_BUYER: "Strategic buyer",
  INVESTOR: "Investor",
  OTHER: "Other",
};

export const PIPELINE_LABEL: Record<PipelineStage, string> = {
  DISCOVERED: "Discovered",
  INTERESTED: "Interested",
  INFO_REQUESTED: "Information requested",
  IN_DISCUSSION: "In discussion",
  DUE_DILIGENCE: "Due diligence",
  OFFER_SUBMITTED: "Offer submitted",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const VENTURE_STATUS_LABEL: Record<VentureStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  PAUSED: "Paused",
  SOLD: "Sold",
  REMOVED: "Removed by moderation",
};

export const ACCESS_STATUS_LABEL: Record<AccessStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Declined",
  REVOKED: "Revoked",
  WITHDRAWN: "Withdrawn",
};

export const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
};

export const INDUSTRIES = [
  "AI & Automation",
  "Climate & Energy",
  "Consumer",
  "Developer Tools",
  "E-commerce",
  "Education",
  "Fintech",
  "Food & Hospitality",
  "Health & Wellness",
  "HR & Recruiting",
  "Legal & Compliance",
  "Media & Content",
  "Mobility",
  "Productivity",
  "Proptech",
  "Sports & Outdoors",
  "Travel",
  "Other",
];

export const ASSET_TYPES = [
  "Source code",
  "Domain",
  "Brand & trademarks",
  "Customer contracts",
  "User base",
  "Mobile apps",
  "Patents",
  "Designs & prototypes",
  "Inventory",
  "Social accounts",
  "Content library",
  "Supplier relationships",
  "Data & models",
];

export const GEOGRAPHIES = [
  "Switzerland",
  "Germany",
  "France",
  "Italy",
  "Austria",
  "United Kingdom",
  "Nordics",
  "Benelux",
  "Iberia",
  "Rest of Europe",
  "North America",
  "Global / remote",
];

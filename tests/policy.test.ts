import { describe, expect, it } from "vitest";
import { canEditVenture, canRequestAccess, canViewDataRoom, canViewDetails, canViewTeaser, type GrantLike } from "@/lib/authz";
import { annualizedRunRate } from "@/lib/metrics";
import { founderLevel } from "@/lib/verification";

const venture = { founderId: "f1", status: "PUBLISHED", confidentiality: "STANDARD", requireNda: true } as const;
const buyer = { id: "b1", role: "BUYER", emailVerifiedAt: new Date() } as const;
const unverifiedBuyer = { id: "b2", role: "BUYER", emailVerifiedAt: null } as const;
const founder = { id: "f1", role: "FOUNDER", emailVerifiedAt: new Date() } as const;
const otherFounder = { id: "f2", role: "FOUNDER", emailVerifiedAt: new Date() } as const;
const admin = { id: "a1", role: "ADMIN", emailVerifiedAt: new Date() } as const;
const grant = (o: Partial<GrantLike> = {}): GrantLike => ({
  level: "DETAILS",
  status: "APPROVED",
  ndaAcceptedAt: new Date(),
  expiresAt: null,
  ...o,
});

describe("authorization policy", () => {
  it("shows published teasers to anonymous visitors", () => {
    expect(canViewTeaser(venture, null)).toBe(true);
  });

  it("hides drafts and removed listings from everyone but the owner and admins", () => {
    for (const status of ["DRAFT", "REMOVED"] as const) {
      const v = { ...venture, status };
      expect(canViewTeaser(v, null)).toBe(false);
      expect(canViewTeaser(v, buyer, [grant()])).toBe(false);
      expect(canViewTeaser(v, founder)).toBe(true);
      expect(canViewTeaser(v, admin)).toBe(true);
    }
  });

  it("hides stealth teasers from visitors and unverified users", () => {
    const v = { ...venture, confidentiality: "STEALTH" } as const;
    expect(canViewTeaser(v, null)).toBe(false);
    expect(canViewTeaser(v, unverifiedBuyer)).toBe(false);
    expect(canViewTeaser(v, buyer)).toBe(true);
  });

  it("requires an approved, unexpired grant with NDA for details", () => {
    expect(canViewDetails(venture, null, [])).toBe(false);
    expect(canViewDetails(venture, buyer, [])).toBe(false);
    expect(canViewDetails(venture, buyer, [grant({ status: "PENDING" })])).toBe(false);
    expect(canViewDetails(venture, buyer, [grant({ status: "REVOKED" })])).toBe(false);
    expect(canViewDetails(venture, buyer, [grant({ ndaAcceptedAt: null })])).toBe(false);
    expect(canViewDetails(venture, buyer, [grant({ expiresAt: new Date(Date.now() - 1000) })])).toBe(false);
    expect(canViewDetails(venture, buyer, [grant()])).toBe(true);
    expect(canViewDetails({ ...venture, requireNda: false }, buyer, [grant({ ndaAcceptedAt: null })])).toBe(true);
  });

  it("requires a DATA_ROOM grant for the data room", () => {
    expect(canViewDataRoom(venture, buyer, [grant()])).toBe(false);
    expect(canViewDataRoom(venture, buyer, [grant({ level: "DATA_ROOM" })])).toBe(true);
    expect(canViewDataRoom(venture, otherFounder, [])).toBe(false);
    expect(canViewDataRoom(venture, founder, [])).toBe(true);
  });

  it("only lets the owning founder edit, and only buyers request access", () => {
    expect(canEditVenture(venture, founder)).toBe(true);
    expect(canEditVenture(venture, otherFounder)).toBe(false);
    expect(canEditVenture(venture, buyer)).toBe(false);
    expect(canRequestAccess(venture, buyer)).toBe(true);
    expect(canRequestAccess(venture, otherFounder)).toBe(false);
    expect(canRequestAccess(venture, null)).toBe(false);
    expect(canRequestAccess({ ...venture, status: "PAUSED" }, buyer)).toBe(false);
  });
});

describe("revenue transparency", () => {
  const mrr = (o = {}) => ({ key: "MRR" as const, value: 5000, period: "Aug 2026", source: "FOUNDER_REPORTED" as const, nature: "HISTORICAL" as const, ...o });

  it("annualises MRR only for recurring subscription-type revenue", () => {
    expect(annualizedRunRate({ revenueStatus: "RECURRING", businessModel: "SAAS", metrics: [mrr()] })?.value).toBe(60000);
    expect(annualizedRunRate({ revenueStatus: "OCCASIONAL", businessModel: "SAAS", metrics: [mrr()] })).toBeNull();
    expect(annualizedRunRate({ revenueStatus: "RECURRING", businessModel: "ECOMMERCE", metrics: [mrr()] })).toBeNull();
    expect(annualizedRunRate({ revenueStatus: "RECURRING", businessModel: "SAAS", metrics: [mrr({ nature: "PROJECTION" })] })).toBeNull();
    expect(annualizedRunRate({ revenueStatus: "RECURRING", businessModel: "SAAS", metrics: [mrr({ source: "NOT_DISCLOSED" })] })).toBeNull();
  });

  it("labels the run rate as annualised", () => {
    expect(annualizedRunRate({ revenueStatus: "RECURRING", businessModel: "SUBSCRIPTION", metrics: [mrr()] })?.basis).toMatch(/Annualised/);
  });
});

describe("founder verification levels", () => {
  const base = { emailVerifiedAt: new Date(), ventureId: "v1" };
  const v = (kind: "IDENTITY" | "OWNERSHIP" | "FINANCIAL", status: "PENDING" | "APPROVED" | "REJECTED", ventureId: string | null = null, expiresAt: Date | null = null) => ({ kind, status, ventureId, expiresAt });

  it("is cumulative and only counts approved reviews", () => {
    expect(founderLevel({ ...base, emailVerifiedAt: null, verifications: [v("IDENTITY", "APPROVED")] })).toBe(0);
    expect(founderLevel({ ...base, verifications: [] })).toBe(1);
    expect(founderLevel({ ...base, verifications: [v("IDENTITY", "PENDING")] })).toBe(1);
    expect(founderLevel({ ...base, verifications: [v("IDENTITY", "APPROVED")] })).toBe(2);
    expect(founderLevel({ ...base, verifications: [v("OWNERSHIP", "APPROVED", "v1")] })).toBe(1);
    expect(founderLevel({ ...base, verifications: [v("IDENTITY", "APPROVED"), v("OWNERSHIP", "APPROVED", "v2")] })).toBe(2);
    expect(
      founderLevel({ ...base, verifications: [v("IDENTITY", "APPROVED"), v("OWNERSHIP", "APPROVED", "v1"), v("FINANCIAL", "APPROVED", "v1")] }),
    ).toBe(4);
  });

  it("ignores expired approvals", () => {
    const past = new Date(Date.now() - 1000);
    expect(founderLevel({ ...base, verifications: [v("IDENTITY", "APPROVED", null, past)] })).toBe(1);
  });
});

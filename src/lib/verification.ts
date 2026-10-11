import type { VerificationKind, VerificationStatus } from "@prisma/client";

export interface VerificationLike {
  kind: VerificationKind;
  status: VerificationStatus;
  ventureId: string | null;
  expiresAt: Date | null;
}

/** An approval past its expiry date no longer counts, even before the sweep marks it EXPIRED. */
export function effectiveStatus(v: Pick<VerificationLike, "status" | "expiresAt">, now = new Date()): VerificationStatus {
  if (v.status === "APPROVED" && v.expiresAt && v.expiresAt < now) return "EXPIRED";
  return v.status;
}

function approved(list: VerificationLike[], kind: VerificationKind, ventureId?: string) {
  return list.some(
    (v) => v.kind === kind && (ventureId === undefined || v.ventureId === ventureId) && effectiveStatus(v) === "APPROVED",
  );
}

export type FounderLevel = 0 | 1 | 2 | 3 | 4;

export const LEVEL_LABEL: Record<FounderLevel, string> = {
  0: "Unverified",
  1: "Email verified",
  2: "Identity verified",
  3: "Ownership verified",
  4: "Business & financials verified",
};

export const LEVEL_SHORT: Record<FounderLevel, string> = {
  0: "Unverified",
  1: "L1 · Email",
  2: "L2 · Identity",
  3: "L3 · Ownership",
  4: "L4 · Financials",
};

/**
 * Levels are cumulative: a level only counts when every level below it is complete.
 * Uploading a document never raises a level — only an APPROVED, unexpired review does.
 */
export function founderLevel(input: {
  emailVerifiedAt: Date | null;
  verifications: VerificationLike[];
  ventureId?: string;
}): FounderLevel {
  if (!input.emailVerifiedAt) return 0;
  if (!approved(input.verifications, "IDENTITY")) return 1;
  if (!input.ventureId || !approved(input.verifications, "OWNERSHIP", input.ventureId)) return 2;
  if (!approved(input.verifications, "FINANCIAL", input.ventureId)) return 3;
  return 4;
}

export function latestOf(list: (VerificationLike & { createdAt: Date })[], kind: VerificationKind, ventureId?: string) {
  return list
    .filter((v) => v.kind === kind && (ventureId === undefined || v.ventureId === ventureId))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

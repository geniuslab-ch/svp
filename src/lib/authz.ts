import type { AccessLevel, AccessStatus, Confidentiality, Role, VentureStatus } from "@prisma/client";

/**
 * Pure authorization policy. Every server-side read of venture data goes through these
 * functions; the UI only reflects their result. Covered by tests/authz.test.ts.
 */

export type Viewer = { id: string; role: Role; emailVerifiedAt: Date | null } | null;

export interface VentureGate {
  founderId: string;
  status: VentureStatus;
  confidentiality: Confidentiality;
  requireNda: boolean;
}

export interface GrantLike {
  level: AccessLevel;
  status: AccessStatus;
  ndaAcceptedAt: Date | null;
  expiresAt: Date | null;
}

export const isOwner = (v: Pick<VentureGate, "founderId">, viewer: Viewer) => !!viewer && viewer.id === v.founderId;
export const isAdmin = (viewer: Viewer) => viewer?.role === "ADMIN";

function grantActive(g: GrantLike, venture: VentureGate, now: Date) {
  if (g.status !== "APPROVED") return false;
  if (g.expiresAt && g.expiresAt < now) return false;
  if (venture.requireNda && !g.ndaAcceptedAt) return false;
  return true;
}

export function canViewTeaser(venture: VentureGate, viewer: Viewer, grants: GrantLike[] = [], now = new Date()) {
  if (isOwner(venture, viewer) || isAdmin(viewer)) return true;
  if (venture.status === "REMOVED" || venture.status === "DRAFT") return false;
  // Buyers already in a process keep sight of the teaser if the listing is paused or sold.
  if (grants.some((g) => grantActive(g, venture, now))) return true;
  if (venture.status !== "PUBLISHED") return false;
  if (venture.confidentiality === "STEALTH") return !!viewer?.emailVerifiedAt;
  return true;
}

export function canViewDetails(venture: VentureGate, viewer: Viewer, grants: GrantLike[], now = new Date()) {
  if (isOwner(venture, viewer) || isAdmin(viewer)) return true;
  if (!viewer || venture.status === "REMOVED" || venture.status === "DRAFT") return false;
  return grants.some((g) => grantActive(g, venture, now));
}

export function canViewDataRoom(venture: VentureGate, viewer: Viewer, grants: GrantLike[], now = new Date()) {
  if (isOwner(venture, viewer) || isAdmin(viewer)) return true;
  if (!viewer || venture.status === "REMOVED" || venture.status === "DRAFT") return false;
  return grants.some((g) => g.level === "DATA_ROOM" && grantActive(g, venture, now));
}

export function canEditVenture(venture: Pick<VentureGate, "founderId" | "status">, viewer: Viewer) {
  return isOwner(venture, viewer) && viewer?.role === "FOUNDER" && venture.status !== "REMOVED";
}

/** Buyers request access; founders and admins cannot request access to listings. */
export function canRequestAccess(venture: VentureGate, viewer: Viewer) {
  if (!viewer || viewer.role !== "BUYER") return false;
  if (isOwner(venture, viewer)) return false;
  return venture.status === "PUBLISHED";
}

import type { Confidentiality, MetricSource, RevenueStatus, VentureStage } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { LEVEL_LABEL, LEVEL_SHORT, type FounderLevel } from "@/lib/verification";
import { CONFIDENTIALITY_DESCRIPTION, CONFIDENTIALITY_LABEL, REVENUE_LABEL, SOURCE_LABEL, STAGE_DESCRIPTION, STAGE_LABEL } from "@/lib/labels";

export function VerificationBadge({ level, compact }: { level: FounderLevel; compact?: boolean }) {
  if (level === 0) return <Badge tone="outline">Unverified founder</Badge>;
  const tone = level >= 3 ? "lime" : level === 2 ? "sage" : "outline";
  return (
    <Badge tone={tone} title={`Founder verification: ${LEVEL_LABEL[level]}. Levels are only awarded after review.`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
        {level >= 2 ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <path d="M4 7h16v10H4zM4 7l8 6 8-6" />}
      </svg>
      {compact ? LEVEL_SHORT[level] : LEVEL_LABEL[level]}
    </Badge>
  );
}

export function StageBadge({ stage }: { stage: VentureStage }) {
  return (
    <Badge tone="neutral" title={STAGE_DESCRIPTION[stage]}>
      {STAGE_LABEL[stage]}
    </Badge>
  );
}

export function RevenueBadge({ status }: { status: RevenueStatus }) {
  const tone = status === "PROFITABLE" ? "lime" : status === "RECURRING" ? "sage" : status === "OCCASIONAL" ? "amber" : "outline";
  return <Badge tone={tone}>{REVENUE_LABEL[status]}</Badge>;
}

export function ConfidentialityBadge({ level }: { level: Confidentiality }) {
  if (level === "STANDARD") return null;
  return (
    <Badge tone="steel" title={CONFIDENTIALITY_DESCRIPTION[level]}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      {CONFIDENTIALITY_LABEL[level]}
    </Badge>
  );
}

export function SourceTag({ source, nature }: { source: MetricSource; nature?: "HISTORICAL" | "PROJECTION" }) {
  if (nature === "PROJECTION") return <span className="text-[11px] font-medium uppercase tracking-wider text-amber">Projection</span>;
  const cls =
    source === "VERIFIED" ? "text-lime" : source === "FOUNDER_REPORTED" ? "text-ivory-400" : source === "ESTIMATED" ? "text-amber" : "text-ivory-500";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider ${cls}`}>
      {source === "VERIFIED" && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      )}
      {SOURCE_LABEL[source]}
    </span>
  );
}

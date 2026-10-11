import Link from "next/link";
import type { VentureTeaser } from "@/lib/services/ventures";
import { formatPrice } from "@/lib/format";
import { MODEL_LABEL, ACQUISITION_LABEL } from "@/lib/labels";
import { VentureCover } from "./cover";
import { ConfidentialityBadge, RevenueBadge, StageBadge, VerificationBadge } from "./badges";
import { metricValue } from "./metric";
import { METRIC_SHORT } from "@/lib/labels";
import { SourceTag } from "./badges";

export function VentureCard({ v, layout = "grid", footer }: { v: VentureTeaser; layout?: "grid" | "list"; footer?: React.ReactNode }) {
  const headline = v.metrics.find((m) => m.value != null && ["MRR", "MONTHLY_REVENUE"].includes(m.key)) ?? v.metrics.find((m) => m.value != null);
  if (layout === "list") {
    return (
      <article className="group relative flex gap-4 rounded-card border border-ink-700/70 bg-ink-900 p-3 transition hover:border-ink-600 hover:bg-ink-850 sm:gap-5">
        <VentureCover seed={v.coverSeed} alias={v.alias} className="h-24 w-24 shrink-0 rounded-[10px] sm:h-28 sm:w-40" monogram={false} />
        <div className="min-w-0 flex-1 py-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <StageBadge stage={v.stage} />
            <RevenueBadge status={v.revenueStatus} />
            <ConfidentialityBadge level={v.confidentiality} />
          </div>
          <h3 className="mt-2 truncate text-[17px] font-medium">
            <Link href={`/ventures/${v.slug}`} className="after:absolute after:inset-0">
              {v.alias}
            </Link>
          </h3>
          <p className="line-clamp-1 text-sm text-ivory-300">{v.tagline}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ivory-400">
            <span>{v.industry}</span>
            <span>{MODEL_LABEL[v.businessModel]}</span>
            <span>{v.geography}</span>
          </div>
        </div>
        <div className="hidden shrink-0 flex-col items-end justify-between py-1 text-right sm:flex">
          <div className="num text-[15px]">{formatPrice(v)}</div>
          <VerificationBadge level={v.founderLevel} compact />
        </div>
      </article>
    );
  }
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-ink-700/70 bg-ink-900 transition duration-300 hover:-translate-y-0.5 hover:border-ink-600 hover:shadow-lift">
      <div className="relative">
        <VentureCover seed={v.coverSeed} alias={v.alias} className="aspect-[16/10] w-full transition duration-500 group-hover:scale-[1.02]" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <StageBadge stage={v.stage} />
          <ConfidentialityBadge level={v.confidentiality} />
        </div>
        {v.isDemo && <span className="absolute right-3 top-3 rounded-full bg-ink-950/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ivory-300 backdrop-blur">Demo</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="eyebrow">{v.industry} · {MODEL_LABEL[v.businessModel]}</div>
        <h3 className="mt-2 text-xl font-medium leading-snug">
          <Link href={`/ventures/${v.slug}`} className="after:absolute after:inset-0">
            {v.alias}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-ivory-300">{v.tagline}</p>
        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-3 border-t border-ink-700/70 pt-4">
            <div>
              <div className="text-[11.5px] text-ivory-400">Asking · {ACQUISITION_LABEL[v.acquisitionType]}</div>
              <div className="num mt-0.5 text-[15px]">{formatPrice(v)}</div>
            </div>
            <div className="text-right">
              {headline ? (
                <>
                  <div className="text-[11.5px] text-ivory-400">{METRIC_SHORT[headline.key]}</div>
                  <div className="num mt-0.5 text-[15px]">{metricValue(headline, v.currency)}</div>
                  <SourceTag source={headline.source} />
                </>
              ) : (
                <RevenueBadge status={v.revenueStatus} />
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <VerificationBadge level={v.founderLevel} compact />
            {footer}
          </div>
        </div>
      </div>
    </article>
  );
}

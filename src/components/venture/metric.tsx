import type { PublicMetric } from "@/lib/services/ventures";
import { METRIC_LABEL, METRIC_SHORT } from "@/lib/labels";
import { CURRENCY_METRICS } from "@/lib/metrics";
import { formatMoney, formatNumber } from "@/lib/format";
import { SourceTag } from "./badges";

export function metricValue(m: Pick<PublicMetric, "key" | "value">, currency: string) {
  if (m.value == null) return null;
  if (m.key === "GROWTH_RATE") return `${m.value > 0 ? "+" : ""}${m.value}%`;
  if (CURRENCY_METRICS.includes(m.key)) return formatMoney(m.value, currency);
  return formatNumber(m.value);
}

export function MetricStat({ m, currency, short }: { m: PublicMetric; currency: string; short?: boolean }) {
  const v = metricValue(m, currency);
  return (
    <div className="min-w-0">
      <div className="truncate text-[11.5px] text-ivory-400">
        {short ? METRIC_SHORT[m.key] : METRIC_LABEL[m.key]}
        {m.nature === "PROJECTION" && " (projected)"}
      </div>
      <div className="num mt-0.5 text-lg leading-tight text-ivory">{v ?? <span className="text-ivory-500">{m.source === "NOT_APPLICABLE" ? "n/a" : "Undisclosed"}</span>}</div>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2">
        <SourceTag source={m.source} nature={m.nature} />
        {m.period && v && <span className="text-[11px] text-ivory-500">{m.period}</span>}
      </div>
    </div>
  );
}

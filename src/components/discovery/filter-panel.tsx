import type { VentureFilters } from "@/lib/services/ventures";
import { ACQUISITION_LABEL, ASSET_TYPES, GEOGRAPHIES, INDUSTRIES, MODEL_LABEL, REVENUE_LABEL, STAGE_LABEL } from "@/lib/labels";

function Group({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-ink-700/70 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[13px] font-medium text-ivory-200">
        {title}
        <svg className="h-4 w-4 text-ivory-500 transition group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function Chips({ name, options, selected }: { name: string; options: [string, string][]; selected?: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([value, label]) => (
        <label key={value} className="cursor-pointer">
          <input type="checkbox" name={name} value={value} defaultChecked={selected?.includes(value)} className="peer sr-only" />
          <span className="inline-flex rounded-full border border-ink-700 px-2.5 py-1 text-[12.5px] text-ivory-300 transition hover:border-ivory-500 peer-checked:border-lime/60 peer-checked:bg-lime/10 peer-checked:text-lime peer-focus-visible:ring-2 peer-focus-visible:ring-lime/60">
            {label}
          </span>
        </label>
      ))}
    </div>
  );
}

const numInput =
  "w-full rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-ivory placeholder:text-ivory-500 focus:border-lime/60 focus:outline-none";

/** Plain GET form, so filters work without JavaScript and produce shareable URLs. */
export function FilterPanel({ f, action, keep }: { f: VentureFilters; action: string; keep?: Record<string, string> }) {
  const activeCount =
    (f.industry?.length ?? 0) + (f.stage?.length ?? 0) + (f.revenueStatus?.length ?? 0) + (f.businessModel?.length ?? 0) +
    (f.geography?.length ?? 0) + (f.acquisitionType?.length ?? 0) + (f.assets?.length ?? 0) +
    [f.priceMin, f.priceMax, f.revenueMin, f.revenueMax, f.teamMax].filter((x) => x != null).length + (f.profitable ? 1 : 0) + (f.verifiedOnly ? 1 : 0);
  return (
    <form action={action} method="get" className="text-sm">
      {keep && Object.entries(keep).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {f.q && <input type="hidden" name="q" value={f.q} />}
      {f.sort && <input type="hidden" name="sort" value={f.sort} />}
      <div className="flex items-center justify-between pb-2">
        <div className="eyebrow">Filters {activeCount > 0 && <span className="text-lime">· {activeCount}</span>}</div>
        {activeCount > 0 && (
          <a href={action} className="text-[12.5px] text-ivory-400 hover:text-ivory">
            Clear all
          </a>
        )}
      </div>
      <Group title="Stage" open>
        <Chips name="stage" options={Object.entries(STAGE_LABEL)} selected={f.stage} />
      </Group>
      <Group title="Industry" open={!!f.industry?.length}>
        <Chips name="industry" options={INDUSTRIES.map((i) => [i, i])} selected={f.industry} />
      </Group>
      <Group title="Revenue" open={!!f.revenueStatus?.length || f.revenueMin != null || f.revenueMax != null || f.profitable}>
        <Chips name="revenue" options={Object.entries(REVENUE_LABEL)} selected={f.revenueStatus} />
        <div className="mt-3 text-[12px] text-ivory-400">Publicly disclosed monthly revenue</div>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <input className={numInput} name="revMin" inputMode="numeric" placeholder="Min / mo" defaultValue={f.revenueMin ?? ""} aria-label="Minimum monthly revenue" />
          <input className={numInput} name="revMax" inputMode="numeric" placeholder="Max / mo" defaultValue={f.revenueMax ?? ""} aria-label="Maximum monthly revenue" />
        </div>
        <label className="mt-3 flex items-center gap-2 text-[13px] text-ivory-300">
          <input type="checkbox" name="profitable" value="1" defaultChecked={f.profitable} className="h-4 w-4 accent-lime" /> Profitable only
        </label>
      </Group>
      <Group title="Asking price" open={f.priceMin != null || f.priceMax != null}>
        <div className="grid grid-cols-2 gap-2">
          <input className={numInput} name="priceMin" inputMode="numeric" placeholder="Min" defaultValue={f.priceMin ?? ""} aria-label="Minimum price" />
          <input className={numInput} name="priceMax" inputMode="numeric" placeholder="Max" defaultValue={f.priceMax ?? ""} aria-label="Maximum price" />
        </div>
        <p className="mt-2 text-[12px] text-ivory-500">“Price on request” listings are excluded when a price filter is set.</p>
      </Group>
      <Group title="Business model" open={!!f.businessModel?.length}>
        <Chips name="model" options={Object.entries(MODEL_LABEL)} selected={f.businessModel} />
      </Group>
      <Group title="Acquisition type" open={!!f.acquisitionType?.length}>
        <Chips name="acq" options={Object.entries(ACQUISITION_LABEL)} selected={f.acquisitionType} />
      </Group>
      <Group title="Assets included" open={!!f.assets?.length}>
        <Chips name="asset" options={ASSET_TYPES.map((a) => [a, a])} selected={f.assets} />
      </Group>
      <Group title="Geography" open={!!f.geography?.length}>
        <Chips name="geo" options={GEOGRAPHIES.map((g) => [g, g])} selected={f.geography} />
      </Group>
      <Group title="Team & trust" open={f.teamMax != null || f.verifiedOnly}>
        <label className="text-[12px] text-ivory-400" htmlFor="teamMax">Maximum team size</label>
        <input id="teamMax" className={`${numInput} mt-1.5`} name="teamMax" inputMode="numeric" placeholder="Any" defaultValue={f.teamMax ?? ""} />
        <label className="mt-3 flex items-center gap-2 text-[13px] text-ivory-300">
          <input type="checkbox" name="verified" value="1" defaultChecked={f.verifiedOnly} className="h-4 w-4 accent-lime" /> Identity-verified founders (L2+)
        </label>
      </Group>
      <button className="mt-5 h-10 w-full rounded-full bg-ivory text-sm font-medium text-ink-950 transition hover:bg-white">Apply filters</button>
    </form>
  );
}

export function filtersToQuery(sp: Record<string, string | string[] | undefined>, omit: string[] = []) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (omit.includes(k) || v == null) continue;
    for (const x of Array.isArray(v) ? v : [v]) if (x !== "") q.append(k, x);
  }
  return q.toString();
}

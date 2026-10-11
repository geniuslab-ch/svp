import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { listVentures, parseFilters } from "@/lib/services/ventures";
import { FilterPanel, filtersToQuery } from "@/components/discovery/filter-panel";
import { FilterDrawer } from "@/components/discovery/filter-drawer";
import { VentureCard } from "@/components/venture/venture-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const metadata = { title: "Browse ventures" };
export const dynamic = "force-dynamic";

const SORTS = [
  ["recent", "Recently listed"],
  ["relevance", "Relevance"],
  ["traction", "Traction"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
] as const;

export default async function VenturesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const f = parseFilters(sp);
  const page = Math.max(1, Number(sp.page) || 1);
  const layout = sp.view === "list" ? "list" : "grid";
  const { items, total, pageSize } = await listVentures(f, user, { page });
  const base = filtersToQuery(sp, ["page", "view", "sort"]);
  const withParams = (extra: Record<string, string>) => {
    const q = new URLSearchParams(filtersToQuery(sp, ["page"]));
    for (const [k, v] of Object.entries(extra)) q.set(k, v);
    return `/ventures?${q.toString()}`;
  };
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const activeCount = [...new URLSearchParams(base).keys()].filter((k) => k !== "q").length;

  return (
    <div className="container-x py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Browse</div>
          <h1 className="serif mt-1 text-4xl sm:text-5xl">All ventures</h1>
          <p className="mt-1 text-sm text-ivory-400">
            <span className="num">{total}</span> {total === 1 ? "venture" : "ventures"} match
          </p>
        </div>
        <div className="flex rounded-full border border-ink-700 p-0.5 text-[13px]" role="tablist" aria-label="View">
          <Link role="tab" aria-selected="false" href={`/discover${base ? `?${base}` : ""}`} className="rounded-full px-3.5 py-1.5 text-ivory-400 hover:text-ivory">Swipe</Link>
          <span role="tab" aria-selected="true" className="rounded-full bg-ink-750 px-3.5 py-1.5 text-ivory">Grid</span>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2 border-y border-ink-700/70 py-3">
        <form action="/ventures" className="relative mr-auto w-full sm:w-80">
          {Object.entries(sp).filter(([k]) => !["q", "page"].includes(k)).flatMap(([k, v]) => (Array.isArray(v) ? v : [v ?? ""]).map((x, i) => <input key={`${k}${i}`} type="hidden" name={k} value={x} />))}
          <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input name="q" defaultValue={f.q} placeholder="Search ventures, industries…" aria-label="Search ventures" className="h-9 w-full rounded-full border border-ink-700 bg-ink-850 pl-10 pr-4 text-sm placeholder:text-ivory-500 focus:border-lime/60 focus:outline-none" />
        </form>
        <div className="lg:hidden">
          <FilterDrawer count={activeCount}>
            <FilterPanel f={f} action="/ventures" keep={layout === "list" ? { view: "list" } : undefined} />
          </FilterDrawer>
        </div>
        <details className="relative">
          <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-full border border-ink-700 px-3.5 text-[13px] text-ivory-200 hover:border-ivory-400">
            Sort: {SORTS.find(([k]) => k === (f.sort ?? "recent"))?.[1]}
          </summary>
          <div className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-ink-700 bg-ink-850 p-1.5 shadow-lift">
            {SORTS.map(([k, label]) => (
              <Link key={k} href={withParams({ sort: k })} className={cn("block rounded-xl px-3 py-2 text-sm hover:bg-ink-750", (f.sort ?? "recent") === k ? "text-lime" : "text-ivory-200")}>
                {label}
              </Link>
            ))}
          </div>
        </details>
        <div className="flex rounded-full border border-ink-700 p-0.5" aria-label="Layout">
          <Link href={withParams({ view: "grid" })} aria-label="Grid layout" className={cn("rounded-full p-1.5", layout === "grid" ? "bg-ink-750 text-ivory" : "text-ivory-500")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /></svg>
          </Link>
          <Link href={withParams({ view: "list" })} aria-label="List layout" className={cn("rounded-full p-1.5", layout === "list" ? "bg-ink-750 text-ivory" : "text-ivory-500")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">
          <FilterPanel f={f} action="/ventures" keep={layout === "list" ? { view: "list" } : undefined} />
        </aside>
        <div>
          {items.length === 0 ? (
            <EmptyState
              title="No ventures match"
              body="Try removing a filter or widening the price range. New ventures are listed every week."
              action={<ButtonLink href="/ventures" variant="outline">Clear filters</ButtonLink>}
            />
          ) : layout === "list" ? (
            <div className="space-y-3">{items.map((v) => <VentureCard key={v.id} v={v} layout="list" />)}</div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{items.map((v) => <VentureCard key={v.id} v={v} />)}</div>
          )}
          {pages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={withParams({ page: String(p) })} aria-current={p === page ? "page" : undefined} className={cn("num grid h-9 w-9 place-items-center rounded-full text-sm", p === page ? "bg-ivory text-ink-950" : "border border-ink-700 text-ivory-300 hover:border-ivory-400")}>
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

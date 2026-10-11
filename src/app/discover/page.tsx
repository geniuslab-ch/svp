import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { discoverQueue, parseFilters } from "@/lib/services/ventures";
import { SwipeDeck } from "@/components/discovery/swipe-deck";
import { FilterPanel, filtersToQuery } from "@/components/discovery/filter-panel";
import { FilterDrawer } from "@/components/discovery/filter-drawer";

export const metadata = { title: "Discover" };
export const dynamic = "force-dynamic";

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const f = parseFilters(sp);
  const queue = await discoverQueue(f, user, [], 12);
  const query = filtersToQuery(sp);
  const activeCount = [...new URLSearchParams(query).keys()].filter((k) => k !== "sort").length;

  return (
    <div className="container-x py-8 sm:py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="eyebrow">Discover</div>
          <h1 className="serif mt-1 text-4xl sm:text-5xl">What’s next?</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-ink-700 p-0.5 text-[13px]" role="tablist" aria-label="View">
            <span role="tab" aria-selected="true" className="rounded-full bg-ink-750 px-3.5 py-1.5 text-ivory">Swipe</span>
            <Link role="tab" aria-selected="false" href={`/ventures${query ? `?${query}` : ""}`} className="rounded-full px-3.5 py-1.5 text-ivory-400 hover:text-ivory">
              Grid
            </Link>
          </div>
          <div className="lg:hidden">
            <FilterDrawer count={activeCount}>
              <FilterPanel f={f} action="/discover" />
            </FilterDrawer>
          </div>
        </div>
      </div>
      <div className="grid gap-10 lg:grid-cols-[260px_1fr_260px]">
        <aside className="hidden lg:block">
          <FilterPanel f={f} action="/discover" />
        </aside>
        <SwipeDeck key={query} initial={queue} query={query} signedIn={!!user} canSave={user?.role === "BUYER"} />
        <aside className="hidden space-y-4 text-sm text-ivory-400 lg:block">
          <div className="surface p-5">
            <div className="eyebrow mb-2">Private by design</div>
            <p>Saving a venture never notifies the founder and never creates an offer. Founders only hear from you when you send a request — under your alias.</p>
          </div>
          {!user && (
            <div className="surface p-5">
              <div className="eyebrow mb-2">Browsing as a guest</div>
              <p>Passes are kept for this visit only. <Link href="/signup?role=buyer" className="link">Create a buyer account</Link> to save ventures and build a pipeline.</p>
            </div>
          )}
          {user?.role === "BUYER" && (
            <div className="surface p-5">
              <div className="eyebrow mb-2">Your pipeline</div>
              <p>
                Saved ventures land in <Link href="/buyer" className="link">your pipeline</Link>. Passed ones stay in your <Link href="/buyer/history" className="link">history</Link> and can be restored.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

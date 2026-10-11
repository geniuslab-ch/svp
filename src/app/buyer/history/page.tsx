import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import { RemoveSaved } from "../saved/remove-saved";

export const metadata = { title: "History" };

export default async function HistoryPage() {
  const user = await requireRole(["BUYER"]);
  const [views, passed] = await Promise.all([
    db.ventureView.findMany({ where: { userId: user.id, venture: { status: { in: ["PUBLISHED", "PAUSED", "SOLD"] } } }, orderBy: { viewedAt: "desc" }, take: 50, include: { venture: { select: { alias: true, slug: true, tagline: true } } } }),
    db.ventureInteraction.findMany({ where: { userId: user.id, kind: "PASSED", venture: { status: "PUBLISHED" } }, orderBy: { updatedAt: "desc" }, include: { venture: { select: { id: true, alias: true, slug: true, tagline: true } } } }),
  ]);
  return (
    <div>
      <div className="eyebrow">History</div>
      <h1 className="serif mt-2 text-display-md">Viewed & passed</h1>
      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <section>
          <h2 className="text-lg font-medium">Recently viewed</h2>
          <ul className="mt-3 divide-y divide-ink-700/70 rounded-card border border-ink-700/70">
            {views.length === 0 && <li className="p-4 text-sm text-ivory-400">Ventures you open appear here.</li>}
            {views.map((v) => (
              <li key={v.ventureId} className="flex items-center justify-between gap-3 p-4 text-sm">
                <span className="min-w-0"><Link href={`/ventures/${v.venture.slug}`} className="font-medium hover:underline">{v.venture.alias}</Link><span className="block truncate text-ivory-400">{v.venture.tagline}</span></span>
                <span className="shrink-0 text-[12px] text-ivory-500">{timeAgo(v.viewedAt)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-medium">Passed</h2>
          {passed.length === 0 ? (
            <div className="mt-3"><EmptyState title="No passes" body="Ventures you swipe left on are listed here and can be restored." /></div>
          ) : (
            <ul className="mt-3 divide-y divide-ink-700/70 rounded-card border border-ink-700/70">
              {passed.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <span className="min-w-0"><Link href={`/ventures/${p.venture.slug}`} className="font-medium hover:underline">{p.venture.alias}</Link><span className="block truncate text-ivory-400">{p.venture.tagline}</span></span>
                  <RemoveSaved id={p.venture.id} label="Restore" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

import Link from "next/link";
import { db } from "@/lib/db";
import { VENTURE_STATUS_LABEL } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ModerationControls } from "./moderation-controls";

export const metadata = { title: "Listings" };

export default async function AdminVentures({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const ventures = await db.venture.findMany({
    where: filter === "flagged" ? { flagged: true } : filter === "removed" ? { status: "REMOVED" } : {},
    orderBy: [{ flagged: "desc" }, { updatedAt: "desc" }],
    take: 200,
    include: { founder: { select: { email: true } }, _count: { select: { accessRequests: true } } },
  });
  return (
    <div>
      <div className="eyebrow">Moderation</div>
      <h1 className="serif mt-2 text-display-md">Listings</h1>
      <div className="mt-4 flex gap-2 text-sm">
        {[["", "All"], ["flagged", "Flagged"], ["removed", "Removed"]].map(([k, l]) => (
          <Link key={k} href={k ? `/admin/ventures?filter=${k}` : "/admin/ventures"} className={`rounded-full px-3 py-1 ${filter === k || (!filter && !k) ? "bg-ink-800 text-ivory" : "text-ivory-400"}`}>{l}</Link>
        ))}
      </div>
      <ul className="mt-6 space-y-3">
        {ventures.map((v) => (
          <li key={v.id} className="surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/ventures/${v.slug}`} className="font-medium hover:underline">{v.alias}</Link>
                  <Badge tone={v.status === "PUBLISHED" ? "lime" : v.status === "REMOVED" ? "clay" : "outline"}>{VENTURE_STATUS_LABEL[v.status]}</Badge>
                  {v.flagged && <Badge tone="clay">Flagged</Badge>}
                  {v.featured && <Badge tone="steel">Featured</Badge>}
                  {v.isDemo && <Badge tone="outline">Demo</Badge>}
                </div>
                <div className="mt-1 text-[12.5px] text-ivory-500">{v.founder.email} · {v._count.accessRequests} requests · updated {formatDate(v.updatedAt)}</div>
                {v.moderationNote && <div className="text-[12.5px] text-clay">{v.moderationNote}</div>}
              </div>
              <ModerationControls id={v.id} status={v.status} featured={v.featured} flagged={v.flagged} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

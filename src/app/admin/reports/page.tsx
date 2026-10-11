import Link from "next/link";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportControls } from "./report-controls";

export const metadata = { title: "Reports" };

export default async function AdminReports() {
  const reports = await db.report.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100, include: { reporter: { select: { email: true } } } });
  const ventureIds = reports.filter((r) => r.targetType === "VENTURE").map((r) => r.targetId);
  const ventures = new Map((await db.venture.findMany({ where: { id: { in: ventureIds } }, select: { id: true, alias: true, slug: true } })).map((v) => [v.id, v]));
  return (
    <div>
      <div className="eyebrow">Moderation</div>
      <h1 className="serif mt-2 text-display-md">Reports</h1>
      <div className="mt-8 space-y-3">
        {reports.length === 0 && <EmptyState title="No reports" body="Reports from members appear here." />}
        {reports.map((r) => {
          const v = ventures.get(r.targetId);
          return (
            <article key={r.id} className="surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2"><Badge tone={r.status === "OPEN" ? "clay" : "outline"}>{r.status.toLowerCase()}</Badge><span className="font-medium">{r.reason}</span></div>
                <span className="text-[12px] text-ivory-500">{r.reporter.email} · {timeAgo(r.createdAt)}</span>
              </div>
              <div className="mt-2 text-sm text-ivory-400">
                {r.targetType.toLowerCase()}: {v ? <Link className="link" href={`/ventures/${v.slug}`}>{v.alias}</Link> : <span className="font-mono">{r.targetId}</span>}
              </div>
              {r.details && <p className="mt-2 text-sm text-ivory-200">{r.details}</p>}
              {r.resolution && <p className="mt-2 text-[13px] text-ivory-400">Resolution: {r.resolution}</p>}
              {r.status === "OPEN" && <ReportControls id={r.id} />}
            </article>
          );
        })}
      </div>
    </div>
  );
}

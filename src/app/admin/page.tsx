import Link from "next/link";
import { db } from "@/lib/db";
import { expireVerifications } from "@/lib/services/trust";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Admin" };

export default async function AdminOverview() {
  const expired = await expireVerifications();
  const since = new Date(Date.now() - 30 * 86400_000);
  const [users, founders, buyers, published, drafts, sold, requests, approved, conversations, offers, pendingV, openReports, recent] = await Promise.all([
    db.user.count({ where: { status: { not: "DELETED" } } }),
    db.user.count({ where: { role: "FOUNDER", status: "ACTIVE" } }),
    db.user.count({ where: { role: "BUYER", status: "ACTIVE" } }),
    db.venture.count({ where: { status: "PUBLISHED" } }),
    db.venture.count({ where: { status: "DRAFT" } }),
    db.venture.count({ where: { status: "SOLD" } }),
    db.accessRequest.count({ where: { createdAt: { gte: since } } }),
    db.accessRequest.count({ where: { status: "APPROVED", decidedAt: { gte: since } } }),
    db.conversation.count(),
    db.offer.count(),
    db.verificationRequest.count({ where: { status: "PENDING" } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12, include: { actor: { select: { email: true, role: true } } } }),
  ]);
  const stats = [
    ["Active users", users], ["Founders", founders], ["Buyers", buyers], ["Published listings", published],
    ["Drafts", drafts], ["Sold", sold], ["Requests (30d)", requests], ["Approvals (30d)", approved],
    ["Conversations", conversations], ["Offers (non-binding)", offers],
  ] as const;
  return (
    <div>
      <div className="eyebrow">Administration</div>
      <h1 className="serif mt-2 text-display-md">Marketplace overview</h1>
      {expired > 0 && <p className="mt-3 text-sm text-amber">{expired} approvals passed their validity date and were marked expired.</p>}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/admin/verifications" className="surface p-5 transition hover:border-ink-600">
          <div className="text-[12px] text-ivory-400">Verification queue</div>
          <div className="num mt-1 text-4xl text-lime">{pendingV}</div>
        </Link>
        <Link href="/admin/reports" className="surface p-5 transition hover:border-ink-600">
          <div className="text-[12px] text-ivory-400">Open reports</div>
          <div className="num mt-1 text-4xl text-clay">{openReports}</div>
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-ink-700/70 bg-ink-700/70 sm:grid-cols-5">
        {stats.map(([l, n]) => (
          <div key={l} className="bg-ink-950 p-4">
            <div className="num text-2xl">{n}</div>
            <div className="text-[12px] text-ivory-400">{l}</div>
          </div>
        ))}
      </div>
      <h2 className="mt-10 text-lg font-medium">Recent activity</h2>
      <ul className="mt-3 divide-y divide-ink-700/70 rounded-card border border-ink-700/70 text-sm">
        {recent.map((a) => (
          <li key={a.id} className="flex flex-wrap justify-between gap-2 px-4 py-2.5">
            <span><span className="font-mono text-[12.5px] text-lime">{a.action}</span> <span className="text-ivory-400">· {a.targetType} {a.targetId?.slice(-8)}</span></span>
            <span className="text-[12px] text-ivory-500">{a.actor?.email ?? "system"} · {timeAgo(a.createdAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

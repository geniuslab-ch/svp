import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Audit log" };

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ action?: string }> }) {
  const { action } = await searchParams;
  const rows = await db.auditLog.findMany({
    where: action ? { action: { startsWith: action } } : {},
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { actor: { select: { email: true } } },
  });
  return (
    <div>
      <div className="eyebrow">Security</div>
      <h1 className="serif mt-2 text-display-md">Audit log</h1>
      <p className="mt-2 text-sm text-ivory-400">Append-only record of verification decisions, confidential document access, moderation and account events.</p>
      <form className="mt-6"><input name="action" defaultValue={action} placeholder="Filter by action prefix, e.g. document." className="h-9 w-80 rounded-full border border-ink-700 bg-ink-850 px-4 text-sm" /></form>
      <div className="mt-4 overflow-x-auto rounded-card border border-ink-700/70">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-ink-900 text-[12px] text-ivory-400"><tr><th className="p-3">When</th><th className="p-3">Action</th><th className="p-3">Actor</th><th className="p-3">Target</th><th className="p-3">Details</th></tr></thead>
          <tbody className="divide-y divide-ink-700/70">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap p-3 text-ivory-400">{formatDate(r.createdAt)} {r.createdAt.toISOString().slice(11, 16)}Z</td>
                <td className="p-3 font-mono text-lime">{r.action}</td>
                <td className="p-3 break-all">{r.actor?.email ?? "system"}</td>
                <td className="p-3 text-ivory-400">{r.targetType} <span className="font-mono">{r.targetId?.slice(-10)}</span></td>
                <td className="max-w-xs truncate p-3 font-mono text-[11.5px] text-ivory-500">{r.metadata ? JSON.stringify(r.metadata) : ""}{r.ip ? ` ip:${r.ip}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

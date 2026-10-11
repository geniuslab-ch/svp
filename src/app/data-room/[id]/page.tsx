import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { dataRoomFor } from "@/lib/services/deals";
import { AppError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { MetricStat } from "@/components/venture/metric";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Data room" };
export const dynamic = "force-dynamic";

const CATEGORY: Record<string, string> = { financials: "Financials", contracts: "Contracts", ip: "Intellectual property", technical: "Technical", product: "Product", other: "Other" };

export default async function DataRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/data-room/${id}`);
  let room;
  try {
    room = await dataRoomFor(user, id);
  } catch (e) {
    if (e instanceof AppError) notFound();
    throw e;
  }
  const groups = Object.entries(
    room.documents.reduce<Record<string, typeof room.documents>>((acc, d) => ((acc[d.category] ??= []).push(d), acc), {}),
  );
  const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

  return (
    <div className="container-x max-w-5xl py-10">
      <Link href={`/ventures/${room.venture.slug}`} className="text-[13px] text-ivory-400 hover:text-ivory">← {room.venture.alias}</Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
            Confidential due-diligence room
          </div>
          <h1 className="serif mt-2 text-display-md">{room.venture.alias}</h1>
        </div>
        {room.viewerIsOwner ? (
          <ButtonLink href={`/founder/ventures/${room.venture.id}/edit?step=9`} variant="outline">Manage documents</ButtonLink>
        ) : (
          room.expiresAt && <Badge tone="amber">Access expires {formatDate(room.expiresAt)}</Badge>
        )}
      </div>
      <div className="mt-6 rounded-xl border border-steel/30 bg-steel/5 px-4 py-3 text-[13px] text-ivory-300">
        {room.viewerIsOwner
          ? "Buyers you approve for data-room access see this page. Every view and download is recorded in the audit log."
          : "Shared under the platform confidentiality undertaking. Your views and downloads are logged and visible to administrators. Do not redistribute."}
      </div>

      {room.metrics.length > 0 && (
        <section className="mt-10">
          <h2 className="eyebrow mb-4">Data-room metrics</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {room.metrics.map((m) => <MetricStat key={m.id} m={m} currency={room.venture.currency} />)}
          </div>
        </section>
      )}

      <section className="mt-10">
        {groups.length === 0 ? (
          <EmptyState title="No documents yet" body={room.viewerIsOwner ? "Upload financial statements, contracts and technical documentation in step 9 of your listing." : "The founder hasn’t uploaded documents yet. You’ll be notified of updates."} />
        ) : (
          <div className="space-y-8">
            {groups.map(([cat, docs]) => (
              <div key={cat}>
                <h2 className="eyebrow mb-3">{CATEGORY[cat] ?? cat}</h2>
                <ul className="divide-y divide-ink-700/70 rounded-card border border-ink-700/70">
                  {docs.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{d.title}</div>
                        <div className="text-[12px] text-ivory-500">{d.filename} · {kb(d.size)} · {formatDate(d.createdAt)} · {d.tier === "DATA_ROOM" ? "data room" : "approved buyers"}</div>
                      </div>
                      <a href={`/api/documents/${d.id}`} className="shrink-0 rounded-full border border-ink-600 px-3.5 py-1.5 text-[13px] hover:border-ivory-400">Open</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

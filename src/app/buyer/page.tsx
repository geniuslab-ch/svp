import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { PIPELINE_LABEL } from "@/lib/labels";
import { formatPrice, timeAgo } from "@/lib/format";
import { PIPELINE_STAGES } from "@/lib/services/deals";
import { VentureCover } from "@/components/venture/cover";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PipelineEditor } from "./pipeline-editor";

export const metadata = { title: "Acquisition pipeline" };

export default async function BuyerDashboard() {
  const user = await requireRole(["BUYER"]);
  const profile = await db.buyerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/onboarding/buyer");
  const entries = await db.pipelineEntry.findMany({
    where: { buyerId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      venture: {
        select: {
          id: true, slug: true, alias: true, tagline: true, coverSeed: true, status: true, priceType: true,
          askingPrice: true, askingPriceMin: true, askingPriceMax: true, currency: true, updatedAt: true,
          accessRequests: { where: { buyerId: user.id }, select: { level: true, status: true, ndaAcceptedAt: true } },
          conversations: { where: { buyerId: user.id }, select: { id: true } },
        },
      },
    },
  });
  const active = entries.filter((e) => e.stage !== "ARCHIVED");
  const columns = PIPELINE_STAGES.filter((s) => s.value !== "ARCHIVED" && s.value !== "DISCOVERED");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Acting as {profile.alias}</div>
          <h1 className="serif mt-2 text-display-md">Acquisition pipeline</h1>
          <p className="mt-2 max-w-xl text-sm text-ivory-400">Stages and notes are private to you. Founders never see your pipeline.</p>
        </div>
        <ButtonLink href="/discover">Discover more</ButtonLink>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-card border border-ink-700/70 bg-ink-700/70 sm:grid-cols-6">
        {columns.map((c) => (
          <div key={c.value} className="bg-ink-950 p-3">
            <div className="num text-2xl">{active.filter((e) => e.stage === c.value).length}</div>
            <div className="text-[11.5px] leading-tight text-ivory-400">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {active.length === 0 ? (
          <EmptyState title="Your pipeline is empty" body="Swipe right or press Save on a venture to start tracking it here." action={<ButtonLink href="/discover">Start discovering</ButtonLink>} />
        ) : (
          active.map((e) => {
            const v = e.venture;
            return (
              <article key={e.id} className="surface p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <VentureCover seed={v.coverSeed} alias={v.alias} className="h-20 w-full shrink-0 rounded-lg sm:w-28" monogram={false} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/ventures/${v.slug}`} className="text-[16px] font-medium hover:underline">{v.alias}</Link>
                      <Badge tone="lime">{PIPELINE_LABEL[e.stage]}</Badge>
                      {v.status !== "PUBLISHED" && <Badge tone="amber">{v.status.toLowerCase()}</Badge>}
                    </div>
                    <p className="truncate text-sm text-ivory-400">{v.tagline}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 text-[12.5px] text-ivory-500">
                      <span>{formatPrice(v)}</span>
                      {v.accessRequests.map((a) => (
                        <span key={a.level}>{a.level === "DATA_ROOM" ? "Data room" : "Details"}: {a.status.toLowerCase()}</span>
                      ))}
                      <span>Updated {timeAgo(e.updatedAt)}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[13px]">
                      {v.conversations[0] && <Link className="link" href={`/messages/${v.conversations[0].id}`}>Conversation</Link>}
                      {v.accessRequests.some((a) => a.level === "DATA_ROOM" && a.status === "APPROVED") && <Link className="link" href={`/data-room/${v.id}`}>Data room</Link>}
                    </div>
                  </div>
                </div>
                <PipelineEditor ventureId={v.id} stage={e.stage} notes={e.notes ?? ""} />
              </article>
            );
          })
        )}
      </div>
      {entries.length > active.length && <p className="mt-6 text-sm text-ivory-500">{entries.length - active.length} archived opportunities hidden.</p>}
    </div>
  );
}

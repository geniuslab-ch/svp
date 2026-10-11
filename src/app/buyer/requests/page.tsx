import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ACCESS_STATUS_LABEL } from "@/lib/labels";
import { formatDate, timeAgo } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { withdrawRequestAction } from "@/app/actions/deals";

export const metadata = { title: "My requests" };

export default async function BuyerRequestsPage() {
  const user = await requireRole(["BUYER"]);
  const rows = await db.accessRequest.findMany({
    where: { buyerId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { venture: { select: { id: true, alias: true, slug: true, conversations: { where: { buyerId: user.id }, select: { id: true } } } } },
  });
  return (
    <div>
      <div className="eyebrow">Requests</div>
      <h1 className="serif mt-2 text-display-md">Information requests</h1>
      <p className="mt-2 text-sm text-ivory-400">Sent under your alias. Founders decide who sees more.</p>
      <div className="mt-8 space-y-3">
        {rows.length === 0 ? (
          <EmptyState title="No requests yet" body="Open a venture and use “Request information” to contact the founder anonymously." action={<ButtonLink href="/ventures">Browse ventures</ButtonLink>} />
        ) : (
          rows.map((r) => (
            <div key={r.id} className="surface flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/ventures/${r.venture.slug}`} className="font-medium hover:underline">{r.venture.alias}</Link>
                  <span className="text-[13px] text-ivory-400">· {r.level === "DATA_ROOM" ? "Data room" : "Details"}</span>
                  <Badge tone={r.status === "APPROVED" ? "lime" : r.status === "PENDING" ? "amber" : "outline"}>{ACCESS_STATUS_LABEL[r.status]}</Badge>
                </div>
                <div className="mt-1 text-[12.5px] text-ivory-500">
                  Sent {timeAgo(r.createdAt)} · NDA {r.ndaAcceptedAt ? `accepted ${formatDate(r.ndaAcceptedAt)}` : "not required"}
                  {r.expiresAt && ` · expires ${formatDate(r.expiresAt)}`}
                </div>
                {r.decisionNote && <p className="mt-1 text-sm text-ivory-300">Founder’s note: {r.decisionNote}</p>}
              </div>
              <div className="flex gap-2">
                {r.status === "APPROVED" && r.venture.conversations[0] && <ButtonLink size="sm" variant="outline" href={`/messages/${r.venture.conversations[0].id}`}>Message</ButtonLink>}
                {r.status === "APPROVED" && r.level === "DATA_ROOM" && <ButtonLink size="sm" href={`/data-room/${r.venture.id}`}>Data room</ButtonLink>}
                {r.status === "PENDING" && (
                  <form action={withdrawRequestAction}>
                    <input type="hidden" name="requestId" value={r.id} />
                    <button className="h-8 rounded-full border border-ink-600 px-3.5 text-[13px] text-ivory-300 hover:border-ivory-400">Withdraw</button>
                  </form>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

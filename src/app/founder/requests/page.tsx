import { requireRole } from "@/lib/auth/session";
import { founderRequests } from "@/lib/services/deals";
import { ACCESS_STATUS_LABEL } from "@/lib/labels";
import { formatDate, timeAgo } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DecisionButtons } from "./decision-buttons";
import Link from "next/link";

export const metadata = { title: "Buyer requests" };

export default async function FounderRequestsPage() {
  const user = await requireRole(["FOUNDER"]);
  const requests = await founderRequests(user);
  const pending = requests.filter((r) => r.status === "PENDING");
  const handled = requests.filter((r) => r.status !== "PENDING");

  const Card = ({ r }: { r: (typeof requests)[number] }) => (
    <article className="surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[17px] font-medium">{r.buyer.alias}</span>
            {r.buyer.verification === "VERIFIED" && <Badge tone="lime">Proof of funds reviewed</Badge>}
            {r.buyer.verification !== "VERIFIED" && <Badge tone="outline">Email-verified buyer</Badge>}
          </div>
          <div className="mt-1 text-[13px] text-ivory-400">
            wants {r.level === "DATA_ROOM" ? <strong className="text-ivory-200">data-room access</strong> : <strong className="text-ivory-200">detailed information</strong>} on{" "}
            <Link className="link" href={`/ventures/${r.venture.slug}`}>{r.venture.alias}</Link> · {timeAgo(r.createdAt)}
          </div>
        </div>
        <Badge tone={r.status === "APPROVED" ? "lime" : r.status === "PENDING" ? "amber" : "outline"}>{ACCESS_STATUS_LABEL[r.status]}</Badge>
      </div>
      <blockquote className="mt-4 border-l-2 border-ink-600 pl-4 text-[15px] text-ivory-200">{r.message}</blockquote>
      {r.buyer.disclosed.length > 0 && (
        <dl className="mt-4 grid gap-3 text-[13px] sm:grid-cols-2">
          {r.buyer.disclosed.map((d) => (
            <div key={d.label}>
              <dt className="text-ivory-500">{d.label}</dt>
              <dd className="text-ivory-200">{d.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-4 text-[12px] text-ivory-500">
        {r.ndaAcceptedAt ? `Confidentiality undertaking accepted ${formatDate(r.ndaAcceptedAt)}` : "No confidentiality undertaking"}
        {r.expiresAt && ` · access expires ${formatDate(r.expiresAt)}`}
      </div>
      {(r.status === "PENDING" || r.status === "APPROVED") && <DecisionButtons id={r.id} status={r.status} level={r.level} />}
    </article>
  );

  return (
    <div>
      <div className="eyebrow">Requests</div>
      <h1 className="serif mt-2 text-display-md">Buyer requests</h1>
      <p className="mt-2 max-w-2xl text-sm text-ivory-400">
        Buyers appear under their alias with only the details they chose to disclose. Approving opens a private conversation and unlocks the requested tier. You can revoke access at any time.
      </p>
      <h2 className="mt-10 text-lg font-medium">Awaiting your decision ({pending.length})</h2>
      <div className="mt-4 space-y-4">
        {pending.length ? pending.map((r) => <Card key={r.id} r={r} />) : <EmptyState title="Nothing pending" body="New requests appear here and in your notifications." />}
      </div>
      {handled.length > 0 && (
        <>
          <h2 className="mt-12 text-lg font-medium">History</h2>
          <div className="mt-4 space-y-4">{handled.map((r) => <Card key={r.id} r={r} />)}</div>
        </>
      )}
    </div>
  );
}

import { db } from "@/lib/db";
import { formatDate, timeAgo } from "@/lib/format";
import { VERIFICATION_STATUS_LABEL } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ReviewForm } from "./review-form";

export const metadata = { title: "Verification review" };

const KIND: Record<string, string> = { IDENTITY: "L2 · Identity", OWNERSHIP: "L3 · Ownership", FINANCIAL: "L4 · Financials", BUYER_FUNDS: "Buyer · Proof of funds" };

export default async function VerificationsAdmin() {
  const [pending, recent] = await Promise.all([
    db.verificationRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: {
        documents: true,
        venture: { select: { alias: true, legalName: true, slug: true } },
        user: { select: { email: true, role: true, founderProfile: { select: { legalName: true, country: true, linkedinUrl: true } }, buyerProfile: { select: { alias: true } } } },
      },
    }),
    db.verificationRequest.findMany({
      where: { status: { not: "PENDING" } },
      orderBy: { reviewedAt: "desc" },
      take: 20,
      include: { user: { select: { email: true } }, reviewer: { select: { email: true } } },
    }),
  ]);
  return (
    <div>
      <div className="eyebrow">Trust & safety</div>
      <h1 className="serif mt-2 text-display-md">Verification review</h1>
      <p className="mt-2 max-w-2xl text-sm text-ivory-400">
        Manual review process. Compare evidence against the stated legal name and venture. Approve only when the evidence is sufficient. Every document view and decision is logged.
      </p>
      <div className="mt-8 space-y-4">
        {pending.length === 0 && <EmptyState title="Queue is clear" body="New submissions appear here." />}
        {pending.map((r) => (
          <article key={r.id} className="surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2"><Badge tone="amber">{KIND[r.kind]}</Badge><span className="text-[13px] text-ivory-400">submitted {timeAgo(r.createdAt)}</span></div>
              <span className="font-mono text-[12px] text-ivory-500">{r.id.slice(-10)}</span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div><dt className="text-ivory-500">Account</dt><dd className="break-all">{r.user.email}</dd></div>
              {r.user.founderProfile && <div><dt className="text-ivory-500">Legal name (private)</dt><dd>{r.user.founderProfile.legalName} · {r.user.founderProfile.country}</dd></div>}
              {r.user.buyerProfile && <div><dt className="text-ivory-500">Alias</dt><dd>{r.user.buyerProfile.alias}</dd></div>}
              {r.venture && <div><dt className="text-ivory-500">Venture</dt><dd>{r.venture.alias}{r.venture.legalName && ` (${r.venture.legalName})`}</dd></div>}
            </dl>
            <p className="mt-4 rounded-xl bg-ink-850 p-3 text-sm text-ivory-200">{r.statement}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {r.documents.length === 0 && <li className="text-[13px] text-ivory-500">No files attached (demo record).</li>}
              {r.documents.map((d) => (
                <li key={d.id}><a href={`/api/verification-documents/${d.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full border border-ink-600 px-3 py-1 text-[13px] hover:border-ivory-400">{d.filename} ↗</a></li>
              ))}
            </ul>
            <ReviewForm requestId={r.id} financial={r.kind === "FINANCIAL"} />
          </article>
        ))}
      </div>
      <h2 className="mt-12 text-lg font-medium">Recent decisions</h2>
      <ul className="mt-3 divide-y divide-ink-700/70 rounded-card border border-ink-700/70 text-sm">
        {recent.map((r) => (
          <li key={r.id} className="flex flex-wrap justify-between gap-2 px-4 py-3">
            <span>{KIND[r.kind]} · <span className="text-ivory-400">{r.user.email}</span></span>
            <span className="flex items-center gap-2 text-[12.5px] text-ivory-500">
              <Badge tone={r.status === "APPROVED" ? "lime" : r.status === "REJECTED" ? "clay" : "outline"}>{VERIFICATION_STATUS_LABEL[r.status]}</Badge>
              {r.reviewer?.email ?? "—"} · {formatDate(r.reviewedAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { effectiveStatus, founderLevel, LEVEL_LABEL } from "@/lib/verification";
import { VERIFICATION_STATUS_LABEL } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/venture/badges";
import { ResendVerification } from "@/components/resend-verification";
import { VerificationForm } from "@/components/verification-form";
import { cn } from "@/lib/cn";

export const metadata = { title: "Verification center" };

export default async function VerificationCenter() {
  const user = await requireRole(["FOUNDER"]);
  const [requests, ventures] = await Promise.all([
    db.verificationRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { venture: { select: { alias: true } }, documents: { select: { filename: true } } } }),
    db.venture.findMany({ where: { founderId: user.id, status: { not: "REMOVED" } }, select: { id: true, alias: true } }),
  ]);
  const level = founderLevel({ emailVerifiedAt: user.emailVerifiedAt, verifications: requests });
  const identity = requests.find((r) => r.kind === "IDENTITY" && ["APPROVED", "PENDING"].includes(effectiveStatus(r)));

  const steps = [
    { n: 1, title: "Email verified", done: !!user.emailVerifiedAt, body: "Confirm you control your account email." },
    { n: 2, title: "Identity", done: level >= 2, pending: identity?.status === "PENDING", body: "Upload an ID document. A reviewer compares it with your legal name." },
    { n: 3, title: "Ownership or authority to sell", done: false, body: "Per venture: commercial register extract, cap table, domain/app-store ownership, or a board resolution." },
    { n: 4, title: "Business & financials", done: false, body: "Per venture: bank statements, accounting exports or payment-processor reports. Approved figures are labelled Verified." },
  ];

  return (
    <div>
      <div className="eyebrow">Trust</div>
      <h1 className="serif mt-2 text-display-md">Verification center</h1>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ivory-400">
        Account level: <VerificationBadge level={level} />
      </div>
      <p className="mt-4 max-w-2xl text-sm text-ivory-400">
        Reviews are performed manually by the platform team against the documents you submit (no automated identity provider is connected yet). Uploading never changes a badge — only an approved review does. Documents are stored privately, visible only to reviewers, and every access is logged.
      </p>

      <ol className="mt-8 grid gap-3 md:grid-cols-2">
        {steps.map((s) => (
          <li key={s.n} className={cn("surface p-5", s.done && "border-lime/30")}>
            <div className="flex items-center justify-between">
              <span className="num text-[12px] text-ivory-500">LEVEL {s.n}</span>
              {s.done ? <Badge tone="lime">Complete</Badge> : s.pending ? <Badge tone="amber">Pending review</Badge> : <Badge tone="outline">{s.n >= 3 ? "Per venture" : "To do"}</Badge>}
            </div>
            <div className="mt-2 font-medium">{s.title}</div>
            <p className="mt-1 text-[13px] text-ivory-400">{s.body}</p>
            {s.n === 1 && !s.done && <div className="mt-3"><ResendVerification compact /></div>}
          </li>
        ))}
      </ol>

      {ventures.length > 0 && level >= 2 && (
        <div className="mt-8">
          <h2 className="text-lg font-medium">Per-venture levels</h2>
          <ul className="mt-3 space-y-2">
            {ventures.map((v) => {
              const l = founderLevel({ emailVerifiedAt: user.emailVerifiedAt, verifications: requests, ventureId: v.id });
              return (
                <li key={v.id} className="flex items-center justify-between rounded-xl border border-ink-700/70 px-4 py-3 text-sm">
                  {v.alias} <span className="flex items-center gap-2 text-ivory-400">{LEVEL_LABEL[l]} <VerificationBadge level={l} compact /></span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="surface mt-10 p-6 sm:p-8">
        <h2 className="text-lg font-medium">Submit evidence</h2>
        <VerificationForm ventures={ventures} role="FOUNDER" canSubmit={!!user.emailVerifiedAt} />
      </div>

      <h2 className="mt-12 text-lg font-medium">Submissions</h2>
      <ul className="mt-4 space-y-3">
        {requests.length === 0 && <li className="text-sm text-ivory-400">No submissions yet.</li>}
        {requests.map((r) => {
          const st = effectiveStatus(r);
          return (
            <li key={r.id} className="surface p-5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{{ IDENTITY: "Identity", OWNERSHIP: "Ownership", FINANCIAL: "Financials", BUYER_FUNDS: "Proof of funds" }[r.kind]}{r.venture && ` · ${r.venture.alias}`}</span>
                <Badge tone={st === "APPROVED" ? "lime" : st === "PENDING" ? "amber" : st === "REJECTED" ? "clay" : "outline"}>{VERIFICATION_STATUS_LABEL[st]}</Badge>
              </div>
              <div className="mt-1 text-[12.5px] text-ivory-500">
                Submitted {formatDate(r.createdAt)} · {r.documents.length} file(s){r.reviewedAt && ` · reviewed ${formatDate(r.reviewedAt)}`}{r.expiresAt && st === "APPROVED" && ` · valid until ${formatDate(r.expiresAt)}`}
              </div>
              {r.reviewNote && <p className="mt-2 text-ivory-300">Reviewer note: {r.reviewNote}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

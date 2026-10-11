import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { founderLevel, LEVEL_LABEL } from "@/lib/verification";
import { VENTURE_STATUS_LABEL } from "@/lib/labels";
import { formatDate, formatPrice } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { VentureCover } from "@/components/venture/cover";
import { VerificationBadge } from "@/components/venture/badges";
import { ResendVerification } from "@/components/resend-verification";
import { VentureStatusControls } from "./status-controls";

export const metadata = { title: "Founder dashboard" };

export default async function FounderDashboard({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireRole(["FOUNDER"]);
  const profile = await db.founderProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/onboarding/founder");
  const { welcome } = await searchParams;
  const [ventures, verifications, pendingRequests] = await Promise.all([
    db.venture.findMany({
      where: { founderId: user.id },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { interactions: { where: { kind: "SAVED" } }, views: true, accessRequests: true } } },
    }),
    db.verificationRequest.findMany({ where: { userId: user.id } }),
    db.accessRequest.count({ where: { status: "PENDING", venture: { founderId: user.id } } }),
  ]);
  const accountLevel = founderLevel({ emailVerifiedAt: user.emailVerifiedAt, verifications });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">{welcome ? "Welcome" : "Overview"}</div>
          <h1 className="serif mt-2 text-display-md">Hello, {profile.displayName}</h1>
        </div>
        <ButtonLink href="/founder/ventures/new">List a venture</ButtonLink>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="surface p-5">
          <div className="text-[12px] text-ivory-400">Verification</div>
          <div className="mt-2"><VerificationBadge level={accountLevel} /></div>
          <Link href="/founder/verification" className="link mt-3 inline-block text-[13px]">{accountLevel < 2 ? "Continue verification" : "Verify a venture"} →</Link>
        </div>
        <div className="surface p-5">
          <div className="text-[12px] text-ivory-400">Pending buyer requests</div>
          <div className="num mt-1 text-3xl">{pendingRequests}</div>
          <Link href="/founder/requests" className="link mt-1 inline-block text-[13px]">Review requests →</Link>
        </div>
        <div className="surface p-5">
          <div className="text-[12px] text-ivory-400">Times saved by buyers</div>
          <div className="num mt-1 text-3xl">{ventures.reduce((s, v) => s + v._count.interactions, 0)}</div>
          <div className="mt-1 text-[12px] text-ivory-500">Anonymous — you see counts, never who.</div>
        </div>
      </div>

      {!user.emailVerifiedAt && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-card border border-amber/30 bg-amber/5 p-5">
          <div>
            <div className="font-medium text-amber">Confirm your email to publish</div>
            <p className="text-sm text-ivory-300">Level 1 verification is required before a listing goes live.</p>
          </div>
          <ResendVerification compact />
        </div>
      )}

      <h2 className="mt-12 text-lg font-medium">Your ventures</h2>
      <div className="mt-4 space-y-3">
        {ventures.length === 0 ? (
          <EmptyState
            title="No ventures yet"
            body="Ideas, prototypes and pre-revenue MVPs are all welcome. Start a draft — nothing is published until you choose."
            action={<ButtonLink href="/founder/ventures/new">Start a listing</ButtonLink>}
          />
        ) : (
          ventures.map((v) => {
            const level = founderLevel({ emailVerifiedAt: user.emailVerifiedAt, verifications, ventureId: v.id });
            return (
              <div key={v.id} className="surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <VentureCover seed={v.coverSeed} alias={v.alias} className="h-20 w-full shrink-0 rounded-lg sm:w-28" monogram={false} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[16px] font-medium">{v.alias}</span>
                    <Badge tone={v.status === "PUBLISHED" ? "lime" : v.status === "REMOVED" ? "clay" : v.status === "DRAFT" ? "outline" : "amber"}>{VENTURE_STATUS_LABEL[v.status]}</Badge>
                    {v.isDemo && <Badge tone="outline">Demo</Badge>}
                  </div>
                  <div className="mt-1 text-[13px] text-ivory-400">
                    {formatPrice(v)} · {v._count.views} views · {v._count.interactions} saves · {v._count.accessRequests} requests · updated {formatDate(v.updatedAt)}
                  </div>
                  <div className="mt-1 text-[12px] text-ivory-500">{LEVEL_LABEL[level]}{v.status === "DRAFT" && ` · step ${Math.min(v.wizardStep, 11)} of 11`}</div>
                  {v.status === "REMOVED" && v.moderationNote && <p className="mt-1 text-[12.5px] text-clay">Moderation: {v.moderationNote}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {v.status !== "DRAFT" && v.status !== "REMOVED" && <ButtonLink href={`/ventures/${v.slug}`} variant="ghost" size="sm">View</ButtonLink>}
                  {v.status !== "REMOVED" && v.status !== "SOLD" && (
                    <ButtonLink href={`/founder/ventures/${v.id}/edit${v.status === "DRAFT" ? `?step=${Math.min(v.wizardStep, 11)}` : ""}`} variant="outline" size="sm">
                      {v.status === "DRAFT" ? "Continue" : "Edit"}
                    </ButtonLink>
                  )}
                  {v.status !== "DRAFT" && <ButtonLink href={`/data-room/${v.id}`} variant="ghost" size="sm">Data room</ButtonLink>}
                  <VentureStatusControls id={v.id} status={v.status} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

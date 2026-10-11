import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getVentureForViewer } from "@/lib/services/ventures";
import { recordView } from "@/lib/services/interactions";
import { AppError } from "@/lib/errors";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { ACCESS_STATUS_LABEL, ACQUISITION_LABEL, MODEL_LABEL } from "@/lib/labels";
import { LEVEL_LABEL } from "@/lib/verification";
import { VentureCover } from "@/components/venture/cover";
import { ConfidentialityBadge, RevenueBadge, StageBadge, VerificationBadge } from "@/components/venture/badges";
import { MetricStat, metricValue } from "@/components/venture/metric";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RequestAccessForm, ReportDialog, SaveButton } from "@/components/venture/detail-client";
import { ResendVerification } from "@/components/resend-verification";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const user = await getCurrentUser();
  try {
    return { user, data: await getVentureForViewer(slug, user) };
  } catch (e) {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const { data } = await load(slug);
    return { title: data.venture.alias, description: data.venture.tagline };
  } catch {
    return { title: "Venture" };
  }
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="border-t border-ink-700/70 py-8">
      <h2 className="eyebrow mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Prose({ label, text }: { label: string; text: string | null | undefined }) {
  if (!text) return null;
  return (
    <div>
      <h3 className="text-sm font-medium text-ivory">{label}</h3>
      <p className="mt-1 whitespace-pre-line text-[15px] text-ivory-300">{text}</p>
    </div>
  );
}

export default async function VenturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, data } = await load(slug);
  const { venture: v, details, access } = data;
  if (user && !data.viewerIsOwner) await recordView(user, v.id);

  const [interaction, buyerProfile] = user
    ? await Promise.all([
        db.ventureInteraction.findUnique({ where: { userId_ventureId: { userId: user.id, ventureId: v.id } } }),
        user.role === "BUYER" ? db.buyerProfile.findUnique({ where: { userId: user.id }, select: { alias: true } }) : null,
      ])
    : [null, null];

  const requested = new Map(access.requests.map((r) => [r.level, r]));
  const openLevels = (["DETAILS", "DATA_ROOM"] as const).filter((l) => {
    const r = requested.get(l);
    return !r || ["REJECTED", "WITHDRAWN", "REVOKED"].includes(r.status);
  });
  const projections = details?.metrics.filter((m) => m.nature === "PROJECTION") ?? [];
  const historical = (details?.metrics ?? v.metrics).filter((m) => m.nature === "HISTORICAL");
  const arr = details ? data.detailsArr : v.arr;

  return (
    <div>
      <div className="relative">
        <VentureCover seed={v.coverSeed} alias={v.alias} className="h-[220px] w-full sm:h-[300px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
      </div>

      <div className="container-x -mt-24 relative">
        <nav className="mb-4 text-[13px] text-ivory-400" aria-label="Breadcrumb">
          <Link href="/ventures" className="hover:text-ivory">Ventures</Link> <span className="text-ivory-500">/</span> {v.industry}
        </nav>
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              <StageBadge stage={v.stage} />
              <RevenueBadge status={v.revenueStatus} />
              <ConfidentialityBadge level={v.confidentiality} />
              {v.status !== "PUBLISHED" && <Badge tone="amber">{v.status === "SOLD" ? "Sold" : v.status === "PAUSED" ? "Paused" : v.status === "DRAFT" ? "Draft — only you can see this" : "Removed"}</Badge>}
              {v.isDemo && <Badge tone="outline">Demo listing — fictional</Badge>}
            </div>
            <h1 className="serif mt-4 text-display-lg">{v.alias}</h1>
            {details?.legalName && <div className="mt-1 text-sm text-ivory-400">Legal entity: {details.legalName}</div>}
            <p className="mt-3 max-w-2xl text-lg text-ivory-200">{v.tagline}</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ivory-400">
              <span>{v.industry}</span>
              <span>{MODEL_LABEL[v.businessModel]}</span>
              <span>{v.geography}</span>
              <span>Team of {v.teamSize}</span>
              {v.foundedYear && <span>Since {v.foundedYear}</span>}
              {v.publishedAt && <span>Listed {formatDate(v.publishedAt)}</span>}
            </div>

            <Section title="Overview">
              <p className="max-w-2xl whitespace-pre-line text-[16px] leading-relaxed text-ivory-200">{v.summary}</p>
              {v.tractionHeadline && <p className="mt-4 text-sm text-ivory-300">↗ {v.tractionHeadline} <span className="text-ivory-500">(founder-reported indicator)</span></p>}
            </Section>

            <Section title="Metrics">
              {historical.length === 0 && !arr ? (
                <p className="text-sm text-ivory-400">
                  {v.revenueStatus === "PRE_REVENUE" ? "Pre-revenue. This venture is listed for its product, technology and assets rather than its revenue." : "No public metrics. Approved buyers may see more."}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
                  {historical.map((m) => (
                    <MetricStat key={`${m.key}-${m.nature}`} m={m} currency={v.currency} />
                  ))}
                  {arr && (
                    <div>
                      <div className="text-[11.5px] text-ivory-400">Annualised run rate</div>
                      <div className="num mt-0.5 text-lg">{metricValue({ key: "ANNUAL_REVENUE", value: arr.value }, v.currency)}</div>
                      <div className="text-[11px] text-ivory-500">{arr.basis}</div>
                    </div>
                  )}
                </div>
              )}
              {projections.length > 0 && (
                <div className="mt-6 rounded-xl border border-amber/30 bg-amber/5 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-amber">Founder projection — not a historical result</div>
                  <div className="mt-3 grid grid-cols-2 gap-6 sm:grid-cols-3">
                    {projections.map((m) => (
                      <MetricStat key={`${m.key}-p`} m={m} currency={v.currency} />
                    ))}
                  </div>
                </div>
              )}
              <p className="mt-5 text-[12px] text-ivory-500">
                <span className="text-lime">Verified</span> figures were checked against documents by the platform team. Founder-reported and estimated figures are not independently checked.
              </p>
            </Section>

            <Section title="What’s included">
              <div className="flex flex-wrap gap-2">
                {v.assetsIncluded.length ? v.assetsIncluded.map((a) => <Badge key={a} tone="outline">{a}</Badge>) : <span className="text-sm text-ivory-400">To be detailed with approved buyers.</span>}
              </div>
              <p className="mt-3 text-sm text-ivory-400">Acquisition type: <span className="text-ivory-200">{ACQUISITION_LABEL[v.acquisitionType]}</span></p>
            </Section>

            {details ? (
              <>
                <Section title="Approved-buyer information">
                  <div className="mb-6 flex items-center gap-2 rounded-xl border border-lime/25 bg-lime/5 px-4 py-3 text-[13px] text-lime">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                    {data.viewerIsOwner ? "You are viewing your own listing as an approved buyer would." : "Confidential — shared with you under the platform confidentiality undertaking."}
                  </div>
                  <div className="grid gap-6">
                    <Prose label="Problem" text={details.problem} />
                    <Prose label="Value proposition" text={details.valueProposition} />
                    <Prose label="Product status" text={details.productStatus} />
                    <Prose label="MVP" text={details.mvpDescription} />
                    <Prose label="Monetisation" text={details.monetization} />
                    <Prose label="Customers & users" text={details.customersDescription} />
                    <Prose label="Partnerships" text={details.partnerships} />
                    <Prose label="Intellectual property" text={details.intellectualProperty} />
                    <Prose label="Growth opportunities" text={details.growthOpportunities} />
                    <Prose label="Why the founder is selling" text={details.saleRationale} />
                    <Prose label="Proposed sale structure" text={details.saleStructure} />
                    {details.techStack.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium">Technology</h3>
                        <div className="mt-2 flex flex-wrap gap-1.5">{details.techStack.map((t) => <Badge key={t}>{t}</Badge>)}</div>
                      </div>
                    )}
                    {(details.demoUrl || details.websiteUrl) && (
                      <div className="flex flex-wrap gap-4 text-sm">
                        {details.demoUrl && <a className="link" href={details.demoUrl} target="_blank" rel="noopener noreferrer nofollow">Product demo ↗</a>}
                        {details.websiteUrl && <a className="link" href={details.websiteUrl} target="_blank" rel="noopener noreferrer nofollow">Website ↗</a>}
                      </div>
                    )}
                    {details.founderName && (
                      <p className="text-sm text-ivory-400">Founder: <span className="text-ivory-200">{details.founderName}</span>{details.founderRole && `, ${details.founderRole}`}</p>
                    )}
                  </div>
                </Section>
                {details.documents.length > 0 && (
                  <Section title="Shared documents">
                    <ul className="divide-y divide-ink-700/70 rounded-xl border border-ink-700/70">
                      {details.documents.map((d) => (
                        <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                          <span className="min-w-0 truncate">{d.title} <span className="text-ivory-500">· {d.category}</span></span>
                          <a className="link shrink-0" href={`/api/documents/${d.id}`}>Open</a>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[12px] text-ivory-500">Every document access is logged. Links expire within a minute of opening.</p>
                  </Section>
                )}
              </>
            ) : (
              <Section title="Approved-buyer information">
                <div className="grid gap-3 sm:grid-cols-2">
                  {["Problem & value proposition", "Product screenshots & demo", "Revenue, expenses & customer metrics", "Technology stack & IP", "Growth opportunities", "Sale rationale & structure"].map((t) => (
                    <div key={t} className="flex items-center gap-3 rounded-xl border border-ink-700/70 bg-ink-900 px-4 py-3 text-sm text-ivory-400">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                      {t}
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-ivory-400">Shared only after the founder approves your request{v.requireNda ? " and you accept the confidentiality undertaking" : ""}.</p>
              </Section>
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start" id="request">
            <div className="surface p-6">
              <div className="text-[12px] text-ivory-400">Asking price</div>
              <div className="num mt-1 text-2xl">{formatPrice(v)}</div>
              <p className="mt-1 text-[12px] text-ivory-500">Seller expectation — not an independent valuation.</p>
              <div className="mt-5 flex items-center justify-between border-t border-ink-700/70 pt-4">
                <span className="text-[13px] text-ivory-400">Founder</span>
                <VerificationBadge level={v.founderLevel} />
              </div>
              <p className="mt-2 text-[12px] text-ivory-500">{LEVEL_LABEL[v.founderLevel]}. <Link href="/trust" className="underline underline-offset-2">What this means</Link></p>
              <div className="mt-5 flex flex-wrap gap-2">
                {data.viewerIsOwner ? (
                  <ButtonLink href={`/founder/ventures/${v.id}/edit`} variant="secondary" className="w-full">Edit listing</ButtonLink>
                ) : (
                  <SaveButton ventureId={v.id} saved={interaction?.kind === "SAVED"} signedIn={!!user} isBuyer={user?.role === "BUYER"} />
                )}
                {access.dataRoom && <ButtonLink href={`/data-room/${v.id}`} variant="outline">Open data room</ButtonLink>}
              </div>
            </div>

            {!data.viewerIsOwner && user?.role !== "ADMIN" && (
              <div className="surface p-6">
                <h2 className="text-lg font-medium">Request information</h2>
                {access.requests.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-[13px]">
                    {access.requests.map((r) => (
                      <li key={r.id} className="flex justify-between">
                        <span className="text-ivory-300">{r.level === "DATA_ROOM" ? "Data room" : "Details"}</span>
                        <Badge tone={r.status === "APPROVED" ? "lime" : r.status === "PENDING" ? "amber" : "outline"}>{ACCESS_STATUS_LABEL[r.status]}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4">
                  {!user ? (
                    <div className="space-y-3 text-sm text-ivory-300">
                      <p>Sign in with a buyer account to contact the founder under an alias.</p>
                      <ButtonLink href={`/login?next=/ventures/${v.slug}`} className="w-full">Sign in to request</ButtonLink>
                    </div>
                  ) : user.role !== "BUYER" ? (
                    <p className="text-sm text-ivory-400">Information requests are available to buyer accounts.</p>
                  ) : !user.emailVerifiedAt ? (
                    <div className="space-y-3 text-sm text-ivory-300">
                      <p>Confirm your email before contacting founders — anonymous, but accountable.</p>
                      <ResendVerification compact />
                    </div>
                  ) : !buyerProfile ? (
                    <ButtonLink href="/onboarding/buyer" className="w-full">Create your buyer alias</ButtonLink>
                  ) : !access.canRequest ? (
                    <p className="text-sm text-ivory-400">This listing is not accepting new requests.</p>
                  ) : openLevels.length === 0 ? (
                    <p className="text-sm text-ivory-400">Your requests are in progress. You’ll be notified when the founder responds.</p>
                  ) : (
                    <RequestAccessForm ventureId={v.id} requireNda={v.requireNda} levels={[...openLevels]} alias={buyerProfile.alias} />
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-between px-1">
              <span className="text-[12px] text-ivory-500">Ref. {v.id.slice(-8)}</span>
              {!data.viewerIsOwner && <ReportDialog targetType="VENTURE" targetId={v.id} signedIn={!!user} />}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

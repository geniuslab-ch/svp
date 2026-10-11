import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { getCurrentUser } from "@/lib/auth/session";
import { listVentures } from "@/lib/services/ventures";
import { ButtonLink } from "@/components/ui/button";
import { VentureCard } from "@/components/venture/venture-card";
import { VentureCover } from "@/components/venture/cover";
import { StageBadge, VerificationBadge } from "@/components/venture/badges";
import { formatPrice } from "@/lib/format";
import { STAGE_DESCRIPTION, STAGE_LABEL } from "@/lib/labels";
import { LEVEL_LABEL } from "@/lib/verification";

export const dynamic = "force-dynamic";

const STAGES = ["IDEA", "PROTOTYPE", "MVP", "EARLY_TRACTION", "REVENUE", "PROFITABLE"] as const;

export default async function Home() {
  const user = await getCurrentUser();
  const { items, total } = await listVentures({ sort: "recent" }, user, { pageSize: 9 });
  const stack = items.slice(0, 3);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_80%_0%,rgba(200,240,75,0.08),transparent_70%)]" />
        <div className="container-x relative grid gap-14 pb-20 pt-14 md:pt-20 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:pb-28">
          <div className="animate-fade-up">
            <div className="eyebrow flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
              Private acquisition marketplace · {total} ventures listed
            </div>
            <h1 className="serif mt-6 text-display-xl">
              Don’t start from zero.
              <br />
              <em className="text-lime">Acquire</em> what’s next.
            </h1>
            <p className="mt-7 max-w-xl text-lg text-ivory-300">{BRAND.description}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/discover" size="lg">
                Explore ventures
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M5 12h14m0 0-5-5m5 5-5 5" />
                </svg>
              </ButtonLink>
              <ButtonLink href={user?.role === "FOUNDER" ? "/founder/ventures/new" : "/sell"} size="lg" variant="outline">
                List your venture
              </ButtonLink>
            </div>
            <p className="mt-6 text-[13px] text-ivory-500">Browse freely. No account needed until you save, contact a founder or list.</p>
          </div>

          {/* Fanned card stack — a preview of the swipe experience */}
          <div className="relative mx-auto h-[440px] w-full max-w-[360px] sm:h-[480px]" aria-hidden={stack.length === 0}>
            {stack.length === 0 && (
              <div className="grid h-full place-items-center rounded-[22px] border border-dashed border-ink-700 text-sm text-ivory-400">
                Listings appear here once published.
              </div>
            )}
            {stack
              .slice()
              .reverse()
              .map((v, i, arr) => {
                const depth = arr.length - 1 - i;
                return (
                  <Link
                    key={v.id}
                    href={`/ventures/${v.slug}`}
                    tabIndex={depth === 0 ? 0 : -1}
                    className="absolute inset-0 overflow-hidden rounded-[22px] border border-ink-700 bg-ink-900 shadow-lift transition duration-500 hover:-translate-y-1"
                    style={{
                      transform: `translateY(${depth * -14}px) scale(${1 - depth * 0.05}) rotate(${depth === 0 ? 0 : depth % 2 ? -4 : 4}deg)`,
                      zIndex: 10 - depth,
                      opacity: 1 - depth * 0.2,
                    }}
                  >
                    <VentureCover seed={v.coverSeed} alias={v.alias} className="h-[55%] w-full" />
                    <div className="p-5">
                      <div className="flex gap-1.5">
                        <StageBadge stage={v.stage} />
                        <VerificationBadge level={v.founderLevel} compact />
                      </div>
                      <div className="mt-3 text-xl font-medium">{v.alias}</div>
                      <p className="mt-1 line-clamp-2 text-sm text-ivory-300">{v.tagline}</p>
                      <div className="num mt-3 text-sm text-ivory-200">{formatPrice(v)}</div>
                    </div>
                  </Link>
                );
              })}
            <div className="absolute -bottom-12 left-1/2 flex -translate-x-1/2 items-center gap-3 text-[12px] text-ivory-400">
              <kbd className="rounded border border-ink-600 px-1.5 font-mono">←</kbd> pass
              <span className="text-ink-600">/</span>
              interested <kbd className="rounded border border-ink-600 px-1.5 font-mono">→</kbd>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stage ribbon ─────────────────────────────────────────────────── */}
      <section className="border-y border-ink-700/60 bg-ink-900/50">
        <div className="container-x grid grid-cols-2 divide-ink-700/60 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x">
          {STAGES.map((s, i) => (
            <Link key={s} href={`/ventures?stage=${s}`} className="group px-0 py-6 lg:px-5 lg:first:pl-0">
              <div className="num text-[11px] text-ivory-500">0{i + 1}</div>
              <div className="mt-1 text-[15px] text-ivory transition group-hover:text-lime">{STAGE_LABEL[s]}</div>
              <div className="mt-1 text-[12.5px] leading-snug text-ivory-400">{STAGE_DESCRIPTION[s]}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="container-x py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <div className="eyebrow">How it works</div>
            <h2 className="serif mt-4 text-display-lg">
              Swipe to discover.
              <br />
              <span className="text-ivory-400">Not to buy.</span>
            </h2>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-card border border-ink-700/70 bg-ink-700/70 sm:grid-cols-3">
            {[
              ["Discover", "Swipe through teasers or browse with filters. Saving is private — the founder is not notified and nothing is binding."],
              ["Request, under your alias", "Ask for details or data-room access. Founders see your alias and only the profile fields you choose to disclose."],
              ["Founder approves", "Details unlock after approval and, where required, the platform NDA. Every document view is logged; access can be revoked."],
            ].map(([t, d], i) => (
              <li key={t} className="bg-ink-950 p-7">
                <div className="serif text-5xl text-lime">{i + 1}</div>
                <h3 className="mt-6 text-lg font-medium">{t}</h3>
                <p className="mt-2 text-sm text-ivory-300">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Latest ventures ──────────────────────────────────────────────── */}
      <section className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Recently listed</div>
            <h2 className="serif mt-3 text-display-md">On the market this week</h2>
          </div>
          <ButtonLink href="/ventures" variant="outline">
            View all ventures
          </ButtonLink>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((v) => (
            <VentureCard key={v.id} v={v} />
          ))}
        </div>
      </section>

      {/* ── Trust ────────────────────────────────────────────────────────── */}
      <section className="container-x py-28">
        <div className="grid gap-14 lg:grid-cols-2">
          <div>
            <div className="eyebrow">Trust infrastructure</div>
            <h2 className="serif mt-4 text-display-lg">
              Verified founders.
              <br />
              <em className="text-ivory-400">Protected buyers.</em>
            </h2>
            <p className="mt-6 max-w-lg text-ivory-300">
              Badges are earned through review, never by uploading a file. Buyers act under an alias with control over what they disclose — anonymous, but never unaccountable: every buyer confirms their email, and the platform can identify accounts where verification, fraud prevention or the law requires it.
            </p>
            <Link href="/trust" className="link mt-6 inline-block text-sm">
              How verification works →
            </Link>
          </div>
          <ol className="space-y-3">
            {([1, 2, 3, 4] as const).map((l) => (
              <li key={l} className="flex items-center gap-5 rounded-card border border-ink-700/70 bg-ink-900 p-5">
                <div className="num grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ink-600 text-sm text-lime">L{l}</div>
                <div>
                  <div className="font-medium">{LEVEL_LABEL[l]}</div>
                  <div className="text-[13px] text-ivory-400">
                    {
                      {
                        1: "Confirmed control of the account’s email address.",
                        2: "Identity evidence reviewed by the platform team.",
                        3: "Evidence of ownership or authority to sell this venture, reviewed.",
                        4: "Business and financial documents reviewed; figures marked Verified.",
                      }[l]
                    }
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Pre-revenue manifesto ────────────────────────────────────────── */}
      <section className="border-y border-ink-700/60 bg-ink-900/40">
        <div className="container-x grid gap-10 py-24 lg:grid-cols-[2fr_1fr] lg:items-end">
          <h2 className="serif text-display-lg">
            Zero revenue is not zero value. Code, IP, a domain, a prototype and a validated market are <em className="text-lime">assets</em>.
          </h2>
          <p className="text-ivory-300">
            Every listing states what it is — an idea, a working MVP, a revenue-generating or profitable company. Figures are labelled verified, founder-reported or estimated, and projections are never presented as results.
          </p>
        </div>
      </section>

      {/* ── Dual CTA ─────────────────────────────────────────────────────── */}
      <section className="container-x grid gap-5 pt-24 md:grid-cols-2">
        <div className="surface flex flex-col p-8 sm:p-10">
          <div className="eyebrow">For founders</div>
          <h3 className="serif mt-4 text-4xl">Your next chapter starts with a good handover.</h3>
          <p className="mt-3 text-ivory-300">List under an alias, decide who sees what, and keep sensitive files in a private data room.</p>
          <div className="mt-auto pt-8">
            <ButtonLink href={user ? "/founder/ventures/new" : "/signup?role=founder"} variant="secondary">
              List your venture
            </ButtonLink>
          </div>
        </div>
        <div className="surface flex flex-col p-8 sm:p-10">
          <div className="eyebrow">For acquirers</div>
          <h3 className="serif mt-4 text-4xl">Skip the blank page. Buy the momentum.</h3>
          <p className="mt-3 text-ivory-300">Explore under a pseudonym, track opportunities in a private pipeline, and make non-binding offers when ready.</p>
          <div className="mt-auto pt-8">
            <ButtonLink href={user ? "/discover" : "/signup?role=buyer"}>Start exploring</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}

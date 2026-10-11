import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { STAGE_LABEL } from "@/lib/labels";

export const metadata = { title: "Sell your venture" };

export default async function SellPage() {
  const user = await getCurrentUser();
  const cta = user?.role === "FOUNDER" ? "/founder/ventures/new" : "/signup?role=founder";
  return (
    <div>
      <section className="container-x py-20">
        <div className="eyebrow">For founders</div>
        <h1 className="serif mt-5 max-w-4xl text-display-xl">Your work deserves a <em className="text-lime">sequel</em>.</h1>
        <p className="mt-6 max-w-xl text-lg text-ivory-300">Whether it’s a validated idea, a working MVP or a profitable company, list it confidentially and hand it to someone ready to take it further.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={cta} size="lg">List your venture</ButtonLink>
          <ButtonLink href="/trust" size="lg" variant="outline">How verification works</ButtonLink>
        </div>
        <div className="mt-10 flex flex-wrap gap-2">
          {Object.values(STAGE_LABEL).map((s) => <span key={s} className="rounded-full border border-ink-700 px-3 py-1 text-[13px] text-ivory-300">{s}</span>)}
        </div>
      </section>
      <section className="container-x grid gap-px overflow-hidden rounded-card border border-ink-700/70 bg-ink-700/70 md:grid-cols-3">
        {[
          ["List under an alias", "Publish a teaser without revealing your name or company. Choose standard, confidential or stealth visibility."],
          ["You decide who sees more", "Buyers request access. You approve, decline or revoke — details and documents unlock only for approved buyers."],
          ["A private data room", "Upload financials, contracts and technical documentation. Files are never public; every access is logged."],
          ["Honest by design", "Pre-revenue is a first-class status. Each figure is labelled founder-reported, estimated or verified, with its period."],
          ["Build trust in levels", "Verify email, identity, ownership and financials. Badges are awarded only after review."],
          ["Free to list", "Basic listings are free while we’re in beta. Premium options may come later — never retroactively."],
        ].map(([t, d]) => (
          <div key={t} className="bg-ink-950 p-7">
            <h3 className="text-lg font-medium">{t}</h3>
            <p className="mt-2 text-sm text-ivory-400">{d}</p>
          </div>
        ))}
      </section>
      <p className="container-x mt-8 text-[13px] text-ivory-500">The platform connects founders and acquirers. It is not a broker, escrow provider, legal or investment adviser. Seek professional advice before signing any agreement.</p>
    </div>
  );
}

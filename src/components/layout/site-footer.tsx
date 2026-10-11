import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { Wordmark } from "./wordmark";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink-700/60">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm text-ivory-400">{BRAND.description}</p>
        </div>
        <div>
          <div className="eyebrow mb-3">Marketplace</div>
          <ul className="space-y-2 text-sm text-ivory-300">
            <li><Link className="hover:text-ivory" href="/discover">Discover</Link></li>
            <li><Link className="hover:text-ivory" href="/ventures">Browse all ventures</Link></li>
            <li><Link className="hover:text-ivory" href="/sell">List your venture</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-3">Trust</div>
          <ul className="space-y-2 text-sm text-ivory-300">
            <li><Link className="hover:text-ivory" href="/trust">How verification works</Link></li>
            <li><Link className="hover:text-ivory" href="/legal/privacy">Privacy policy</Link></li>
            <li><Link className="hover:text-ivory" href="/legal/terms">Terms of service</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-3">Important</div>
          <p className="text-[12.5px] leading-relaxed text-ivory-400">
            {BRAND.name} is a discovery marketplace — not a broker, escrow agent, legal or investment adviser. Asking prices are seller expectations, not valuations. Do your own due diligence.
          </p>
        </div>
      </div>
      <div className="container-x flex flex-col justify-between gap-2 border-t border-ink-800 py-6 text-[12px] text-ivory-500 sm:flex-row">
        <span>© {new Date().getFullYear()} {BRAND.name}. Draft legal documents pending professional review.</span>
        <span>Designed around Swiss FADP &amp; GDPR principles · Data minimised by design</span>
      </div>
    </footer>
  );
}

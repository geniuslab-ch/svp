import { BRAND } from "@/lib/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-x grid min-h-[calc(100vh-4rem)] gap-12 py-12 lg:grid-cols-[1fr_minmax(0,460px)] lg:items-center lg:py-20">
      <aside className="hidden lg:block">
        <div className="eyebrow">{BRAND.name} · Private acquisition marketplace</div>
        <p className="serif mt-6 max-w-lg text-display-md text-ivory">
          “The best time to buy a company is before everyone agrees it’s a company.”
        </p>
        <ul className="mt-10 max-w-md space-y-4 text-sm text-ivory-300">
          {[
            ["Swipe to discover, not to buy.", "Interest is private until you choose to make contact."],
            ["Verified founders, pseudonymous buyers.", "Founders prove ownership. Buyers act under an alias."],
            ["Pre-revenue is a first-class listing.", "Code, IP and validated ideas have value too."],
          ].map(([t, d]) => (
            <li key={t} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lime" />
              <span>
                <span className="text-ivory">{t}</span> {d}
              </span>
            </li>
          ))}
        </ul>
      </aside>
      <div className="w-full">{children}</div>
    </div>
  );
}

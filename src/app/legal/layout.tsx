export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-x max-w-3xl py-16">
      <div className="mb-10 rounded-xl border border-amber/40 bg-amber/5 p-4 text-sm text-amber">
        DRAFT PLACEHOLDER — NOT LEGAL ADVICE. This document must be reviewed and completed by qualified Swiss/EU counsel before public launch. Bracketed items are unresolved.
      </div>
      <article className="space-y-5 text-[15px] leading-relaxed text-ivory-300 [&_h1]:serif [&_h1]:text-5xl [&_h1]:text-ivory [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-ivory [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </article>
    </div>
  );
}

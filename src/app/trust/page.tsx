import { LEVEL_LABEL } from "@/lib/verification";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Trust & verification" };

export default function TrustPage() {
  return (
    <div className="container-x max-w-4xl py-16">
      <div className="eyebrow">Trust</div>
      <h1 className="serif mt-4 text-display-lg">How verification works</h1>
      <p className="mt-5 text-lg text-ivory-300">Badges describe checks that were actually completed — nothing more. Uploading a document never earns a badge; a reviewer’s approval does, and approvals expire.</p>

      <h2 className="mt-14 text-xl font-medium">Founder levels</h2>
      <ol className="mt-5 space-y-4">
        {[
          [1, "Automatic once the founder clicks a single-use link sent to their email address."],
          [2, "The founder uploads an identity document. A member of the platform team compares it with the legal name on the account. Valid for 2 years."],
          [3, "Per venture. Evidence of ownership or authority to sell — e.g. a commercial register extract, cap table, domain registrar or app-store account ownership. Valid for 1 year."],
          [4, "Per venture. Bank statements, accounting exports or payment-processor reports are reviewed against the figures in the listing. Supported figures are labelled “Verified”. Valid for 6 months; editing a verified figure removes the label."],
        ].map(([n, d]) => (
          <li key={n as number} className="surface p-5">
            <div className="font-medium"><span className="num mr-2 text-lime">L{n}</span>{LEVEL_LABEL[n as 1 | 2 | 3 | 4]}</div>
            <p className="mt-1 text-sm text-ivory-300">{d}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-ivory-400">
        Current process: reviews are manual, performed by authorised platform staff. {BRAND.name} does not yet use an automated identity-verification provider; the system is designed so one can be added. Verification reduces risk but does not guarantee the accuracy of a listing — always perform your own due diligence.
      </p>

      <h2 className="mt-14 text-xl font-medium">Buyers: pseudonymous, not unaccountable</h2>
      <ul className="mt-4 space-y-3 text-[15px] text-ivory-300">
        <li>• Buyers act under an alias and choose which profile details founders can see.</li>
        <li>• Saving or swiping never notifies the founder. Contact happens only through an explicit request.</li>
        <li>• Every buyer confirms their email before contacting founders. Optional proof-of-funds review adds a label — the documents are never shown to founders.</li>
        <li>• The platform can identify account holders where needed for verification, fraud prevention, legal obligations or a transaction. Anonymity towards other members is not absolute anonymity.</li>
      </ul>

      <h2 className="mt-14 text-xl font-medium">Information tiers</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ["Public teaser", "Alias, industry, stage, short description, general traction, price if chosen, verification level."],
          ["Approved buyers", "Business model detail, metrics, demo links, technology, growth opportunities, sale structure."],
          ["Data room", "Financial statements, contracts, IP and technical documentation. Expiring access; every view logged."],
        ].map(([t, d]) => (
          <div key={t} className="surface p-5"><div className="font-medium">{t}</div><p className="mt-1 text-sm text-ivory-400">{d}</p></div>
        ))}
      </div>
      <p className="mt-4 text-sm text-ivory-400">Permissions are enforced on the server for every page and download — not just hidden in the interface.</p>
    </div>
  );
}

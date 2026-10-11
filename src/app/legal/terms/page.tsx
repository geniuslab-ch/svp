import { BRAND } from "@/lib/brand";

export const metadata = { title: "Terms of service (draft)" };

export default function Terms() {
  return (
    <>
      <h1>Terms of service</h1>
      <p>Version: draft · Operator: {BRAND.legalEntity}</p>
      <h2>1. What the platform is</h2>
      <p>{BRAND.name} is an online marketplace and discovery service that lets founders present ventures and lets prospective acquirers discover them and request information. {BRAND.name} is not a party to any transaction and does not act as a broker, agent, escrow provider, legal, tax or investment adviser. [Counsel to confirm no licensable brokerage or financial-intermediary activity under Swiss law (e.g. FinSA/FinIA, AMLA) and EU member-state rules.]</p>
      <h2>2. Accounts</h2>
      <ul>
        <li>You must provide accurate information and keep your credentials secure.</li>
        <li>Founder and buyer roles have different permissions. Administrator rights are never self-assigned.</li>
        <li>We may suspend accounts for misleading listings, fraud, harassment or breach of confidentiality.</li>
      </ul>
      <h2>3. Listings</h2>
      <ul>
        <li>Founders must have the right to offer what they list and must describe it accurately, distinguishing historical results from projections.</li>
        <li>Asking prices are the seller’s expectations, not valuations by {BRAND.name}.</li>
        <li>Verification badges reflect the checks described on the Trust page only and are not a guarantee.</li>
      </ul>
      <h2>4. Confidentiality</h2>
      <p>Buyers who accept the platform confidentiality undertaking agree to keep information received confidential and use it only to evaluate the opportunity. [Counsel to draft enforceable NDA terms, governing law and jurisdiction.]</p>
      <h2>5. Offers</h2>
      <p>Expressions of interest and indicative offers made through the platform are non-binding. Binding offers and agreements are concluded outside the platform. [Counsel to review electronic-signature and contract-formation implications before any binding workflow is enabled.]</p>
      <h2>6. Fees</h2>
      <p>Basic use is currently free. Any future paid features will be announced before they apply.</p>
      <h2>7. Liability</h2>
      <p>[Limitation of liability, marketplace-liability and indemnity clauses to be drafted by counsel.]</p>
      <h2>8. Governing law</h2>
      <p>[To be determined — e.g. Swiss law, courts of the operator’s seat.]</p>
    </>
  );
}

import { BRAND } from "@/lib/brand";

export const metadata = { title: "Privacy policy (draft)" };

export default function Privacy() {
  return (
    <>
      <h1>Privacy policy</h1>
      <p>Version: {BRAND.privacyVersion} · Controller: {BRAND.legalEntity} · Contact: {BRAND.supportEmail}</p>
      <p>This notice is drafted with the Swiss Federal Act on Data Protection (FADP) and, where applicable, the EU GDPR in mind. Drafting with these laws in mind does not by itself make the platform compliant; compliance requires legal review and operational measures.</p>
      <h2>What we process</h2>
      <ul>
        <li>Account data: email, password hash, role, consent records, login timestamps.</li>
        <li>Profile data: founder legal name (private), display name, buyer alias and the profile fields you choose to disclose.</li>
        <li>Verification data: documents you submit for identity, ownership, financial or proof-of-funds review.</li>
        <li>Listing and deal data: listings, metrics, documents, requests, messages, non-binding offers, pipeline notes (private to you).</li>
        <li>Security data: IP addresses and actions recorded in audit logs, rate-limit counters.</li>
      </ul>
      <h2>Anonymity — and its limits</h2>
      <p>Other members see buyers by alias and only the fields they disclose. We do not promise absolute anonymity: the platform and authorised service providers may process identity information for verification, fraud prevention, legal obligations (including possible anti-money-laundering duties) and the completion of transactions, and may disclose it where legally required.</p>
      <h2>Purposes & legal bases</h2>
      <p>[Map each purpose to a legal basis: contract performance, legitimate interests (fraud prevention, security), legal obligation, consent where required.]</p>
      <h2>Processors & transfers</h2>
      <p>Hosting: Render (application). Database and private file storage: Supabase. Email: Resend (if enabled). [List processor locations and transfer mechanisms (e.g. adequacy decisions, SCCs); confirm data-processing agreements are in place.]</p>
      <h2>Retention</h2>
      <p>Account data is kept while your account is active. Verification documents are deleted when you delete your account. Audit logs are retained for [period to be defined] for security and legal purposes.</p>
      <h2>Your rights</h2>
      <p>You can access and download your data (Settings → Your data), correct your profile, and delete your account (Settings → Delete account). You may also object, request restriction or complain to the FDPIC or your EU supervisory authority.</p>
      <h2>Cookies & analytics</h2>
      <p>We use one strictly necessary session cookie. No advertising or third-party analytics cookies are set.</p>
    </>
  );
}

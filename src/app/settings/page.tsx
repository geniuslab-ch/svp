import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { BuyerProfileForm, FounderProfileForm } from "@/components/profile-forms";
import { VerificationForm } from "@/components/verification-form";
import { Badge } from "@/components/ui/badge";
import { ResendVerification } from "@/components/resend-verification";
import { DeleteAccountForm, NotificationPrefsForm, PasswordForm } from "./settings-client";

export const metadata = { title: "Settings & privacy" };

function Panel({ title, description, children, id }: { title: string; description?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="grid gap-6 border-t border-ink-700/70 py-10 lg:grid-cols-[260px_1fr]">
      <div>
        <h2 className="text-lg font-medium">{title}</h2>
        {description && <p className="mt-1 text-sm text-ivory-400">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const user = await requireUser("/settings");
  const [founder, buyer, buyerFunds] = await Promise.all([
    db.founderProfile.findUnique({ where: { userId: user.id } }),
    db.buyerProfile.findUnique({ where: { userId: user.id } }),
    db.verificationRequest.findFirst({ where: { userId: user.id, kind: "BUYER_FUNDS" }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <div className="container-x max-w-5xl py-10">
      <div className="eyebrow">Account</div>
      <h1 className="serif mt-2 text-display-md">Settings & privacy</h1>

      <Panel title="Account" description="Your email is private and never shown to other members.">
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className="text-ivory-500">Email</dt><dd className="break-all">{user.email}</dd></div>
          <div><dt className="text-ivory-500">Account type</dt><dd className="capitalize">{user.role.toLowerCase()}</dd></div>
          <div><dt className="text-ivory-500">Email status</dt><dd>{user.emailVerifiedAt ? <Badge tone="lime">Verified</Badge> : <Badge tone="amber">Unconfirmed</Badge>}</dd></div>
          <div><dt className="text-ivory-500">Member since</dt><dd>{formatDate(user.createdAt)}</dd></div>
          <div><dt className="text-ivory-500">Privacy notice accepted</dt><dd>{user.privacyAcceptedAt ? `${formatDate(user.privacyAcceptedAt)} (${user.privacyVersion})` : "—"}</dd></div>
        </dl>
        {!user.emailVerifiedAt && <div className="mt-4"><ResendVerification compact /></div>}
      </Panel>

      {user.role === "FOUNDER" && (
        <Panel title="Founder profile" description="Legal name is private and used only for verification.">
          <FounderProfileForm profile={founder} />
        </Panel>
      )}

      {user.role === "BUYER" && (
        <>
          <Panel title="Buyer profile & disclosure" description="Founders see your alias plus only the fields you tick.">
            <BuyerProfileForm profile={buyer} />
          </Panel>
          <Panel title="Buyer verification" description="Optional. A reviewed proof of funds shows founders a “Proof of funds reviewed” label — never the document itself.">
            <div className="mb-4 text-sm">
              Status: {buyer?.verification === "VERIFIED" ? <Badge tone="lime">Reviewed</Badge> : buyer?.verification === "PENDING" ? <Badge tone="amber">Pending review</Badge> : <Badge tone="outline">Not submitted</Badge>}
              {buyerFunds?.status === "REJECTED" && buyerFunds.reviewNote && <p className="mt-2 text-clay">Reviewer note: {buyerFunds.reviewNote}</p>}
            </div>
            {buyer?.verification !== "PENDING" && <VerificationForm ventures={[]} role="BUYER" canSubmit={!!user.emailVerifiedAt} />}
          </Panel>
        </>
      )}

      <Panel title="Notifications" description="In-app notifications are always on. Choose what we also email you. Emails never contain confidential listing data.">
        <NotificationPrefsForm requests={user.notifyEmailRequests} messages={user.notifyEmailMessages} updates={user.notifyEmailUpdates} />
      </Panel>

      <Panel title="Password" description="Changing your password keeps you signed in on this device.">
        <PasswordForm />
      </Panel>

      <Panel title="Your data" description="Download a copy of the personal data we hold about you (FADP / GDPR access right).">
        <a href="/api/account/export" className="inline-flex h-10 items-center rounded-full border border-ink-600 px-5 text-sm hover:border-ivory-400">Download my data (JSON)</a>
      </Panel>

      {user.role !== "ADMIN" && (
        <Panel id="delete" title="Delete account" description="Removes your profile, listings, documents, saved ventures and verification files. Messages you sent remain visible to the other party as “Deleted account”. Security audit logs are retained.">
          <DeleteAccountForm />
        </Panel>
      )}
    </div>
  );
}

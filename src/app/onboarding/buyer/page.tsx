import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { BuyerProfileForm } from "@/components/profile-forms";

export const metadata = { title: "Buyer onboarding" };

export default async function BuyerOnboarding() {
  const user = await requireRole(["BUYER"], "/onboarding/buyer");
  const profile = await db.buyerProfile.findUnique({ where: { userId: user.id } });
  return (
    <div className="container-x max-w-3xl py-12">
      <div className="eyebrow">Buyer profile</div>
      <h1 className="serif mt-3 text-display-md">Choose how founders see you</h1>
      <p className="mt-3 max-w-xl text-ivory-300">
        You act under an alias. You decide which details accompany it. Anonymous, but accountable: we keep your verified email, and the platform may process identity information where verification, fraud prevention or the law requires it.
      </p>
      {!user.emailVerifiedAt && <p className="mt-4 text-sm text-amber">Confirm your email ({user.email}) before contacting founders.</p>}
      <div className="surface mt-8 p-6 sm:p-8">
        <BuyerProfileForm profile={profile} onboarding />
      </div>
    </div>
  );
}

import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { FounderProfileForm } from "@/components/profile-forms";

export const metadata = { title: "Founder onboarding" };

export default async function FounderOnboarding() {
  const user = await requireRole(["FOUNDER"], "/onboarding/founder");
  const profile = await db.founderProfile.findUnique({ where: { userId: user.id } });
  return (
    <div className="container-x max-w-3xl py-12">
      <div className="eyebrow">Step 1 of 2 · Founder profile</div>
      <h1 className="serif mt-3 text-display-md">Tell us who’s behind the venture</h1>
      <p className="mt-3 max-w-xl text-ivory-300">
        Your legal name stays private and is used only for verification. Buyers see your display name once you approve them. Next, you’ll be able to list a venture and start verification.
      </p>
      {!user.emailVerifiedAt && <p className="mt-4 text-sm text-amber">We sent a confirmation link to {user.email}. You can continue now and confirm later.</p>}
      <div className="surface mt-8 p-6 sm:p-8">
        <FounderProfileForm profile={profile} onboarding />
      </div>
    </div>
  );
}

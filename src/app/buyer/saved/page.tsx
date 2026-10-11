import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { TEASER_SELECT, toTeaser } from "@/lib/services/ventures";
import { VentureCard } from "@/components/venture/venture-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { canViewTeaser } from "@/lib/authz";
import { RemoveSaved } from "./remove-saved";

export const metadata = { title: "Saved ventures" };

export default async function SavedPage() {
  const user = await requireRole(["BUYER"]);
  const rows = await db.ventureInteraction.findMany({
    where: { userId: user.id, kind: "SAVED" },
    orderBy: { updatedAt: "desc" },
    include: { venture: { select: TEASER_SELECT } },
  });
  const grants = await db.accessRequest.findMany({ where: { buyerId: user.id } });
  const items = rows.filter((r) => canViewTeaser(r.venture, user, grants.filter((g) => g.ventureId === r.venture.id))).map((r) => toTeaser(r.venture));
  return (
    <div>
      <div className="eyebrow">Saved</div>
      <h1 className="serif mt-2 text-display-md">Saved ventures</h1>
      <p className="mt-2 text-sm text-ivory-400">Private shortlist. Founders are not notified when you save.</p>
      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyState title="Nothing saved yet" body="Swipe right on ventures you want to come back to." action={<ButtonLink href="/discover">Discover ventures</ButtonLink>} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((v) => <VentureCard key={v.id} v={v} footer={<RemoveSaved id={v.id} />} />)}
          </div>
        )}
      </div>
    </div>
  );
}

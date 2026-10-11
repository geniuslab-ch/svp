import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { DashboardNav } from "@/components/layout/dashboard-nav";

export default async function FounderLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["FOUNDER"], "/founder");
  const pending = await db.accessRequest.count({ where: { status: "PENDING", venture: { founderId: user.id } } });
  return (
    <div className="container-x grid gap-8 py-8 lg:grid-cols-[200px_1fr] lg:py-12">
      <aside>
        <DashboardNav
          title="Founder"
          items={[
            { href: "/founder", label: "Overview", exact: true },
            { href: "/founder/ventures/new", label: "New listing" },
            { href: "/founder/requests", label: "Buyer requests", count: pending },
            { href: "/messages", label: "Messages" },
            { href: "/founder/verification", label: "Verification" },
            { href: "/settings", label: "Settings" },
          ]}
        />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

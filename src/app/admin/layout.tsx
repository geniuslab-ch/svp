import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { DashboardNav } from "@/components/layout/dashboard-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["ADMIN"], "/admin");
  const [pendingVerifications, openReports, flagged] = await Promise.all([
    db.verificationRequest.count({ where: { status: "PENDING" } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.venture.count({ where: { flagged: true } }),
  ]);
  return (
    <div className="container-x grid gap-8 py-8 lg:grid-cols-[200px_1fr] lg:py-12">
      <aside>
        <DashboardNav
          title="Administration"
          items={[
            { href: "/admin", label: "Overview", exact: true },
            { href: "/admin/verifications", label: "Verifications", count: pendingVerifications },
            { href: "/admin/ventures", label: "Listings", count: flagged },
            { href: "/admin/reports", label: "Reports", count: openReports },
            { href: "/admin/users", label: "Users" },
            { href: "/admin/audit", label: "Audit log" },
          ]}
        />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

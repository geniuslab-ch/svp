import { requireRole } from "@/lib/auth/session";
import { DashboardNav } from "@/components/layout/dashboard-nav";

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["BUYER"], "/buyer");
  return (
    <div className="container-x grid gap-8 py-8 lg:grid-cols-[200px_1fr] lg:py-12">
      <aside>
        <DashboardNav
          title="Acquirer"
          items={[
            { href: "/buyer", label: "Pipeline", exact: true },
            { href: "/buyer/saved", label: "Saved" },
            { href: "/buyer/requests", label: "Requests" },
            { href: "/buyer/history", label: "History" },
            { href: "/messages", label: "Messages" },
            { href: "/settings", label: "Profile & privacy" },
          ]}
        />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

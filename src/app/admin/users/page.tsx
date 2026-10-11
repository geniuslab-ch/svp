import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { UserControls } from "./user-controls";

export const metadata = { title: "Users" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const users = await db.user.findMany({
    where: { status: { not: "DELETED" }, ...(q ? { email: { contains: q, mode: "insensitive" as const } } : {}) },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, email: true, role: true, status: true, emailVerifiedAt: true, createdAt: true, lastLoginAt: true,
      buyerProfile: { select: { alias: true, verification: true } },
      _count: { select: { ventures: true, accessRequests: true } },
    },
  });
  return (
    <div>
      <div className="eyebrow">People</div>
      <h1 className="serif mt-2 text-display-md">Users & roles</h1>
      <p className="mt-2 text-sm text-ivory-400">Roles are fixed at sign-up. Administrator rights can only be granted from the server command line (<code className="font-mono">npm run make-admin</code>), never from the web interface.</p>
      <form className="mt-6"><input name="q" defaultValue={q} placeholder="Search by email" className="h-9 w-72 rounded-full border border-ink-700 bg-ink-850 px-4 text-sm" /></form>
      <div className="mt-4 overflow-x-auto rounded-card border border-ink-700/70">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-900 text-[12px] text-ivory-400">
            <tr><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Activity</th><th className="p-3">Joined</th><th className="p-3" /></tr>
          </thead>
          <tbody className="divide-y divide-ink-700/70">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-3"><div className="break-all">{u.email}</div>{u.buyerProfile && <div className="text-[12px] text-ivory-500">alias: {u.buyerProfile.alias}</div>}</td>
                <td className="p-3 capitalize">{u.role.toLowerCase()}</td>
                <td className="p-3"><div className="flex flex-wrap gap-1"><Badge tone={u.status === "ACTIVE" ? "sage" : "clay"}>{u.status.toLowerCase()}</Badge>{!u.emailVerifiedAt && <Badge tone="amber">email unconfirmed</Badge>}</div></td>
                <td className="p-3 text-[12.5px] text-ivory-400">{u._count.ventures} listings · {u._count.accessRequests} requests</td>
                <td className="p-3 text-[12.5px] text-ivory-400">{formatDate(u.createdAt)}</td>
                <td className="p-3 text-right">{u.role !== "ADMIN" && <UserControls id={u.id} status={u.status} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

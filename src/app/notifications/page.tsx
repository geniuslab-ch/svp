import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import { markNotificationsReadAction, openNotificationAction } from "@/app/actions/account";
import { cn } from "@/lib/cn";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const unread = items.filter((n) => !n.readAt).length;
  return (
    <div className="container-x max-w-3xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Notifications</div>
          <h1 className="serif mt-2 text-display-md">What’s new</h1>
        </div>
        {unread > 0 && (
          <form action={markNotificationsReadAction}>
            <button className="text-sm text-ivory-400 hover:text-ivory">Mark all as read</button>
          </form>
        )}
      </div>
      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyState title="All quiet" body="You’ll hear here when founders respond, buyers request access or listings you follow change." />
        ) : (
          <ul className="divide-y divide-ink-700/70 rounded-card border border-ink-700/70">
            {items.map((n) => (
              <li key={n.id}>
                <form action={openNotificationAction}>
                  <input type="hidden" name="id" value={n.id} />
                  <button className={cn("flex w-full items-start gap-3 p-4 text-left transition hover:bg-ink-900", !n.readAt && "bg-ink-900/60")}>
                    <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-lime")} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] text-ivory">{n.title}</span>
                      {n.body && <span className="block text-sm text-ivory-400">{n.body}</span>}
                      <span className="text-[12px] text-ivory-500">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

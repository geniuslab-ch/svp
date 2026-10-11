import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listConversations } from "@/lib/services/deals";
import { timeAgo } from "@/lib/format";
import { VentureCover } from "@/components/venture/cover";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireUser("/messages");
  const convos = await listConversations(user);
  return (
    <div className="container-x max-w-4xl py-10">
      <div className="eyebrow">Messages</div>
      <h1 className="serif mt-2 text-display-md">Conversations</h1>
      <p className="mt-2 text-sm text-ivory-400">Conversations open once a founder approves a request. Buyers appear under their alias.</p>
      <div className="mt-8">
        {convos.length === 0 ? (
          <EmptyState title="No conversations yet" body={user.role === "FOUNDER" ? "Approve a buyer request to start a private conversation." : "Request information on a venture. When the founder approves, a private conversation opens here."} />
        ) : (
          <ul className="divide-y divide-ink-700/70 rounded-card border border-ink-700/70">
            {convos.map((c) => (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="flex items-center gap-4 p-4 transition hover:bg-ink-900">
                  <VentureCover seed={c.venture.coverSeed} alias={c.venture.alias} className="h-12 w-12 shrink-0 rounded-full" monogram={false} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-medium">{c.venture.alias} <span className="font-normal text-ivory-400">· {c.counterpart}</span></span>
                      <span className="shrink-0 text-[12px] text-ivory-500">{timeAgo(c.updatedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm text-ivory-400">{c.last?.body ?? "No messages yet"}</p>
                      {c.unread > 0 && <span className="num shrink-0 rounded-full bg-lime px-2 text-[11px] font-semibold text-ink-950">{c.unread}</span>}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

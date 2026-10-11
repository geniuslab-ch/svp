import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { unreadCount } from "@/lib/services/notifications";
import { db } from "@/lib/db";
import { Wordmark } from "./wordmark";
import { ButtonLink } from "@/components/ui/button";
import { MobileNav, UserMenu } from "./header-client";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const [unread, unreadMessages] = user
    ? await Promise.all([
        unreadCount(user.id),
        db.message.count({
          where: {
            readAt: null,
            NOT: { senderId: user.id },
            conversation: { OR: [{ buyerId: user.id }, { founderId: user.id }] },
          },
        }),
      ])
    : [0, 0];

  const dashboard = user?.role === "ADMIN" ? "/admin" : user?.role === "FOUNDER" ? "/founder" : "/buyer";
  const links = [
    { href: "/discover", label: "Discover" },
    { href: "/ventures", label: "Browse" },
    ...(user?.role === "FOUNDER" ? [{ href: "/founder", label: "My ventures" }] : []),
    ...(user?.role === "BUYER" ? [{ href: "/buyer", label: "Pipeline" }, { href: "/buyer/saved", label: "Saved" }] : []),
    ...(user?.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
    ...(!user ? [{ href: "/sell", label: "Sell" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-ink-700/60 bg-ink-950/80 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center gap-6">
        <Wordmark />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-3 py-1.5 text-sm text-ivory-300 transition hover:bg-ink-800 hover:text-ivory">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link href="/messages" className="relative hidden rounded-full p-2 text-ivory-300 transition hover:bg-ink-800 hover:text-ivory sm:block" aria-label={`Messages${unreadMessages ? `, ${unreadMessages} unread` : ""}`}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d="M4 5h16v11H8l-4 4z" />
                </svg>
                {unreadMessages > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-lime" />}
              </Link>
              <Link href="/notifications" className="relative rounded-full p-2 text-ivory-300 transition hover:bg-ink-800 hover:text-ivory" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5h4" />
                </svg>
                {unread > 0 && (
                  <span className="num absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-lime px-1 text-[10px] font-semibold text-ink-950">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <UserMenu email={user.email} role={user.role} dashboard={dashboard} />
            </>
          ) : (
            <>
              <Link href="/login" className="hidden rounded-full px-3 py-1.5 text-sm text-ivory-300 transition hover:text-ivory sm:block">
                Sign in
              </Link>
              <ButtonLink href="/signup" size="sm">
                Join
              </ButtonLink>
            </>
          )}
          <MobileNav links={[...links, ...(user ? [{ href: "/messages", label: "Messages" }, { href: "/settings", label: "Settings" }] : [{ href: "/login", label: "Sign in" }])]} />
        </div>
      </div>
    </header>
  );
}

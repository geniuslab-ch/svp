"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { logoutAction } from "@/app/actions/auth";

export function UserMenu({ email, role, dashboard }: { email: string; role: string; dashboard: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="ml-1 grid h-9 w-9 place-items-center rounded-full border border-ink-600 bg-ink-800 text-sm font-medium uppercase text-ivory transition hover:border-ivory-400"
      >
        {email.charAt(0)}
        <span className="sr-only">Account menu</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-ink-700 bg-ink-850 p-1.5 shadow-lift"
          >
            <div className="px-3 py-2.5">
              <div className="truncate text-sm text-ivory">{email}</div>
              <div className="eyebrow mt-0.5">{role.toLowerCase()} account</div>
            </div>
            <div className="my-1 h-px bg-ink-700" />
            {[
              { href: dashboard, label: "Dashboard" },
              { href: "/messages", label: "Messages" },
              { href: "/notifications", label: "Notifications" },
              ...(role === "FOUNDER" ? [{ href: "/founder/verification", label: "Verification center" }] : []),
              { href: "/settings", label: "Settings & privacy" },
            ].map((l) => (
              <Link key={l.href} role="menuitem" href={l.href} className="block rounded-xl px-3 py-2 text-sm text-ivory-200 hover:bg-ink-750 hover:text-ivory">
                {l.label}
              </Link>
            ))}
            <div className="my-1 h-px bg-ink-700" />
            <form action={logoutAction}>
              <button role="menuitem" className="block w-full rounded-xl px-3 py-2 text-left text-sm text-ivory-300 hover:bg-ink-750 hover:text-ivory">
                Sign out
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div className="md:hidden">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu" className="rounded-full p-2 text-ivory-200 hover:bg-ink-800">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute inset-x-0 top-16 overflow-hidden border-b border-ink-700 bg-ink-950"
            aria-label="Mobile"
          >
            <div className="container-x flex flex-col py-3">
              {links.map((l) => (
                <Link key={l.href + l.label} href={l.href} className="serif border-b border-ink-800 py-3 text-2xl text-ivory last:border-0">
                  {l.label}
                </Link>
              ))}
              {links.some((l) => l.href === "/settings") && (
                <form action={logoutAction}>
                  <button className="py-3 text-left text-sm text-ivory-400">Sign out</button>
                </form>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}

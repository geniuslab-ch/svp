"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function DashboardNav({ items, title }: { items: { href: string; label: string; count?: number; exact?: boolean }[]; title: string }) {
  const path = usePathname();
  return (
    <nav aria-label={title} className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <div className="eyebrow mb-3 hidden lg:block">{title}</div>
      <ul className="flex gap-1 lg:flex-col">
        {items.map((i) => {
          const active = i.exact ? path === i.href : path === i.href || path.startsWith(i.href + "/");
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between gap-3 whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition lg:rounded-xl",
                  active ? "bg-ink-800 text-ivory" : "text-ivory-400 hover:bg-ink-850 hover:text-ivory",
                )}
              >
                {i.label}
                {!!i.count && <span className="num rounded-full bg-lime px-1.5 text-[11px] font-semibold text-ink-950">{i.count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

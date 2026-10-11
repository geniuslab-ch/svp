import Link from "next/link";
import { BRAND } from "@/lib/brand";

/** Mark: an open chapter — a closed arc followed by a forward stroke. */
export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M17 6.5A9.5 9.5 0 1 0 17 25.5" stroke="#F1ECE2" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 16h9m0 0-4-4m4 4-4 4" stroke="#C8F04B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2" aria-label={`${BRAND.name} home`}>
      <Mark />
      <span className="serif text-[26px] leading-none tracking-tight text-ivory transition group-hover:text-white">
        {BRAND.name.toLowerCase()}
        <span className="text-lime">.</span>
      </span>
    </Link>
  );
}

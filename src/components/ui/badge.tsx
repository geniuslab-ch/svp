import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "lime" | "amber" | "clay" | "sage" | "steel" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-ink-750 text-ivory-200",
  lime: "bg-lime/10 text-lime ring-1 ring-inset ring-lime/25",
  amber: "bg-amber/10 text-amber ring-1 ring-inset ring-amber/25",
  clay: "bg-clay/10 text-clay ring-1 ring-inset ring-clay/25",
  sage: "bg-sage/10 text-sage ring-1 ring-inset ring-sage/25",
  steel: "bg-steel/10 text-steel ring-1 ring-inset ring-steel/25",
  outline: "text-ivory-300 ring-1 ring-inset ring-ink-600",
};

export function Badge({ tone = "neutral", children, className, title }: { tone?: Tone; children: ReactNode; className?: string; title?: string }) {
  return (
    <span
      title={title}
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium leading-5", tones[tone], className)}
    >
      {children}
    </span>
  );
}

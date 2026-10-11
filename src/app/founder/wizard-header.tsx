import Link from "next/link";
import { WIZARD_STEPS } from "@/lib/services/listings";
import { cn } from "@/lib/cn";

export function WizardHeader({ step, title, ventureId, maxStep = 1, alias }: { step: number; title: string; ventureId?: string; maxStep?: number; alias?: string }) {
  return (
    <div>
      <div className="eyebrow">{alias ? `Editing · ${alias}` : "New listing"} · Step {step} of 11</div>
      <h1 className="serif mt-2 text-display-md">{title}</h1>
      <ol className="mt-6 flex gap-1" aria-label="Progress">
        {WIZARD_STEPS.map((s) => {
          const reachable = ventureId && s.n <= Math.max(maxStep, step);
          const cls = cn("block h-1.5 rounded-full transition", s.n === step ? "bg-lime" : s.n < step || (ventureId && s.n <= maxStep) ? "bg-ivory-400" : "bg-ink-700");
          return (
            <li key={s.n} className="flex-1" title={`${s.n}. ${s.title}`}>
              {reachable ? (
                <Link href={`/founder/ventures/${ventureId}/edit?step=${s.n}`} aria-label={`Step ${s.n}: ${s.title}`} aria-current={s.n === step ? "step" : undefined} className="block py-1">
                  <span className={cls} />
                </Link>
              ) : (
                <span className="block py-1"><span className={cls} /></span>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-1 hidden justify-between text-[11px] text-ivory-500 md:flex">
        {WIZARD_STEPS.map((s) => <span key={s.n} className={cn("flex-1 truncate pr-1", s.n === step && "text-ivory-200")}>{s.title}</span>)}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";
import type { VentureTeaser } from "@/lib/services/ventures";
import { formatPrice } from "@/lib/format";
import { ACQUISITION_LABEL, METRIC_SHORT, MODEL_LABEL } from "@/lib/labels";
import { VentureCover } from "@/components/venture/cover";
import { ConfidentialityBadge, RevenueBadge, SourceTag, StageBadge, VerificationBadge } from "@/components/venture/badges";
import { metricValue } from "@/components/venture/metric";
import { useToast } from "@/components/ui/toast";
import { loadMoreAction, passVentureAction, saveVentureAction, undoInteractionAction } from "@/app/actions/discovery";

type Decision = "save" | "pass";
const THRESHOLD = 110;

function SwipeCard({ v, onDecide, active, depth }: { v: VentureTeaser; onDecide: (d: Decision) => void; active: boolean; depth: number }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-9, 0, 9]);
  const saveOpacity = useTransform(x, [20, THRESHOLD], [0, 1]);
  const passOpacity = useTransform(x, [-THRESHOLD, -20], [1, 0]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > THRESHOLD || info.velocity.x > 600) onDecide("save");
    else if (info.offset.x < -THRESHOLD || info.velocity.x < -600) onDecide("pass");
    else animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
  };

  const revenue = v.metrics.find((m) => (m.key === "MRR" || m.key === "MONTHLY_REVENUE" || m.key === "ANNUAL_REVENUE") && m.value != null);
  const users = v.metrics.find((m) => (m.key === "CUSTOMERS" || m.key === "ACTIVE_USERS") && m.value != null);

  return (
    <motion.article
      className="absolute inset-0 flex touch-pan-y flex-col overflow-hidden rounded-[24px] border border-ink-700 bg-ink-900 shadow-lift"
      style={{ x: active ? x : 0, rotate: active ? rotate : 0, zIndex: 20 - depth }}
      initial={{ scale: 0.94, y: 18, opacity: 0 }}
      animate={{ scale: 1 - depth * 0.04, y: depth * 14, opacity: depth > 2 ? 0 : 1 - depth * 0.25 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      drag={active ? "x" : false}
      dragSnapToOrigin={false}
      dragElastic={0.9}
      onDragEnd={onDragEnd}
      aria-hidden={!active}
      aria-label={active ? `${v.alias}: ${v.tagline}` : undefined}
    >
      <div className="relative h-[28%] min-h-[120px] shrink-0">
        <VentureCover seed={v.coverSeed} alias={v.alias} className="h-full w-full" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
          <StageBadge stage={v.stage} />
          <ConfidentialityBadge level={v.confidentiality} />
          {v.isDemo && <span className="rounded-full bg-ink-950/70 px-2 py-0.5 font-mono text-[10px] uppercase leading-5 tracking-wider text-ivory-300 backdrop-blur">Demo</span>}
        </div>
        {active && (
          <>
            <motion.div style={{ opacity: saveOpacity }} className="absolute right-4 top-4 rounded-full bg-lime px-3 py-1 text-[12px] font-semibold uppercase tracking-wider text-ink-950">
              Save
            </motion.div>
            <motion.div style={{ opacity: passOpacity }} className="absolute right-4 top-4 rounded-full bg-ivory px-3 py-1 text-[12px] font-semibold uppercase tracking-wider text-ink-950">
              Pass
            </motion.div>
          </>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="eyebrow min-w-0 truncate">{v.industry} · {MODEL_LABEL[v.businessModel]} · {v.geography}</div>
          <VerificationBadge level={v.founderLevel} compact />
        </div>
        <h2 className="serif mt-2 text-[30px] leading-[1.02] sm:text-[34px]">{v.alias}</h2>
        <p className="mt-2 line-clamp-2 text-[14px] text-ivory-300">{v.summary || v.tagline}</p>

        <dl className="mt-4 grid shrink-0 grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink-700 bg-ink-700 text-[13px]">
          <div className="bg-ink-900 p-3">
            <dt className="text-[11.5px] text-ivory-400">Asking · {ACQUISITION_LABEL[v.acquisitionType]}</dt>
            <dd className="num mt-0.5 text-[15px] text-ivory">{formatPrice(v)}</dd>
          </div>
          <div className="bg-ink-900 p-3">
            <dt className="text-[11.5px] text-ivory-400">{revenue ? METRIC_SHORT[revenue.key] : "Revenue"}</dt>
            <dd className="mt-0.5">
              {revenue ? (
                <>
                  <span className="num text-[15px] text-ivory">{metricValue(revenue, v.currency)}</span> <SourceTag source={revenue.source} />
                </>
              ) : (
                <RevenueBadge status={v.revenueStatus} />
              )}
            </dd>
          </div>
          <div className="bg-ink-900 p-3">
            <dt className="text-[11.5px] text-ivory-400">{users ? METRIC_SHORT[users.key] : "Traction"}</dt>
            <dd className="mt-0.5 text-ivory">
              {users ? <span className="num text-[15px]">{metricValue(users, v.currency)}</span> : <span className="text-[13px] text-ivory-300">{v.tractionHeadline ?? "Not disclosed"}</span>}
            </dd>
          </div>
          <div className="bg-ink-900 p-3">
            <dt className="text-[11.5px] text-ivory-400">Team</dt>
            <dd className="num mt-0.5 text-[15px] text-ivory">{v.teamSize} {v.teamSize === 1 ? "person" : "people"}</dd>
          </div>
        </dl>

        {v.arr && (
          <p className="mt-2 text-[12px] text-ivory-400">
            Annualised run rate <span className="num text-ivory-200">{metricValue({ key: "ANNUAL_REVENUE", value: v.arr.value }, v.currency)}</span> · {v.arr.basis}
          </p>
        )}
        {users && v.tractionHeadline && <p className="mt-2 hidden text-[12.5px] text-ivory-300 [@media(min-height:760px)]:block">↗ {v.tractionHeadline}</p>}

        <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
          {v.assetsIncluded.slice(0, 3).map((a) => (
            <span key={a} className="rounded-full border border-ink-700 px-2.5 py-0.5 text-[11.5px] text-ivory-300">
              {a}
            </span>
          ))}
          {v.assetsIncluded.length > 3 && <span className="px-1 text-[11.5px] text-ivory-500">+{v.assetsIncluded.length - 3}</span>}
        </div>
      </div>
    </motion.article>
  );
}

export function SwipeDeck({
  initial,
  query,
  signedIn,
  canSave,
}: {
  initial: VentureTeaser[];
  query: string;
  signedIn: boolean;
  canSave: boolean;
}) {
  const [cards, setCards] = useState(initial);
  const [history, setHistory] = useState<{ v: VentureTeaser; d: Decision }[]>([]);
  const [exhausted, setExhausted] = useState(initial.length === 0);
  const [exitDir, setExitDir] = useState<1 | -1>(1);
  const [authPrompt, setAuthPrompt] = useState(false);
  const seen = useRef(new Set(initial.map((v) => v.id)));
  const loading = useRef(false);
  const [, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const top = cards[0];

  const refill = useCallback(
    async (remaining: VentureTeaser[]) => {
      if (loading.current || exhausted || remaining.length > 3) return;
      loading.current = true;
      try {
        const more = await loadMoreAction(query, [...seen.current]);
        const fresh = more.filter((m) => !seen.current.has(m.id));
        fresh.forEach((m) => seen.current.add(m.id));
        if (fresh.length === 0) setExhausted(true);
        setCards((c) => [...c, ...fresh]);
      } finally {
        loading.current = false;
      }
    },
    [query, exhausted],
  );

  const decide = useCallback(
    (d: Decision) => {
      if (!top) return;
      if (d === "save" && !signedIn) {
        setAuthPrompt(true);
        return;
      }
      if (d === "save" && !canSave) {
        toast("Saving ventures is for buyer accounts.", { tone: "error" });
        return;
      }
      setExitDir(d === "save" ? 1 : -1);
      const rest = cards.slice(1);
      setCards(rest);
      setHistory((h) => [...h.slice(-19), { v: top, d }]);
      void refill(rest);
      if (signedIn) {
        startTransition(async () => {
          const res = d === "save" ? await saveVentureAction(top.id) : await passVentureAction(top.id);
          if (!res.ok) {
            toast(res.message, { tone: "error" });
            setCards((c) => [top, ...c]);
            setHistory((h) => h.filter((x) => x.v.id !== top.id));
          } else if (d === "save") {
            toast(`Saved ${top.alias} to your pipeline`, { action: { label: "View", onClick: () => router.push("/buyer/saved") } });
          }
        });
      }
    },
    [top, cards, signedIn, canSave, refill, toast, router],
  );

  const undo = useCallback(() => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((h) => h.slice(0, -1));
    setCards((c) => [last.v, ...c]);
    if (signedIn) {
      startTransition(async () => {
        const res = await undoInteractionAction(last.v.id);
        if (!res.ok) toast(res.message, { tone: "error" });
      });
    }
  }, [history, signedIn, toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowRight") decide("save");
      else if (e.key === "ArrowLeft") decide("pass");
      else if ((e.key === "ArrowUp" || e.key === "Enter") && top) router.push(`/ventures/${top.slug}`);
      else if (e.key === "z" || e.key === "Backspace") undo();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, undo, top, router]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[min(660px,calc(100svh-13rem))] min-h-[560px] w-full max-w-[420px]" aria-live="polite">
        <AnimatePresence custom={exitDir}>
          {cards.slice(0, 3).map((v, i) => (
            <motion.div
              key={v.id}
              className="absolute inset-0"
              custom={exitDir}
              exit={{ x: exitDir * 520, rotate: exitDir * 14, opacity: 0, transition: { duration: 0.32, ease: [0.2, 0.7, 0.2, 1] } }}
            >
              <SwipeCard v={v} active={i === 0} depth={i} onDecide={decide} />
            </motion.div>
          ))}
        </AnimatePresence>
        {!top && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[24px] border border-dashed border-ink-700 p-8 text-center">
            <div className="serif text-3xl">You’re all caught up</div>
            <p className="mt-2 max-w-xs text-sm text-ivory-400">
              No more ventures match these filters. Widen your filters, browse the full list, or come back when new founders list.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link href="/discover" className="rounded-full border border-ink-600 px-4 py-2 text-sm hover:border-ivory-400">Reset filters</Link>
              <Link href="/ventures" className="rounded-full bg-ivory px-4 py-2 text-sm text-ink-950">Browse all</Link>
              {signedIn && canSave && <Link href="/buyer/history" className="rounded-full px-4 py-2 text-sm text-ivory-300 hover:text-ivory">Review passed</Link>}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-7 flex items-center gap-3 sm:gap-4">
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="grid h-11 w-11 place-items-center rounded-full border border-ink-700 text-ivory-300 transition hover:border-ivory-400 hover:text-ivory disabled:opacity-30"
          aria-label="Undo last decision (Z)"
          title="Undo (Z)"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></svg>
        </button>
        <button
          onClick={() => decide("pass")}
          disabled={!top}
          className="grid h-14 w-14 place-items-center rounded-full border border-ink-600 bg-ink-850 text-ivory transition hover:border-ivory-300 hover:bg-ink-800 active:scale-95 disabled:opacity-30"
          aria-label="Pass (Left arrow)"
          title="Pass (←)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <Link
          href={top ? `/ventures/${top.slug}#request` : "#"}
          aria-disabled={!top}
          className="flex h-11 items-center gap-2 rounded-full border border-ink-700 px-4 text-[13px] text-ivory-200 transition hover:border-ivory-400 hover:text-ivory aria-disabled:pointer-events-none aria-disabled:opacity-30"
          title="Open details / request information (↑)"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M4 5h16v11H8l-4 4z" /></svg>
          Request info
        </Link>
        <button
          onClick={() => decide("save")}
          disabled={!top}
          className="grid h-14 w-14 place-items-center rounded-full bg-lime text-ink-950 transition hover:bg-lime-300 active:scale-95 disabled:opacity-30"
          aria-label="Save — interested (Right arrow)"
          title="Interested (→)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M6 4h12v17l-6-4-6 4z" /></svg>
        </button>
        <Link
          href={top ? `/ventures/${top.slug}` : "#"}
          aria-disabled={!top}
          className="grid h-11 w-11 place-items-center rounded-full border border-ink-700 text-ivory-300 transition hover:border-ivory-400 hover:text-ivory aria-disabled:pointer-events-none aria-disabled:opacity-30"
          aria-label="Open venture details (Up arrow)"
          title="Details (↑)"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M7 17 17 7M8 7h9v9" /></svg>
        </Link>
      </div>
      <p className="mt-4 hidden text-center text-[12px] text-ivory-500 sm:block">
        Keyboard: <kbd className="font-mono">←</kbd> pass · <kbd className="font-mono">→</kbd> save · <kbd className="font-mono">↑</kbd> details · <kbd className="font-mono">Z</kbd> undo. Saving is private and non-binding.
      </p>

      <AnimatePresence>
        {authPrompt && (
          <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAuthPrompt(false)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-title"
              className="surface w-full max-w-sm p-7"
              initial={{ y: 16, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="auth-title" className="serif text-3xl">Keep this one</h2>
              <p className="mt-2 text-sm text-ivory-300">Create a free buyer account to save ventures. You’ll explore under an alias — founders never see your identity by default.</p>
              <div className="mt-6 flex flex-col gap-2">
                <Link href="/signup?role=buyer" className="grid h-11 place-items-center rounded-full bg-lime text-sm font-medium text-ink-950">Create buyer account</Link>
                <Link href="/login?next=/discover" className="grid h-11 place-items-center rounded-full border border-ink-600 text-sm">Sign in</Link>
                <button onClick={() => setAuthPrompt(false)} className="mt-1 text-sm text-ivory-400 hover:text-ivory">Keep browsing</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

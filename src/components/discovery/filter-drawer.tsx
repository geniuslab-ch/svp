"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";

export function FilterDrawer({ children, label = "Filters", count = 0 }: { children: ReactNode; label?: string; count?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-ink-700 px-3.5 text-[13px] text-ivory-200 hover:border-ivory-400"
        aria-haspopup="dialog"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M4 6h16M7 12h10M10 18h4" /></svg>
        {label}
        {count > 0 && <span className="num rounded-full bg-lime px-1.5 text-[11px] font-semibold text-ink-950">{count}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[80] bg-ink-950/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              className="absolute bottom-0 right-0 top-0 w-full max-w-sm overflow-y-auto border-l border-ink-700 bg-ink-900 p-6"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-full p-2 text-ivory-400 hover:bg-ink-800 hover:text-ivory" aria-label="Close filters">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
              {children}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Toast = { id: number; text: string; tone: "ok" | "error"; action?: { label: string; onClick: () => void } };
type Push = (text: string, opts?: { tone?: "ok" | "error"; action?: Toast["action"] }) => void;

const Ctx = createContext<Push>(() => undefined);
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback<Push>((text, opts) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, tone: opts?.tone ?? "ok", action: opts?.action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="pointer-events-auto flex items-center gap-4 rounded-full border border-ink-600 bg-ink-800/95 py-2 pl-4 pr-2 text-sm shadow-lift backdrop-blur"
            >
              <span className={t.tone === "ok" ? "h-1.5 w-1.5 rounded-full bg-lime" : "h-1.5 w-1.5 rounded-full bg-clay"} />
              <span className="text-ivory-100">{t.text}</span>
              {t.action ? (
                <button onClick={t.action.onClick} className="rounded-full bg-ink-700 px-3 py-1 text-[13px] font-medium text-ivory hover:bg-ink-600">
                  {t.action.label}
                </button>
              ) : (
                <span className="w-2" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

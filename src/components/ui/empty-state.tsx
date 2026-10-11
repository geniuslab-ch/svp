import type { ReactNode } from "react";

export function EmptyState({ title, body, action, icon }: { title: string; body?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-ink-700 px-6 py-16 text-center">
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-full border border-ink-700 text-ivory-400">
        {icon ?? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12h8M12 8v8" />
          </svg>
        )}
      </div>
      <h3 className="serif text-2xl">{title}</h3>
      {body && <p className="mt-2 max-w-md text-sm text-ivory-300">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

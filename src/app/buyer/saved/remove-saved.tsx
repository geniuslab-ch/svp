"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { undoInteractionAction } from "@/app/actions/discovery";
import { useToast } from "@/components/ui/toast";

export function RemoveSaved({ id, label = "Remove" }: { id: string; label?: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await undoInteractionAction(id);
          if (r.ok) {
            toast(label === "Restore" ? "Restored to your discovery queue" : "Removed");
            router.refresh();
          } else toast(r.message, { tone: "error" });
        })
      }
      className="relative z-10 text-[12.5px] text-ivory-400 hover:text-ivory disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
}

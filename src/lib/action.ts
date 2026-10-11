import "server-only";
import { unstable_rethrow } from "next/navigation";
import { AppError } from "./errors";

export interface ActionState {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Changes on every result so client components can react to repeated submissions. */
  at?: number;
}

/** Runs a server action body and turns AppErrors into form state. Redirects pass through. */
export async function runAction(fn: () => Promise<string | void>): Promise<ActionState> {
  try {
    const message = await fn();
    return { ok: true, message: message || undefined, at: Date.now() };
  } catch (e) {
    unstable_rethrow(e);
    if (e instanceof AppError) return { ok: false, message: e.message, fieldErrors: e.fieldErrors, at: Date.now() };
    console.error("[action] unexpected error", e);
    return { ok: false, message: "Something went wrong on our side. Please try again.", at: Date.now() };
  }
}

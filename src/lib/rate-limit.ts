import { db } from "./db";
import { AppError } from "./errors";

/**
 * Fixed-window rate limiter stored in Postgres, so it holds across instances and restarts.
 * Throws AppError("RATE_LIMITED") once `limit` hits occur within `windowSeconds`.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<void> {
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000);
  const row = await db.$transaction(async (tx) => {
    const existing = await tx.rateLimit.findUnique({ where: { key } });
    if (!existing || existing.windowStart.getTime() !== windowStart.getTime()) {
      return tx.rateLimit.upsert({
        where: { key },
        create: { key, windowStart, count: 1 },
        update: { windowStart, count: 1 },
      });
    }
    return tx.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  });
  if (row.count > limit) {
    throw new AppError("RATE_LIMITED", "Too many attempts. Please wait a moment and try again.");
  }
}

import "server-only";
import { NextResponse } from "next/server";
import { AppError, httpStatus } from "./errors";
import { deliverObject } from "./storage";

export function errorResponse(e: unknown) {
  if (e instanceof AppError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] });
  console.error("[api] unexpected error", e);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}

/** Streams or redirects to a private object. Call only after authorization succeeded. */
export async function documentResponse(key: string, filename: string, mimeType: string) {
  const delivery = await deliverObject(key);
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  };
  if (delivery.kind === "redirect") return NextResponse.redirect(delivery.url, { status: 302, headers });
  const safe = filename.replace(/[^\w.\- ]+/g, "_");
  return new NextResponse(new Uint8Array(delivery.data), {
    headers: {
      ...headers,
      "Content-Type": mimeType,
      // PDFs and images open inline; everything else downloads. CSP sandbox blocks script execution.
      "Content-Disposition": `${mimeType === "application/pdf" || mimeType.startsWith("image/") ? "inline" : "attachment"}; filename="${safe}"`,
      "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
    },
  });
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-start justify-center py-20">
      <div className="eyebrow">Something went wrong</div>
      <h1 className="serif mt-4 text-display-lg">A plot twist we didn’t plan.</h1>
      <p className="mt-4 max-w-md text-ivory-300">An unexpected error occurred. Nothing you did was lost on our side. Try again, or come back in a moment.</p>
      {error.digest && <p className="mt-2 font-mono text-[12px] text-ivory-500">Reference: {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className="inline-flex h-10 items-center rounded-full border border-ink-600 px-5 text-sm">Home</Link>
      </div>
    </div>
  );
}

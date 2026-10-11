"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#0A0A09", color: "#F1ECE2", fontFamily: "system-ui", padding: 48 }}>
        <h1 style={{ fontSize: 32 }}>Something went wrong.</h1>
        <p>Please try again.</p>
        <button onClick={reset} style={{ marginTop: 16, padding: "8px 18px", borderRadius: 999, background: "#C8F04B", border: 0 }}>Try again</button>
      </body>
    </html>
  );
}

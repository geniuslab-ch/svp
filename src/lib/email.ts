import { env } from "./env";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

/**
 * Email transport. "console" prints messages to the server log (development / private demos);
 * "resend" uses the Resend HTTP API (free tier). Failures are logged, never thrown, so that a
 * mail outage cannot leak whether an account exists.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  if (env.emailDriver === "resend" && process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: [message.to],
          subject: message.subject,
          text: message.text,
        }),
      });
      if (!res.ok) console.error("[email] Resend error", res.status, await res.text());
    } catch (err) {
      console.error("[email] Resend request failed", err);
    }
    return;
  }
  if (process.env.NODE_ENV === "test") return;
  console.info(`\n[email:console] To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n`);
}

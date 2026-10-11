import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { confirmEmailAction } from "@/app/actions/auth";
import { Button, ButtonLink } from "@/components/ui/button";
import { ResendVerification } from "@/components/resend-verification";

export const metadata = { title: "Confirm email" };

/**
 * The link in the email opens this page; confirmation happens on an explicit POST so that
 * mail scanners and link prefetchers cannot consume the single-use token.
 */
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string; done?: string; failed?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const home = user?.role === "FOUNDER" ? "/founder" : user?.role === "ADMIN" ? "/admin" : "/discover";
  return (
    <div className="surface p-7 sm:p-9">
      {sp.done ? (
        <>
          <div className="eyebrow text-lime">Level 1 complete</div>
          <h1 className="serif mt-2 text-4xl">Email confirmed</h1>
          <p className="mt-3 text-sm text-ivory-300">Thank you. You can now contact founders, publish listings and continue verification.</p>
          <ButtonLink href={user ? home : "/login"} className="mt-7">Continue</ButtonLink>
        </>
      ) : sp.token ? (
        <>
          <h1 className="serif text-4xl">Confirm your email</h1>
          <p className="mt-3 text-sm text-ivory-300">One click to confirm this address belongs to you.</p>
          <form action={confirmEmailAction} className="mt-7">
            <input type="hidden" name="token" value={sp.token} />
            <Button size="lg">Confirm my email</Button>
          </form>
        </>
      ) : sp.failed ? (
        <>
          <h1 className="serif text-4xl">Link expired</h1>
          <p className="mt-3 text-sm text-ivory-300">This confirmation link is invalid or was already used.</p>
          <div className="mt-6">{user ? <ResendVerification /> : <Link className="link" href="/login">Sign in to request a new link</Link>}</div>
        </>
      ) : (
        <>
          <h1 className="serif text-4xl">Check your inbox</h1>
          <p className="mt-3 text-sm text-ivory-300">We sent a confirmation link to {user?.email ?? "your email address"}. It expires in 24 hours.</p>
          <div className="mt-6">{user && !user.emailVerifiedAt ? <ResendVerification /> : user ? <ButtonLink href={home}>Continue</ButtonLink> : null}</div>
        </>
      )}
    </div>
  );
}

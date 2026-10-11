import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const sp = await searchParams;
  if (await getCurrentUser()) redirect(sp.next?.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/");
  return (
    <div className="surface p-7 sm:p-9">
      <h1 className="serif text-4xl">Welcome back</h1>
      <p className="mt-2 text-sm text-ivory-400">
        New here? <Link className="link" href={`/signup${sp.next ? `?next=${encodeURIComponent(sp.next)}` : ""}`}>Create an account</Link>
      </p>
      {sp.reset && <p className="mt-5 rounded-xl border border-lime/30 bg-lime/10 px-4 py-3 text-sm text-lime">Password updated. Sign in with your new password.</p>}
      <LoginForm next={sp.next} />
      {env.demoMode && (
        <div className="mt-8 rounded-xl border border-dashed border-ink-600 p-4 text-[13px] text-ivory-300">
          <div className="eyebrow mb-2">Demo accounts · password <span className="text-ivory">demo-password-1</span></div>
          <ul className="space-y-1 font-mono text-[12.5px]">
            <li>founder@demo.sequel.test — founder</li>
            <li>buyer@demo.sequel.test — buyer</li>
            <li>admin@demo.sequel.test — administrator</li>
          </ul>
          <p className="mt-2 text-[12px] text-ivory-500">Shown because DEMO_MODE is enabled. Disable it before inviting real users.</p>
        </div>
      )}
    </div>
  );
}

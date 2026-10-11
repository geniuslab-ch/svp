import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Create an account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  if (await getCurrentUser()) redirect("/");
  const { role } = await searchParams;
  return (
    <div className="surface p-7 sm:p-9">
      <h1 className="serif text-4xl">Join the marketplace</h1>
      <p className="mt-2 text-sm text-ivory-400">
        Already a member? <Link className="link" href="/login">Sign in</Link>
      </p>
      <SignupForm defaultRole={role === "founder" ? "FOUNDER" : role === "buyer" ? "BUYER" : undefined} />
    </div>
  );
}

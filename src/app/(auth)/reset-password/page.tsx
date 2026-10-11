import { ResetForm } from "./reset-form";

export const metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="surface p-7 sm:p-9">
      <h1 className="serif text-4xl">Choose a new password</h1>
      <p className="mt-2 text-sm text-ivory-400">For your security, all existing sessions will be signed out.</p>
      <ResetForm token={token ?? ""} />
    </div>
  );
}

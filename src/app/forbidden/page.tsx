import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Not available" };

export default function Forbidden() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-start justify-center py-20">
      <div className="eyebrow">403</div>
      <h1 className="serif mt-4 text-display-lg">Not for this account.</h1>
      <p className="mt-4 max-w-md text-ivory-300">This area belongs to a different account type. Founder, buyer and administrator areas are kept separate.</p>
      <ButtonLink href="/" className="mt-8">Back home</ButtonLink>
    </div>
  );
}

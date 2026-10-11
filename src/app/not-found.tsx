import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-start justify-center py-20">
      <div className="eyebrow">404</div>
      <h1 className="serif mt-4 text-display-lg">This chapter isn’t written yet.</h1>
      <p className="mt-4 max-w-md text-ivory-300">The page doesn’t exist, or you don’t have access to it. Confidential listings and data rooms only appear to approved members.</p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/discover">Explore ventures</ButtonLink>
        <ButtonLink href="/" variant="outline">Home</ButtonLink>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getOwnedVenture, getVentureForViewer } from "@/lib/services/ventures";
import { publishReadiness, WIZARD_STEPS } from "@/lib/services/listings";
import { AppError } from "@/lib/errors";
import { DocumentsStep, PublishStep, StepContent } from "@/components/wizard/wizard-steps";
import { VentureCard } from "@/components/venture/venture-card";
import { WizardHeader } from "../../../wizard-header";

export const metadata = { title: "Edit listing" };

export default async function EditVenturePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ step?: string }> }) {
  const user = await requireRole(["FOUNDER"]);
  const { id } = await params;
  const sp = await searchParams;
  let v;
  try {
    v = await getOwnedVenture(id, user);
  } catch (e) {
    if (e instanceof AppError) notFound();
    throw e;
  }
  if (v.founderId !== user.id || v.status === "REMOVED" || v.status === "SOLD") notFound();
  const step = Math.min(11, Math.max(1, Number(sp.step) || 1));
  const title = WIZARD_STEPS[step - 1].title;
  const preview = step === 11 ? (await getVentureForViewer(v.id, user)).venture : null;

  return (
    <div>
      <WizardHeader step={step} title={title} ventureId={v.id} maxStep={v.wizardStep} alias={v.alias} />
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="surface p-6 sm:p-8">
          {step === 9 ? <DocumentsStep v={v} /> : step === 11 ? <PublishStep v={v} missing={publishReadiness(v, user)} /> : <StepContent v={v} step={step} />}
        </div>
        {preview && (
          <div>
            <div className="eyebrow mb-3">Public teaser preview</div>
            <VentureCard v={preview} />
            <p className="mt-3 text-[12px] text-ivory-500">This is everything a visitor sees. Approved-buyer information and documents stay hidden until you approve a request.</p>
          </div>
        )}
      </div>
    </div>
  );
}

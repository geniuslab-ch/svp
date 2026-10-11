import { NewVentureForm } from "@/components/wizard/wizard-steps";
import { WizardHeader } from "../../wizard-header";

export const metadata = { title: "New listing" };

export default function NewVenturePage() {
  return (
    <div>
      <WizardHeader step={1} title="Identity & category" />
      <div className="surface mt-6 p-6 sm:p-8">
        <NewVentureForm />
      </div>
    </div>
  );
}

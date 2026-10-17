import { Suspense } from "react";
import { PhoneAddPlan } from "@/components/phone14/crm-forms";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PhoneAddPlan />
    </Suspense>
  );
}

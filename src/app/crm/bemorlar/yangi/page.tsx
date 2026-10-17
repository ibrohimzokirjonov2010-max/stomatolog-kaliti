import { Suspense } from "react";
import { PhoneAddPatient } from "@/components/phone14/crm-forms";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PhoneAddPatient />
    </Suspense>
  );
}

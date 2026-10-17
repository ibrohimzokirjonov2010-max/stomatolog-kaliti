import { Suspense } from "react";
import { PhoneAddAppointment } from "@/components/phone14/crm-forms";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PhoneAddAppointment />
    </Suspense>
  );
}

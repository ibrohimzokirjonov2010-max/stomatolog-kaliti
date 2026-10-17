import { Suspense } from "react";
import { PhoneAddPayment } from "@/components/phone14/crm-forms";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PhoneAddPayment />
    </Suspense>
  );
}

import { Suspense } from "react";
import { LabOrdersPage } from "@/components/lab-orders";

export default function Page() {
  return (
    <Suspense>
      <LabOrdersPage />
    </Suspense>
  );
}

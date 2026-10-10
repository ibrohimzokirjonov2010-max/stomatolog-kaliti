import { Suspense } from "react";
import { JobsMinePage } from "@/components/jobs-mine";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <JobsMinePage />
    </Suspense>
  );
}

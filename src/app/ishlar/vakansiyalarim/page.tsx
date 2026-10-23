import { Suspense } from "react";
import { JobsMinePage } from "@/components/jobs-mine";
import { VakansiyalarimMobile } from "@/components/jobs/mobile/VakansiyalarimMobile";

export default function Page() {
  return (
    <>
      <VakansiyalarimMobile />
      <div className="hidden lg:block">
        <Suspense fallback={null}>
          <JobsMinePage />
        </Suspense>
      </div>
    </>
  );
}

import { Suspense } from "react";
import { JobApplicationsPage } from "@/components/job-applications";
import { ArizalarimMobile } from "@/components/jobs/mobile/ArizalarimMobile";

export default function Page() {
  return (
    <>
      <ArizalarimMobile />
      <div className="hidden lg:block">
        <Suspense fallback={null}><JobApplicationsPage /></Suspense>
      </div>
    </>
  );
}

import { Suspense } from "react";
import { JobApplicationsPage } from "@/components/job-applications";

export default function Page() {
  return <Suspense fallback={null}><JobApplicationsPage /></Suspense>;
}

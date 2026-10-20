"use client";

import { Suspense } from "react";
import { JobForm } from "@/components/add-forms/JobForm";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#6b7590]">Yuklanmoqda…</p>}>
      <JobForm />
    </Suspense>
  );
}

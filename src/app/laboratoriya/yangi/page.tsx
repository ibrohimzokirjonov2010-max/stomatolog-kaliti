"use client";

import { Suspense } from "react";
import { LabForm } from "@/components/add-forms/LabForm";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#6b7590]">Yuklanmoqda…</p>}>
      <LabForm />
    </Suspense>
  );
}

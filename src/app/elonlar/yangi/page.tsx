"use client";

import { Suspense } from "react";
import { ElonForm } from "@/components/add-forms/ElonForm";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#6b7590]">Yuklanmoqda…</p>}>
      <ElonForm />
    </Suspense>
  );
}

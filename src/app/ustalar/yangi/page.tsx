"use client";

import { Suspense } from "react";
import { UstaForm } from "@/components/add-forms/UstaForm";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#6b7590]">Yuklanmoqda…</p>}>
      <UstaForm />
    </Suspense>
  );
}

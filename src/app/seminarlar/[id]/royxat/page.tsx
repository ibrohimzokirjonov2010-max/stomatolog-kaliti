"use client";

import { useParams } from "next/navigation";
import { SeminarRegisterFlow } from "@/components/seminars/mobile/SeminarRegisterFlow";

export default function SeminarRegisterPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? decodeURIComponent(params.id) : "";
  return <SeminarRegisterFlow id={id} />;
}

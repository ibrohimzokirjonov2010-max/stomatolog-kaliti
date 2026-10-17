"use client";

import { useParams } from "next/navigation";
import { PhonePatientProfile } from "@/components/phone14/patient-profile";

export default function PatientProfilePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? decodeURIComponent(params.id) : "";
  return <PhonePatientProfile id={id} />;
}

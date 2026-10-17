"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { buildPatients, patientStatuses } from "@/data/crm";
import { useStoredList } from "@/lib/stored-list";

export default function PatientProfilePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? decodeURIComponent(params.id) : "";
  const [items] = useStoredList("sk-crm-patients-v1", buildPatients());
  const patient = items.find((item) => item.id === id);

  if (!patient) {
    return (
      <section className="px-1 py-4 lg:hidden">
        <p>Bemor topilmadi</p>
        <Link href="/crm/bemorlar">Bemorlar</Link>
      </section>
    );
  }

  const status = patientStatuses.find((item) => item.id === patient.status)?.label;
  return (
    <section className="space-y-2 px-1 py-3 lg:hidden" data-testid="patient-profile-phone">
      <Link href="/crm/bemorlar" className="text-[13px] font-bold text-[#0F8A8A]">← Bemorlar</Link>
      <h1 className="text-[22px] font-extrabold text-[#0f1e3d]">{patient.name}</h1>
      <p className="text-[13px] text-[#6a7c93]">{patient.age} yosh · {patient.gender} · {status}</p>
      <p className="text-[14px]">{patient.phone}</p>
      <p className="text-[14px]">{patient.city}</p>
      <p className="text-[14px]">{patient.email}</p>
    </section>
  );
}

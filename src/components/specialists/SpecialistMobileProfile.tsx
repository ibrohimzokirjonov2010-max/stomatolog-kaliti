"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchSpecialists, type PublicSpecialist } from "@/lib/specialists-public";

export function SpecialistMobileProfile({ id }: { id: string }) {
  const [person, setPerson] = useState<PublicSpecialist | null | undefined>(undefined);
  useEffect(() => {
    let stop = false;
    void fetchSpecialists().then((rows) => {
      if (!stop) setPerson(rows.find((item) => item.id === id) ?? null);
    });
    return () => {
      stop = true;
    };
  }, [id]);

  if (person === undefined) return <p className="p-4 text-sm text-[#5b6b82]">Yuklanmoqda...</p>;
  if (!person) {
    return (
      <div className="p-4">
        <p>Mutaxassis topilmadi</p>
        <Link href="/mutaxassislar" className="text-[13px] font-semibold text-[#0066ff]">Orqaga</Link>
      </div>
    );
  }
  return (
    <article className="space-y-2 p-1" data-testid="spec-mobile-profile">
      <Link href="/mutaxassislar" className="text-[13px] font-semibold text-[#0066ff]">Mutaxassislar</Link>
      <h1 className="text-[22px] font-extrabold text-[#0f1e3d]">{person.name}</h1>
      <p className="text-[14px] text-[#5b6b82]">{person.specialty}{person.city ? ` · ${person.city}` : ""}</p>
      {person.clinic ? <p className="text-[14px] text-[#0f1e3d]">{person.clinic}</p> : null}
      {person.about ? <p className="text-[14px] text-[#5b6b82]">{person.about}</p> : null}
      {person.kind === "usta" ? <Link href={person.href} className="inline-flex text-[14px] font-semibold text-[#0066ff]">Usta profili</Link> : null}
    </article>
  );
}

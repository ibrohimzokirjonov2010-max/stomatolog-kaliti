"use client";

import Link from "next/link";
import { specialists, getSpecialist } from "@/data/desktop-specialists";

/** Simple phone list. The desktop page is the lg overlay. */
export function MutaxassislarMobile({ id }: { id?: string }) {
  if (id) {
    const person = getSpecialist(id);
    if (!person) {
      return (
        <div className="lg:hidden p-4">
          <p>Mutaxassis topilmadi</p>
          <Link href="/mutaxassislar">Orqaga</Link>
        </div>
      );
    }
    return (
      <article className="lg:hidden space-y-2 p-1" data-testid="spec-mobile-profile">
        <Link href="/mutaxassislar" className="text-[13px] font-semibold text-[#0066ff]">
          Mutaxassislar
        </Link>
        <h1 className="text-[22px] font-extrabold text-[#0f1e3d]">{person.name}</h1>
        <p className="text-[14px] text-[#5b6b82]">
          {person.specialtyLabel} · {person.city}
        </p>
        <p className="text-[14px] text-[#0f1e3d]">
          {person.rating} ({person.reviews} ta sharh) · {person.experience}
        </p>
        <p className="text-[14px] text-[#5b6b82]">{person.clinic}</p>
      </article>
    );
  }

  return (
    <div className="lg:hidden space-y-3" data-testid="spec-mobile">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-[#0f1e3d]">Mutaxassislar</h1>
        <p className="text-[13px] text-[#6a7c93]">Tajribali stomatolog mutaxassislar bilan bog‘laning</p>
      </div>
      <div className="space-y-2">
        {specialists.map((person) => (
          <Link key={person.id} href={`/mutaxassislar/${person.id}`} className="block rounded-xl border border-[#e6edf5] bg-white p-3">
            <b className="block text-[15px] text-[#0f1e3d]">{person.name}</b>
            <span className="text-[13px] text-[#5b6b82]">
              {person.specialtyLabel} · {person.city} · {person.rating}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

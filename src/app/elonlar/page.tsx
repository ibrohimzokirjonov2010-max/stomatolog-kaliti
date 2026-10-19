"use client";

import Link from "next/link";
import type { Listing } from "@/data/listings";
import { useStoredList } from "@/lib/stored-list";

export default function Page() {
  const [items] = useStoredList("sk-elonlar-v1", [] as Listing[]);
  return (
    <section className="px-4 py-6 lg:hidden" data-testid="listings-mobile">
      <h1 className="text-[22px] font-extrabold text-[#0f1e3d]">E‘lonlar</h1>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-[#6b7590]">Hozircha e’lon yo‘q.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-[#e6edf5] bg-white px-3 py-2">
              <Link href={`/elonlar/${item.id}`} className="font-semibold text-[#0f1e3d]">{item.title}</Link>
              <p className="text-[12px] text-[#6b7590]">{item.city}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

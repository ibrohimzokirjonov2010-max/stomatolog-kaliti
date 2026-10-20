"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Listing } from "@/data/listings";
import { classifiedToListing, type ClassifiedRow } from "@/lib/classified-view";
import { useStoredList } from "@/lib/stored-list";

export default function Page() {
  const [extra] = useStoredList("sk-elonlar-v1", [] as Listing[]);
  const [remote, setRemote] = useState<Listing[]>([]);
  useEffect(() => {
    let cancel = false;
    void fetch("/api/work/classifieds").then(async (res) => {
      const data = await res.json().catch(() => null) as { items?: ClassifiedRow[] } | null;
      if (!cancel && Array.isArray(data?.items)) setRemote(data.items.map(classifiedToListing));
    }).catch(() => undefined);
    return () => { cancel = true; };
  }, []);
  const items = [...remote, ...extra.filter((item) => !remote.some((row) => row.id === item.id))];
  return (
    <section className="px-4 py-6 lg:hidden" data-testid="listings-mobile">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[22px] font-extrabold text-[#0f1e3d]">E‘lonlar</h1>
        <Link href="/elonlar/yangi" className="inline-flex h-10 items-center rounded-xl bg-[#0066FF] px-3 text-[13px] font-semibold text-white">Yangi e‘lon</Link>
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-[#6b7590]">Hozircha e’lon yo‘q.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-[#e6edf5] bg-white px-3 py-2">
              <Link href={`/elonlar/${item.id}`} className="font-semibold text-[#0f1e3d]">{item.title}</Link>
              <p className="text-[12px] text-[#6b7590]">{item.city}{item.priceLabel ? ` · ${item.priceLabel}` : ""}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

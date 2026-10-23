"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useFavorites } from "@/components/favorites-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { catalogHref, fetchCatalogProducts, type CatalogCard } from "@/lib/catalog-client";
import { useSavedPlaces } from "@/lib/saved-addresses";
import { formatMoney } from "@/lib/format";

function Shell({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-[24px] font-bold text-[#0B1F4D]">{title}</h1>
      <p className="mt-1 text-[14px] text-[#6b7280]">{text}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: string }) {
  return <p className="rounded-2xl border border-[#eceff5] bg-white px-4 py-8 text-center text-[14px] text-[#6b7280]">{children}</p>;
}

export function NotificationsPage() {
  const [items, setItems] = useState<{ id: number; title: string; body?: string; createdAt?: string; readAt?: string | null }[]>([]);
  const [auth, setAuth] = useState<boolean | null>(null);

  useEffect(() => {
    let stop = false;
    void fetch("/api/notifications", { cache: "no-store", credentials: "same-origin" })
      .then((res) => res.json())
      .then((json: { auth?: boolean; items?: typeof items }) => {
        if (stop) return;
        setAuth(json.auth !== false);
        setItems(Array.isArray(json.items) ? json.items : []);
      })
      .catch(() => {
        if (!stop) setAuth(false);
      });
    return () => {
      stop = true;
    };
  }, []);

  return (
    <Shell title="Bildirishnomalar" text="Hisobingizga kelgan xabarlar.">
      {auth === false ? <Empty>Bildirishnomalarni ko‘rish uchun kiring.</Empty> : null}
      {auth && items.length === 0 ? <Empty>Hozircha bildirishnoma yo‘q.</Empty> : null}
      {items.length ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-[#eceff5] bg-white px-4 py-3">
              <b className="block text-[14px] text-[#1a1d26]">{item.title}</b>
              {item.body ? <p className="mt-1 text-[13px] text-[#6b7280]">{item.body}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </Shell>
  );
}

export function SavedPage() {
  const favorites = useFavorites();
  const [cards, setCards] = useState<CatalogCard[]>([]);

  useEffect(() => {
    let stop = false;
    void fetchCatalogProducts().then((rows) => {
      if (!stop) setCards(rows);
    });
    return () => {
      stop = true;
    };
  }, []);

  const saved = favorites.ids.map((id) => cards.find((card) => card.id === id) ?? null);

  return (
    <Shell title="Saqlanganlar" text="Yurakcha bosilgan mahsulotlar shu qurilmada saqlanadi.">
      {favorites.ids.length === 0 ? <Empty>Hozircha saqlangan mahsulot yo‘q.</Empty> : null}
      {favorites.ids.length ? (
        <ul className="space-y-2">
          {favorites.ids.map((id, index) => {
            const card = saved[index];
            const kind = id.startsWith("elon:") ? "elon" : id.startsWith("post:") ? "post" : id.startsWith("spec:") ? "spec" : id.startsWith("news:") ? "news" : null;
            const href = kind === "elon" ? `/elonlar/${id.slice(5)}` : kind === "post" ? `/community/${id.slice(5)}` : kind === "spec" ? `/mutaxassislar/${id.slice(5)}` : kind === "news" ? `/yangiliklar/${id.slice(5)}` : card ? catalogHref(card.category, card.id) : `/marketplace/${id}`;
            return (
              <li key={id}>
                <Link href={href} className="flex items-center gap-3 rounded-2xl border border-[#eceff5] bg-white px-4 py-3">
                  {card?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- catalog photo
                    <img src={card.image} alt="" className="size-12 rounded-lg object-contain bg-[#f4f7fc]" />
                  ) : <span className="size-12 rounded-lg bg-[#f4f7fc]" />}
                  <span>
                    <b className="block text-[14px] text-[#1a1d26]">{card?.name ?? (kind === "elon" ? "E’lon" : kind === "post" ? "Hamjamiyat posti" : kind === "spec" ? "Mutaxassis" : kind === "news" ? "Yangilik" : "Mahsulot")}</b>
                    {card ? <span className="text-[13px] text-[#0066FF]">{formatMoney(card.price, "UZS")}</span> : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </Shell>
  );
}

export function AddressesPage() {
  const { profile, ready } = useDoctorProfile();
  const { places, loaded } = useSavedPlaces(Boolean(profile), ready);

  return (
    <Shell title="Manzillar" text="Yetkazish uchun saqlangan manzillar.">
      {!loaded ? <Empty>Yuklanmoqda…</Empty> : null}
      {loaded && places.length === 0 ? <Empty>Hozircha saqlangan manzil yo‘q. Buyurtma berishda manzil yoziladi.</Empty> : null}
      {places.length ? (
        <ul className="space-y-2">
          {places.map((place) => (
            <li key={place.id} className="rounded-2xl border border-[#eceff5] bg-white px-4 py-3">
              <b className="block text-[14px]">{place.label}</b>
              <p className="mt-1 text-[13px] text-[#6b7280]">{[place.city, place.district, place.address].filter(Boolean).join(", ")}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </Shell>
  );
}

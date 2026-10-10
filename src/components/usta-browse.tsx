"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Award,
  BadgeCheck,
  ChevronRight,
  ClipboardList,
  MapPin,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  X,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ContactSheet } from "@/components/usta-contact";
import { UstaMobileList } from "@/components/usta-mobile-list";
import { UstalarMobileHero } from "@/components/ustalar-mobile-hero";
import { useUstaWork } from "@/components/usta-provider";
import {
  masterCities,
  mobileServiceChips,
  serviceFilters,
  serviceLabels,
  serviceShortLabels,
  type Master,
  type UstaService,
} from "@/data/masters";
import { cn } from "@/lib/utils";

export function UstaBrowse() {
  const params = useSearchParams();
  const router = useRouter();
  const qParam = (params.get("q") ?? "").trim();
  const [query, setQuery] = useState(qParam);
  const [services, setServices] = useState<UstaService[]>([]);
  const [city, setCity] = useState("");
  const [contact, setContact] = useState<Master | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { masters } = useUstaWork();

  const q = (query || qParam).trim().toLowerCase();
  const chip = services.length === 1 ? services[0] : services.length === 0 ? "all" : "mixed";
  const filterBadge =
    (city ? 1 : 0) + (services.length > 1 ? 1 : 0);

  const visible = useMemo(() => {
    return masters.filter((master) => {
      const matchesService =
        services.length === 0 || services.some((s) => master.services.includes(s));
      const matchesCity = !city || master.city === city;
      const haystack = [
        master.name,
        master.title,
        master.city,
        ...master.services.map((id) => serviceLabels[id]),
      ]
        .join(" ")
        .toLowerCase();
      const matchesQ = !q || haystack.includes(q);
      return matchesService && matchesCity && matchesQ;
    });
  }, [city, masters, q, services]);

  const list = visible;
  const empty = visible.length === 0;

  function toggleService(id: UstaService) {
    setServices((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function selectChip(id: "all" | UstaService) {
    setServices(id === "all" ? [] : [id]);
  }

  function clear() {
    setServices([]);
    setCity("");
    setQuery("");
    if (qParam) router.replace("/ustalar", { scroll: false });
  }

  return (
    <div>
      {/* ════════════════════════════════════════════════
          MOBILE LAYOUT (≤768px phone / lg shell)
          ════════════════════════════════════════════════ */}
      <div className="lg:hidden">
        <UstaMobileList />
      </div>

      {/* ════════════════════════════════════════════════
          DESKTOP LAYOUT
          ════════════════════════════════════════════════ */}
      <div className="hidden lg:block">
        {/* Same promo slider as on phones (shared PromoSlider). */}
        <UstalarMobileHero
          onPick={(cat) => {
            setServices([cat]);
            document.getElementById("usta-desktop-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
        <div className="mb-4 flex items-start justify-between gap-4">
          <header>
            <h1 className="text-[26px] font-bold tracking-tight text-[#1a1d26]">Ustalar</h1>
            <p className="mt-1 text-sm text-[#8b93a7]">
              rentgen, stomatolog kreslosi, klinika jihozlari — o‘rnatish, sozlash, ta’mirlash.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <Link href="/ustalar/sorovlarim" className="inline-block text-[13px] font-semibold text-primary">
                Mening so‘rovlarim
              </Link>
              <Link href="/ustalar/mening" className="inline-block text-[13px] font-semibold text-primary">
                Usta sifatida e’lon berish
              </Link>
            </div>
          </header>
          <button type="button" onClick={clear} className="text-sm font-medium text-primary hover:underline">
            Filtrlarni tozalash
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[#4b5568]">Xizmat turi</span>
          <button
            type="button"
            onClick={() => setServices([])}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium",
              services.length === 0
                ? "bg-primary text-white"
                : "border border-[#e6eaf2] bg-white text-[#4b5568] hover:bg-slate-50"
            )}
          >
            Barcha xizmatlar
          </button>
          {serviceFilters.map((item) => {
            const on = services.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleService(item.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium",
                  on
                    ? "bg-primary text-white"
                    : "border border-[#e6eaf2] bg-white text-[#4b5568] hover:bg-slate-50"
                )}
              >
                {item.label}
                {on ? <X className="size-3.5" /> : null}
              </button>
            );
          })}
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="ml-auto h-9 rounded-full border border-[#e6eaf2] bg-white px-3 text-sm text-[#4b5568]"
          >
            <option value="">Shahar</option>
            {masterCities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <h2 id="usta-desktop-list" className="scroll-mt-20 mt-5 mb-3 text-[16px] font-semibold text-[#1a1d26]">
          Barcha ustalar va kompaniyalar
          <span className="ml-2 text-[13px] font-medium text-[#8b93a7]">{visible.length} ta</span>
        </h2>

        {empty ? (
          !masters.length ? <NoMasters /> : (
          <div className="rounded-[14px] border border-[#eceff5] bg-white px-6 py-16 text-center text-[#8b93a7]">
            Bu filtrlar bo‘yicha usta yo‘q. Filtrlarni tozalang.
          </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {list.map((master) => (
              <MasterCard key={master.id} master={master} onContact={() => setContact(master)} />
            ))}
          </div>
        )}

        <ul className="mt-6 grid grid-cols-1 gap-3 rounded-[14px] border border-[#eceff5] bg-white px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
          <Trust icon={BadgeCheck} title="Moderatsiya" text="Har bir profil admin tekshiruvidan o‘tadi" />
          <Trust icon={ShieldCheck} title="Telefon himoyalangan" text="Usta so‘rovni qabul qilgach ochiladi" />
          <Trust icon={Truck} title="Aniq so‘rov" text="Klinika, manzil va vaqtni ko‘rsatasiz" />
          <Trust icon={Award} title="Bildirishnoma" text="Javob kelganda xabar olasiz" />
        </ul>
      </div>

      {filtersOpen ? (
        <FilterSheet
          title="Filtrlar"
          onClose={() => setFiltersOpen(false)}
          onClear={() => {
            setCity("");
          }}
        >
          <section>
            <p className="mb-2 text-sm font-semibold text-[#1a1d26]">Shahar</p>
            <div className="grid grid-cols-2 gap-2">
              <FilterChip active={!city} onClick={() => setCity("")} label="Barchasi" />
              {masterCities.map((item) => (
                <FilterChip
                  key={item}
                  active={city === item}
                  onClick={() => setCity(item)}
                  label={item}
                />
              ))}
            </div>
          </section>
        </FilterSheet>
      ) : null}

      {contact ? <div className="hidden lg:block"><ContactSheet master={contact} onClose={() => setContact(null)} /></div> : null}
    </div>
  );
}

function MobileMasterCard({ master, onContact }: { master: Master; onContact: () => void }) {
  const specialty =
    master.services
      .filter((id) => id !== "servis")
      .slice(0, 2)
      .map((id) => serviceShortLabels[id])
      .join(" · ") || master.title;

  return (
    <article className="rounded-[18px] border border-[#eceff5] bg-white p-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
      <div className="flex gap-3">
        {master.photo ? (
          <Image
            src={master.photo}
            alt=""
            width={64}
            height={64}
            className="size-16 shrink-0 rounded-full object-cover ring-2 ring-[#eef2f8]"
          />
        ) : (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[#0066FF] ring-2 ring-[#eef2f8]">
            <BadgeCheck className="size-7" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="flex min-w-0 items-center gap-1 text-[15px] font-bold text-[#1a1d26]">
            <span className="truncate">{master.name}</span>
            <BadgeCheck className="size-3.5 shrink-0 fill-[#0066FF] text-white" />
          </h3>
          <p className="mt-0.5 text-[13px] text-[#8b93a7]">
            {specialty}
            <span className="text-[#c5cad6]"> · </span>
            {master.years} yil
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#4b5568]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 text-[#0066FF]" />
              {master.city}
            </span>
            {master.jobs > 0 ? <span className="text-[#8b93a7]">{master.jobs} ta bajarilgan ish</span> : null}
          </p>
        </div>
      </div>
      {master.description ? <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-[#4b5568]">{master.description}</p> : null}
      {master.mine ? (
        <p className="mt-3 rounded-2xl bg-[#f4f6fa] px-3 py-3 text-center text-[13px] font-semibold text-[#8b93a7]">Bu sizning e’loningiz</p>
      ) : (
        <button
          type="button"
          onClick={onContact}
          className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0066FF] text-[14px] font-semibold text-white"
        >
          <Send className="size-4" />
          Xizmat so‘rovi yuborish
        </button>
      )}
    </article>
  );
}

function MobileTrust({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Award;
  title: string;
  text: string;
}) {
  return (
    <li className="flex items-start gap-2 rounded-2xl border border-[#eceff5] bg-white px-3 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eef4ff] text-[#0066FF]">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-[12px] font-bold text-[#1a1d26]">{title}</span>
        <span className="mt-0.5 block text-[11px] text-[#8b93a7]">{text}</span>
      </span>
    </li>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-xl text-[13px] font-semibold",
        active ? "bg-[#0066FF] text-white" : "bg-[#f4f6fa] text-[#4b5568]",
      )}
    >
      {label}
    </button>
  );
}

function FilterSheet({
  title,
  onClose,
  onClear,
  children,
}: {
  title: string;
  onClose: () => void;
  onClear: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Yopish" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white px-4 pt-3 shadow-2xl"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e6eaf2]" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[16px] font-bold text-[#1a1d26]">{title}</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClear} className="text-sm font-semibold text-[#8b93a7]">
              Tozalash
            </button>
            <button type="button" onClick={onClose} className="text-sm font-semibold text-[#0066FF]">
              Tayyor
            </button>
          </div>
        </div>
        <div className="space-y-4 pb-2">{children}</div>
      </div>
    </div>
  );
}

function MasterCard({ master, onContact }: { master: Master; onContact: () => void }) {
  return (
    <article className="flex flex-col items-center rounded-[14px] border border-[#eceff5] bg-white p-4 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {master.photo ? (
        <Image
          src={master.photo}
          alt=""
          width={72}
          height={72}
          className="size-[72px] rounded-full object-cover"
        />
      ) : (
        <span className="flex size-[72px] items-center justify-center rounded-full bg-[#e8f1ff] text-primary">
          <svg viewBox="0 0 24 24" className="size-8" fill="currentColor">
            <path d="M12 3.2c-2.2 0-4 1.6-4 3.6 0 1-.3 2.4-.8 3.8C6.6 12.4 6 14 6 15.4c0 2 1.5 3.4 3.2 3.4 1 0 1.7-.6 2.8-.6s1.8.6 2.8.6c1.7 0 3.2-1.4 3.2-3.4 0-1.4-.6-3-1.2-4.8-.5-1.4-.8-2.8-.8-3.8 0-2-1.8-3.6-4-3.6z" />
          </svg>
        </span>
      )}
      <h3 className="mt-3 flex items-center gap-1 text-[14px] font-semibold text-[#1a1d26]">
        {master.name}
        <BadgeCheck className="size-4 fill-primary text-white" />
      </h3>
      <p className="text-[12px] text-[#8b93a7]">{master.title}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-1">
        {master.services.slice(0, 3).map((id) => (
          <span key={id} className="rounded-full bg-[#f3f5f9] px-2 py-0.5 text-[11px] font-medium text-[#4b5568]">
            {serviceShortLabels[id]}
          </span>
        ))}
      </div>
      <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[12px] text-[#6b7280]">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" />
          {master.city}
        </span>
        <span>{master.years} yil tajriba</span>
        {master.jobs > 0 ? <span>{master.jobs} ta ish</span> : null}
      </p>
      {master.mine ? (
        <p className="mt-3 w-full rounded-full bg-[#f4f6fa] py-2 text-[12px] font-semibold text-[#8b93a7]">Bu sizning e’loningiz</p>
      ) : (
        <button
          type="button"
          onClick={onContact}
          className={cn(buttonVariants({ size: "sm" }), "mt-3 h-9 w-full rounded-full")}
        >
          Xizmat so‘rovi yuborish
        </button>
      )}
    </article>
  );
}

function Trust({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Award;
  title: string;
  text: string;
}) {
  return (
    <li className="flex gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-primary">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block text-[13px] font-semibold text-[#1a1d26]">{title}</span>
        <span className="block text-[12px] text-[#8b93a7]">{text}</span>
      </span>
    </li>
  );
}

function NoMasters() {
  return (
    <div className="rounded-[18px] border border-[#eceff5] bg-white px-6 py-14 text-center shadow-[0_4px_14px_rgba(15,23,42,0.04)]" data-testid="no-masters">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#eef4ff] text-[#0066FF]">
        <ClipboardList className="size-6" />
      </span>
      <p className="mt-4 text-[16px] font-semibold text-[#1a1d26]">Hali e’lon yo‘q</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-[#8b93a7]">
        Hozircha tasdiqlangan usta yoki servis kompaniyasi yo‘q. Birinchi bo‘lib profilingizni joylang.
      </p>
      <Link href="/ustalar/mening" className={cn(buttonVariants(), "mt-5 inline-flex h-12 min-w-[200px] !rounded-2xl text-[14px] font-semibold")}>
        Usta sifatida e’lon berish
      </Link>
    </div>
  );
}

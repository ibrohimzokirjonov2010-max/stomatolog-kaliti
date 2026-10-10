"use client";

import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Box,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  Factory,
  FlaskConical,
  Gem,
  Headphones,
  MapPin,
  Package,
  Plus,
  RotateCcw,
  Search,
  Truck,
  Wrench,
} from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useLabWork } from "@/components/lab-provider";
import { LabMobileList } from "@/components/lab-mobile-list";
import { LabMobileHero } from "@/components/lab-mobile-hero";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField, inputCls, textareaCls } from "@/components/work-ui";
import {
  labCities,
  labMaterialFilters,
  labMaterialLabel,
  labServiceFilters,
  labServiceLabel,
  orderStatusSteps,
  type Lab,
  type LabMaterial,
  type LabService,
} from "@/data/labs";
import { dueDayOptions, orderStepIndex } from "@/lib/lab-work";
import { cn } from "@/lib/utils";
import { validateLabOrder } from "@/lib/work-validate";

type ModalKind = "order" | "detail" | null;

const stepIcons = [ClipboardList, Headphones, Factory, Package, Truck];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "LB";
}

export function LabBrowse() {
  const params = useSearchParams();
  const router = useRouter();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const { labs, labsReady, orders, latest } = useLabWork();

  const [query, setQuery] = useState("");
  const [service, setService] = useState<LabService | "">("");
  const [material, setMaterial] = useState<LabMaterial | "">("");
  const [days, setDays] = useState("");
  const [city, setCity] = useState("");
  const [modal, setModal] = useState<ModalKind>(null);
  const [activeLab, setActiveLab] = useState<Lab | null>(null);
  const [preselectLabId, setPreselectLabId] = useState("");

  const visible = useMemo(() => {
    const maxDays = days ? Number(days) : null;
    const mq = (query.trim() || q).toLowerCase();
    return labs.filter((lab) => {
      if (service && !lab.services.includes(service)) return false;
      if (material && !lab.materials.includes(material)) return false;
      if (maxDays !== null && !(lab.days !== null && lab.days <= maxDays)) return false;
      if (city && lab.city !== city) return false;
      if (mq) {
        const hay = [lab.name, lab.city, ...lab.services.map(labServiceLabel), ...lab.materials.map(labMaterialLabel)].join(" ").toLowerCase();
        if (!hay.includes(mq)) return false;
      }
      return true;
    });
  }, [city, days, labs, material, q, query, service]);

  const filtered = Boolean(service || material || days || city || query || q);
  const counts = useMemo(() => {
    const active = orders.filter((row) => row.status !== "bekor");
    return {
      all: active.length,
      jarayonda: active.filter((r) => r.status === "yangi" || r.status === "qabul_qilindi" || r.status === "ishlanmoqda").length,
      tayyor: active.filter((r) => r.status === "tayyor").length,
      yetkazildi: active.filter((r) => r.status === "yetkazildi").length,
    };
  }, [orders]);
  const stepIndex = latest ? orderStepIndex(latest.status) : -1;

  function clear() {
    setService("");
    setMaterial("");
    setDays("");
    setCity("");
    setQuery("");
    if (q) router.replace("/laboratoriya", { scroll: false });
  }
  function openDetail(lab: Lab) {
    setActiveLab(lab);
    setModal("detail");
  }
  function openOrder(lab?: Lab) {
    setPreselectLabId(lab?.id ?? "");
    setModal("order");
  }

  return (
    <>
    <div className="lg:hidden">
      <LabMobileList />
    </div>
    <div className="hidden lg:block">
      {/* Same promo slider as on phones (shared PromoSlider). */}
      <LabMobileHero
        onService={(sv) => {
          setService(sv);
          document.getElementById("lab-desktop-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onList={() => document.getElementById("lab-desktop-list")?.scrollIntoView({ behavior: "smooth", block: "start" })}
      />
      <div className="mb-4 flex items-start justify-between gap-3">
        <header className="min-w-0">
          <h1 className="text-[26px] font-bold tracking-tight text-[#0B1F4D] lg:text-[#1a1d26]">Laboratoriya</h1>
          <p className="mt-0.5 text-[13px] text-[#8b93a7] lg:mt-1 lg:text-sm">Dental lab hamkorlari · crown, veneer, implant va protez buyurtmasi.</p>
          <div className="mt-2 hidden items-center gap-4 lg:flex">
            <Link href="/laboratoriya/buyurtmalarim" className="text-[13px] font-semibold text-primary">Mening lab buyurtmalarim</Link>
            <Link href="/laboratoriya/mening" className="text-[13px] font-semibold text-primary">Laboratoriya sifatida e’lon berish</Link>
          </div>
        </header>
        <div className="flex shrink-0 gap-2">
          <Button className="h-11 !rounded-xl px-3.5 lg:h-10 lg:px-4" onClick={() => openOrder()} disabled={labsReady && labs.length === 0}>
            <Plus className="size-4" />
            <span className="lg:hidden">Buyurtma</span>
            <span className="hidden lg:inline">Yangi buyurtma</span>
          </Button>
          <Link href="/laboratoriya/mening" className={cn(buttonVariants({ variant: "outline" }), "hidden h-10 !rounded-xl px-4 lg:inline-flex")}>
            <Building2 className="size-4" />
            Lab qo‘shish
          </Link>
        </div>
      </div>

      <div className="relative mb-3 lg:hidden">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-[#8b93a7]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Lab, xizmat, shahar..."
          className="h-12 w-full rounded-2xl border-0 bg-white pr-3 pl-10 text-[15px] text-[#1a1d26] shadow-[0_4px_16px_rgba(15,23,42,0.06)] outline-none placeholder:text-[#8b93a7] focus:ring-2 focus:ring-[#0066FF]/20"
        />
      </div>

      {/* filters */}
      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
        <FilterPill icon={Wrench} value={service} onChange={(v) => setService(v as LabService | "")}>
          <option value="">Xizmat</option>
          {labServiceFilters.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
        </FilterPill>
        <FilterPill icon={Gem} value={material} onChange={(v) => setMaterial(v as LabMaterial | "")}>
          <option value="">Material</option>
          {labMaterialFilters.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
        </FilterPill>
        <FilterPill icon={Calendar} value={days} onChange={setDays}>
          <option value="">Muddat</option>
          <option value="5">5 kungacha</option>
          <option value="7">7 kungacha</option>
          <option value="10">10 kungacha</option>
        </FilterPill>
        <FilterPill icon={MapPin} value={city} onChange={setCity}>
          <option value="">Shahar</option>
          {labCities.map((i) => <option key={i} value={i}>{i}</option>)}
        </FilterPill>
        {filtered ? (
          <button type="button" onClick={clear} className="inline-flex shrink-0 items-center gap-1.5 px-2 text-sm font-medium text-[#0066FF] hover:underline lg:ml-auto">
            Filtrlarni tozalash
            <RotateCcw className="size-3.5" />
          </button>
        ) : null}
      </div>

      {/* order tracking strip */}
      <section className="mb-5 rounded-[16px] bg-[#eaf2ff] px-4 py-4 lg:px-5" data-testid="lab-tracking">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="flex min-w-[200px] items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0066FF] shadow-sm">
              <ClipboardList className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-[#1a1d26]">Buyurtma holati</h2>
              <p className="text-[12px] text-[#8b93a7]">
                {latest ? `${latest.labName} · ${labServiceLabel(latest.service)}` : "Hali buyurtma yo‘q — yangi buyurtma bering."}
              </p>
              <Link href="/laboratoriya/buyurtmalarim" className="mt-1 inline-flex items-center gap-0.5 text-[12px] font-semibold text-[#0066FF] hover:underline">
                Mening lab buyurtmalarim{counts.all ? ` (${counts.all})` : ""}
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </div>
          <ol className="grid min-w-0 flex-1 grid-cols-5 gap-1.5 lg:gap-3">
            {orderStatusSteps.map((step, index) => {
              const Icon = stepIcons[index];
              const on = stepIndex >= 0 && index <= stepIndex;
              const current = stepIndex === index;
              return (
                <li key={step.id} className="flex min-w-0 flex-col items-center gap-1.5 text-center lg:flex-row lg:items-start lg:text-left">
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0066FF] lg:size-10", on && "ring-2 ring-[#0066FF]", current && "bg-[#0066FF] text-white")}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-semibold leading-tight text-[#1a1d26] lg:text-[13px]">{step.title}</span>
                    <span className="hidden text-[11px] leading-snug text-[#8b93a7] lg:block">{step.text}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <h2 id="lab-desktop-list" className="scroll-mt-20 mb-3 text-[15px] font-bold text-[#0B1F4D] lg:text-[16px] lg:font-semibold lg:text-[#1a1d26]">
        Lab kompaniyalari
        <span className="ml-1.5 text-[12px] font-semibold text-[#8b93a7]">{visible.length} ta</span>
      </h2>

      {!labsReady ? (
        <p className="py-10 text-center text-sm text-[#8b93a7]">Yuklanmoqda…</p>
      ) : labs.length === 0 ? (
        <div className="rounded-[18px] border border-[#eceff5] bg-white px-6 py-14 text-center shadow-[0_4px_14px_rgba(15,23,42,0.04)]" data-testid="no-labs">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#eef4ff] text-[#0066FF]"><FlaskConical className="size-6" /></span>
          <p className="mt-4 text-[16px] font-semibold text-[#1a1d26]">Hali e’lon yo‘q</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-[#8b93a7]">Hozircha tasdiqlangan laboratoriya yo‘q. Laboratoriyangiz bo‘lsa, profilingizni joylang.</p>
          <Link href="/laboratoriya/mening" className={cn(buttonVariants(), "mt-5 inline-flex h-12 min-w-[200px] !rounded-2xl text-[14px] font-semibold")}>Laboratoriya sifatida e’lon berish</Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-[#eceff5] bg-white px-4 py-12 text-center">
          <p className="text-[14px] font-semibold text-[#1a1d26]">Laboratoriya topilmadi</p>
          <p className="mt-1 text-[13px] text-[#8b93a7]">Filtrlarni o‘zgartiring yoki tozalang.</p>
          <button type="button" onClick={clear} className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-[#0066FF] px-5 text-[14px] font-semibold text-white">Filtrlarni tozalash</button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="lab-list">
          {visible.map((lab) => (
            <li key={lab.id}>
              <LabCard lab={lab} onOpen={() => openDetail(lab)} onOrder={() => openOrder(lab)} />
            </li>
          ))}
        </ul>
      )}

      <section className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link href="/laboratoriya/mening" className="flex items-center gap-3 rounded-2xl border border-[#eceff5] bg-white px-3.5 py-3.5 lg:hidden">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f1ff] text-[#0066FF]"><Building2 className="size-4" /></span>
          <span className="min-w-0 leading-tight">
            <span className="block text-[13px] font-bold text-[#1a1d26]">Lab qo‘shish</span>
            <span className="mt-0.5 block text-[12px] text-[#8b93a7]">Profil va buyurtmalarni qabul qilish</span>
          </span>
        </Link>
        <Link href="/marketplace?cat=laboratoriya" className="flex items-center gap-3 rounded-2xl border border-[#eceff5] bg-white px-3.5 py-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f1ff] text-[#0066FF]"><Box className="size-4" /></span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[13px] font-bold text-[#1a1d26]">Materiallar va ehtiyot qismlar</span>
            <span className="mt-0.5 block text-[12px] text-[#8b93a7]">Marketplace-ga o‘tish</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-[#8b93a7]" />
        </Link>
      </section>

      {modal === "order" ? (
        <Modal title="Yangi buyurtma" onClose={() => setModal(null)}>
          <OrderForm labs={labs} preselectLabId={preselectLabId} onCancel={() => setModal(null)} onSaved={() => setModal(null)} />
        </Modal>
      ) : null}
      {modal === "detail" && activeLab ? (
        <Modal title={activeLab.name} onClose={() => setModal(null)}>
          <LabDetail
            lab={activeLab}
            onClose={() => setModal(null)}
            onOrder={() => {
              const lab = activeLab;
              setModal(null);
              openOrder(lab);
            }}
          />
        </Modal>
      ) : null}
    </div>
    </>
  );
}

function LabCard({ lab, onOpen, onOrder }: { lab: Lab; onOpen: () => void; onOrder: () => void }) {
  return (
    <article className="flex h-full flex-col rounded-[14px] border border-[#eceff5] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <button type="button" onClick={onOpen} className="flex gap-3 text-left">
        {lab.photo ? (
          <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-[#f4f6fa]">
            <Image src={lab.photo} alt="" fill sizes="44px" className="object-cover" />
          </span>
        ) : (
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ff] text-[12px] font-bold text-[#0066FF]">{initialsOf(lab.name)}</span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold text-[#1a1d26]">{lab.name}</span>
          <span className="mt-0.5 block text-[12px] text-[#8b93a7]">{lab.city}, O‘zbekiston</span>
        </span>
      </button>
      <div className="mt-3 flex flex-wrap gap-1">
        {lab.services.slice(0, 4).map((s) => (
          <span key={s} className="rounded-full bg-[#f3f5f9] px-2 py-0.5 text-[11px] font-medium text-[#4b5568]">{labServiceLabel(s)}</span>
        ))}
        {lab.services.length > 4 ? <span className="rounded-full bg-[#f3f5f9] px-2 py-0.5 text-[11px] font-medium text-[#4b5568]">+{lab.services.length - 4}</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6b7280]">
        {lab.days ? (
          <span className="inline-flex items-center gap-1"><Clock className="size-3.5 text-[#8b93a7]" />O‘rtacha {lab.days} kun</span>
        ) : null}
        {lab.done > 0 ? <span>{lab.done} ta yetkazilgan</span> : null}
      </div>
      <div className="mt-auto flex items-center gap-3 pt-3">
        <button type="button" onClick={onOpen} className="text-[13px] font-semibold text-[#0066FF] hover:underline">Batafsil</button>
        {lab.mine ? (
          <span className="text-[12px] font-semibold text-[#8b93a7]">Sizning laboratoriyangiz</span>
        ) : (
          <button type="button" onClick={onOrder} className="text-[13px] font-semibold text-[#4b5568] hover:text-primary">Buyurtma</button>
        )}
      </div>
    </article>
  );
}

function LabDetail({ lab, onClose, onOrder }: { lab: Lab; onClose: () => void; onOrder: () => void }) {
  return (
    <div>
      <p className="text-sm text-[#6b7280]">
        {lab.city}, O‘zbekiston{lab.days ? ` · o‘rtacha ${lab.days} kun` : ""}
        {lab.priceFrom ? ` · ${lab.priceFrom.toLocaleString("ru-RU")} so‘mdan` : ""}
      </p>
      <p className="mt-2 text-[13px] text-[#4b5568]">
        {lab.services.map(labServiceLabel).join(" · ")}
        {lab.materials.length ? ` · ${lab.materials.map(labMaterialLabel).join(", ")}` : ""}
      </p>
      {lab.description ? <p className="mt-3 text-[13.5px] leading-relaxed text-[#4b5568]">{lab.description}</p> : null}
      <p className="mt-3 rounded-xl bg-[#f5f8ff] px-3 py-2 text-[12.5px] text-[#4b5568]">Laboratoriya telefon raqami buyurtmangizni qabul qilgach ochiladi.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {lab.mine ? null : <Button type="button" className="h-10 !rounded-xl" onClick={onOrder}>Buyurtma berish</Button>}
        <Button type="button" variant="ghost" onClick={onClose}>Yopish</Button>
      </div>
    </div>
  );
}

export function OrderForm({ labs, preselectLabId, presetService, presetNote, onSaved, onCancel }: { labs: Lab[]; preselectLabId?: string; presetService?: LabService; presetNote?: string; onSaved: () => void; onCancel: () => void }) {
  const { placeOrder } = useLabWork();
  const { profile, ready } = useDoctorProfile();
  const candidates = labs.filter((l) => !l.mine);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const inflight = useRef(false);
  const [form, setForm] = useState({
    labId: preselectLabId || candidates[0]?.id || "",
    service: (presetService ?? "crown") as LabService,
    material: "zirconia" as LabMaterial,
    patientCode: "",
    dueDays: "7",
    phone: profile?.phone ?? "",
    note: presetNote ?? "",
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inflight.current) return;
    setError("");
    if (!form.labId) {
      setError("Laboratoriyani tanlang.");
      return;
    }
    const check = validateLabOrder({ ...form, dueDays: Number(form.dueDays) });
    setErrors(check.errors);
    if (Object.keys(check.errors).length) return;
    inflight.current = true;
    setBusy(true);
    const res = await placeOrder({ ...check.clean, labId: form.labId, service: check.clean.service as LabService, material: check.clean.material as LabMaterial });
    inflight.current = false;
    setBusy(false);
    if (!res.ok) {
      if (res.errors) setErrors(res.errors);
      setError(res.error);
      return;
    }
    onSaved();
  }

  if (ready && !profile) {
    return (
      <div className="text-center" data-testid="lab-login-gate">
        <p className="text-[15px] font-semibold text-[#1a1d26]">Buyurtma berish uchun tizimga kiring</p>
        <p className="mt-1 text-[13px] text-[#8b93a7]">Buyurtmalaringiz akkauntingizga bog‘lanadi.</p>
        <Link href={`/kirish?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/laboratoriya")}`} className={cn(buttonVariants(), "mt-4 h-11 !rounded-xl")}>Kirish</Link>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={submit} noValidate>
      <p className="text-[13px] text-muted-foreground">Bemorning to‘liq ismi o‘rniga kod/initsial yozing. Telefon raqamingiz laboratoriyaga buyurtma bilan birga boradi.</p>
      {error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      {candidates.length === 0 ? <p className="text-sm text-[#8b93a7]">Buyurtma berish uchun boshqa laboratoriya yo‘q.</p> : null}
      <FormField label="Laboratoriya">
        <select className={inputCls} value={form.labId} onChange={(e) => setForm({ ...form, labId: e.target.value })}>
          {candidates.map((lab) => <option key={lab.id} value={lab.id}>{lab.name} — {lab.city}</option>)}
        </select>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Xizmat" error={errors.service}>
          <select className={inputCls} value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value as LabService })}>
            {labServiceFilters.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
          </select>
        </FormField>
        <FormField label="Material" error={errors.material}>
          <select className={inputCls} value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value as LabMaterial })}>
            {labMaterialFilters.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Bemor kodi / initsial" error={errors.patientCode}>
          <input className={inputCls} value={form.patientCode} onChange={(e) => setForm({ ...form, patientCode: e.target.value })} placeholder="A.K. yoki B-14" maxLength={16} aria-invalid={Boolean(errors.patientCode)} />
        </FormField>
        <FormField label="Muddat" error={errors.dueDays}>
          <select className={inputCls} value={form.dueDays} onChange={(e) => setForm({ ...form, dueDays: e.target.value })}>
            {dueDayOptions.map((n) => <option key={n} value={n}>{n} kun</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Telefon" error={errors.phone}>
        <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998 90 123 45 67" inputMode="tel" aria-invalid={Boolean(errors.phone)} />
      </FormField>
      <FormField label="Izoh">
        <textarea className={textareaCls} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Rang, shade, maxsus so‘rov..." maxLength={500} />
      </FormField>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" className="h-11 !rounded-xl" onClick={onCancel}>Bekor qilish</Button>
        <Button type="submit" className="h-11 !rounded-xl bg-[#0066FF]" disabled={busy || candidates.length === 0}>{busy ? "Yuborilmoqda…" : "Buyurtma berish"}</Button>
      </div>
    </form>
  );
}

function FilterPill({ icon: Icon, value, onChange, children }: { icon: typeof Wrench; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="relative inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-[#e6eaf2] bg-white pr-8 pl-3 lg:h-10">
      <Icon className="size-4 text-[#0066FF]" />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none bg-transparent text-sm font-medium text-[#4b5568] outline-none">
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 size-4 text-slate-400" />
    </label>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0" aria-label="Yopish" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lab-modal-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-2xl"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e6eaf2] sm:hidden" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="lab-modal-title" className="text-[17px] font-bold text-[#1a1d26]">{title}</h2>
          <button type="button" onClick={onClose} className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-[#0066FF]">Yopish</button>
        </div>
        {children}
      </div>
    </div>
  );
}

"use client";

/* eslint-disable react-hooks/set-state-in-effect -- data loading effects kick off async fetches */

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { ListingPhoto } from "@/components/listing-photo";
import { Chip, FormField, Gate, ModBanner, inputCls, textareaCls } from "@/components/work-ui";
import { masterCities, serviceLabels, toshkentDistricts, type UstaService } from "@/data/masters";
import { WorksPicker } from "@/components/usta-works-picker";
import type { MyMaster } from "@/lib/usta-work";
import { api } from "@/lib/work-client";
import { validateMaster } from "@/lib/work-validate";

const SERVICES: UstaService[] = ["rentgen", "kreslo", "ornatish", "tamirlash", "mebel", "servis", "konsultatsiya"];

export default function MyMasterPage() {
  const { profile, ready } = useDoctorProfile();
  const [state, setState] = useState<"loading" | "ready">("loading");
  const [mine, setMine] = useState<MyMaster | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const inflight = useRef(false);
  const [f, setF] = useState({ kind: "usta", name: "", title: "", services: [] as string[], city: "Toshkent", years: "", description: "", photo: "", phone: "", telegram: "", district: "", works: [] as string[] });

  useEffect(() => {
    if (!ready) return;
    if (!profile) {
      setState("ready");
      return;
    }
    let alive = true;
    void api<{ master: MyMaster | null }>("/api/work/masters/mine").then((res) => {
      if (!alive) return;
      const m = res.ok ? res.data.master : null;
      setMine(m);
      setF(
        m
          ? { kind: m.kind, name: m.name, title: m.title, services: m.services, city: m.city, years: String(m.years || ""), description: m.description ?? "", photo: m.photo ?? "", phone: m.phone, telegram: m.telegram ?? "", district: m.district ?? "", works: m.works ?? [] }
          : { kind: "usta", name: profile.fullName ?? "", title: "", services: [], city: "Toshkent", years: "", description: "", photo: "", phone: profile.phone ?? "", telegram: "", district: "", works: [] },
      );
      setState("ready");
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, profile?.id]);

  function toggle(id: string) {
    setF((cur) => ({ ...cur, services: cur.services.includes(id) ? cur.services.filter((x) => x !== id) : [...cur.services, id] }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (inflight.current) return;
    setError("");
    setSaved(false);
    const check = validateMaster(f);
    setErrors(check.errors);
    if (Object.keys(check.errors).length) return;
    inflight.current = true;
    setBusy(true);
    const res = await api<{ master: MyMaster }>("/api/work/masters/mine", { body: f });
    inflight.current = false;
    setBusy(false);
    if (!res.ok) {
      if (res.errors) setErrors(res.errors);
      setError(res.error);
      return;
    }
    setMine(res.data.master);
    setSaved(true);
  }

  async function remove() {
    if (!window.confirm("Profilingiz o‘chirilsin? Kelgan so‘rovlar ham o‘chadi.")) return;
    const res = await api("/api/work/masters/mine", { method: "DELETE" });
    if (!res.ok) return setError(res.error);
    setMine(null);
    setSaved(false);
    setF((cur) => ({ ...cur, name: profile?.fullName ?? "", title: "", services: [], years: "", description: "", photo: "" }));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-4">
        <p className="text-[13px] text-[#8b93a7]">
          <Link href="/ustalar" className="text-[#0F766E] hover:underline">Ustalar</Link>
          <span className="mx-1">/</span>
          <span>Usta profilim</span>
        </p>
        <h1 className="mt-2 text-[26px] font-bold tracking-tight text-[#0B1F4D] lg:text-[#1a1d26]">{mine ? "Usta profilim" : "Usta sifatida e’lon berish"}</h1>
        <p className="mt-1 text-sm text-[#8b93a7]">Profilingiz administrator tasdiqlagach katalogda chiqadi. Telefon raqamingiz ochiq ko‘rsatilmaydi — faqat siz so‘rovni qabul qilganingizda mijozga ochiladi.</p>
      </header>

      {ready && !profile ? (
        <Gate title="Avval tizimga kiring" text="Usta profili akkauntingizga bog‘lanadi." next="/ustalar/mening" />
      ) : state === "loading" ? (
        <p className="py-10 text-center text-sm text-[#8b93a7]">Yuklanmoqda…</p>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4 rounded-[18px] border border-[#eceff5] bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)] sm:p-6" data-testid="master-form">
          {mine ? <ModBanner status={mine.status} reason={mine.rejectReason} /> : null}
          {error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
          {saved ? <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{mine?.status === "pending" ? "Saqlandi. Administrator tasdiqlashini kuting." : "Saqlandi."}</p> : null}
          <div className="flex gap-2">
            <Chip on={f.kind === "usta"} onClick={() => setF({ ...f, kind: "usta" })}>Usta</Chip>
            <Chip on={f.kind === "kompaniya"} onClick={() => setF({ ...f, kind: "kompaniya" })}>Servis kompaniyasi</Chip>
          </div>
          <FormField label={f.kind === "usta" ? "Ism-familiya" : "Kompaniya nomi"} error={errors.name}>
            <input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={80} aria-invalid={Boolean(errors.name)} />
          </FormField>
          <FormField label="Mutaxassislik" error={errors.title} hint="Masalan: Stomatolog texnik, Rentgen servis ustasi">
            <input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={80} aria-invalid={Boolean(errors.title)} />
          </FormField>
          <div>
            <p className="text-sm font-medium text-[#4b5568]">Xizmatlar</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SERVICES.map((id) => (
                <Chip key={id} on={f.services.includes(id)} onClick={() => toggle(id)}>{serviceLabels[id]}</Chip>
              ))}
            </div>
            {errors.services ? <p role="alert" className="mt-1 text-[12.5px] font-medium text-[#dc2626]">{errors.services}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Shahar" error={errors.city}>
              <select className={inputCls} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>
                {masterCities.map((c) => <option key={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Tajriba (yil)" error={errors.years}>
              <input className={inputCls} inputMode="numeric" value={f.years} onChange={(e) => setF({ ...f, years: e.target.value.replace(/\D/g, "") })} placeholder="0" aria-invalid={Boolean(errors.years)} />
            </FormField>
          </div>
          <FormField label="Tuman / hudud (ixtiyoriy)" error={errors.district}>
            <select className={inputCls} value={f.district} onChange={(e) => setF({ ...f, district: e.target.value })}>
              <option value="">Tanlanmagan</option>
              {(f.city === "Toshkent" ? toshkentDistricts : []).map((d) => <option key={d}>{d}</option>)}
              {f.city !== "Toshkent" ? <option value={f.city}>{f.city} shahri</option> : null}
            </select>
          </FormField>
          <FormField label="Qisqa tavsif" error={errors.description} hint="Qaysi jihozlar bilan ishlaysiz, nimalar qilasiz.">
            <textarea className={textareaCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={600} aria-invalid={Boolean(errors.description)} />
          </FormField>
          <ListingPhoto value={f.photo} onChange={(photo) => setF({ ...f, photo })} label="Profil rasmi" error={errors.photo} />
          <WorksPicker value={f.works} onChange={(works) => setF((cur) => ({ ...cur, works }))} error={errors.works} />
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Telefon (yopiq saqlanadi)" error={errors.phone}>
              <input className={inputCls} inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+998 90 123 45 67" aria-invalid={Boolean(errors.phone)} />
            </FormField>
            <FormField label="Telegram (ixtiyoriy)">
              <input className={inputCls} value={f.telegram} onChange={(e) => setF({ ...f, telegram: e.target.value })} placeholder="@username" maxLength={80} />
            </FormField>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="submit" disabled={busy} className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-2xl bg-[#0F766E] px-6 text-[14px] font-semibold text-white disabled:opacity-60">
              {busy ? "Saqlanmoqda…" : mine ? "Saqlash" : "Moderatsiyaga yuborish"}
            </button>
            {mine ? (
              <>
                <Link href="/ustalar/sorovlarim?tab=kelgan" className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#CCFBF1] px-5 text-[14px] font-semibold text-[#0F766E]">Kelgan so‘rovlar</Link>
                <button type="button" onClick={remove} className="inline-flex h-12 items-center justify-center rounded-2xl px-4 text-[14px] font-semibold text-[#dc2626]">O‘chirish</button>
              </>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}

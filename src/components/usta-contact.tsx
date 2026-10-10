"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUstaWork } from "@/components/usta-provider";
import { defaultRequestService, requestServices, toshkentDistricts, type Master, type RequestService } from "@/data/masters";
import { cn } from "@/lib/utils";
import type { WhenNeed } from "@/lib/usta-work";
import { validateMasterRequest } from "@/lib/work-validate";

export function ContactSheet({ master, onClose }: { master: Master; onClose: () => void }) {
  const { submitRequest } = useUstaWork();
  const { profile, ready } = useDoctorProfile();
  const [step, setStep] = useState<"form" | "done">("form");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const inflight = useRef(false);
  const [form, setForm] = useState<{
    service: RequestService;
    clinic: string;
    district: string;
    address: string;
    name: string;
    phone: string;
    note: string;
    when: WhenNeed;
    date: string;
  }>({
    service: defaultRequestService(master),
    clinic: profile?.clinic ?? "",
    district: master.city === "Toshkent" ? "Yunusobod" : master.city,
    address: "",
    name: profile?.fullName ?? "",
    phone: profile?.phone ?? "",
    note: "",
    when: "bugun",
    date: "",
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inflight.current) return;
    setError("");
    const check = validateMasterRequest(form);
    setErrors(check.errors);
    if (Object.keys(check.errors).length) return;
    inflight.current = true;
    setBusy(true);
    const result = await submitRequest({ masterId: master.id, ...form });
    inflight.current = false;
    setBusy(false);
    if (!result.ok) {
      if (result.errors) setErrors(result.errors);
      setError(result.error);
      return;
    }
    setStep("done");
  }

  const err = (key: string) =>
    errors[key] ? (
      <p role="alert" className="mt-1 text-[12.5px] font-medium text-[#dc2626]">
        {errors[key]}
      </p>
    ) : null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Yopish" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white px-4 pt-3 shadow-2xl lg:inset-auto lg:top-1/2 lg:left-1/2 lg:w-[min(100%-2rem,440px)] lg:max-h-[85vh] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:px-5 lg:pt-5"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e6eaf2] lg:hidden" />
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[16px] font-bold text-[#1a1d26]">{master.name}</p>
            <p className="text-[13px] text-[#8b93a7]">
              {master.title} · {master.city}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full text-[#8b93a7] hover:bg-slate-50" aria-label="Yopish">
            <X className="size-4" />
          </button>
        </div>

        {ready && !profile ? (
          <div className="pb-3 text-center" data-testid="usta-login-gate">
            <p className="text-[15px] font-semibold text-[#1a1d26]">So‘rov yuborish uchun tizimga kiring</p>
            <p className="mt-1 text-[13px] text-[#8b93a7]">Usta qabul qilgach, telefon raqami sizga ochiladi.</p>
            <Link href="/kirish?next=/ustalar" className={cn(buttonVariants(), "mt-4 h-11 !rounded-xl")}>
              Kirish
            </Link>
          </div>
        ) : null}

        {profile && step === "form" ? (
          <form onSubmit={submit} className="space-y-3 pb-2" noValidate>
            <h2 className="text-[15px] font-semibold text-[#1a1d26]">Xizmat so‘rovi</h2>
            <p className="text-[13px] text-[#8b93a7]">Qisqa ma’lumot yetarli. Usta telefon raqamingizni so‘rovni ko‘rganda oladi; usta raqami esa u qabul qilgach sizga ochiladi.</p>
            {error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
            <Field label="Xizmat turi">
              <select
                className="mt-1 h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={form.service}
                onChange={(event) => setForm({ ...form, service: event.target.value as RequestService })}
              >
                {requestServices.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              {err("service")}
            </Field>
            <Field label="Klinika nomi">
              <Input className="mt-1 h-11" value={form.clinic} onChange={(event) => setForm({ ...form, clinic: event.target.value })} placeholder="Masalan, Nexus Dental" aria-invalid={Boolean(errors.clinic)} />
              {err("clinic")}
            </Field>
            <Field label="Tuman">
              <select
                className="mt-1 h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={form.district}
                onChange={(event) => setForm({ ...form, district: event.target.value })}
              >
                {districtOptions(master.city).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Manzil (ixtiyoriy)">
              <Input className="mt-1 h-11" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Ko‘cha, uy, mo‘ljal" />
            </Field>
            <Field label="Ism">
              <Input className="mt-1 h-11" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} aria-invalid={Boolean(errors.name)} />
              {err("name")}
            </Field>
            <Field label="Telefon">
              <Input className="mt-1 h-11" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+998 90 123 45 67" inputMode="tel" aria-invalid={Boolean(errors.phone)} />
              {err("phone")}
            </Field>
            <Field label="Qisqa izoh">
              <Textarea className="mt-1 min-h-[72px]" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Nima ishlamayapti yoki nima o‘rnatish kerak" maxLength={500} />
            </Field>
            <fieldset>
              <legend className="text-sm font-medium text-[#4b5568]">Qachon kerak</legend>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(
                  [
                    ["bugun", "Bugun"],
                    ["ertaga", "Ertaga"],
                    ["sana", "Sana"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setForm({ ...form, when: id })}
                    className={cn(
                      "h-11 rounded-full px-4 text-[13px] font-semibold",
                      form.when === id ? "bg-[#0066FF] text-white" : "border border-[#e6eaf2] bg-white text-[#4b5568]",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {form.when === "sana" ? <Input type="date" className="mt-2 h-11" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /> : null}
              {err("date")}
            </fieldset>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="h-12 flex-1 !rounded-2xl" onClick={onClose}>
                Bekor qilish
              </Button>
              <Button type="submit" className="h-12 flex-1 !rounded-2xl" disabled={busy}>
                {busy ? "Yuborilmoqda..." : "Yuborish"}
              </Button>
            </div>
          </form>
        ) : null}

        {step === "done" ? (
          <div className="pb-3 text-center" data-testid="usta-request-done">
            <p className="text-[16px] font-semibold text-[#1a1d26]">So‘rov yuborildi.</p>
            <p className="mt-2 text-[13px] text-[#8b93a7]">Usta qabul qilsa, sizga bildirishnoma keladi va telefon raqami ochiladi.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href="/ustalar/sorovlarim" className={cn(buttonVariants(), "h-11 !rounded-xl")}>
                Mening so‘rovlarim
              </Link>
              <Button type="button" variant="outline" className="h-11 !rounded-xl" onClick={onClose}>
                Yopish
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function districtOptions(city: string) {
  if (city !== "Toshkent") return [city, ...toshkentDistricts];
  return [...toshkentDistricts];
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Label className="block">
      <span className="text-[#4b5568]">{label}</span>
      {children}
    </Label>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { FormField, inputCls, textareaCls } from "@/components/work-ui";

type Scope = "hisob" | "malumot" | "savol";
const SCOPES: { id: Scope; title: string; text: string }[] = [
  { id: "hisob", title: "Hisobimni o‘chirish", text: "Hisob va unga bog‘liq shaxsiy ma’lumotlar o‘chiriladi." },
  { id: "malumot", title: "Ma’lumotlarim nusxasi / ayrim ma’lumotni o‘chirish", text: "Qaysi ma’lumot kerakligini xabarda yozing." },
  { id: "savol", title: "Maxfiylik bo‘yicha savol", text: "Ma’lumotlaringiz haqida savol yoki tuzatish." },
];

export function PrivacyRequestForm({ initialScope }: { initialScope?: string }) {
  const { profile, ready } = useDoctorProfile();
  const [scope, setScope] = useState<Scope>(initialScope === "savol" ? "savol" : initialScope === "malumot" ? "malumot" : "hisob");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setFormError("");
    setErrors({});
    setBusy(true);
    try {
      const res = await fetch("/api/privacy-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          scope,
          name: name || profile?.fullName || "",
          phone: phone || (profile ? profile.phone : ""),
          email: email || profile?.email || "",
          message,
          website,
        }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; errors?: Record<string, string> } | null;
      if (!res.ok || !json?.ok) {
        if (json?.errors) setErrors(json.errors);
        setFormError(json?.error ?? "So‘rovni yuborib bo‘lmadi. Qayta urinib ko‘ring.");
        return;
      }
      setDone(true);
    } catch {
      setFormError("Tarmoq xatosi. Qayta urinib ko‘ring.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[#b7e4c7] bg-[#effaf3] p-5 text-center" data-testid="privacy-done">
        <CheckCircle2 className="mx-auto size-9 text-[#16a34a]" />
        <p className="mt-2 text-[16px] font-bold text-[#14532d]">So‘rovingiz yuborildi</p>
        <p className="mt-1 text-[14px] text-[#2f6b46]">
          Administrator ko‘rib chiqadi{profile ? ", natija haqida bildirishnoma olasiz" : " va ko‘rsatgan kontaktingiz orqali siz bilan bog‘lanadi"}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4" data-testid="privacy-form">
      {ready && profile ? (
        <p className="rounded-xl bg-[#f5f8ff] px-3.5 py-2.5 text-[13.5px] text-[#475569]">
          Siz <b>{profile.fullName}</b> sifatida kirgansiz — so‘rov shu hisobga bog‘lanadi.
        </p>
      ) : (
        <p className="rounded-xl bg-[#f5f8ff] px-3.5 py-2.5 text-[13.5px] text-[#475569]">
          Kirmasdan ham so‘rov yuborishingiz mumkin. Shaxsingizni tasdiqlash uchun administrator ko‘rsatgan telefon yoki email orqali bog‘lanadi.
        </p>
      )}

      <fieldset>
        <legend className="mb-1.5 text-[13px] font-semibold text-[#1a1d26]">So‘rov turi</legend>
        <div className="space-y-2">
          {SCOPES.map((s) => (
            <label
              key={s.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 ${scope === s.id ? "border-[#0F766E] bg-[#f5f8ff]" : "border-[#e2e8f0] bg-white"}`}
            >
              <input type="radio" name="scope" value={s.id} checked={scope === s.id} onChange={() => setScope(s.id)} className="mt-1 size-4 accent-[#0F766E]" />
              <span>
                <span className="block text-[14px] font-semibold text-[#1a1d26]">{s.title}</span>
                <span className="block text-[12.5px] text-[#64748b]">{s.text}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.scope ? <p className="mt-1 text-[12.5px] font-medium text-destructive">{errors.scope}</p> : null}
      </fieldset>

      <FormField label={profile ? "Ism" : "Ism *"} error={errors.name}>
        <input className={inputCls} aria-invalid={errors.name ? true : undefined} value={name} onChange={(e) => setName(e.target.value)} placeholder={profile?.fullName || "Ism-familiyangiz"} autoComplete="name" />
      </FormField>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label={profile ? "Telefon" : "Telefon *"} error={errors.phone}>
          <input className={inputCls} inputMode="tel" aria-invalid={errors.phone ? true : undefined} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={profile?.phone || "+998 90 123 45 67"} autoComplete="tel" />
        </FormField>
        <FormField label="Email" error={errors.email}>
          <input className={inputCls} type="email" aria-invalid={errors.email ? true : undefined} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={profile?.email || "email@gmail.com"} autoComplete="email" />
        </FormField>
      </div>
      <FormField label={scope === "savol" ? "Savolingiz *" : "Izoh (ixtiyoriy)"} error={errors.message}>
        <textarea className={textareaCls} aria-invalid={errors.message ? true : undefined} value={message} onChange={(e) => setMessage(e.target.value.slice(0, 1000))} placeholder="Qo‘shimcha ma’lumot…" />
      </FormField>

      {/* honeypot: hidden from people, bots fill it */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      {formError ? (
        <p role="alert" className="rounded-xl bg-[#fff1f0] px-3 py-2.5 text-[13.5px] font-medium text-[#d92d20]">
          {formError}
        </p>
      ) : null}
      <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-[15px] font-bold sm:w-auto sm:px-8">
        {busy ? "Yuborilmoqda…" : "So‘rov yuborish"}
      </Button>
    </form>
  );
}

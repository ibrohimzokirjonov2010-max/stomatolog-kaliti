"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Camera,
  CheckCircle2,
  ClipboardList,
  Loader2,
  LogOut,
  MapPin,
  Phone,
  Stethoscope,
  Store,
  UserRound,
} from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { formatPhoneDisplay, initialsFromName, roleLabel } from "@/lib/doctor-profile";
import { prepareImage, uploadImage } from "@/lib/image-upload";
import { BonusBalanceCard, BonusNotice } from "@/components/bonus/bonus";
import { TelegramNotifyCard } from "@/components/telegram-notify-card";
import { ProfileSellerRow } from "@/components/seller-entry";

const providerLabel = { phone: "Telefon", google: "Google", telegram: "Telegram" } as const;

export function ProfilPage() {
  const router = useRouter();
  const { ready, profile, updateProfile, logout } = useDoctorProfile();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinic, setClinic] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!profile) {
      if (window.matchMedia("(min-width: 1024px)").matches) return;
      router.replace("/kirish");
      return;
    }
    setFullName(profile.fullName);
    setPhone(profile.phone ? formatPhoneDisplay(profile.phone) : "");
    setSpecialty(profile.specialty ?? "");
    setClinic(profile.clinic ?? "");
    setCity(profile.city ?? "");
    setBio(profile.bio ?? "");
    // Only re-seed the form when a different user loads (not after every save).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, profile?.id, router]);

  if (!ready || !profile) {
    return (
      <div className="mx-auto max-w-2xl" aria-busy="true" aria-label="Yuklanmoqda">
        <div className="overflow-hidden rounded-[20px] border border-[#e8eef4] bg-white">
          <div className="h-44 animate-pulse bg-gradient-to-br from-[#cfe0ff] to-[#b9d0f7]" />
          <div className="space-y-4 p-6">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-200/80" />
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-11 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!fullName.trim()) {
      setError("To‘liq ism majburiy.");
      return;
    }
    setBusy(true);
    const result = await updateProfile({ fullName, phone, specialty, clinic, city, bio });
    setBusy(false);
    if (!result.ok) {
      if (result.reason === "exists") setError("Bu telefon boshqa akkauntda band.");
      else if (result.reason === "invalid") setError("Telefon raqami 9 xonali bo‘lishi kerak (masalan, 90 123 45 67).");
      else if (result.reason === "unauthorized") setError("Sessiya tugagan. Qayta kiring.");
      else setError(result.message ?? "Saqlab bo‘lmadi. Qayta urinib ko‘ring.");
      return;
    }
    setMessage("Profil muvaffaqiyatli saqlandi.");
    setPhone(result.profile.phone ? formatPhoneDisplay(result.profile.phone) : "");
  }

  async function onAvatarPicked(file: File | undefined) {
    if (!file) return;
    setError("");
    setMessage("");
    setAvatarBusy(true);
    try {
      const prepared = await prepareImage(file, 512, 0.86);
      const url = await uploadImage(prepared.blob, "avatar");
      URL.revokeObjectURL(prepared.previewUrl);
      const result = await updateProfile({ avatarUrl: url });
      if (!result.ok) throw new Error(result.message ?? "Rasmni saqlab bo‘lmadi.");
      setMessage("Profil rasmi yangilandi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rasmni yuklab bo‘lmadi.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function removeAvatar() {
    setAvatarBusy(true);
    const result = await updateProfile({ avatarUrl: "" });
    setAvatarBusy(false);
    if (result.ok) setMessage("Profil rasmi olib tashlandi.");
    else setError(result.message ?? "Saqlab bo‘lmadi.");
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-[#e8eef4] bg-[#f7f8fb] px-3.5 text-[14px] text-[#1a1d26] outline-none transition placeholder:text-[#8b93a7] focus:border-[#0066FF] focus:bg-white focus:ring-3 focus:ring-[#0066FF]/20 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-[20px] border border-[#e8eef4] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
        <div className="relative bg-gradient-to-br from-[#0066FF] to-[#0047b3] px-5 py-7 text-white sm:px-7">
          <div className="absolute -right-8 -top-10 size-36 rounded-full bg-white/10" />
          <div className="relative flex flex-wrap items-center gap-4">
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => avatarInput.current?.click()}
                disabled={avatarBusy}
                className="group relative block size-20 overflow-hidden rounded-full ring-4 ring-white/25 sm:size-24"
                aria-label="Profil rasmini o‘zgartirish"
              >
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center bg-white/15 text-[22px] font-bold backdrop-blur">
                    {initialsFromName(profile.fullName)}
                  </span>
                )}
                <span className="absolute inset-0 grid place-items-center bg-black/35 opacity-0 transition group-hover:opacity-100">
                  <Camera className="size-6" />
                </span>
                {avatarBusy ? (
                  <span className="absolute inset-0 grid place-items-center bg-black/45">
                    <Loader2 className="size-6 animate-spin" />
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => avatarInput.current?.click()}
                disabled={avatarBusy}
                className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-white text-[#0066FF] shadow-md ring-2 ring-[#0066FF]/10"
                aria-label="Rasm yuklash"
              >
                <Camera className="size-4" />
              </button>
              <input
                ref={avatarInput}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  void onAvatarPicked(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold tracking-[0.14em] text-white/70">PROFIL</p>
              <h1 className="mt-0.5 truncate text-[22px] font-bold tracking-tight">{profile.fullName}</h1>
              <p className="mt-1 text-[13.5px] text-white/85">
                {profile.specialty || roleLabel(profile.role)}
                <span className="mx-1.5 text-white/50">·</span>
                {providerLabel[profile.provider ?? "phone"]} orqali
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => avatarInput.current?.click()}
                  disabled={avatarBusy}
                  className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold ring-1 ring-white/25 hover:bg-white/25"
                >
                  {avatarBusy ? "Yuklanmoqda…" : profile.avatarUrl ? "Rasmni almashtirish" : "Rasm yuklash"}
                </button>
                {profile.avatarUrl ? (
                  <button
                    type="button"
                    onClick={() => void removeAvatar()}
                    disabled={avatarBusy}
                    className="rounded-full px-3 py-1 text-[12px] font-semibold text-white/80 hover:bg-white/10"
                  >
                    Olib tashlash
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <dl className="relative mt-5 grid gap-2 sm:grid-cols-3">
            <MetaChip
              icon={<Phone className="size-3.5" />}
              label={profile.phone ? formatPhoneDisplay(profile.phone) : "Telefon kiritilmagan"}
            />
            <MetaChip
              icon={<Building2 className="size-3.5" />}
              label={profile.clinic || "Klinika kiritilmagan"}
            />
            <MetaChip icon={<MapPin className="size-3.5" />} label={profile.city || "Shahar kiritilmagan"} />
          </dl>
        </div>

        <div className="space-y-3 border-b border-[#f0f3f8] px-5 py-3 sm:px-7">
          <BonusNotice />
          <BonusBalanceCard compact />
          <TelegramNotifyCard />
          <Link
            href="/buyurtmalarim"
            className="flex items-center gap-3 rounded-2xl bg-[#f5f9ff] px-3.5 py-3 ring-1 ring-[#e0ecff] transition hover:bg-[#e8f1ff]"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-white text-[#0066FF] shadow-sm">
              <ClipboardList className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold text-[#1a1d26]">Mening buyurtmalarim</span>
              <span className="block text-[12px] text-[#8b93a7]">Holat va bildirishnomalar</span>
            </span>
          </Link>
          <ProfileSellerRow icon={<Store className="size-4" />} />
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-6 sm:px-7">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1a1d26]">
            <UserRound className="size-4 text-[#0066FF]" />
            Shaxsiy ma’lumotlar
          </div>
          <p className="-mt-2 flex items-center gap-1.5 text-[12.5px] text-[#8b93a7]">
            <Stethoscope className="size-3.5" />
            Ma’lumotlar serverda saqlanadi — istalgan qurilmadan kirganda ko‘rinadi.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="To‘liq ism">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} required />
            </Field>
            <Field label="Telefon">
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className={inputClass}
              />
            </Field>
            <Field label="Mutaxassislik">
              <input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Masalan: Ortodontiya"
                className={inputClass}
              />
            </Field>
            <Field label="Klinika">
              <input
                value={clinic}
                onChange={(e) => setClinic(e.target.value)}
                placeholder="Klinika nomi"
                className={inputClass}
              />
            </Field>
            <Field label="Shahar">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Toshkent"
                className={inputClass}
              />
            </Field>
            <Field label="Rol">
              <input value={roleLabel(profile.role)} disabled className={inputClass} />
            </Field>
          </div>

          <Field label="O‘zim haqimda">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 1000))}
              rows={4}
              placeholder="Tajribangiz, yo‘nalishlaringiz, sertifikatlar…"
              className={inputClass.replace("h-11", "min-h-[108px] py-3 leading-relaxed")}
            />
            <span className="block text-right text-[11.5px] text-[#8b93a7]">{bio.length}/1000</span>
          </Field>

          {error ? (
            <p className="rounded-xl bg-[#fff1f0] px-3 py-2.5 text-[13px] font-medium text-[#d92d20]">{error}</p>
          ) : null}
          {message ? (
            <p className="flex items-center gap-2 rounded-xl bg-[#ecfdf3] px-3 py-2.5 text-[13px] font-medium text-[#027a48]">
              <CheckCircle2 className="size-4 shrink-0" />
              {message}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 border-t border-[#f1f5f9] pt-4 sm:flex-row">
            <button
              type="submit"
              disabled={busy}
              className="flex h-11 flex-1 items-center justify-center rounded-full bg-[#0066FF] text-[14px] font-bold text-white shadow-[0_6px_16px_rgba(0,102,255,0.28)] hover:bg-[#0052cc] disabled:opacity-60"
            >
              {busy ? "Saqlanmoqda…" : "O‘zgarishlarni saqlash"}
            </button>
            <button
              type="button"
              onClick={() => {
                void logout().then(() => router.push("/kirish"));
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e8eef4] bg-white px-5 text-[14px] font-semibold text-[#4b5568] hover:bg-[#f7f8fb]"
            >
              <LogOut className="size-4" />
              Chiqish
            </button>
          </div>
          <nav aria-label="Huquqiy havolalar" className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[13px] text-[#8b93a7]">
            <Link href="/maxfiylik" className="hover:text-[#0066FF] hover:underline">Maxfiylik siyosati</Link>
            <Link href="/shartlar" className="hover:text-[#0066FF] hover:underline">Foydalanish shartlari</Link>
            <Link href="/hisobni-ochirish" className="hover:text-[#0066FF] hover:underline">Hisobni o‘chirish</Link>
          </nav>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-semibold text-[#1a1d26]">{label}</span>
      {children}
    </label>
  );
}

function MetaChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl bg-white/12 px-3 py-2 text-[12.5px] font-medium text-white/95 ring-1 ring-white/15 backdrop-blur">
      <span className="shrink-0 opacity-90">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}

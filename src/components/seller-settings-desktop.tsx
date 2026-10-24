"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ChevronRight, Lock, ShieldAlert, ShieldCheck, Trash2, Upload, UserPlus } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useSellerWork } from "@/components/seller-provider";
import { DemoTag, Panel, PillTabs, SoonTag } from "@/components/seller-desktop-ui";
import { type Shop } from "@/data/shops";
import { formatPhoneDisplay, normalizePhone } from "@/lib/doctor-profile";
import { prepareImage, uploadImage } from "@/lib/image-upload";
import { cn } from "@/lib/utils";

type STab = "account" | "notify" | "shop" | "delivery" | "integrations" | "staff" | "region";
const TABS: { id: STab; label: string }[] = [
  { id: "account", label: "Hisob va xavfsizlik" },
  { id: "notify", label: "Bildirishnomalar" },
  { id: "shop", label: "Do‘kon sozlamalari" },
  { id: "delivery", label: "Yetkazib berish" },
  { id: "integrations", label: "Integratsiyalar" },
  { id: "staff", label: "Xodimlar" },
  { id: "region", label: "Til va mintaqa" },
];
const NOTIFY_ROWS: { key: "newOrders" | "orderStatus" | "messages" | "reviews" | "marketing"; label: string; hint: string; def: boolean }[] = [
  { key: "newOrders", label: "Yangi buyurtmalar", hint: "Yangi buyurtma kelganda", def: true },
  { key: "orderStatus", label: "Buyurtma holati", hint: "Holat o‘zgarganda", def: true },
  { key: "messages", label: "Mijoz xabarlari", hint: "Yangi xabar kelganda", def: true },
  { key: "reviews", label: "Sharhlar", hint: "Yangi sharh qoldirilganda", def: true },
  { key: "marketing", label: "Marketing", hint: "Aksiya va yangiliklar", def: false },
];
type Settings = { hasStore?: boolean; status?: string; minOrder: number; closed: boolean; notify: Record<string, boolean>; hasPassword?: boolean };

const inputCls =
  "h-11 w-full rounded-xl border border-[#e4e9f2] bg-white px-3.5 text-[14px] font-medium text-[#111827] outline-none placeholder:font-normal placeholder:text-[#a3abbd] focus:border-[#0F766E] disabled:bg-[#f7f9fc] disabled:text-[#8b93a7]";

function Field({ label, children, tag }: { label: string; children: ReactNode; tag?: ReactNode }) {
  return (
    <label className="block text-[12.5px] font-semibold text-[#4b5568]">
      <span className="flex items-center gap-2">{label}{tag}</span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

function Toggle({ on, onChange, disabled, label }: { on: boolean; onChange?: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!on)}
      className={cn("relative h-[22px] w-10 shrink-0 rounded-full transition-colors", on ? "bg-[#0F766E]" : "bg-[#d5dbe8]", disabled && "cursor-not-allowed opacity-50")}
    >
      <span className={cn("absolute top-[2px] size-[18px] rounded-full bg-white shadow transition-all", on ? "left-[20px]" : "left-[2px]")} />
    </button>
  );
}

async function api<T>(url: string, method: string, body?: unknown): Promise<(T & { ok: boolean; error?: string; reason?: string }) | null> {
  try {
    const res = await fetch(url, { method, credentials: "same-origin", cache: "no-store", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    return (await res.json()) as T & { ok: boolean; error?: string; reason?: string };
  } catch {
    return null;
  }
}

export function SellerSettingsDesktop({ shop }: { shop: Shop }) {
  const { profile, updateProfile } = useDoctorProfile();
  const { updateShop, myProducts } = useSellerWork();
  const [tab, setTab] = useState<STab>("account");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [flash, setFlash] = useState<{ text: string; err?: boolean } | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", telegram: shop.telegram ?? "" });
  const [formInit, setFormInit] = useState(false);
  if (profile && !formInit) {
    setFormInit(true);
    setForm({ fullName: profile.fullName, phone: formatPhoneDisplay(profile.phone), telegram: shop.telegram ?? "" });
  }
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [pw, setPw] = useState<{ open: boolean; cur: string; next: string; again: string; err: string; busy: boolean }>({ open: false, cur: "", next: "", again: "", err: "", busy: false });
  const [minOrder, setMinOrder] = useState("");
  const [minDirty, setMinDirty] = useState(false);
  const flashTimer = useRef<number | null>(null);

  function say(text: string, err = false) {
    setFlash({ text, err });
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 3200);
  }

  useEffect(() => {
    let alive = true;
    api<{ settings: Settings }>("/api/seller/settings", "GET").then((d) => {
      if (!alive) return;
      if (d?.ok) {
        setSettings(d.settings);
        setMinOrder(d.settings.minOrder ? String(d.settings.minOrder) : "");
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  async function patchSettings(patch: Record<string, unknown>, okText: string) {
    const d = await api<{ settings: Settings }>("/api/seller/settings", "PATCH", patch);
    if (d?.ok) {
      setSettings(d.settings);
      say(okText);
      return true;
    }
    say(d?.error ?? "Saqlab bo‘lmadi.", true);
    return false;
  }

  async function saveProfile() {
    if (!profile || saving) return;
    setSaving(true);
    const phone = normalizePhone(form.phone);
    const patch: { fullName?: string; phone?: string } = {};
    if (form.fullName.trim() && form.fullName.trim() !== profile.fullName) patch.fullName = form.fullName.trim();
    if (phone && phone !== normalizePhone(profile.phone)) patch.phone = phone;
    let ok = true;
    if (Object.keys(patch).length) {
      const res = await updateProfile(patch);
      if (!res.ok) {
        ok = false;
        const reason = String(res.reason);
        say(reason === "phone_locked" ? "Tasdiqlangan raqamni faqat Telegram kodi orqali o‘zgartirish mumkin." : reason === "exists" ? "Bu raqam band." : "Profilni saqlab bo‘lmadi.", true);
      }
    }
    if (ok && form.telegram.trim() !== (shop.telegram ?? "")) updateShop({ telegram: form.telegram.trim() });
    setSaving(false);
    if (ok) say("Saqlandi");
  }

  async function onAvatar(file?: File) {
    if (!file) return;
    setAvatarBusy(true);
    try {
      const prepared = await prepareImage(file, 512, 0.85);
      const url = await uploadImage(prepared.blob, "avatar");
      URL.revokeObjectURL(prepared.previewUrl);
      const res = await updateProfile({ avatarUrl: url });
      say(res.ok ? "Rasm yangilandi" : "Rasmni saqlab bo‘lmadi.", !res.ok);
    } catch (e) {
      say(e instanceof Error && e.message ? e.message : "Rasm yuklanmadi.", true);
    } finally {
      setAvatarBusy(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (pw.next !== pw.again) return setPw({ ...pw, err: "Yangi parollar mos kelmadi." });
    setPw({ ...pw, busy: true, err: "" });
    const d = await api<object>("/api/auth/password", "POST", { current: pw.cur, next: pw.next });
    if (d?.ok) {
      setPw({ open: false, cur: "", next: "", again: "", err: "", busy: false });
      say("Parol o‘zgartirildi");
    } else setPw((p) => ({ ...p, busy: false, err: d?.error ?? "Parolni o‘zgartirib bo‘lmadi." }));
  }

  const notify = useMemo(() => Object.fromEntries(NOTIFY_ROWS.map((r) => [r.key, settings?.notify?.[r.key] ?? r.def])), [settings]);
  const closed = settings?.closed ?? false;
  const statusPill =
    shop.verified !== "active"
      ? { text: "Tekshiruvda", cls: "bg-[#fff7ed] text-[#c2410c]" }
      : closed
        ? { text: "Vaqtincha yopiq", cls: "bg-[#fef2f2] text-[#b91c1c]" }
        : { text: "Faol", cls: "bg-[#ecfdf3] text-[#15803d]" };
  const deliveryGroups = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of myProducts) m.set(p.delivery || "—", (m.get(p.delivery || "—") ?? 0) + 1);
    return [...m.entries()];
  }, [myProducts]);
  const isTelegram = profile?.provider === "telegram";
  const initials = (form.fullName || shop.name).trim().slice(0, 1).toUpperCase();
  const show = (id: STab) => tab === "account" || tab === id;

  const profileCard = (
    <Panel
      title="Profil va hisob"
      action={
        <button type="button" onClick={() => void saveProfile()} disabled={saving} className="h-9 rounded-xl bg-[#0F766E] px-5 text-[13px] font-semibold text-white hover:bg-[#0F766E] disabled:bg-[#CCFBF1]">
          {saving ? "Saqlanmoqda…" : "Saqlash"}
        </button>
      }
    >
      <div className="mt-4 grid grid-cols-[140px_minmax(0,1fr)] gap-6">
        <div className="text-center">
          {profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="" className="mx-auto size-[88px] rounded-full object-cover" />
          ) : (
            <span className="mx-auto grid size-[88px] place-items-center rounded-full bg-[#F0FDFA] text-[32px] font-bold text-[#0F766E]">{initials}</span>
          )}
          <label className="mt-3 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#F0FDFA] px-3 text-[12.5px] font-semibold text-[#0F766E] hover:bg-[#f5f9ff]">
            <Upload className="size-3.5" />
            {avatarBusy ? "Yuklanmoqda…" : "Rasm yuklash"}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={avatarBusy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void onAvatar(f); }} />
          </label>
          <p className="mt-1.5 text-[11px] text-[#8b93a7]">JPG yoki PNG</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ism familiya">
            <input className={inputCls} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <Field label="Foydalanuvchi nomi" tag={<SoonTag />}>
            <input className={inputCls} value={profile?.telegramUsername ? `@${profile.telegramUsername.replace(/^@/, "")}` : ""} placeholder="—" disabled />
          </Field>
          <Field label="Telefon">
            <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" />
          </Field>
          <Field label="Parol">
            <div className="flex gap-2">
              <input className={inputCls} value="••••••••" disabled readOnly />
              <button
                type="button"
                disabled={settings?.hasPassword === false}
                title={settings?.hasPassword === false ? "Ijtimoiy tarmoq orqali kirgan akkauntda parol yo‘q" : undefined}
                onClick={() => setPw({ ...pw, open: !pw.open })}
                className="h-11 shrink-0 rounded-xl border border-[#F0FDFA] px-4 text-[13px] font-semibold text-[#0F766E] hover:bg-[#f5f9ff] disabled:cursor-not-allowed disabled:opacity-50"
              >
                O‘zgartirish
              </button>
            </div>
          </Field>
          <Field label="Email" tag={<SoonTag />}>
            <input className={inputCls} value={profile?.email ?? ""} placeholder="—" disabled />
          </Field>
          <Field label="Telegram (do‘kon aloqasi)">
            <input className={inputCls} value={form.telegram} placeholder="@do‘kon" onChange={(e) => setForm({ ...form, telegram: e.target.value })} />
          </Field>
          <Field label="Rol">
            <input className={inputCls} value="Sotuvchi (do‘kon egasi)" disabled />
          </Field>
        </div>
      </div>
      {pw.open ? (
        <form onSubmit={changePassword} className="mt-5 grid grid-cols-3 items-end gap-3 rounded-xl border border-[#eceff5] bg-[#fafbfd] p-4">
          <Field label="Joriy parol"><input type="password" autoComplete="current-password" className={inputCls} value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} /></Field>
          <Field label="Yangi parol"><input type="password" autoComplete="new-password" className={inputCls} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
          <Field label="Yangi parolni takrorlang"><input type="password" autoComplete="new-password" className={inputCls} value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} /></Field>
          {pw.err ? <p className="col-span-3 text-[12.5px] text-[#dc2626]">{pw.err}</p> : null}
          <div className="col-span-3 flex gap-2">
            <button type="submit" disabled={pw.busy || !pw.cur || pw.next.length < 6} className="h-10 rounded-xl bg-[#0F766E] px-5 text-[13px] font-semibold text-white disabled:bg-[#CCFBF1]">{pw.busy ? "Saqlanmoqda…" : "Parolni yangilash"}</button>
            <button type="button" onClick={() => setPw({ open: false, cur: "", next: "", again: "", err: "", busy: false })} className="h-10 rounded-xl border border-[#e4e9f2] px-4 text-[13px] font-semibold text-[#4b5568]">Bekor</button>
          </div>
        </form>
      ) : null}
    </Panel>
  );

  const securityCard = (
    <Panel title="Xavfsizlik">
      <div className="mt-3 divide-y divide-[#f1f4f9] text-[13px]">
        <div className="flex items-center justify-between gap-3 py-3">
          <div>
            <p className="flex items-center gap-2 font-semibold text-[#111827]"><ShieldCheck className="size-4 text-[#0F766E]" />Ikki bosqichli tasdiqlash (2FA) <SoonTag /></p>
            <p className="mt-0.5 text-[11.5px] text-[#8b93a7]">Tavsiya etiladi — hozircha mavjud emas</p>
          </div>
          <Toggle on={false} disabled label="2FA" />
        </div>
        {(["Oxirgi kirishlar", "Faol sessiyalar"] as const).map((t) => (
          <div key={t} className="flex items-center justify-between gap-3 py-3">
            <p className="flex items-center gap-2 font-semibold text-[#111827]">{t} <SoonTag /></p>
            <span className="inline-flex h-8 cursor-not-allowed items-center rounded-lg border border-[#eef1f6] px-3 text-[12.5px] font-semibold text-[#c3cad9]">Ko‘rish</span>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-xl border border-[#fbd5d5] bg-[#fff5f5] p-3.5">
        <p className="flex items-center gap-2 text-[13px] font-bold text-[#b91c1c]"><ShieldAlert className="size-4" />Hisobni o‘chirish</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-[#9a4a4a]">Hisobni o‘chirish uchun so‘rov yuboring — administrator ko‘rib chiqadi. Tugallanmagan buyurtma yoki to‘lov bo‘lsa, avval yakunlanadi.</p>
        <Link href="/hisobni-ochirish" className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#f3caca] px-3.5 text-[12.5px] font-semibold text-[#b91c1c] hover:bg-[#fef2f2]"><Trash2 className="size-3.5" />Hisobni o‘chirish so‘rovi</Link>
      </div>
    </Panel>
  );

  const notifyCard = (
    <Panel title="Bildirishnomalar" action={<DemoTag>Saqlanadi</DemoTag>}>
      <div className="mt-3 text-[12.5px]">
        <div className="grid grid-cols-[minmax(0,1fr)_repeat(3,52px)] gap-1 border-b border-[#eef1f6] pb-2 text-center text-[11px] font-semibold text-[#8b93a7]">
          <span />
          <span>Email</span><span>Telegram</span><span>SMS</span>
        </div>
        {NOTIFY_ROWS.map((r) => (
          <div key={r.key} className="grid grid-cols-[minmax(0,1fr)_repeat(3,52px)] items-center gap-1 border-b border-[#f4f6fa] py-2.5 last:border-0">
            <div className="flex items-center gap-2.5">
              <Toggle on={Boolean(notify[r.key])} label={r.label} onChange={(v) => void patchSettings({ notify: { [r.key]: v } }, "Saqlandi")} disabled={!settings} />
              <div className="min-w-0"><p className="truncate font-semibold text-[#111827]">{r.label}</p><p className="truncate text-[11px] text-[#8b93a7]">{r.hint}</p></div>
            </div>
            {[0, 1, 2].map((i) => (
              <span key={i} className="flex justify-center"><input type="checkbox" disabled aria-label="Tez orada" className="size-4 cursor-not-allowed opacity-40" /></span>
            ))}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-[#8b93a7]">Tanlovlaringiz saqlanadi. Email, Telegram va SMS orqali yuborish <SoonTag /> — hozircha xabarlar faqat kabinetda ko‘rinadi.</p>
    </Panel>
  );

  const shopCard = (
    <Panel title="Do‘kon sozlamalari">
      <div className="mt-3 divide-y divide-[#f1f4f9] text-[13px]">
        <div className="flex items-center justify-between gap-2 py-3"><span className="text-[#6b7280]">Do‘kon holati</span><span className={cn("rounded-full px-3 py-1 text-[12px] font-semibold", statusPill.cls)}>{statusPill.text}</span></div>
        <div className="py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#6b7280]">Minimal buyurtma summasi</span>
            <div className="flex items-center gap-2">
              <input
                inputMode="numeric"
                value={minOrder ? new Intl.NumberFormat("ru-RU").format(Number(minOrder.replace(/\D/g, ""))) : ""}
                placeholder="0"
                onChange={(e) => { setMinOrder(e.target.value.replace(/\D/g, "")); setMinDirty(true); }}
                className="h-9 w-32 rounded-lg border border-[#e4e9f2] px-3 text-right text-[13px] font-semibold text-[#111827] outline-none focus:border-[#0F766E]"
              />
              <span className="text-[12px] text-[#8b93a7]">so‘m</span>
            </div>
          </div>
          {minDirty ? (
            <div className="mt-2 flex justify-end">
              <button type="button" onClick={async () => { if (await patchSettings({ minOrder: Number(minOrder || 0) }, "Minimal summa saqlandi")) setMinDirty(false); }} className="h-8 rounded-lg bg-[#0F766E] px-4 text-[12.5px] font-semibold text-white hover:bg-[#0F766E]">Saqlash</button>
            </div>
          ) : (
            <p className="mt-1 text-[11px] text-[#8b93a7]">Do‘koningiz mahsulotlari bo‘yicha buyurtma shu summadan kam bo‘lsa, qabul qilinmaydi. 0 — cheklov yo‘q.</p>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 py-3"><span className="flex items-center gap-2 text-[#6b7280]">Avtomatik tasdiqlash <SoonTag /></span><Toggle on={false} disabled label="Avtomatik tasdiqlash" /></div>
        <div className="flex items-center justify-between gap-3 py-3"><span className="flex items-center gap-2 text-[#6b7280]">Ombor ogohlantirish <SoonTag /></span><Toggle on={false} disabled label="Ombor ogohlantirish" /></div>
        <div className="flex items-center justify-between gap-3 py-3">
          <div><p className="text-[#6b7280]">Do‘kon ko‘rinishini vaqtincha yopish</p><p className="text-[11px] text-[#8b93a7]">Yopiq paytda yangi buyurtma qabul qilinmaydi</p></div>
          <Toggle on={closed} disabled={!settings || shop.verified !== "active"} label="Vaqtincha yopish" onChange={(v) => void patchSettings({ closed: v }, v ? "Do‘kon vaqtincha yopildi" : "Do‘kon qayta ochildi")} />
        </div>
      </div>
    </Panel>
  );

  const deliveryCard = (
    <Panel title="Yetkazib berish sozlamalari" action={<SoonTag />}>
      <ul className="mt-3 divide-y divide-[#f1f4f9] text-[13px]">
        {deliveryGroups.length ? (
          deliveryGroups.map(([label, n]) => (
            <li key={label} className="flex items-center justify-between gap-2 py-2.5"><span className="font-semibold text-[#111827]">{label}</span><span className="text-[12px] text-[#8b93a7]">{n} ta mahsulot</span></li>
          ))
        ) : (
          <li className="py-3 text-[12.5px] text-[#8b93a7]">Hali mahsulot yo‘q.</li>
        )}
        <li className="flex items-center justify-between gap-2 py-2.5 text-[#6b7280]"><span>To‘lov usullari</span><span className="text-[12px]">Click, Payme, Naqd</span></li>
        <li className="flex items-center justify-between gap-2 py-2.5 text-[#a3abbd]"><span>Hududlar va narxlar</span><ChevronRight className="size-4" /></li>
      </ul>
      <p className="mt-1 text-[11.5px] text-[#8b93a7]">Yetkazib berish muddati har bir mahsulotda belgilanadi. Hududlar va narx sozlamasi tez orada.</p>
    </Panel>
  );

  const integrationsCard = (
    <Panel title="Integratsiyalar">
      <ul className="mt-3 divide-y divide-[#f1f4f9] text-[13px]">
        <li className="flex items-center justify-between gap-2 py-2.5">
          <span className="font-semibold text-[#111827]">Telegram orqali kirish</span>
          {isTelegram ? <span className="rounded-full bg-[#ecfdf3] px-2.5 py-1 text-[11.5px] font-semibold text-[#15803d]">Ulangan</span> : <span className="rounded-full bg-[#f1f4f9] px-2.5 py-1 text-[11.5px] font-semibold text-[#8b93a7]">Ulanmagan</span>}
        </li>
        {["Click", "Payme", "Uzum", "Telegram bot"].map((n) => (
          <li key={n} className="flex items-center justify-between gap-2 py-2.5">
            <span className="font-semibold text-[#111827]">{n}</span>
            <span className="rounded-full bg-[#f1f4f9] px-2.5 py-1 text-[11.5px] font-semibold text-[#8b93a7]">Ulash — tez orada</span>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-[11.5px] text-[#8b93a7]">To‘lov shlyuzlari ulangach, pul to‘g‘ridan-to‘g‘ri hisobingizga tushadi. Hozir to‘lovlar demo rejimida.</p>
    </Panel>
  );

  const staffCard = (
    <Panel title="Xodimlar va ruxsatlar" action={<span className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-xl border border-[#eef1f6] px-3.5 text-[12.5px] font-semibold text-[#c3cad9]"><UserPlus className="size-4" />Xodim qo‘shish · Tez orada</span>}>
      <ul className="mt-3 text-[13px]">
        <li className="flex items-center gap-3 rounded-xl border border-[#eceff5] p-3">
          <span className="grid size-10 place-items-center rounded-full bg-[#F0FDFA] font-bold text-[#0F766E]">{initials}</span>
          <div className="min-w-0 flex-1"><p className="truncate font-semibold text-[#111827]">{profile?.fullName ?? shop.ownerName}</p><p className="truncate text-[11.5px] text-[#8b93a7]">{profile?.phone ? formatPhoneDisplay(profile.phone) : shop.phone}</p></div>
          <span className="rounded-full bg-[#F0FDFA] px-2.5 py-1 text-[11.5px] font-semibold text-[#0F766E]">Egasi</span>
        </li>
      </ul>
      <p className="mt-2 text-[11.5px] text-[#8b93a7]">Operator va admin rollari bilan xodimlar qo‘shish tez orada.</p>
    </Panel>
  );

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#111827]">Sozlamalar</h1>
          <p className="mt-1 text-[13.5px] text-[#6b7280]">Hisob, xavfsizlik, bildirishnomalar va do‘kon sozlamalarini boshqaring.</p>
        </div>
        {flash ? <span className={cn("rounded-xl px-3.5 py-2 text-[13px] font-semibold", flash.err ? "bg-[#fef2f2] text-[#b91c1c]" : "bg-[#ecfdf3] text-[#15803d]")}>{flash.text}</span> : null}
      </header>

      <PillTabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "region" ? (
        <Panel title="Til va mintaqa">
          <div className="grid place-items-center py-12 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-[#f1f4f9]"><Lock className="size-6 text-[#8b93a7]" /></span>
            <p className="mt-3 text-[15px] font-bold text-[#111827]">Tez orada</p>
            <p className="mt-1 max-w-sm text-[13px] text-[#6b7280]">Hozir interfeys o‘zbek tilida, narxlar so‘mda. Til va valyuta tanlash keyin qo‘shiladi.</p>
          </div>
        </Panel>
      ) : (
        <div className="space-y-4">
          {tab === "account" ? (
            <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start gap-4">
              {profileCard}
              {securityCard}
            </div>
          ) : null}
          {tab === "account" ? (
            <div className="grid grid-cols-3 items-start gap-4">
              {show("notify") ? notifyCard : null}
              {show("shop") ? shopCard : null}
              {show("delivery") ? deliveryCard : null}
            </div>
          ) : null}
          {tab === "account" ? (
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-start gap-4">
              {integrationsCard}
              {staffCard}
            </div>
          ) : null}
          {tab === "notify" ? <div className="max-w-3xl">{notifyCard}</div> : null}
          {tab === "shop" ? <div className="max-w-2xl">{shopCard}</div> : null}
          {tab === "delivery" ? <div className="max-w-2xl">{deliveryCard}</div> : null}
          {tab === "integrations" ? <div className="max-w-2xl">{integrationsCard}</div> : null}
          {tab === "staff" ? <div className="max-w-3xl">{staffCard}</div> : null}
        </div>
      )}
    </div>
  );
}

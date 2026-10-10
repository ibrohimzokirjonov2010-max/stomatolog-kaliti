"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Settings } from "lucide-react";
import { Card, Empty, ErrorBox, Loading, PageHead, Pill, adminPost, btn, fmtDate, useAdminData, useToast, type Tone } from "@/components/admin/ui";

type Contact = { email: string | null; phone: string | null; telegram: string | null };
type Req = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  scope: "hisob" | "malumot" | "savol";
  message: string | null;
  status: "yangi" | "jarayonda" | "bajarildi" | "rad";
  adminNote: string | null;
  createdAt: string;
  registered: boolean;
};

const SCOPE = { hisob: "Hisobni o‘chirish", malumot: "Ma’lumot nusxasi / o‘chirish", savol: "Maxfiylik savoli" } as const;
const STATUS: Record<Req["status"], { label: string; tone: Tone }> = {
  yangi: { label: "Yangi", tone: "orange" },
  jarayonda: { label: "Jarayonda", tone: "blue" },
  bajarildi: { label: "Bajarildi", tone: "green" },
  rad: { label: "Rad etildi", tone: "red" },
};

const field = "mt-1 h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-[13.5px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

export function SettingsView() {
  const { data, error, loading, reload } = useAdminData<{ contact: Contact; requests: Req[] }>("/api/admin/sozlamalar");
  const toast = useToast();
  const [form, setForm] = useState({ email: "", phone: "", telegram: "" });
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [reject, setReject] = useState<{ id: string; note: string } | null>(null);

  useEffect(() => {
    // sync the form with the loaded settings
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (data?.contact) setForm({ email: data.contact.email ?? "", phone: data.contact.phone ?? "", telegram: data.contact.telegram ?? "" });
  }, [data?.contact]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const res = await adminPost("/api/admin/sozlamalar", { action: "contact", ...form });
    setSaving(false);
    if (!res.ok) {
      const body = res as { error: string };
      return toast.show(body.error, "err");
    }
    toast.show("Aloqa ma’lumoti saqlandi");
    void reload();
  }

  async function setStatus(id: string, status: Req["status"], note = "") {
    setBusy(id);
    const res = await adminPost("/api/admin/sozlamalar", { action: "status", id, status, note });
    setBusy(null);
    if (!res.ok) return toast.show(res.error, "err");
    toast.show("Holat yangilandi");
    setReject(null);
    void reload();
  }

  const requests = data?.requests ?? [];
  const open = requests.filter((r) => r.status === "yangi" || r.status === "jarayonda").length;

  return (
    <div className="mx-auto max-w-[1000px]">
      <PageHead title="Sozlamalar" subtitle="Huquqiy sahifalardagi aloqa ma’lumoti va maxfiylik / hisobni o‘chirish so‘rovlari" />
      {error ? <ErrorBox text={error} onRetry={reload} /> : !data ? <Loading /> : (
        <div className="space-y-4" style={{ opacity: loading ? 0.7 : 1 }}>
          <Card className="p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-900"><Settings className="size-4 text-primary" />Ommaviy aloqa ma’lumoti</h2>
            <p className="mt-1 text-[12.5px] text-slate-500">
              /maxfiylik va /shartlar sahifalarida ko‘rsatiladi. Faqat o‘zingiz kiritgan haqiqiy ma’lumot chiqadi; bo‘sh qoldirsangiz, sahifalar ilova ichidagi so‘rov formasini ko‘rsatadi.
            </p>
            <form onSubmit={save} noValidate className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block text-[12.5px] font-semibold text-slate-700">Email
                <input className={field} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="info@sizning-domen.uz" />
              </label>
              <label className="block text-[12.5px] font-semibold text-slate-700">Telefon
                <input className={field} inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998 …" />
              </label>
              <label className="block text-[12.5px] font-semibold text-slate-700">Telegram
                <input className={field} value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} placeholder="@username" />
              </label>
              <div className="sm:col-span-3">
                <button type="submit" disabled={saving} className={btn.primary}>{saving ? "Saqlanmoqda…" : "Saqlash"}</button>
              </div>
            </form>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-[#eceff5] px-4 py-3">
              <h2 className="text-[15px] font-bold text-slate-900">Maxfiylik va o‘chirish so‘rovlari</h2>
              {open ? <Pill tone="orange">{open} ta ochiq</Pill> : null}
            </div>
            {requests.length === 0 ? (
              <Empty title="Hali so‘rov yo‘q" hint="/hisobni-ochirish formasi orqali kelgan so‘rovlar shu yerda ko‘rinadi." />
            ) : (
              <ul className="divide-y divide-[#eef1f6]">
                {requests.map((r) => {
                  const st = STATUS[r.status];
                  const isOpen = r.status === "yangi" || r.status === "jarayonda";
                  return (
                    <li key={r.id} className="space-y-1.5 px-4 py-3.5" data-testid="privacy-row">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-semibold text-slate-900">{r.name}</span>
                        <Pill tone={st.tone}>{st.label}</Pill>
                        <Pill tone="gray">{SCOPE[r.scope]}</Pill>
                        <Pill tone={r.registered ? "green" : "gray"}>{r.registered ? "Ro‘yxatdan o‘tgan" : "Mehmon"}</Pill>
                        <span className="ml-auto text-[12px] text-slate-400">{fmtDate(r.createdAt, true)}</span>
                      </div>
                      <p className="text-[13px] text-slate-600">{[r.phone, r.email].filter(Boolean).join(" · ")}</p>
                      {r.message ? <p className="whitespace-pre-line text-[13px] text-slate-600">“{r.message}”</p> : null}
                      {r.adminNote ? <p className="text-[12.5px] text-slate-500">Izoh: {r.adminNote}</p> : null}
                      {isOpen ? (
                        reject?.id === r.id ? (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <input className={`${field} max-w-sm`} placeholder="Rad etish sababi" value={reject.note} onChange={(e) => setReject({ id: r.id, note: e.target.value })} />
                            <button type="button" disabled={busy === r.id} className={btn.dangerSolid} onClick={() => setStatus(r.id, "rad", reject.note)}>Rad etish</button>
                            <button type="button" className={btn.outline} onClick={() => setReject(null)}>Bekor</button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {r.status === "yangi" ? <button type="button" disabled={busy === r.id} className={btn.outline} onClick={() => setStatus(r.id, "jarayonda")}>Jarayonda</button> : null}
                            <button type="button" disabled={busy === r.id} className={btn.primary} onClick={() => setStatus(r.id, "bajarildi")}>Bajarildi</button>
                            <button type="button" disabled={busy === r.id} className={btn.danger} onClick={() => setReject({ id: r.id, note: "" })}>Rad etish</button>
                          </div>
                        )
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

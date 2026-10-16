"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { Gate } from "@/components/work-ui";
import type { State } from "@/components/clinic-dashboard";
import type { FieldErrors } from "@/lib/work-validate";
import { api } from "@/lib/work-client";

/** Same data source and write ops as the Mening klinikam dashboard (/api/work/clinic). */
export function useClinic() {
  const { profile, ready } = useDoctorProfile();
  const userId = profile?.id ?? null;
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await api<{ state: State }>("/api/work/clinic");
    if (res.ok) setState(res.data.state ?? null);
    else setError(res.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- signed-out: nothing to load
      setLoading(false);
      return;
    }
    void load();
  }, [ready, userId, load]);

  const op = useCallback(
    async (name: string, data: Record<string, unknown>, id?: string): Promise<{ ok: true } | { ok: false; error: string; errors?: FieldErrors }> => {
      setBusy(true);
      setError("");
      const res = await api<{ state: State }>("/api/work/clinic", { body: { op: name, id, data } });
      setBusy(false);
      if (!res.ok) return { ok: false, error: res.error, errors: res.errors };
      setState(res.data.state);
      return { ok: true };
    },
    [],
  );

  return { ready, signedIn: Boolean(userId), state, loading, error, setError, busy, op };
}

export function CrmFrame({ next, children }: { next: string; children: (s: ReturnType<typeof useClinic>) => ReactNode }) {
  const clinic = useClinic();
  let body: ReactNode;
  if (!clinic.ready || clinic.loading) body = <div className="h-[420px] animate-pulse rounded-2xl bg-white" />;
  else if (!clinic.signedIn)
    body = <Gate title="Kirish talab qilinadi" text="Klinika ma’lumotlari shaxsiy — faqat egasi ko‘radi. Davom etish uchun tizimga kiring." next={next} />;
  else body = children(clinic);
  return (
    <div className="min-w-0">{body}</div>
  );
}

export function CrmTitle({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  return (
    <header className="mb-4 flex flex-wrap items-start gap-3">
      <div className="min-w-0">
        <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#0B1F4D] lg:text-[30px]">{title}</h1>
        <p className="mt-1 text-[13.5px] text-[#8b93a7] lg:text-[15px]">{subtitle}</p>
      </div>
      {actions ? <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export const fmtDate = (iso: string | null | undefined) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : "—");
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
export const selectCls =
  "h-10 w-full appearance-none rounded-xl border border-[#e6eaf2] bg-white pr-8 pl-3.5 text-[12.5px] font-medium text-[#1f2a44] outline-none focus:border-[#0066FF]";

"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { marketingNeeds, site } from "@/data/site";

type FormState = {
  name: string;
  clinic: string;
  contact: string;
  needs: string[];
  notes: string;
};

const empty: FormState = {
  name: "",
  clinic: "",
  contact: "",
  needs: [],
  notes: "",
};

export function MarketingForm() {
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function toggleNeed(id: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      needs: checked
        ? [...current.needs, id]
        : current.needs.filter((item) => item !== id),
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.clinic.trim() || !form.contact.trim()) {
      setError("Ism, klinika va telefon yoki Telegramni yozing.");
      return;
    }
    if (form.needs.length === 0) {
      setError("Kerakli xizmatlardan kamida bittasini belgilang.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/marketing-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...form, website: "" }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "So‘rovni saqlab bo‘lmadi.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("So‘rovni saqlab bo‘lmadi.");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-white px-8 py-12">
        <p className="text-sm font-medium text-primary">So‘rov qabul qilindi</p>
        <h2 className="mt-2 text-2xl font-semibold">Rahmat, {form.name}.</h2>
        <p className="mt-3 max-w-lg text-muted-foreground">
          {form.clinic} uchun so‘rovingiz yozib olindi. Tez orada Telegram yoki telefon
          orqali bog‘lanamiz. Hozircha to‘lov yo‘q.
        </p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={() => {
            setForm(empty);
            setSubmitted(false);
          }}
        >
          Yana so‘rov yuborish
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-white px-8 py-8">
      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
        <Field id="name" label="Ismingiz">
          <Input
            id="name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="h-11 rounded-xl px-3.5 text-sm md:text-sm"
            placeholder="Masalan, Dilnoza Karimova"
          />
        </Field>
        <Field id="clinic" label="Klinika nomi">
          <Input
            id="clinic"
            value={form.clinic}
            onChange={(event) => setForm({ ...form, clinic: event.target.value })}
            className="h-11 rounded-xl px-3.5 text-sm md:text-sm"
            placeholder="Masalan, Smile Dental"
          />
        </Field>
        <Field id="contact" label="Telefon yoki Telegram" className="col-span-2">
          <Input
            id="contact"
            value={form.contact}
            onChange={(event) => setForm({ ...form, contact: event.target.value })}
            className="h-11 rounded-xl px-3.5 text-sm md:text-sm"
            placeholder="+998 … yoki @username"
          />
        </Field>
      </div>

      <fieldset className="mt-6">
        <legend className="mb-3 text-sm font-medium">Nima kerak?</legend>
        <div className="grid grid-cols-2 gap-2.5">
          {marketingNeeds.map((need) => {
            const checked = form.needs.includes(need.id);
            return (
              <label
                key={need.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3.5 py-3 text-sm hover:bg-slate-50"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => toggleNeed(need.id, value === true)}
                  className="size-4"
                />
                {need.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <Field id="notes" label="Izoh (ixtiyoriy)" className="mt-6">
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(event) => setForm({ ...form, notes: event.target.value })}
          className="min-h-24 rounded-xl px-3.5 py-3 text-sm md:text-sm"
          placeholder="Qisqa aytib o‘ting: nima kerak va qachon."
        />
      </Field>

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-[12px] text-muted-foreground">
          So‘rov saqlanadi. Kerak bo‘lsa {site.telegramHandle}.
        </p>
        <Button type="submit" disabled={busy}>{busy ? "Yuborilmoqda…" : "So‘rovni yuborish"}</Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  children,
  className,
}: {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-2 text-sm font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

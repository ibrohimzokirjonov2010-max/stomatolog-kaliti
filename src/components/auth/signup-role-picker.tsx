"use client";

import { Check, FlaskConical, GraduationCap, Hospital, Store, Stethoscope, type LucideIcon } from "lucide-react";
import { SIGNUP_ROLES, type SignupRoleId } from "@/lib/signup-roles";

const ICONS: Record<SignupRoleId, LucideIcon> = {
  Stomatolog: Stethoscope,
  Talaba: GraduationCap,
  "Klinika egasi": Hospital,
  "Tish texnigi": FlaskConical,
  Sotuvchi: Store,
};

export function SignupRolePicker({ value, onChange }: { value: string; onChange: (id: SignupRoleId) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[13.5px] font-semibold text-[#1a1d26]">
        Rolingizni tanlang<span className="ml-0.5 text-[#e5484d]">*</span>
      </legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        {SIGNUP_ROLES.map(({ id, label, sub }, index) => {
          const Icon = ICONS[id];
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(id)}
              className={`relative flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition ${index < 3 ? "sm:col-span-2" : "sm:col-span-3"} ${
                selected ? "border-[#1d6cf2] bg-[#eef4ff]" : "border-[#e3e9f1] bg-white hover:border-[#a9c6fb]"
              }`}
            >
              {selected ? (
                <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-[#1d6cf2] text-white">
                  <Check className="size-3" />
                </span>
              ) : null}
              <Icon className="size-6 text-[#1d6cf2]" />
              <span className="text-[12.5px] font-bold text-[#0f1e3d]">{label}</span>
              <span className="text-[10.5px] leading-tight text-[#6b7a90]">{sub}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

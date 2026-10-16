"use client";

import { CrmFrame, type CrmKey } from "@/components/crm/desktop/CrmFrame";

export function CrmStubDesktop({ title, text, active }: { title: string; text: string; active: CrmKey }) {
  return (
    <CrmFrame active={active} placeholder="Qidirish...">
      <div data-testid="crm-stub">
        <h1 style={{ fontSize: "calc(1.3 * var(--u))" }}>{title}</h1>
        <p className="crm-muted">{text}</p>
      </div>
    </CrmFrame>
  );
}

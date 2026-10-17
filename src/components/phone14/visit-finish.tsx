"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/phone14/chrome";
import { patientPlans } from "@/data/phone-records";
import { finishUnpaid, type QueueAppt } from "@/data/phone-queue";
import { formatGroupedNumber } from "@/lib/format";

export function VisitFinishSheet({ appt, onClose }: { appt: QueueAppt; onClose: () => void }) {
  const router = useRouter();
  const [notes, setNotes] = useState(appt.note);
  const [plans, setPlans] = useState(false);
  const list = patientPlans(appt.patientId);

  function unpaid() {
    finishUnpaid({ ...appt, note: notes }, notes);
    onClose();
    router.push("/crm/uchrashuvlar");
  }

  function pay(plan?: string, amount = appt.amount) {
    const params = new URLSearchParams({
      patient: appt.patientId,
      visit: appt.id,
      amount: String(amount),
      notes,
    });
    if (plan) params.set("plan", plan);
    onClose();
    router.push(`/crm/tolovlar/yangi?${params.toString()}`);
  }

  return (
    <Sheet title="Qabulni yakunlash" onClose={onClose}>
      <div className="finish-sheet" data-testid="finish-sheet">
        <p><b>{appt.name}</b></p>
        <p className="spec">{appt.service} · tish {appt.tooth}</p>
        <p className="spec">{formatGroupedNumber(appt.amount)} so‘m</p>
        <label className="crm-field">Izoh
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Qabul haqida izoh" />
        </label>
        <button type="button" className="crm-save" data-testid="finish-pay" onClick={() => pay()}>To‘lov qilish</button>
        <button type="button" className="p14-chip" onClick={() => setPlans((value) => !value)}>Reja bo‘yicha to‘lov</button>
        {plans ? (
          <div className="sheet-links">
            {list.length === 0 ? <p className="spec">Reja yo‘q</p> : list.map((plan) => (
              <button key={plan.id} type="button" onClick={() => pay(plan.name, Math.max(0, plan.total - plan.paid) || appt.amount)}>
                {plan.name} · {formatGroupedNumber(Math.max(0, plan.total - plan.paid))} so‘m
              </button>
            ))}
          </div>
        ) : null}
        <button type="button" className="crm-save ghost-save" data-testid="finish-unpaid" onClick={unpaid}>To‘lovsiz yakunlash</button>
      </div>
    </Sheet>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

/** Hali ishlamaydigan boshqaruv uchun qisqa xabar (dizaynni o‘zgartirmaydi). */
export function useSoonToast() {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!text) return;
    const t = window.setTimeout(() => setText(""), 2200);
    return () => window.clearTimeout(t);
  }, [text]);
  const show = useCallback((msg: string) => setText(msg), []);
  const node = text ? (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[70] mx-auto w-fit max-w-[90%] rounded-2xl bg-[#111827] px-4 py-2.5 text-center text-[13px] font-medium text-white shadow-lg"
    >
      {text}
    </div>
  ) : null;
  return { show, node };
}

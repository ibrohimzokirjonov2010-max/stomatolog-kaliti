"use client";

import { useEffect, useState } from "react";

/** Honest SMS gate: blocks nothing until a provider key is configured. */
export function PublishNote() {
  const [text, setText] = useState("");
  useEffect(() => {
    let stop = false;
    void fetch("/api/forms/publish-gate")
      .then((res) => res.json())
      .then((data: { message?: string }) => {
        if (!stop && data?.message) setText(data.message);
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, []);
  if (!text) return null;
  return (
    <p className="text-[12.5px] leading-snug text-[#6b7280]" data-testid="sms-otp-note">
      {text}
    </p>
  );
}

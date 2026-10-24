"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

/** Remembers landing UTMs in localStorage so sign-up can store them on the lead. */
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}

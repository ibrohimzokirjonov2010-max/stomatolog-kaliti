const KEY = "sh_attr_v1";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  landing_path?: string;
};

function clip(value: string | null | undefined, max: number) {
  const text = value?.trim() ?? "";
  return text ? text.slice(0, max) : undefined;
}

export function readAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Attribution;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** First-touch: keep the first landing UTMs, fill blanks from a later visit. */
export function captureAttribution() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const incoming: Attribution = {};
  for (const key of UTM_KEYS) {
    const value = clip(params.get(key), 120);
    if (value) incoming[key] = value;
  }
  const current = readAttribution();
  const next: Attribution = { ...current };
  for (const key of UTM_KEYS) {
    if (!next[key] && incoming[key]) next[key] = incoming[key];
  }
  if (!next.referrer) {
    const referrer = clip(document.referrer, 300);
    if (referrer && !referrer.includes(window.location.host)) next.referrer = referrer;
  }
  if (!next.landing_path) next.landing_path = window.location.pathname.slice(0, 200);
  localStorage.setItem(KEY, JSON.stringify(next));
}

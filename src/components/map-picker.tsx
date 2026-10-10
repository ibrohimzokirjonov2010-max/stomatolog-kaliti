"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Building2, Check, House, LocateFixed, Loader2, MapPin, Search, Trash2 } from "lucide-react";
import type { SavedPlace } from "@/lib/saved-addresses";
import { cn } from "@/lib/utils";

/* Minimal Leaflet typing (loaded from CDN to avoid touching shared node_modules). */
type LatLng = { lat: number; lng: number };
type LMap = {
  setView: (c: [number, number], z?: number, o?: unknown) => LMap;
  getCenter: () => LatLng;
  on: (ev: string, fn: (e: { latlng: LatLng }) => void) => void;
  remove: () => void;
  invalidateSize: () => void;
  getZoom: () => number;
};
type LeafletNS = {
  map: (el: HTMLElement, o?: unknown) => LMap;
  tileLayer: (url: string, o?: unknown) => { addTo: (m: LMap) => void };
};
declare global {
  interface Window {
    L?: LeafletNS;
  }
}

let leafletPromise: Promise<LeafletNS> | null = null;
function loadLeaflet(): Promise<LeafletNS> {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    css.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    css.crossOrigin = "";
    document.head.appendChild(css);
    const js = document.createElement("script");
    js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    js.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    js.crossOrigin = "";
    js.onload = () => (window.L ? resolve(window.L) : reject(new Error("leaflet")));
    js.onerror = () => {
      leafletPromise = null;
      reject(new Error("leaflet"));
    };
    document.head.appendChild(js);
  });
  return leafletPromise;
}

/** Default view only (city centre), not a user location. */
const CITY_CENTERS: Record<string, [number, number]> = {
  Toshkent: [41.3111, 69.2797],
  Samarqand: [39.6542, 66.9597],
  Buxoro: [39.7747, 64.4286],
  "Farg‘ona": [40.3864, 71.7864],
  Andijon: [40.7821, 72.3442],
  Namangan: [40.9983, 71.6726],
  Qarshi: [38.8606, 65.7891],
  Nukus: [42.4531, 59.6103],
  Urganch: [41.55, 60.6333],
  Jizzax: [40.1158, 67.8422],
  Navoiy: [40.0844, 65.3792],
  Termiz: [37.2242, 67.2783],
  Guliston: [40.4897, 68.7842],
};

type Geo = { address: string; district: string };

async function reverseGeocode(p: LatLng): Promise<Geo | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${p.lat}&lon=${p.lng}&zoom=18&addressdetails=1&accept-language=uz`,
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { address?: Record<string, string>; display_name?: string };
    const a = j.address ?? {};
    const street = [a.road ?? a.pedestrian ?? a.neighbourhood ?? a.quarter, a.house_number].filter(Boolean).join(", ");
    const district = a.city_district ?? a.suburb ?? a.county ?? a.district ?? "";
    const address = street || (j.display_name ?? "").split(",").slice(0, 2).join(",").trim();
    return { address, district };
  } catch {
    return null;
  }
}

async function searchPlace(q: string, city: string): Promise<LatLng | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=uz&accept-language=uz&q=${encodeURIComponent(`${q}, ${city}`)}`,
    );
    const j = (await r.json()) as { lat: string; lon: string }[];
    return j[0] ? { lat: +j[0].lat, lng: +j[0].lon } : null;
  } catch {
    return null;
  }
}

export type PickedPlace = { lat: number; lng: number; address: string; district: string };

const QUICK_LABELS = ["Uy", "Klinika", "2-filial", "3-filial"];

export function PlaceIcon({ label, className }: { label: string; className?: string }) {
  return /^uy\b/i.test(label.trim()) ? <House className={className} /> : <Building2 className={className} />;
}

export function MapPicker({
  open,
  city,
  initial,
  places,
  onClose,
  onConfirm,
  onSave,
  onRemove,
  simple = false,
}: {
  simple?: boolean;
  open: boolean;
  city: string;
  initial: PickedPlace | null;
  places: SavedPlace[];
  onClose: () => void;
  onConfirm: (p: PickedPlace) => void;
  onSave: (p: PickedPlace & { label: string }) => Promise<string | null>;
  onRemove: (id: string) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const seq = useRef(0);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [moved, setMoved] = useState(false);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [mapErr, setMapErr] = useState("");
  const [locMsg, setLocMsg] = useState("");
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Init map when opened.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const start: [number, number] = initial ? [initial.lat, initial.lng] : (CITY_CENTERS[city] ?? CITY_CENTERS.Toshkent);
    /* eslint-disable react-hooks/set-state-in-effect -- reset picker state on open */
    setAddress(initial?.address ?? "");
    setGeo(initial ? { address: initial.address, district: initial.district } : null);
    setMoved(!!initial);
    setLabel("");
    setSaveMsg("");
    setMapErr("");
    /* eslint-enable react-hooks/set-state-in-effect */
    loadLeaflet()
      .then((L) => {
        if (cancelled || !boxRef.current) return;
        const map = L.map(boxRef.current, { zoomControl: false, attributionControl: true }).setView(start, initial ? 17 : 13);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(map);
        map.on("moveend", () => {
          setCenter(map.getCenter());
        });
        map.on("dragstart", () => setMoved(true));
        map.on("click", (e) => {
          setMoved(true);
          map.setView([e.latlng.lat, e.latlng.lng], Math.max(map.getZoom(), 16), { animate: true });
        });
        mapRef.current = map;
        setCenter(map.getCenter());
        setTimeout(() => map.invalidateSize(), 50);
        if (!initial) locate(map);
      })
      .catch(() => !cancelled && setMapErr("Xarita yuklanmadi. Internetni tekshiring."));
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reverse-geocode the pin after the map stops moving.
  useEffect(() => {
    if (!open || !center || !moved) return;
    const id = ++seq.current;
    const t = setTimeout(async () => {
      setBusy(true);
      const g = await reverseGeocode(center);
      if (id !== seq.current) return;
      setBusy(false);
      setGeo(g);
      if (g?.address) setAddress(g.address);
    }, 450);
    return () => clearTimeout(t);
  }, [center, moved, open]);

  function locate(map = mapRef.current) {
    if (!map) return;
    if (!("geolocation" in navigator)) {
      setLocMsg("Qurilma joylashuvni aniqlay olmaydi.");
      return;
    }
    setLocMsg("Joylashuv aniqlanmoqda...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocMsg("");
        setMoved(true);
        map.setView([pos.coords.latitude, pos.coords.longitude], 17);
      },
      () => setLocMsg("Joylashuvga ruxsat berilmadi — pinni xaritada suring."),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  async function doSearch() {
    if (!query.trim() || !mapRef.current) return;
    setBusy(true);
    const p = await searchPlace(query.trim(), city);
    setBusy(false);
    if (!p) {
      setLocMsg("Topilmadi. Boshqacha yozing yoki pinni suring.");
      return;
    }
    setLocMsg("");
    setMoved(true);
    mapRef.current.setView([p.lat, p.lng], 17);
  }

  function goTo(p: SavedPlace) {
    if (p.lat != null && p.lng != null && mapRef.current) {
      mapRef.current.setView([p.lat, p.lng], 17);
    }
    onConfirm({
      lat: p.lat ?? NaN,
      lng: p.lng ?? NaN,
      address: p.address,
      district: p.district ?? "",
    });
  }

  const picked: PickedPlace | null =
    center && moved && address.trim()
      ? { lat: +center.lat.toFixed(6), lng: +center.lng.toFixed(6), address: address.trim(), district: geo?.district ?? "" }
      : null;

  async function save() {
    if (!picked) return setSaveMsg("Avval pinni joylang.");
    if (!label.trim()) return setSaveMsg("Manzilga nom bering (masalan, Uy).");
    setSaving(true);
    const err = await onSave({ ...picked, label: label.trim() });
    setSaving(false);
    setSaveMsg(err ?? "Saqlandi ✓");
    if (!err) setLabel("");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#f4f6fa]" data-testid="map-picker" role="dialog" aria-label="Xaritadan tanlash">
      <div className="flex items-center gap-2 bg-white px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-10 place-items-center rounded-full bg-[#f4f6fa] text-[#0B1220]">
          <ArrowLeft className="size-5" />
        </button>
        <form
          className="flex h-10 flex-1 items-center gap-2 rounded-full bg-[#f4f6fa] px-3"
          onSubmit={(e) => {
            e.preventDefault();
            void doSearch();
          }}
        >
          <Search className="size-4 shrink-0 text-[#7a8397]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ko‘cha yoki joy nomini qidiring"
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#9aa3b5]"
          />
        </form>
      </div>

      <div className="relative min-h-0 flex-1">
        <div ref={boxRef} className="absolute inset-0 z-0 bg-[#e5e9ef]" />
        {mapErr ? (
          <p className="absolute inset-x-4 top-4 z-[5] rounded-xl bg-white p-3 text-center text-[13px] text-[#dc2626] shadow">{mapErr}</p>
        ) : null}
        {/* Center pin: map moves under it (drag or tap). */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-[5] -translate-x-1/2 -translate-y-full" data-testid="map-pin">
          <MapPin className="size-11 fill-[#1f6bff] text-white drop-shadow-[0_4px_6px_rgba(15,23,42,0.35)]" strokeWidth={1.6} />
        </div>
        <span className="pointer-events-none absolute top-1/2 left-1/2 z-[4] h-1.5 w-3 -translate-x-1/2 rounded-full bg-black/25" />
        <button
          type="button"
          onClick={() => locate()}
          aria-label="Mening joylashuvim"
          className="absolute right-3 bottom-3 z-[5] grid size-11 place-items-center rounded-full bg-white text-[#1f6bff] shadow-[0_4px_12px_rgba(15,23,42,0.18)]"
        >
          <LocateFixed className="size-5" />
        </button>
        {locMsg ? (
          <p className="absolute inset-x-14 bottom-4 z-[5] rounded-full bg-white/95 px-3 py-1.5 text-center text-[12px] text-[#4b5568] shadow">{locMsg}</p>
        ) : null}
      </div>

      <div className="max-h-[58%] overflow-y-auto rounded-t-[22px] bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(15,23,42,0.08)]">
        <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-[#dfe4ec]" />
        <p className="text-[12px] text-[#7a8397]">Pin joylashgan manzil</p>
        <div className="mt-1 flex min-h-[48px] items-center gap-2.5 rounded-[12px] border border-[#e3e8f0] px-3 focus-within:border-[#1f6bff]">
          {busy ? <Loader2 className="size-[18px] shrink-0 animate-spin text-[#1f6bff]" /> : <MapPin className="size-[18px] shrink-0 text-[#1f6bff]" />}
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={moved ? "Manzil aniqlanmoqda — kerak bo‘lsa o‘zingiz yozing" : "Pinni kerakli joyga suring yoki bosing"}
            className="min-w-0 flex-1 bg-transparent text-[14.5px] font-medium text-[#0B1220] outline-none placeholder:font-normal placeholder:text-[#9aa3b5]"
            data-testid="map-address"
          />
        </div>
        {geo?.district || picked ? (
          <p className="mt-1 px-1 text-[11.5px] text-[#7a8397]">
            {[geo?.district, picked ? `${picked.lat}, ${picked.lng}` : ""].filter(Boolean).join(" · ")}
          </p>
        ) : null}

{simple ? null : (<>
        {/* Saved places */}
        <p className="mt-3 text-[13.5px] font-bold text-[#0B1220]">Saqlangan manzillar</p>
        {places.length === 0 ? (
          <p className="mt-1.5 rounded-[12px] bg-[#f4f6fa] px-3 py-2.5 text-[13px] text-[#7a8397]" data-testid="saved-empty">
            Hali saqlangan manzil yo‘q
          </p>
        ) : (
          <ul className="mt-1.5 space-y-1.5" data-testid="saved-list">
            {places.map((p) => (
              <li key={p.id} className="flex items-center gap-2.5 rounded-[12px] border border-[#e3e8f0] px-2.5 py-2">
                <button type="button" onClick={() => goTo(p)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-[#1f6bff]">
                    <PlaceIcon label={p.label} className="size-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-[#0B1220]">{p.label}</span>
                    <span className="block truncate text-[12px] text-[#7a8397]">
                      {[p.district, p.address].filter(Boolean).join(", ")}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`«${p.label}» o‘chirilsinmi?`)) onRemove(p.id);
                  }}
                  aria-label={`${p.label} — o‘chirish`}
                  className="grid size-8 shrink-0 place-items-center text-[#9aa3b5]"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Save current pin */}
        <div className="mt-3 rounded-[14px] bg-[#f7f9fc] p-2.5">
          <p className="text-[12.5px] font-semibold text-[#0B1220]">Shu manzilni saqlash</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {QUICK_LABELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLabel(l)}
                className={cn(
                  "h-8 rounded-full border px-3 text-[12.5px] font-medium",
                  label === l ? "border-[#1f6bff] bg-[#e8f1ff] text-[#1f6bff]" : "border-[#dfe4ec] bg-white text-[#4b5568]",
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex gap-1.5">
            <input
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setSaveMsg("");
              }}
              maxLength={40}
              placeholder="Nomi (masalan, 3-filial)"
              className="h-10 min-w-0 flex-1 rounded-[10px] border border-[#e3e8f0] bg-white px-3 text-[14px] outline-none focus:border-[#1f6bff]"
              data-testid="save-label"
            />
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="h-10 shrink-0 rounded-[10px] bg-[#0B1220] px-4 text-[13.5px] font-semibold text-white disabled:opacity-60"
              data-testid="save-place"
            >
              {saving ? "..." : "Saqlash"}
            </button>
          </div>
          {saveMsg ? <p className="mt-1.5 px-1 text-[12px] text-[#4b5568]">{saveMsg}</p> : null}
        </div>

</>)}

        <button
          type="button"
          disabled={!picked}
          onClick={() => picked && onConfirm(picked)}
          className="mt-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#1f6bff] text-[16px] font-semibold text-white shadow-[0_8px_20px_rgba(31,107,255,0.3)] disabled:bg-[#c9d6f0] disabled:shadow-none"
          data-testid="map-confirm"
        >
          <Check className="size-5" /> Shu manzilni tanlash
        </button>
      </div>
    </div>
  );
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "StomaHub — stomatologlar platformasi",
    short_name: "StomaHub",
    description: "Stomatologlar uchun yagona platforma: marketplace, seminarlar, ustalar, laboratoriya.",
    lang: "uz",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0066FF",
    categories: ["medical", "business", "shopping"],
    icons: [
      { src: "/icons/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/pwa/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/pwa/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Marketplace", url: "/marketplace", icons: [{ src: "/icons/marketplace-128.png", sizes: "128x128", type: "image/png" }] },
      { name: "Seminarlar", url: "/seminarlar", icons: [{ src: "/icons/seminarlar-128.png", sizes: "128x128", type: "image/png" }] },
      { name: "Ustalar", url: "/ustalar" },
      { name: "Laboratoriya", url: "/laboratoriya", icons: [{ src: "/icons/laboratoriya-128.png", sizes: "128x128", type: "image/png" }] },
    ],
  };
}

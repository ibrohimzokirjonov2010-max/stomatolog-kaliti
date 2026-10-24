/* StomaHub service worker — minimal: installability + offline fallback for page loads.
   No asset caching, so new deploys are always picked up. */
const OFFLINE_HTML = `<!doctype html><html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>StomaHub — internet yo‘q</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#F4F7FC;color:#0B1220;text-align:center;padding:24px}b{display:block;font-size:20px;margin:16px 0 8px}button{margin-top:20px;background:#0F766E;color:#fff;border:0;border-radius:12px;padding:12px 20px;font-size:15px;font-weight:600}</style></head><body><div><img src="/icons/pwa/icon-192.png" width="72" height="72" alt="" style="border-radius:18px"><b>Internet aloqasi yo‘q</b><span>Aloqa tiklangach sahifani yangilang.</span><br><button onclick="location.reload()">Qayta urinish</button></div></body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open("stomahub-v1").then((c) => c.add("/icons/pwa/icon-192.png")).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin && url.pathname === "/icons/pwa/icon-192.png") {
    event.respondWith(caches.match(req).then((r) => r || fetch(req)));
    return;
  }
  if (req.mode !== "navigate") return;
  event.respondWith(
    fetch(req).catch(
      () => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } }),
    ),
  );
});

// Сервис-воркер: сохраняет файлы программы на устройстве, чтобы учебный режим открывался без сети.
// Порядок «сначала сеть»: при связи всегда свежая версия, без связи — сохранённая. Расчёты (api/*) не сохраняются,
// кроме описания программы и прогресса — они нужны учебному режиму без сети.
const CACHE = "polygon-7687ba1fa5";
const SHELL = ["./","index.html","course/figures.js","course/m00.js","course/index.js","course.js","icon-192.png","icon-512.png","apple-touch-icon.png","manifest.webmanifest","store-idb.js","worker.js","app.js","wizard.js","lib/backtest.js","lib/diagnostics.js","lib/indicators.js","lib/paper.js","lib/rules.js","lib/stats.js","lib/strategies.js","lib/data.js","lib/journal.js","lib/pairs.js","lib/currency.js","lib/benchmarks.js","lib/grid.js","lib/funding.js","lib/dca.js","lib/scan.js","lib/coins.js","lib/state.js","lib/progress.js","lib/catalog.js","lib/store.js","lib/service.js","meta.json"];
const KEEP_API = /\/api\/(meta|progress)$/;

self.addEventListener("install", (e) => {
  // по одному: на компьютере нет meta.json, на сайте нет api — отсутствие одного файла не мешает остальным
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // биржи и запросы с данными — мимо
  if (url.pathname.includes("/api/") && !KEEP_API.test(url.pathname)) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const res = await fetch(e.request);
      if (res.ok) c.put(e.request, res.clone());
      return res;
    } catch {
      const hit = await c.match(e.request, { ignoreSearch: true });
      return hit || (e.request.mode === "navigate" && (await c.match("index.html"))) || Response.error();
    }
  })());
});

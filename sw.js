// Сервис-воркер: сохраняет файлы программы на устройстве, чтобы учебный режим открывался без сети.
// Порядок «сначала сеть»: при связи всегда свежая версия, без связи — сохранённая. Кэш браузера не используется
// (сайт отдаёт файлы с разрешением хранить 10 минут): иначе после обновления новая страница получала бы старый app.js. Расчёты (api/*) не сохраняются,
// кроме описания программы и прогресса — они нужны учебному режиму без сети.
const CACHE = "polygon-8498fe75be";
const SHELL = ["./","i18n.js","store-idb.js","wizard.js","worker.js","course/index.js","course/m00.js","course/fig-m01.js","course/fig-m02.js","course/fig-m03.js","course/fig-m04.js","course/fig-m05.js","course/m01.js","course/m02.js","course/m03.js","course/m04.js","course/m05.js","course/data.js","course/fig-m06.js","course/fig-m08.js","course/fig-m10.js","course/fig-m09.js","course/m07.js","course/m08.js","course/m09.js","course/m10.js","course/glossary.js","course/m06.js","course/fig-m12.js","course/m11.js","course/m12.js","course/m13.js","course/fig-m14.js","course/m14.js","course/videos.js","course/tr.js","course/sims.js","course/fig-m11.js","course/fig-m13.js","course/draw.js","course/fig-m07.js","course/figures.js","sim/amm.js","sim/lending.js","sim/market.js","sim/block.js","sim/option.js","sim/ruin.js","sim/ta.js","sim/monkeys.js","sim/ml.js","sim/tax.js","sim/agents.js","app.js","apple-touch-icon.png","candles.js","fonts/OFL-ibm-plex-sans.txt","fonts/OFL-jetbrains-mono.txt","fonts/OFL-pt-serif.txt","fonts/fonts.css","fonts/ibm-plex-sans-cyrillic-400-normal.woff2","fonts/ibm-plex-sans-cyrillic-500-normal.woff2","fonts/ibm-plex-sans-cyrillic-ext-400-normal.woff2","fonts/ibm-plex-sans-cyrillic-ext-500-normal.woff2","fonts/ibm-plex-sans-latin-400-normal.woff2","fonts/ibm-plex-sans-latin-500-normal.woff2","fonts/ibm-plex-sans-latin-ext-400-normal.woff2","fonts/ibm-plex-sans-latin-ext-500-normal.woff2","fonts/jetbrains-mono-cyrillic-400-normal.woff2","fonts/jetbrains-mono-cyrillic-500-normal.woff2","fonts/jetbrains-mono-cyrillic-ext-400-normal.woff2","fonts/jetbrains-mono-cyrillic-ext-500-normal.woff2","fonts/jetbrains-mono-latin-400-normal.woff2","fonts/jetbrains-mono-latin-500-normal.woff2","fonts/jetbrains-mono-latin-ext-400-normal.woff2","fonts/jetbrains-mono-latin-ext-500-normal.woff2","fonts/pt-serif-cyrillic-400-normal.woff2","fonts/pt-serif-cyrillic-700-normal.woff2","fonts/pt-serif-cyrillic-ext-400-normal.woff2","fonts/pt-serif-cyrillic-ext-700-normal.woff2","fonts/pt-serif-latin-400-normal.woff2","fonts/pt-serif-latin-700-normal.woff2","fonts/pt-serif-latin-ext-400-normal.woff2","fonts/pt-serif-latin-ext-700-normal.woff2","icon-192.png","icon-512.png","manifest.webmanifest","theme.css","course.js","index.html","lib/backtest.js","lib/benchmarks.js","lib/catalog.js","lib/coins.js","lib/currency.js","lib/dca.js","lib/diagnostics.js","lib/grid.js","lib/indicators.js","lib/pairs.js","lib/paper.js","lib/progress.js","lib/rules.js","lib/scan.js","lib/state.js","lib/stats.js","lib/store.js","lib/candles.js","lib/data.js","lib/funding.js","lib/journal.js","lib/proscons.js","lib/service.js","lib/strategies.js","meta.json"];
const KEEP_API = /\/api\/(meta|progress)$/;

self.addEventListener("install", (e) => {
  // по одному: на компьютере нет meta.json, на сайте нет api — отсутствие одного файла не мешает остальным
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // биржи и запросы с данными — мимо
  if (url.pathname.includes("/api/") && !KEEP_API.test(url.pathname)) return;
  if (url.pathname.includes("/media/")) return; // ролики большие и читаются кусками — без кэша, напрямую
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const res = await fetch(e.request, { cache: "no-cache" }); // сверка с сервером: не изменился — короткий ответ 304
      if (res.ok) c.put(e.request, res.clone());
      return res;
    } catch {
      const hit = await c.match(e.request, { ignoreSearch: true });
      return hit || (e.request.mode === "navigate" && (await c.match("index.html"))) || Response.error();
    }
  })());
});

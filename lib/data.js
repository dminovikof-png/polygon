// Загрузка свечей с публичных адресов Bybit, Binance и OKX (без ключей).
// Данные скачивает компьютер пользователя и хранятся только у него в data/cache.
// Программа НЕ содержит встроенных котировок и ничего не отправляет на чужие серверы.
import { store } from "./store.js";

const BASE = "https://api.bybit.com";
// "1m" — только для проверки сетки на минутных свечах (короткое окно), в списке свечей интерфейса его нет.
const INTERVALS = { "1m": "1", "1h": "60", "4h": "240", "1D": "D" };
const STEP_SEC = { "1m": 60, "1h": 3600, "4h": 14400, "1D": 86400 };

export const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT", "ADAUSDT", "LINKUSDT", "AVAXUSDT"];

export const EXCHANGES = ["bybit", "binance", "okx"];
export const EXCHANGE_NAMES = { bybit: "Bybit", binance: "Binance", okx: "OKX" };
// Только рыночные данные (без аккаунта и ключей). Спот Binance — с data-api.binance.vision (адрес для публичных
// рыночных данных), бессрочные фьючерсы Binance — с публичного адреса fapi.binance.com (без ключей).
const BINANCE_BASE = "https://data-api.binance.vision", BINANCE_FAPI = "https://fapi.binance.com";
const BINANCE_INTERVALS = { "1m": "1m", "1h": "1h", "4h": "4h", "1D": "1d" };
const OKX_BASE = "https://www.okx.com";
const OKX_INTERVALS = { "1m": "1m", "1h": "1H", "4h": "4H", "1D": "1Dutc" }; // дневные — по UTC, как у остальных бирж

// Название инструмента OKX: BTCUSDT → BTC-USDT, SOLBTC → SOL-BTC, бессрочный фьючерс → BTC-USDT-SWAP.
export function okxInst(symbol, market = "spot") {
  const m = /^([A-Z0-9]+?)(USDT|BTC)$/.exec(symbol);
  if (!m) throw new Error("OKX: пара должна быть к USDT или к BTC");
  if (market === "linear" && m[2] !== "USDT") throw new Error("Бессрочные фьючерсы — только к USDT");
  return `${m[1]}-${m[2]}${market === "linear" ? "-SWAP" : ""}`;
}

// market: "spot" (по умолчанию) или "linear" — бессрочные фьючерсы к USDT (Bybit, Binance, OKX).
export function validate(symbol, tf, exchange = "bybit", market = "spot") {
  if (market !== "spot" && market !== "linear") throw new Error("Рынок: спот или бессрочный фьючерс");
  if (!EXCHANGES.includes(exchange)) throw new Error("Допустимые биржи: " + EXCHANGES.join(", "));
  if (!/^[A-Z0-9]{2,15}$/.test(symbol)) throw new Error("Некорректный тикер");
  if (!INTERVALS[tf]) throw new Error("Допустимые периоды свечи: " + Object.keys(INTERVALS).join(", "));
}

// Сколько свечей можно запросить: по умолчанию 5000, максимум 20 000 (для 1ч это ~2,3 года, для 1д — вся история).
// Минутных свечей — до 90 000 (около 62 суток).
export const DEFAULT_BARS = 5000, MAX_BARS = 20000, MAX_MINUTE_BARS = 90000;
const maxFor = (tf) => (tf === "1m" ? MAX_MINUTE_BARS : MAX_BARS);
export function clampBars(v, tf) {
  const n = Math.round(Number(v ?? DEFAULT_BARS));
  if (!Number.isFinite(n)) return DEFAULT_BARS;
  return Math.min(maxFor(tf), Math.max(100, n));
}

// Каждая загрузка возвращает { bars, startReached }: startReached = биржа отдала меньше, чем просили, то есть
// раньше этой даты свечей нет (история монеты на бирже начинается здесь).
async function downloadBinance(symbol, tf, maxBars, market = "spot") {
  let out = [];
  let end = null, startReached = false;
  const base = market === "linear" ? `${BINANCE_FAPI}/fapi/v1/klines` : `${BINANCE_BASE}/api/v3/klines`;
  while (out.length < maxBars) {
    const url = `${base}?symbol=${symbol}&interval=${BINANCE_INTERVALS[tf]}&limit=1000${end ? `&endTime=${end}` : ""}`;
    const rows = await getJson(url);
    if (!Array.isArray(rows)) throw new Error("Binance: " + (rows?.msg || "неожиданный ответ"));
    if (!rows.length) { startReached = true; break; }
    // Binance отдаёт от старых к новым.
    const part = rows.map((k) => ({ t: +k[0] / 1000, o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5] }));
    out = part.concat(out);
    end = +rows[0][0] - 1;
    if (rows.length < 1000) { startReached = true; break; }
  }
  return { bars: out, startReached };
}

// OKX отдаёт историю по 100 свечей за запрос (от новых к старым), не больше 20 запросов за 2 секунды.
async function downloadOkx(symbol, tf, maxBars, market = "spot") {
  const inst = okxInst(symbol, market);
  let out = [], after = null, startReached = false;
  while (out.length < maxBars) {
    const url = `${OKX_BASE}/api/v5/market/history-candles?instId=${inst}&bar=${OKX_INTERVALS[tf]}&limit=100${after ? `&after=${after}` : ""}`;
    const j = await getJson(url);
    if (j.code !== "0") throw new Error(`OKX (${inst}): ` + (j.msg || "неожиданный ответ"));
    const rows = j.data || [];
    if (!rows.length) { startReached = true; break; }
    // объём: у спота — в монете (поле 5), у фьючерса поле 5 — в контрактах, в монете — поле 6
    const part = rows.map((k) => ({ t: +k[0] / 1000, o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +(market === "linear" ? k[6] : k[5]) })).reverse();
    out = part.concat(out);
    after = rows.at(-1)[0];
    if (rows.length < 100) { startReached = true; break; }
    await new Promise((r) => setTimeout(r, 110));
  }
  return { bars: out, startReached };
}

// В браузере свой заголовок User-Agent вызвал бы лишний предварительный запрос (CORS), поэтому он только в Node.
// Binance не разрешает браузеру читать свои ответы (проверено 09.11.2026): на устройстве — понятная ошибка.
export const inNode = !!globalThis.process?.versions?.node;
export const BROWSER_BLOCKED = "Binance не отдаёт данные браузеру напрямую, поэтому на планшете и телефоне он недоступен. Выберите Bybit или OKX в общих настройках или откройте программу на компьютере.";

// Повторяет запрос до трёх раз при перегрузке биржи (HTTP 429/5xx, у Bybit retCode 10006 / 10016, у OKX code 50011) с паузой.
export async function getJson(url) {
  if (!inNode && /binance/.test(new URL(url).hostname)) throw new Error(BROWSER_BLOCKED);
  for (let attempt = 1; ; attempt++) {
    let res, body, err = null;
    try {
      res = await fetch(url, { headers: inNode ? { "User-Agent": "chestny-poligon/0.1 (personal backtesting tool)" } : undefined, signal: AbortSignal.timeout(15000) });
      if (res.ok) body = await res.json(); else err = new Error(`Биржа вернула HTTP ${res.status}`);
    } catch (e) { err = e; }
    const busy = err ? !res || res.status === 429 || res.status >= 500 : body && (body.retCode === 10006 || body.retCode === 10016 || body.code === "50011");
    if (!busy || attempt >= 3) { if (err) throw err; return body; }
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
}

// Скачивает свечи, листая назад по 1000 штук. maxBars ограничивает объём.
export async function downloadCandles(symbol, tf, maxBars = DEFAULT_BARS, exchange = "bybit", market = "spot") {
  return (await downloadPaged(symbol, tf, maxBars, exchange, market)).bars;
}

async function downloadPaged(symbol, tf, maxBars, exchange, market = "spot") {
  validate(symbol, tf, exchange, market);
  const r = exchange === "binance" ? await downloadBinance(symbol, tf, maxBars, market) : exchange === "okx" ? await downloadOkx(symbol, tf, maxBars, market) : await downloadBybit(symbol, tf, maxBars, market);
  return { bars: dedupe(r.bars).slice(-maxBars), startReached: r.startReached };
}

async function downloadBybit(symbol, tf, maxBars, market = "spot") {
  let out = [];
  let end = null, startReached = false;
  while (out.length < maxBars) {
    const url = `${BASE}/v5/market/kline?category=${market}&symbol=${symbol}&interval=${INTERVALS[tf]}&limit=1000${end ? `&end=${end}` : ""}`;
    const j = await getJson(url);
    if (j.retCode !== 0) throw new Error("Bybit: " + j.retMsg);
    const rows = j.result?.list || [];
    if (!rows.length) { startReached = true; break; }
    const part = rows.map((k) => ({ t: +k[0] / 1000, o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5] })).reverse();
    out = part.concat(out);
    end = +rows[rows.length - 1][0] - 1;
    if (rows.length < 1000) { startReached = true; break; }
  }
  return { bars: out, startReached };
}

export function dedupe(bars) {
  const out = [];
  for (const b of bars) {
    if (out.length && b.t <= out[out.length - 1].t) {
      if (b.t === out[out.length - 1].t) out[out.length - 1] = b;
      continue;
    }
    out.push(b);
  }
  return out;
}

// Оставляет только ЗАКРЫТЫЕ свечи: последняя свеча, которая ещё формируется, в расчёты не попадает.
export function closedOnly(bars, tf, nowSec = Date.now() / 1000) {
  return bars.filter((b) => b.t + STEP_SEC[tf] <= nowSec);
}

// Кэш: файл data/cache/<биржа>_<монета>_<свеча>.json. Старый формат — просто массив свечей (читается как есть);
// новый — { v: 2, bars, startReached }. Кэш хранит всё скачанное (до MAX_BARS), запрошенное число — срез при чтении.
export function parseCache(raw) {
  if (Array.isArray(raw)) return { bars: raw, startReached: false };
  if (raw && Array.isArray(raw.bars)) return { bars: raw.bars, startReached: !!raw.startReached };
  return { bars: [], startReached: false };
}

// Дошла ли загрузка до начала истории монеты на бирже (по кэшу). Нужно, чтобы отличать «история с такой-то даты»
// от «не меньше, чем скачано».
export async function cacheStartReached(symbol, tf, exchange = "bybit", market = "spot") {
  return parseCache(await store().load(cacheKey(symbol, tf, exchange, market))).startReached;
}
const cacheKey = (symbol, tf, exchange, market) => `cache/${exchange}${market === "spot" ? "" : "-" + market}_${symbol}_${tf}.json`;

// Берёт из кэша; если кэш устарел, докачивает только «хвост» (последние свечи) и склеивает.
// Если запрошено больше свечей, чем есть в кэше, и начало истории ещё не достигнуто, скачивает глубже.
export async function loadCandles(symbol, tf, { refresh = false, maxBars = DEFAULT_BARS, exchange = "bybit", market = "spot" } = {}) {
  validate(symbol, tf, exchange, market);
  maxBars = clampBars(maxBars, tf);
  const key = cacheKey(symbol, tf, exchange, market);
  const cached = parseCache(await store().load(key)); // нет или испорчен — пустой, скачивается заново
  const now = Date.now() / 1000;
  const have = cached.bars;
  const deeper = have.length < maxBars && !cached.startReached;
  const fresh = have.length && now - have.at(-1).t < 2 * STEP_SEC[tf];
  if (fresh && !refresh && !deeper) return closedOnly(have, tf, now).slice(-maxBars);
  let bars, startReached = cached.startReached;
  // хвост — столько свечей, сколько прошло с последней в кэше (не меньше 300), чтобы он перекрыл кэш
  const tailN = have.length ? Math.min(maxFor(tf), Math.max(300, Math.ceil((now - have.at(-1).t) / STEP_SEC[tf]) + 50)) : 0;
  const tail = have.length && !deeper ? await downloadCandles(symbol, tf, tailN, exchange, market) : null;
  // склейка возможна, если хвост перекрывает кэш; иначе качаем всё заново
  if (tail && tail.length && tail[0].t <= have.at(-1).t) {
    bars = dedupe([...have.filter((b) => b.t < tail[0].t), ...tail]).slice(-maxFor(tf));
  } else {
    const r = await downloadPaged(symbol, tf, Math.max(maxBars, have.length), exchange, market);
    bars = r.bars; startReached = r.startReached;
  }
  if (bars.length) await store().save(key, { v: 2, bars, startReached });
  return closedOnly(bars, tf, now).slice(-maxBars);
}

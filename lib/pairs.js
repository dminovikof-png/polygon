// Пары к BTC: настоящие спот-пары биржи (SOLBTC, ETHBTC…) и синтетические соотношения X/BTC из двух пар к USDT.
//
// Синтетика нужна для длинной истории (у Binance пары к USDT старше, а у Bybit пар к BTC всего несколько).
// Честно известно только отношение цен открытия и закрытия: SOLUSDT/BTCUSDT в один и тот же момент.
// Максимум и минимум соотношения внутри свечи НЕИЗВЕСТНЫ (максимум SOL и минимум BTC могли быть в разное время).
// Поэтому у синтетической свечи:
//   • h и l — по телу свечи: max(o, c) и min(o, c) (для индикаторов; ATR, каналы и т. п. будут занижены);
//   • hb и lb — грубые границы: максимум X / минимум BTC и минимум X / максимум BTC. Настоящий размах внутри них.
//     По ним проверяется ликвидация — пессимистично (может засчитать ликвидацию, которой не было);
//   • стопы и цели проверяются по закрытию свечи, а исполняются по открытию следующей (как сигнал);
//   • переход из монеты в BTC и обратно на синтетике — это две сделки через USDT, поэтому комиссия
//     и проскальзывание удваиваются (см. server.js).
import { loadCandles, inNode } from "./data.js";
import { store } from "./store.js";
const DAY = 86400;

const SYN_RE = /^([A-Z0-9]{2,15}USDT)\/BTCUSDT$/;

// Разбор тикера: "SOLUSDT" (к USDT), "SOLBTC" (к BTC на бирже), "SOLUSDT/BTCUSDT" (синтетика).
export function parseSymbol(sym) {
  const s = String(sym || "").toUpperCase();
  const m = SYN_RE.exec(s);
  if (m) {
    if (m[1] === "BTCUSDT") throw new Error("Синтетика BTC/BTC не имеет смысла");
    return { symbol: s, kind: "synthetic", quote: "BTC", base: m[1].slice(0, -4), legs: [m[1], "BTCUSDT"] };
  }
  if (!/^[A-Z0-9]{2,15}$/.test(s)) throw new Error("Некорректный тикер");
  if (s.endsWith("USDT")) return { symbol: s, kind: "spot", quote: "USDT", base: s.slice(0, -4) };
  if (s.endsWith("BTC") && s.length > 3) return { symbol: s, kind: "spot", quote: "BTC", base: s.slice(0, -3) };
  throw new Error("Поддерживаются пары к USDT и к BTC");
}

// Соотношение двух рядов, только по свечам, которые есть в обоих.
export function synthesize(xBars, bBars) {
  const byT = new Map(bBars.map((b) => [b.t, b]));
  const out = [];
  for (const x of xBars) {
    const b = byT.get(x.t);
    if (!b || !(b.o > 0 && b.c > 0 && b.l > 0)) continue;
    const o = x.o / b.o, c = x.c / b.c;
    out.push({ t: x.t, o, c, h: Math.max(o, c), l: Math.min(o, c), hb: x.h / b.l, lb: x.l / b.h, v: x.v, syn: true });
  }
  return out;
}

export async function loadSeries(symbol, tf, opts = {}) {
  const info = parseSymbol(symbol);
  if (info.kind === "synthetic") {
    const [x, b] = await Promise.all(info.legs.map((s) => loadCandles(s, tf, opts)));
    const bars = synthesize(x, b);
    if (bars.length < 30) throw new Error("Слишком мало общих свечей у двух пар для синтетики");
    return { bars, info };
  }
  return { bars: await loadCandles(info.symbol, tf, opts), info };
}

async function getJson(url) {
  const res = await fetch(url, { headers: inNode ? { "User-Agent": "chestny-poligon/0.4 (personal backtesting tool)" } : undefined, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Биржа вернула HTTP ${res.status}`);
  return res.json();
}

// Спот-пары к BTC, которые сейчас торгуются на бирже (публичный список инструментов; кэш на сутки).
// Обёртки самого BTC (WBTC и т. п.) исключены: «соотношение BTC к BTC» ничего не проверяет.
export async function listBtcPairs(exchange = "bybit", { now = Date.now() / 1000 } = {}) {
  const key = `cache/pairs_${exchange}_btc.json`, c = store().get(key);
  if (c && now - c.at < DAY && Array.isArray(c.list)) return c.list;
  let list;
  if (exchange === "bybit") {
    const j = await getJson("https://api.bybit.com/v5/market/instruments-info?category=spot");
    if (j.retCode !== 0) throw new Error("Bybit: " + j.retMsg);
    list = (j.result?.list || []).filter((x) => x.quoteCoin === "BTC" && x.status === "Trading").map((x) => x.symbol);
  } else if (exchange === "okx") {
    const j = await getJson("https://www.okx.com/api/v5/public/instruments?instType=SPOT");
    if (j.code !== "0") throw new Error("OKX: " + j.msg);
    list = (j.data || []).filter((x) => x.quoteCcy === "BTC" && x.state === "live").map((x) => x.baseCcy + "BTC");
  } else {
    const j = await getJson("https://data-api.binance.vision/api/v3/exchangeInfo?permissions=SPOT");
    list = (j.symbols || []).filter((x) => x.quoteAsset === "BTC" && x.status === "TRADING").map((x) => x.symbol);
  }
  list = list.filter((s) => !/BTCBTC$/.test(s)).sort();
  store().set(key, { at: now, list });
  return list;
}

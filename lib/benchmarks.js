// Эталоны — то, с чем сравнивается идея. Все считаются по тем же правилам исполнения, что и стратегия:
// покупка по цене открытия первой свечи с проскальзыванием и комиссией, дальше переоценка по закрытиям.
//   • coin — удержание той же монеты (как в версии 0.3);
//   • btc  — удержание BTC на тот же период (свечи BTC той же биржи и того же размера, выровненные по времени);
//   • cash — деньги в USDT под заданный процент годовых (по умолчанию 0).
// Плюс «разбавленный эталон»: постоянная доля монеты, остальное в кэше, с ребалансировкой при отклонении
// доли больше чем на 20 % от целевой; доля подбирается так, чтобы максимальная просадка совпала с просадкой
// стратегии. Это сравнение при равном риске: если идея меньше теряет, но и меньше зарабатывает, честный
// вопрос — заработала ли она больше, чем просто меньшая доля монеты.
import { maxDrawdown } from "./backtest.js";
import { convertReturns } from "./currency.js";

export const BENCHMARKS = {
  coin: "удержание той же монеты",
  btc: "удержание BTC",
  cash: "кэш в USDT",
};

// Свечи ref, совпадающие по времени со свечами bars. Пропуски заполняются последней известной ценой
// (свеча без движения). До начала истории ref — null.
export function alignBars(bars, ref) {
  const byT = new Map(ref.map((b) => [b.t, b]));
  let last = null;
  return bars.map((b) => {
    const r = byT.get(b.t);
    if (r) { last = r; return r; }
    if (!last) { const prev = ref.findLast?.((x) => x.t < b.t); if (prev) last = prev; }
    return last ? { t: b.t, o: last.c, h: last.c, l: last.c, c: last.c, v: 0 } : null;
  });
}

// Доходности удержания по свечам. Первая непустая свеча — покупка по открытию с издержками.
// До начала данных (null) доходность 0: эталон «ещё не существует», это отмечается в заметках.
export function holdReturns(series, { feePct = 0.1, slipPct = 0.05 } = {}) {
  const fee = feePct / 100, slip = slipPct / 100;
  let started = false, prevC = 0;
  return series.map((b) => {
    if (!b) return 0;
    if (!started) { started = true; prevC = b.c; return (b.c / (b.o * (1 + slip))) * (1 - fee) - 1; }
    const r = b.c / prevC - 1; prevC = b.c; return r;
  });
}

export const cashBarRate = (yieldPct, ppy) => (1 + (Number(yieldPct) || 0) / 100) ** (1 / ppy) - 1;
export const cashReturns = (n, yieldPct, ppy) => new Array(n).fill(cashBarRate(yieldPct, ppy));

// Постоянная доля w монеты, остальное в кэше. Отклонение проверяется по закрытию свечи, ребалансировка —
// по цене открытия следующей (как любая сделка в программе), комиссия и проскальзывание — с оборота.
export function constantShare(bars, w, { feePct = 0.1, slipPct = 0.05, cashYieldPct = 0, ppy = 365, band = 0.2 } = {}) {
  const fee = feePct / 100, slip = slipPct / 100, cb = cashBarRate(cashYieldPct, ppy);
  const n = bars.length, ret = new Array(n).fill(0);
  let units = 0, cash = 1, prevV = 1, pending = w > 0, trades = 0;
  for (let i = 0; i < n; i++) {
    const b = bars[i];
    if (pending) {
      const V = units * b.o + cash, d = w * V - units * b.o;
      if (d > 0) { units += (d * (1 - fee)) / (b.o * (1 + slip)); cash -= d; }
      else if (d < 0) { units -= -d / b.o; cash += -d * (1 - slip) * (1 - fee); }
      pending = false; trades++;
    }
    cash *= 1 + cb;
    const V = units * b.c + cash;
    ret[i] = V / prevV - 1; prevV = V;
    const share = V > 0 ? (units * b.c) / V : 0;
    if (w > 0 && Math.abs(share - w) > band * w) pending = true;
  }
  return { ret, trades };
}

const curveOf = (r) => { let e = 1; return r.map((x) => (e *= 1 + x)); };

// Доля монеты, при которой максимальная просадка постоянной доли равна заданной (targetMdd < 0).
// Просадка почти монотонно растёт с долей; поиск делением пополам, в отчёте — фактическая просадка найденной доли.
// Если стратегия просаживается сильнее, чем 100 % монеты, равный риск без плеча недостижим (capped = true).
// opts.fx — множитель валюты отчёта (currency.js): просадка сравнивается в той же валюте, что у стратегии.
export function dilutedMatch(bars, targetMdd, opts = {}) {
  const run = (w) => { const r = constantShare(bars, w, opts); const ret = convertReturns(r.ret, opts.fx || null); const c = curveOf(ret); return { w, ret, curve: c, mdd: maxDrawdown(c), trades: r.trades }; };
  const full = run(1);
  if (!(targetMdd > full.mdd)) return { ...full, capped: true };
  if (targetMdd >= 0) return { ...run(0), capped: false };
  let lo = 0, hi = 1, best = full;
  for (let k = 0; k < 30; k++) {
    const mid = (lo + hi) / 2, r = run(mid);
    if (Math.abs(r.mdd - targetMdd) < Math.abs(best.mdd - targetMdd)) best = r;
    if (r.mdd < targetMdd) hi = mid; else lo = mid;
    if (hi - lo < 1e-4) break;
  }
  return { ...best, capped: false };
}

// Все три эталона как ряды доходностей по свечам bars — в котируемой валюте пары (quote), затем в валюте отчёта (fx).
//   • пара к USDT: BTC покупается за USDT; кэш — USDT под процент;
//   • пара к BTC: «удержание BTC» — ничего не делать (капитал уже в BTC, доходность 0 в BTC);
//     кэш — продать BTC за USDT на открытии первой свечи (с издержками) и держать USDT под процент.
// btcBars — свечи BTCUSDT; для BTCUSDT и для BTC-пары без пересчёта могут быть null.
export function buildBenchmarks(bars, btcBars, { feePct, slipPct, cashYieldPct = 0, ppy, quote = "USDT", fx = null }) {
  const coin = holdReturns(bars, { feePct, slipPct });
  const aligned = btcBars ? alignBars(bars, btcBars) : null;
  const missing = aligned ? aligned.findIndex((b) => b) : 0;
  let btc, cash;
  if (quote === "BTC") {
    btc = bars.map(() => 0);
    if (!aligned) throw new Error("Для эталона «кэш» у пары к BTC нужны свечи BTCUSDT");
    const cb = cashBarRate(cashYieldPct, ppy), fee = feePct / 100, slip = slipPct / 100;
    let prev = null;
    cash = aligned.map((b) => {
      if (!b) return 0;
      const first = prev === null;
      const r = first ? (1 - fee) * (1 - slip) * (1 + cb) * (b.o / b.c) - 1 : (1 + cb) * (prev / b.c) - 1;
      prev = b.c; return r;
    });
  } else {
    btc = aligned ? holdReturns(aligned, { feePct, slipPct }) : coin;
    cash = cashReturns(bars.length, cashYieldPct, ppy);
  }
  const conv = (r) => convertReturns(r, fx);
  return {
    series: { coin: conv(coin), btc: conv(btc), cash: conv(cash) },
    btcAligned: aligned, quote, fx,
    notes: missing > 0 ? [`Данные BTC на этой бирже начинаются позже монеты: первые ${missing} свечей эталоны, связанные с BTC, стоят на месте.`] : [],
  };
}

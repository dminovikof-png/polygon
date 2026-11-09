// Валюта отчёта: USDT или BTC. Пара торгуется в своей котируемой валюте (SOLUSDT — в USDT, SOLBTC — в BTC);
// кривая капитала пересчитывается в валюту отчёта по цене BTCUSDT той же биржи и того же размера свечи.
// Пересчёт — только учёт (как если бы вы смотрели на тот же счёт в другой валюте), сделок и комиссий он не добавляет.
//
// Множитель f[i]: капитал в валюте отчёта = капитал в котируемой валюте × f[i]; на старте (открытие первой свечи) f = 1.
//   USDT → BTC: f[i] = BTC_открытие_0 / BTC_закрытие_i;   BTC → USDT: f[i] = BTC_закрытие_i / BTC_открытие_0.
export const CURRENCIES = ["USDT", "BTC"];

// btcAligned — свечи BTCUSDT, выровненные по времени со свечами пары (alignBars); null там, где BTC ещё нет.
// До первой цены BTC множитель держится постоянным (пересчитать нечем) — это отмечается в notes.
export function fxFactor(btcAligned, from, to) {
  if (from === to) return { f: null, notes: [] };
  if (!CURRENCIES.includes(from) || !CURRENCIES.includes(to)) throw new Error("Валюта отчёта: " + CURRENCIES.join(" или "));
  if (!btcAligned) throw new Error("Для пересчёта в другую валюту нужны свечи BTCUSDT");
  const first = btcAligned.findIndex((b) => b);
  if (first === -1) throw new Error("Нет цен BTCUSDT за этот период: пересчитать в другую валюту нельзя");
  const p0 = first === 0 ? btcAligned[0].o : btcAligned[first].o;
  const f = btcAligned.map((b, i) => {
    const p = i < first ? p0 : b.c;
    return to === "BTC" ? p0 / p : p / p0;
  });
  return { f, notes: first > 0 ? [`Цены BTCUSDT начинаются позже пары: первые ${first} свечей пересчёт в ${to} не меняется.`] : [] };
}

const curveOf = (r) => { let e = 1; return r.map((x) => (e *= 1 + x)); };

// Доходности по свечам в котируемой валюте → доходности в валюте отчёта.
export function convertReturns(r, f) {
  if (!f) return r;
  let e = 1, prev = 1;
  return r.map((x, i) => { e *= 1 + x; const v = e * f[i]; const out = v / prev - 1; prev = v; return out; });
}

// Результат бэктеста в валюте отчёта: доходности и кривые стратегии и удержания. Сделки остаются в валюте пары.
export function convertBt(bt, f) {
  if (!f) return bt;
  const strat = convertReturns(bt.strat, f), hold = convertReturns(bt.hold, f);
  return { ...bt, strat, hold, stratCurve: curveOf(strat), holdCurve: curveOf(hold) };
}

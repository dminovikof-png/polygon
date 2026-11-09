// Факты о монете по дневным свечам: длина истории, оборот, размах цены, худшая просадка, связь с BTC.
// Это описание прошлого, а не прогноз и не оценка «хорошая ли монета».
const DAY = 86400;

const mean = (x) => x.reduce((a, b) => a + b, 0) / x.length;
const sd = (x) => { const m = mean(x); return Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / (x.length - 1)); };

// Корреляция Пирсона; null, если точек меньше 30 или ряд постоянный.
export function correlation(a, b) {
  if (a.length !== b.length || a.length < 30) return null;
  const ma = mean(a), mb = mean(b);
  let cov = 0, va = 0, vb = 0;
  for (let i = 0; i < a.length; i++) { cov += (a[i] - ma) * (b[i] - mb); va += (a[i] - ma) ** 2; vb += (b[i] - mb) ** 2; }
  return va > 0 && vb > 0 ? cov / Math.sqrt(va * vb) : null;
}

// Худшее падение от максимума по закрытиям: глубина (доля, отрицательная), даты максимума и дна; и сколько сейчас ниже максимума.
export function worstDrawdown(bars) {
  let peak = bars[0], dd = 0, from = bars[0].t, to = bars[0].t;
  for (const b of bars) {
    if (b.c > peak.c) peak = b;
    const d = b.c / peak.c - 1;
    if (d < dd) { dd = d; from = peak.t; to = b.t; }
  }
  return { dd, from, to, fromPeakNow: bars.at(-1).c / peak.c - 1 };
}

// bars, btcBars — закрытые дневные свечи от старых к новым; startReached — биржа отдала всю историю (а не обрезала по лимиту).
export function coinFacts(bars, btcBars = null, { startReached = false } = {}) {
  if (!bars || bars.length < 2) throw new Error("Мало дневных свечей");
  const last = bars.at(-1), yearAgo = last.t - 365 * DAY;
  const year = bars.filter((b) => b.t >= yearAgo);
  const fullYear = bars[0].t <= yearAgo; // есть хотя бы год истории
  const logRet = (xs) => xs.slice(1).map((b, i) => Math.log(b.c / xs[i].c));
  const r1 = logRet(year);
  const tail = bars.slice(-30);
  const out = {
    from: bars[0].t, to: last.t, days: bars.length, years: (last.t - bars[0].t) / (365 * DAY), historyFull: !!startReached,
    price: last.c,
    turnover30: mean(tail.map((b) => b.v * b.c)), // примерный дневной оборот в валюте котировки (объём × закрытие)
    vol1y: r1.length >= 30 ? sd(r1) * Math.sqrt(365) : null, // годовой размах (волатильность) за последний год
    ret1y: fullYear ? last.c / year[0].c - 1 : null,
    ...(() => { const w = worstDrawdown(bars); return { maxDD: w.dd, ddFrom: w.from, ddTo: w.to, belowPeak: w.fromPeakNow }; })(),
    corrBtc: null,
  };
  if (btcBars && btcBars !== bars) {
    const btc = new Map(btcBars.map((b) => [b.t, b.c]));
    const a = [], c = [];
    for (let i = 1; i < year.length; i++) {
      const p0 = btc.get(year[i - 1].t), p1 = btc.get(year[i].t);
      if (p0 && p1) { a.push(year[i].c / year[i - 1].c - 1); c.push(p1 / p0 - 1); }
    }
    out.corrBtc = correlation(a, c);
  }
  return out;
}

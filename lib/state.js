// Этап «Состояние рынка»: описание того, что сейчас происходит с монетой, и базовые частоты из её прошлого.
// Это не прогноз: в исследованиях проекта направление цены предсказать не удалось (IC ≈ 0.04). Блок «что было дальше»
// показан, чтобы было видно, насколько слабо состояние связано с будущим, а не чтобы по нему торговать.
import { sma } from "./indicators.js";

const median = (x) => { if (!x.length) return null; const s = [...x].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// Доля прошлых значений строго ниже x (0…1), без NaN. null — если сравнивать не с чем.
export function percentileRank(hist, x) {
  const h = hist.filter((v) => Number.isFinite(v));
  return h.length && Number.isFinite(x) ? h.filter((v) => v < x).length / h.length : null;
}

// Серии одинаковых значений: [{ v, start, len }], последняя — незакрытая (ещё идёт).
export function spells(flags) {
  const out = [];
  flags.forEach((v, i) => { if (v == null) return; const s = out.at(-1); if (s && s.v === v && s.start + s.len === i) s.len++; else out.push({ v, start: i, len: 1 }); });
  return out;
}

// Скользящие ряды по закрытиям: годовая волатильность за n дней, коэффициент эффективности (чистота движения), ширина полос Боллинджера.
export function rollingVol(c, n) {
  const r = c.map((x, i) => (i ? Math.log(x / c[i - 1]) : NaN));
  return c.map((_, i) => {
    if (i < n) return NaN;
    const w = r.slice(i - n + 1, i + 1), m = w.reduce((a, b) => a + b, 0) / n;
    return Math.sqrt(w.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1)) * Math.sqrt(365);
  });
}
export function efficiency(c, n) {
  return c.map((_, i) => {
    if (i < n) return NaN;
    let path = 0; for (let k = i - n + 1; k <= i; k++) path += Math.abs(c[k] - c[k - 1]);
    return path > 0 ? Math.abs(c[i] - c[i - n]) / path : 0;
  });
}
export function bandWidth(c, n = 20) {
  const m = sma(c, n);
  return c.map((_, i) => {
    if (!(i >= n - 1) || !Number.isFinite(m[i])) return NaN;
    const w = c.slice(i - n + 1, i + 1), s = Math.sqrt(w.reduce((a, b) => a + (b - m[i]) ** 2, 0) / n);
    return (4 * s) / m[i];
  });
}

const level = (p, lo, hi) => (p == null ? null : p < 0.25 ? lo : p > 0.75 ? hi : "обычная");

// bars — закрытые дневные свечи от старых к новым. horizon — на сколько дней вперёд смотреть в «что было дальше».
export function marketState(bars, { horizon = 30 } = {}) {
  if (!bars || bars.length < 260) throw new Error("Нужно хотя бы 260 дневных свечей (200 на среднюю и год сравнения)");
  const c = bars.map((b) => b.c), n = c.length, last = n - 1;
  const ma = sma(c, 200);
  const above = c.map((x, i) => (Number.isFinite(ma[i]) ? x > ma[i] : null));
  const sp = spells(above), cur = sp.at(-1), past = sp.slice(0, -1).filter((s) => s.v === cur.v);
  // из прошлых таких периодов, доживших до нынешнего возраста, — сколько продлились дольше
  const reached = past.filter((s) => s.len >= cur.len);
  const trend = {
    above: cur.v, age: cur.len, gapPct: c[last] / ma[last] - 1, since: bars[cur.start].t,
    pastCount: past.length, pastMedian: median(past.map((s) => s.len)),
    reached: reached.length, longer: reached.length ? reached.filter((s) => s.len > cur.len).length / reached.length : null,
    switchesYear: sp.filter((s) => s.start > last - 365).length, // сколько раз цена пересекала среднюю за последний год
  };
  const vol = rollingVol(c, 30), er = efficiency(c, 30), bw = bandWidth(c, 20);
  const hist = (x) => x.slice(0, last); // сравнение с прошлым, без сегодняшнего значения
  const pv = percentileRank(hist(vol), vol[last]), pe = percentileRank(hist(er), er[last]), pb = percentileRank(hist(bw), bw[last]);

  // что было дальше: доля дней, после которых цена через horizon дней была выше, — в том же состоянии и вообще
  const fwd = { all: [], same: [] };
  for (let i = 0; i + horizon <= last; i++) {
    if (above[i] == null) continue;
    const r = c[i + horizon] / c[i] - 1;
    fwd.all.push(r); if (above[i] === cur.v) fwd.same.push(r);
  }
  const up = (x) => (x.length ? x.filter((r) => r > 0).length / x.length : null);
  return {
    t: bars[last].t, price: c[last], ma200: ma[last], trend,
    vol: { value: vol[last], pct: pv, level: level(pv, "низкая", "высокая") },
    clean: { value: er[last], pct: pe, level: level(pe, "пила", "чистое движение") },
    bands: { value: bw[last], pct: pb, squeeze: pb != null && pb < 0.1 },
    forward: { horizon, upSame: up(fwd.same), upAll: up(fwd.all), medSame: median(fwd.same), medAll: median(fwd.all), nSame: fwd.same.length, nAll: fwd.all.length, independent: Math.floor(fwd.same.length / horizon) },
  };
}

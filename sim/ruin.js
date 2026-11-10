// Риск и размер позиции: критерий Келли, разорение методом Монте-Карло с фиксированным зерном,
// снос волатильности при плече. Одно и то же зерно — одни и те же пути, поэтому урок и тест видят одно и то же.

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// нормальное случайное число (Бокс — Мюллер)
export function gauss(r) { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }

// Доля капитала по Келли для ставки: выигрыш b (в долях риска) с вероятностью p, проигрыш 1 с вероятностью 1 − p.
export const kelly = (p, b) => p - (1 - p) / b;

// Средний рост капитала за ставку (логарифм) при доле f. Максимум — в точке Келли, ноль — примерно при 2 × Келли.
export const growthRate = (p, b, f) => p * Math.log(1 + f * b) + (1 - p) * Math.log(Math.max(1e-12, 1 - f));

// Серия ставок: paths путей по trades сделок, в каждой рискуем долей f капитала.
// Разорение — капитал упал ниже ruinAt (0,1 = потеряно 90 %). Возвращает пути (для рисунка — не больше keep), итоги и доли.
export function simulateBets({ p = 0.5, b = 1.2, f = 0.05, trades = 200, paths = 1000, ruinAt = 0.1, seed = 1, keep = 60 } = {}) {
  const r = rng(seed), finals = [], kept = [];
  let ruined = 0, doubled = 0;
  const dd = [];
  for (let k = 0; k < paths; k++) {
    let eq = 1, peak = 1, worst = 0, ruin = false;
    const path = k < keep ? [1] : null;
    for (let i = 0; i < trades; i++) {
      if (!ruin) {
        eq *= r() < p ? 1 + f * b : 1 - f;
        peak = Math.max(peak, eq); worst = Math.min(worst, eq / peak - 1);
        if (eq < ruinAt) ruin = true;
      } else r(); // те же случайные числа на каждом пути, чтобы пути при разных f были сравнимы
      if (path) path.push(eq);
    }
    if (ruin) ruined++;
    if (eq >= 2) doubled++;
    finals.push(eq); dd.push(worst);
    if (path) kept.push(path);
  }
  const sorted = [...finals].sort((a, c) => a - c), q = (x) => sorted[Math.min(sorted.length - 1, Math.floor(x * sorted.length))];
  return { paths: kept, finals, ruinProb: ruined / paths, doubleProb: doubled / paths, median: q(0.5), p10: q(0.1), p90: q(0.9), medianDD: [...dd].sort((a, c) => a - c)[Math.floor(dd.length / 2)] };
}

// Снос волатильности: при дневной средней доходности mu и разбросе sigma плечо L даёт средний логарифмический рост
// L·mu − L²·sigma²/2 в день. Растёт с плечом только до L* = mu / sigma², дальше падает и уходит в минус.
export const leveredGrowth = (mu, sigma, L) => L * mu - (L * L * sigma * sigma) / 2;
export const bestLeverage = (mu, sigma) => mu / (sigma * sigma);

// Плечо на настоящей истории: каждый день позиция L × капитал (ежедневная ребалансировка), без комиссий и фандинга.
// Если за день капитал теряет всё (L × падение ≥ 100 %), счёт обнуляется.
export function leveredHistory(closes, L) {
  const out = [1];
  for (let i = 1; i < closes.length; i++) {
    const prev = out[i - 1];
    out.push(prev <= 0 ? 0 : Math.max(0, prev * (1 + L * (closes[i] / closes[i - 1] - 1))));
  }
  return out;
}

// Просадки: для каждого дня — насколько капитал ниже своего максимума; худшая просадка и самое долгое восстановление.
export function drawdowns(eq) {
  let peak = eq[0], peakI = 0, worst = 0, longest = 0;
  const dd = eq.map((v, i) => { if (v >= peak) { longest = Math.max(longest, i - peakI); peak = v; peakI = i; } const d = v / peak - 1; worst = Math.min(worst, d); return d; });
  longest = Math.max(longest, eq.length - 1 - peakI);
  return { dd, worst, longest };
}
// Сколько нужно вырасти, чтобы отыграть падение d (−0,5 → +100 %).
export const recoveryNeeded = (d) => 1 / (1 + d) - 1;

// Размер позиции по риску: сколько монет купить, чтобы при срабатывании стопа потерять ровно riskPct счёта.
export function positionSize({ equity, riskPct, entry, stop }) {
  const perUnit = Math.abs(entry - stop), risk = equity * riskPct;
  const units = perUnit > 0 ? risk / perUnit : 0;
  return { units, notional: units * entry, risk, share: (units * entry) / equity };
}

// Дневные доходности и их корреляция.
export const returns = (c) => c.slice(1).map((v, i) => v / c[i] - 1);
export function correlation(a, b) {
  const n = Math.min(a.length, b.length), ma = a.slice(-n).reduce((s, x) => s + x, 0) / n, mb = b.slice(-n).reduce((s, x) => s + x, 0) / n;
  let sab = 0, saa = 0, sbb = 0;
  for (let i = 0; i < n; i++) { const x = a[a.length - n + i] - ma, y = b[b.length - n + i] - mb; sab += x * y; saa += x * x; sbb += y * y; }
  return sab / Math.sqrt(saa * sbb);
}

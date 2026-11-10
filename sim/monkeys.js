// Честная проверка на учебных примерах: случайные стратегии («обезьяны»), планка значимости,
// подгонка параметра, заглядывание в будущее. Всё на дневных закрытиях, без зависимостей.
import { rng } from "./ruin.js";
import { equityFromPositions, rules } from "./ta.js";

const mean = (x) => x.reduce((a, b) => a + b, 0) / x.length;
const sd = (x) => { const m = mean(x); return Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / (x.length - 1)); };

// Планка значимости: ожидаемый максимум t-статистики среди N попыток чистого шума ≈ √(2 ln N), не ниже 1,96.
// Та же формула, что в lib/stats.js (тест проверяет совпадение).
export const plank = (attempts) => Math.max(1.96, Math.sqrt(2 * Math.log(Math.max(attempts, 1))));

// t-статистика превосходства дневных доходностей капитала a над b (одинаковой длины).
export function tExcess(eqA, eqB) {
  const ex = [];
  for (let i = 1; i < eqA.length; i++) ex.push(eqA[i] / eqA[i - 1] - eqB[i] / eqB[i - 1]);
  const s = sd(ex);
  return s > 0 ? (mean(ex) / s) * Math.sqrt(ex.length) : 0;
}

// Случайная стратегия: в рынке или вне его; каждый день с вероятностью flip меняет решение.
export function monkeyPositions(n, r, flip = 0.05) {
  const pos = [];
  let p = r() < 0.5 ? 1 : 0;
  for (let i = 0; i < n; i++) { if (r() < flip) p = 1 - p; pos.push(p); }
  return pos;
}

// count обезьян на ценах c. Возвращает итог каждой, t против удержания, лучшую и планку.
// split (0..1) — доля «песочницы»: лучшую выбирают по ней, а потом смотрят на оставшуюся часть.
export function monkeys(c, { count = 500, seed = 1, flip = 0.05, fee = 0.001, split = 0.7, keep = 100 } = {}) {
  const r = rng(seed), cut = Math.floor(c.length * split);
  const hold = c.map((v) => v / c[0]), holdIn = hold.slice(0, cut + 1), holdOut = hold.slice(cut).map((v) => v / hold[cut]);
  const all = [];
  let best = null, bestAll = null; // лучшие по песочнице и по всей истории (их путь сохраняется всегда)
  for (let k = 0; k < count; k++) {
    const pos = monkeyPositions(c.length, r, flip), eq = equityFromPositions(c, pos, fee).eq;
    const eqIn = eq.slice(0, cut + 1), eqOut = eq.slice(cut).map((v) => v / eq[cut]);
    const one = { final: eq.at(-1), inFinal: eqIn.at(-1), outFinal: eqOut.at(-1), t: tExcess(eq, hold), tIn: tExcess(eqIn, holdIn), tOut: tExcess(eqOut, holdOut), eq: k < keep ? eq : null };
    one.path = eq;
    const old = [best, bestAll];
    if (!best || one.tIn > best.tIn) best = one;
    if (!bestAll || one.t > bestAll.t) bestAll = one;
    for (const o of [...old, one]) if (o && o !== best && o !== bestAll) o.path = null; // путь храним только у лучших
    all.push(one);
  }
  const beatHold = all.filter((m) => m.final > hold.at(-1)).length / count;
  return { all, best, bestAll, hold, cut, beatHold, plank: plank(count), maxT: bestAll.t, rankCorr: rankCorrelation(all.map((m) => m.tIn), all.map((m) => m.tOut)) };
}

// Ранговая корреляция Спирмена.
export function rankCorrelation(a, b) {
  const rank = (x) => { const idx = x.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]), r = new Array(x.length); idx.forEach(([, i], k) => (r[i] = k)); return r; };
  const ra = rank(a), rb = rank(b), ma = mean(ra), mb = mean(rb);
  let s = 0, sa = 0, sb = 0;
  for (let i = 0; i < a.length; i++) { s += (ra[i] - ma) * (rb[i] - mb); sa += (ra[i] - ma) ** 2; sb += (rb[i] - mb) ** 2; }
  return s / Math.sqrt(sa * sb);
}

// Подгонка параметра: правило «цена выше SMA n» для каждого n из списка, в песочнице и на отложенной части.
// Отложенная часть считается с n дней «разгона» из песочницы, чтобы средняя была определена с её первого дня.
export function paramSweep(c, { ns = range(10, 300, 10), split = 0.7, fee = 0.001 } = {}) {
  const cut = Math.floor(c.length * split);
  const rows = ns.map((n) => {
    const pos = rules.smaTrend(c, n), eq = equityFromPositions(c, pos, fee).eq;
    return { n, inFinal: eq[cut] / eq[0], outFinal: eq.at(-1) / eq[cut] };
  });
  const best = rows.reduce((a, b) => (b.inFinal > a.inFinal ? b : a));
  const outs = rows.map((r) => r.outFinal).sort((a, b) => a - b);
  return { rows, best, cut, outMedian: outs[Math.floor(outs.length / 2)], outRank: outs.filter((v) => v > best.outFinal).length + 1 };
}
export function range(a, b, step = 1) { const out = []; for (let x = a; x <= b; x += step) out.push(x); return out; }

// Заглядывание в будущее: то же правило, но позиция, решённая по закрытию дня i, получает доходность того же дня i.
export function peekEquity(c, pos, fee = 0.001) {
  const eq = [1];
  for (let i = 1; i < c.length; i++) {
    let v = eq[i - 1] * (1 + (pos[i] || 0) * (c[i] / c[i - 1] - 1));
    if ((pos[i] || 0) !== (pos[i - 1] || 0)) v *= 1 - fee;
    eq.push(v);
  }
  return eq;
}

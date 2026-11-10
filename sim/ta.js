// Индикаторы и простые стратегии для уроков (на ценах закрытия). Те же формулы, что в lib/indicators.js —
// тест сверяет значения. Здесь отдельная копия, потому что расчётный слой lib/ не раздаётся учебному режиму на компьютере.

const NaNs = (n) => new Array(n).fill(NaN);

export function sma(x, n) {
  const out = NaNs(x.length);
  let s = 0;
  for (let i = 0; i < x.length; i++) { s += x[i]; if (i >= n) s -= x[i - n]; if (i >= n - 1) out[i] = s / n; }
  return out;
}
export function ema(x, n) {
  const out = NaNs(x.length), k = 2 / (n + 1);
  let prev = NaN, s = 0;
  for (let i = 0; i < x.length; i++) {
    if (i < n) { s += x[i]; if (i === n - 1) { prev = s / n; out[i] = prev; } }
    else { prev = x[i] * k + prev * (1 - k); out[i] = prev; }
  }
  return out;
}
// RSI Уайлдера.
export function rsi(c, n = 14) {
  const out = NaNs(c.length);
  let ag = 0, al = 0;
  for (let i = 1; i < c.length; i++) {
    const g = Math.max(c[i] - c[i - 1], 0), l = Math.max(c[i - 1] - c[i], 0);
    if (i <= n) { ag += g / n; al += l / n; if (i < n) continue; }
    else { ag = (ag * (n - 1) + g) / n; al = (al * (n - 1) + l) / n; }
    out[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return out;
}
export function bollinger(c, n = 20, k = 2) {
  const m = sma(c, n), up = NaNs(c.length), lo = NaNs(c.length);
  for (let i = n - 1; i < c.length; i++) {
    let v = 0;
    for (let j = i - n + 1; j <= i; j++) v += (c[j] - m[i]) ** 2;
    const s = Math.sqrt(v / n); up[i] = m[i] + k * s; lo[i] = m[i] - k * s;
  }
  return { mid: m, upper: up, lower: lo };
}
// Канал Дончиана по ценам закрытия: максимум и минимум за n предыдущих дней (без сегодняшнего).
export function donchian(c, n = 20) {
  const hi = NaNs(c.length), lo = NaNs(c.length);
  for (let i = n; i < c.length; i++) { let a = -Infinity, b = Infinity; for (let j = i - n; j < i; j++) { a = Math.max(a, c[j]); b = Math.min(b, c[j]); } hi[i] = a; lo[i] = b; }
  return { hi, lo };
}

// Капитал по сигналу «в рынке / вне рынка». pos[i] — позиция, решённая по закрытию дня i и действующая со следующего дня
// (без заглядывания в будущее). fee — доля за каждую смену позиции.
export function equityFromPositions(c, pos, fee = 0.001) {
  const eq = [1];
  let trades = 0;
  for (let i = 1; i < c.length; i++) {
    const held = pos[i - 1] || 0;
    let v = eq[i - 1] * (1 + held * (c[i] / c[i - 1] - 1));
    const next = pos[i] || 0;
    if (next !== held) { v *= 1 - fee * Math.abs(next - held); trades++; }
    eq.push(v);
  }
  return { eq, trades };
}

// Три учебные механики (правила проще, чем в рабочем режиме, — для рисунков и примеров).
export const rules = {
  // держать, пока цена выше средней за n дней
  smaTrend: (c, n = 200) => { const m = sma(c, n); return c.map((v, i) => (isNaN(m[i]) ? 0 : v > m[i] ? 1 : 0)); },
  // черепахи: вход при новом максимуме за n дней, выход при новом минимуме за m дней
  donchian: (c, n = 20, m = 10) => {
    const a = donchian(c, n), b = donchian(c, m), out = [];
    let p = 0;
    for (let i = 0; i < c.length; i++) { if (!p && c[i] > a.hi[i]) p = 1; else if (p && c[i] < b.lo[i]) p = 0; out.push(p); }
    return out;
  },
  // возврат к среднему: купить при RSI ниже low, продать при RSI выше high
  rsiRevert: (c, n = 14, low = 30, high = 55) => {
    const r = rsi(c, n), out = [];
    let p = 0;
    for (let i = 0; i < c.length; i++) { if (!p && r[i] < low) p = 1; else if (p && r[i] > high) p = 0; out.push(p); }
    return out;
  },
};

// Покупка частями (DCA): amount каждые every дней с дня start; возвращает вложено, монет, стоимость по дням.
export function dca(c, { start = 0, every = 30, amount = 100, end = c.length - 1 } = {}) {
  let coins = 0, invested = 0;
  const value = [];
  for (let i = start; i <= end; i++) {
    if ((i - start) % every === 0) { coins += amount / c[i]; invested += amount; }
    value.push({ invested, value: coins * c[i] });
  }
  return { coins, invested, final: coins * c[end], value };
}

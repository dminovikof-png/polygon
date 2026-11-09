// Пул ликвидности с постоянным произведением x·y = k (как в Uniswap v2) для уроков о DEX.
// x — количество монеты X в пуле, y — монеты Y (обычно стейблкоин), цена X = y / x. Комиссия остаётся в пуле.

export const makePool = (x, y) => ({ x, y });
export const price = (p) => p.y / p.x;
export const k = (p) => p.x * p.y;

// Обмен: отдать в пул amount монеты side ("X" или "Y") и получить другую. fee — доля комиссии (0,003 = 0,3 %).
// avgPrice — сколько Y за 1 X вышло в среднем; impact — насколько средняя цена хуже цены пула до обмена.
export function swap(p, side, amount, fee = 0.003) {
  if (!(amount > 0)) return { out: 0, pool: { ...p }, avgPrice: price(p), before: price(p), after: price(p), impact: 0, feePaid: 0 };
  const eff = amount * (1 - fee), before = price(p);
  let out, pool;
  if (side === "X") { out = (p.y * eff) / (p.x + eff); pool = { x: p.x + amount, y: p.y - out }; }
  else { out = (p.x * eff) / (p.y + eff); pool = { x: p.x - out, y: p.y + amount }; }
  const avgPrice = side === "X" ? out / amount : amount / out; // всегда в Y за 1 X
  const impact = side === "X" ? 1 - avgPrice / before : avgPrice / before - 1; // продавец X получает меньше, покупатель X платит больше
  return { out, pool, avgPrice, before, after: price(pool), impact, feePaid: amount * fee };
}

// Арбитраж: внешние покупатели и продавцы доводят цену пула до рыночной. k при этом не меняется (без комиссии).
export function arbTo(p, marketPrice) {
  const kk = k(p);
  return { x: Math.sqrt(kk / marketPrice), y: Math.sqrt(kk * marketPrice) };
}

// Непостоянные потери: насколько доля в пуле отстала от простого удержания тех же монет,
// если цена X изменилась в r раз (без учёта заработанных комиссий). Всегда ≤ 0, ноль только при r = 1.
export const impermanentLoss = (r) => (2 * Math.sqrt(r)) / (1 + r) - 1;

// Вклад v0 (в Y) поровну в обе монеты; цена X выросла в r раз. Сколько стоит доля в пуле и сколько стоило бы удержание.
// feesApr — годовой доход от комиссий в долях, days — срок: показывает, перекрывают ли комиссии потери.
export function lpVsHold(v0, r, { feesApr = 0, days = 0 } = {}) {
  const hold = (v0 / 2) * r + v0 / 2;
  const lpNoFees = v0 * Math.sqrt(r);
  const lp = lpNoFees * (1 + feesApr * (days / 365));
  return { hold, lpNoFees, lp, il: lpNoFees / hold - 1, vsHold: lp / hold - 1 };
}

// Точки кривой x·y = k для рисунка: n точек от x/spread до x·spread.
export function curvePoints(p, n = 60, spread = 4) {
  const kk = k(p), out = [];
  for (let i = 0; i < n; i++) { const x = p.x / spread * Math.pow(spread * spread, i / (n - 1)); out.push([x, kk / x]); }
  return out;
}

// Сэндвич (MEV): атакующий покупает X перед жертвой, жертва покупает дороже, атакующий продаёт сразу после.
// front — сколько Y тратит атакующий. Возвращает, сколько X получила бы жертва без атаки и с атакой, и доход атакующего в Y.
export function sandwich(p, victimY, front, fee = 0.003) {
  const clean = swap(p, "Y", victimY, fee).out;
  const a = swap(p, "Y", front, fee);
  const v = swap(a.pool, "Y", victimY, fee);
  const back = swap(v.pool, "X", a.out, fee);
  return { clean, attacked: v.out, victimLoss: 1 - v.out / clean, attackerProfit: back.out - front };
}

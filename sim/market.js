// Централизованная биржа для уроков: стакан заявок, рыночная заявка проходит по уровням, комиссии,
// цена ликвидации позиции с плечом, фандинг. Формулы упрощены (без комиссий в цене ликвидации, одна ставка
// поддерживающей маржи) — точные правила у каждой биржи свои.

// Учебный стакан: levels уровней с каждой стороны, шаг tick, объём растёт от середины. Повторяем при одном зерне.
export function makeBook({ mid = 100, spread = 0.02, tick = 0.01, levels = 12, size = 1, seed = 5 } = {}) {
  let a = seed >>> 0;
  const r = () => { a = (Math.imul(a, 1664525) + 1013904223) >>> 0; return a / 4294967296; };
  const bids = [], asks = [];
  for (let i = 0; i < levels; i++) {
    const q = +(size * (0.4 + i * 0.25 + r() * 0.8)).toFixed(3);
    const q2 = +(size * (0.4 + i * 0.25 + r() * 0.8)).toFixed(3);
    bids.push([+(mid - spread / 2 - i * tick).toFixed(6), q]);
    asks.push([+(mid + spread / 2 + i * tick).toFixed(6), q2]);
  }
  return { bids, asks };
}

export const bestBid = (b) => b.bids[0]?.[0] ?? null;
export const bestAsk = (b) => b.asks[0]?.[0] ?? null;
export const midPrice = (b) => (bestBid(b) + bestAsk(b)) / 2;
export const spreadBps = (b) => ((bestAsk(b) - bestBid(b)) / midPrice(b)) * 1e4;

// Рыночная заявка: side "buy" съедает продавцов (asks) снизу вверх, "sell" — покупателей (bids) сверху вниз.
// Возвращает исполненное количество, среднюю цену, худшую цену, число уровней и проскальзывание в б.п.
// относительно лучшей цены и середины. Если стакана не хватило — unfilled > 0.
export function marketOrder(book, side, qty) {
  const levels = side === "buy" ? book.asks : book.bids;
  let left = qty, cost = 0, used = 0, worst = null;
  for (const [p, q] of levels) {
    if (left <= 1e-12) break;
    const take = Math.min(q, left);
    cost += take * p; left -= take; used++; worst = p;
  }
  const filled = qty - Math.max(0, left);
  const avg = filled > 0 ? cost / filled : null, best = levels[0]?.[0] ?? null, mid = midPrice(book);
  const sign = side === "buy" ? 1 : -1;
  return {
    filled, unfilled: Math.max(0, left), avgPrice: avg, worst, levelsUsed: used, notional: cost,
    slipBps: avg ? sign * (avg / best - 1) * 1e4 : null, vsMidBps: avg ? sign * (avg / mid - 1) * 1e4 : null,
  };
}

// Комиссия сделки: доля от суммы. Мейкер (заявка встала в стакан) обычно платит меньше тейкера (забрал из стакана).
export const fee = (notional, rate) => notional * rate;
// Сколько стоит полный круг (купить и продать) в б.п. при ставке rate за сторону.
export const roundTripBps = (rate) => 2 * rate * 1e4;

// Цена ликвидации изолированной позиции с плечом lev: убыток доходит до залога минус поддерживающая маржа mmr.
// Упрощение: без комиссий и фандинга, которые приближают ликвидацию.
export function liqPrice({ entry, lev, side = "long", mmr = 0.005 }) {
  return side === "long" ? entry * (1 - 1 / lev + mmr) : entry * (1 + 1 / lev - mmr);
}
// На сколько процентов цена должна пойти против позиции до ликвидации.
export const distanceToLiq = (o) => Math.abs(liqPrice(o) / o.entry - 1);

// Позиция с плечом на пути цен: результат на залог и момент ликвидации (если был). prices — цены по шагам.
export function leveredPath(prices, { lev, side = "long", mmr = 0.005 }) {
  const entry = prices[0], lp = liqPrice({ entry, lev, side, mmr }), s = side === "long" ? 1 : -1;
  const out = [];
  for (let i = 0; i < prices.length; i++) {
    const hit = side === "long" ? prices[i] <= lp : prices[i] >= lp;
    if (hit) { out.push(-1); return { equity: out, liqAt: i, liqPrice: lp }; }
    out.push(s * lev * (prices[i] / entry - 1));
  }
  return { equity: out, liqAt: null, liqPrice: lp };
}

// Фандинг за одну выплату: при положительной ставке длинные платят коротким. Знак — для держателя позиции.
export const fundingPayment = (notional, rate, side = "long") => (side === "long" ? -1 : 1) * notional * rate;
// Ставка за выплату → годовые (три выплаты в сутки, как на большинстве бирж).
export const fundingApr = (rate, perDay = 3) => rate * perDay * 365;

// Бумажный DCA (покупка частями): фиксированная сумма раз в N свечей, пока не кончится бюджет.
// Покупка — рыночная на открытии свечи, с комиссией и проскальзыванием. Ещё не вложенные деньги лежат в кэше
// (под процент, если он включён). Эталон — разовая покупка всего бюджета на открытии первой свечи.
// Всё считается в долях бюджета: бюджет = 1.

const num = (x, d) => (x === undefined || x === null || x === "" ? d : Number(x));

export function normalizeDca(p = {}, budget = 1000) {
  const d = { amount: num(p.amount, 100), every: Math.round(num(p.every, 7)) };
  if (!(d.amount > 0)) throw new Error("Сумма одной покупки больше нуля");
  if (!(budget >= d.amount)) throw new Error("Бюджет (капитал сессии) не меньше одной покупки");
  if (!(d.every >= 1 && d.every <= 1000)) throw new Error("Покупка раз в N свечей: N от 1 до 1000");
  return d;
}

// bars — свечи пары; p = { amount, every }; budget — в тех же единицах, что amount (обычно USDT);
// costs = { feePct, slipPct, cashYieldPct, cashFlat, ppy }.
export function dcaBacktest(bars, p, budget, costs = {}) {
  const d = normalizeDca(p, budget);
  const n = bars.length;
  if (!n) throw new Error("Нет свечей");
  const fee = num(costs.feePct, 0.1) / 100, slip = num(costs.slipPct, 0.05) / 100;
  const cb = costs.cashFlat ? (1 + num(costs.cashYieldPct, 0) / 100) ** (1 / (costs.ppy || 365)) - 1 : 0;
  const part = d.amount / budget;
  let cash = 1, qty = 0, spent = 0, prevV = 1;
  const strat = new Array(n), lump = new Array(n), buys = [];
  const lumpQty = 1 / (bars[0].o * (1 + slip) * (1 + fee));
  for (let i = 0; i < n; i++) {
    const b = bars[i];
    if (i % d.every === 0 && spent < 1 - 1e-12) {
      const a = Math.min(part, 1 - spent, cash), px = b.o * (1 + slip), q = a / (px * (1 + fee));
      qty += q; cash -= a; spent += a;
      buys.push({ i, t: b.t, px, qty: q, amount: a });
    }
    const V = cash + qty * b.c;
    strat[i] = V / prevV - 1;
    cash *= 1 + cb; // процент на остаток — к следующей свече
    prevV = cash + qty * b.c;
    lump[i] = lumpQty * b.c;
  }
  const curve = (r) => { let e = 1; return r.map((x) => (e *= 1 + x)); };
  const stratCurve = curve(strat);
  const done = spent >= 1 - 1e-12, next = done ? null : d.every - ((n - 1) % d.every); // через сколько свечей следующая покупка
  return {
    dca: true, params: d, strat, stratCurve, lumpCurve: lump, buys, spent, qty, cash,
    avgPrice: qty > 0 ? spent / qty : null, // средняя цена с комиссией, в валюте пары на единицу бюджета
    nextIn: next, nextAmount: done ? 0 : Math.min(part, 1 - spent), done,
  };
}

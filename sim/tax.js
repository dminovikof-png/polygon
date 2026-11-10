// Учёт сделок для налога: какая цена покупки «списывается» при продаже. Способ выбирает не человек, а закон страны.
// FIFO — первыми продаются самые ранние покупки; LIFO — самые поздние; avg — средняя цена всех купленных (общий пул).
// Сделки: [{ side: "buy" | "sell", qty, price, date? }]. Комиссии для простоты включены в цену.
export function realize(trades, method = "fifo") {
  let lots = [];
  const sales = [];
  for (const t of trades) {
    if (t.side === "buy") { lots.push({ qty: t.qty, price: t.price }); continue; }
    let left = t.qty, cost = 0;
    if (method === "avg") {
      const q = lots.reduce((a, l) => a + l.qty, 0), c = lots.reduce((a, l) => a + l.qty * l.price, 0);
      if (left > q + 1e-12) throw new Error("продаётся больше, чем куплено");
      const avg = q ? c / q : 0;
      cost = left * avg;
      lots = q - left > 1e-12 ? [{ qty: q - left, price: avg }] : [];
      left = 0;
    } else {
      while (left > 1e-12) {
        if (!lots.length) throw new Error("продаётся больше, чем куплено");
        const l = method === "lifo" ? lots.at(-1) : lots[0], take = Math.min(left, l.qty);
        cost += take * l.price; l.qty -= take; left -= take;
        if (l.qty <= 1e-12) method === "lifo" ? lots.pop() : lots.shift();
      }
    }
    const proceeds = t.qty * t.price;
    sales.push({ qty: t.qty, price: t.price, proceeds, cost, gain: proceeds - cost });
  }
  return { sales, gain: sales.reduce((a, s) => a + s.gain, 0), left: lots };
}

// Учебный пример: три покупки по разным ценам и одна продажа части монет.
export const DEMO_TRADES = [
  { side: "buy", qty: 1, price: 20000, date: "2021" },
  { side: "buy", qty: 1, price: 60000, date: "2021" },
  { side: "buy", qty: 1, price: 30000, date: "2023" },
  { side: "sell", qty: 1.5, price: 70000, date: "2025" },
];

// Фандинг бессрочных фьючерсов Bybit и идеи carry. Только публичные рыночные данные, без ключей и ордеров.
//
// Фандинг — регулярная выплата между лонгами и шортами бессрочного фьючерса (обычно раз в 8 часов, у части
// контрактов раз в 4 или 1 час). Ставка положительна — лонги платят шортам. Годовая ставка = ставка выплаты ×
// число выплат в году (по фактическому интервалу между соседними выплатами).
//
// Carry: купить монету на споте и продать такую же сумму бессрочного фьючерса. Цена почти не влияет (ноги
// компенсируют друг друга), доход — фандинг. Правило входа и выхода — по средней годовой ставке за N выплат.
import { getJson } from "./data.js";
import { store } from "./store.js";
const BASE = "https://api.bybit.com";
const YEAR = 365 * 86400;

/* ---------- загрузка ---------- */

// Binance: вся история с 2019 года, от старых к новым, по 1000 выплат.
async function binanceFunding(symbol, fromT) {
  let out = [], start = fromT ? (fromT + 1) * 1000 : Date.UTC(2019, 0, 1);
  for (let guard = 0; guard < 200; guard++) {
    const rows = await getJson(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}&startTime=${start}&limit=1000`);
    if (!Array.isArray(rows)) throw new Error("Binance: " + (rows?.msg || "неожиданный ответ"));
    if (!rows.length) break;
    out = out.concat(rows.map((x) => ({ T: Math.round(+x.fundingTime / 1000), rate: +x.fundingRate })));
    if (rows.length < 1000) break;
    start = +rows.at(-1).fundingTime + 1;
  }
  return out;
}

// OKX: публичный адрес отдаёт только последние ~3 месяца выплат (от новых к старым). Более ранние выплаты
// остаются в кэше, если обновлять его хотя бы раз в 3 месяца.
async function okxFunding(symbol, lastT) {
  const inst = symbol.replace(/USDT$/, "") + "-USDT-SWAP";
  let out = [], after = null;
  for (let guard = 0; guard < 50; guard++) {
    const j = await getJson(`https://www.okx.com/api/v5/public/funding-rate-history?instId=${inst}&limit=100${after ? `&after=${after}` : ""}`);
    if (j.code !== "0") throw new Error(`OKX (${inst}): ` + (j.msg || "неожиданный ответ"));
    const rows = j.data || [];
    if (!rows.length) break;
    out = out.concat(rows.map((x) => ({ T: Math.round(+x.fundingTime / 1000), rate: +(x.realizedRate || x.fundingRate) })));
    after = rows.at(-1).fundingTime;
    if (Math.round(+after / 1000) <= lastT) break;
    await new Promise((r) => setTimeout(r, 110));
  }
  return out;
}

async function fundingPage(symbol, endMs) {
  const url = `${BASE}/v5/market/funding/history?category=linear&symbol=${symbol}&limit=200${endMs ? `&endTime=${endMs}` : ""}`;
  const j = await getJson(url);
  if (j.retCode !== 0) throw new Error("Bybit: " + j.retMsg);
  return (j.result?.list || []).map((x) => ({ T: Math.round(+x.fundingRateTimestamp / 1000), rate: +x.fundingRate })); // от новых к старым
}

// Вся история выплат (по возрастанию времени). Кэш data/cache/funding_<биржа>_<монета>.json; при обновлении
// докачиваются только выплаты новее последней в кэше. exchange: bybit, binance, okx.
export async function loadFunding(symbol, { refresh = false, exchange = "bybit" } = {}) {
  if (!/^[A-Z0-9]{2,15}USDT$/.test(symbol)) throw new Error("Фандинг есть только у бессрочных фьючерсов к USDT (например, BTCUSDT)");
  if (!["bybit", "binance", "okx"].includes(exchange)) throw new Error("Фандинг: биржа bybit, binance или okx");
  const key = `cache/funding_${exchange}_${symbol}.json`;
  let have = store().get(key);
  if (!Array.isArray(have)) have = [];
  const now = Date.now() / 1000;
  if (have.length && !refresh && now - have.at(-1).T < 3600) return have;
  const lastT = have.length ? have.at(-1).T : 0;
  let out = [], end = null;
  if (exchange === "binance") out = await binanceFunding(symbol, lastT);
  else if (exchange === "okx") out = await okxFunding(symbol, lastT);
  else for (let guard = 0; guard < 200; guard++) {
    const page = await fundingPage(symbol, end);
    if (!page.length) break;
    out = out.concat(page);
    const oldest = page.at(-1).T;
    if (oldest <= lastT || page.length < 200) break;
    end = oldest * 1000 - 1;
  }
  if (!have.length && !out.length) throw new Error(`У ${symbol} нет бессрочного фьючерса на ${{ bybit: "Bybit", binance: "Binance", okx: "OKX" }[exchange]} (или истории фандинга)`);
  const map = new Map(have.map((x) => [x.T, x.rate]));
  for (const x of out) map.set(x.T, x.rate);
  const all = [...map.entries()].map(([T, rate]) => ({ T, rate })).sort((a, b) => a.T - b.T);
  store().set(key, all);
  return all;
}

/* ---------- ставки ---------- */

// Годовая ставка каждой выплаты, % (интервал — до предыдущей выплаты; у первой — 8 часов).
export function annualized(funding) {
  return funding.map((x, k) => {
    const dt = k ? x.T - funding[k - 1].T : 8 * 3600;
    const per = dt > 0 && dt <= 8 * 3600 + 60 ? dt : 8 * 3600; // пропуски в данных не растягивают интервал
    return { ...x, apr: x.rate * (YEAR / per) * 100 };
  });
}

// Средняя годовая ставка за последние days суток к моменту now.
export function aprOver(funding, days, now = Date.now() / 1000) {
  const a = annualized(funding).filter((x) => x.T > now - days * 86400 && x.T <= now);
  return a.length ? { apr: a.reduce((s, x) => s + x.apr, 0) / a.length, payments: a.length } : { apr: null, payments: 0 };
}

// Сумма ставок выплат внутри каждой свечи [t, t+step) — для платы за удержание по истории. null — до первой выплаты
// в данных (там остаётся постоянная ставка).
export function fundingPerBar(bars, funding, stepSec) {
  const out = new Array(bars.length).fill(null);
  if (!funding.length) return out;
  let k = 0;
  for (let i = 0; i < bars.length; i++) {
    const t = bars[i].t;
    if (t + stepSec <= funding[0].T) continue;
    while (k < funding.length && funding[k].T < t) k++;
    let sum = 0;
    for (let j = k; j < funding.length && funding[j].T < t + stepSec; j++) sum += funding[j].rate;
    out[i] = sum;
  }
  return out;
}

/* ---------- carry-бэктест ---------- */

export function normalizeCarry(p = {}) {
  const num = (x, d) => (x === undefined || x === null || x === "" ? d : Number(x));
  const c = {
    payments: Math.round(num(p.payments, 9)),
    entryApr: num(p.entryApr, 10.95), exitApr: num(p.exitApr, 3.29), emergencyApr: num(p.emergencyApr, -21.9),
    perpFeePct: num(p.perpFeePct, 0.055), haircut: num(p.haircut, 0.9), maintPct: num(p.maintPct, 0.5),
  };
  if (!(c.payments >= 1 && c.payments <= 500)) throw new Error("Число выплат для средней: от 1 до 500");
  if (!(c.exitApr < c.entryApr)) throw new Error("Порог выхода должен быть ниже порога входа");
  if (!(c.emergencyApr <= c.exitApr)) throw new Error("Аварийный порог должен быть не выше порога выхода");
  if (!(c.perpFeePct >= 0 && c.perpFeePct < 5)) throw new Error("Комиссия фьючерса: от 0 до 5 %");
  if (!(c.haircut > 0 && c.haircut <= 1)) throw new Error("Залоговый коэффициент спота: от 0 до 1");
  return c;
}

// Свечи спота и фьючерса — только общие по времени.
export function alignLegs(spot, perp) {
  const m = new Map(perp.map((b) => [b.t, b]));
  const s = [], p = [];
  for (const b of spot) { const q = m.get(b.t); if (q) { s.push(b); p.push(q); } }
  return { spot: s, perp: p };
}

// spot, perp — выровненные свечи (alignLegs); funding — выплаты по возрастанию; costs = { feePct, slipPct, ppy,
// cashYieldPct, cashFlat }. Капитал 1, единый счёт: вся сумма покупает монету, фьючерс продаётся на то же количество
// монет, спот служит залогом фьючерса (с залоговым коэффициентом).
//
// Честность:
// - Сигнал — по закрытию свечи (средняя за N выплат, прошедших к закрытию), исполнение обеих ног — по открытию
//   следующей свечи СВОИХ рядов: спот по цене спота, фьючерс по цене фьючерса, поэтому изменение базиса между
//   входом и выходом учтено. Комиссия и проскальзывание — на каждой из четырёх сделок.
// - Выплата засчитывается, если позиция была открыта ДО момента выплаты и закрыта ПОСЛЕ него. Выплата ровно в
//   момент входа или выхода засчитывается, только если она против нас (неизвестно, успела ли позиция).
// - Сумма выплаты = ставка × количество × цена фьючерса на открытии свечи, в которой была выплата.
// - Ликвидация фьючерса: если на худшей точке свечи (минимум спота и максимум фьючерса) залог (спот × коэффициент +
//   кэш + результат фьючерса) меньше поддерживающей маржи — обе ноги закрываются по этим ценам.
export function carryBacktest(spot, perp, funding, params = {}, costs = {}) {
  const c = normalizeCarry(params);
  const n = spot.length;
  // minBars: для проверки на истории — 30; бумажная сессия считает с первых новых свечей
  if (n < (costs.minBars ?? 30) || perp.length !== n) throw new Error("Слишком мало общих свечей спота и фьючерса");
  const fee = (costs.feePct ?? 0.1) / 100, pfee = c.perpFeePct / 100, slip = (costs.slipPct ?? 0.05) / 100;
  const ppy = costs.ppy || 8760, step = YEAR / ppy;
  const cb = costs.cashFlat ? (1 + (costs.cashYieldPct || 0) / 100) ** (1 / ppy) - 1 : 0;
  const ann = annualized(funding);
  const strat = new Array(n).fill(0), hold = new Array(n).fill(0);
  hold[0] = (spot[0].c / (spot[0].o * (1 + slip))) * (1 - fee) - 1;
  for (let i = 1; i < n; i++) hold[i] = spot[i].c / spot[i - 1].c - 1;
  let cash = 1, q = 0, closedQ = 0, pEntry = 0, held = false, pending = null, prevV = 1;
  let ruined = false, k = 0, fundIncome = 0, feesPaid = 0, inBars = 0, liquidations = 0, tEntry = -1, vEntry = 1;
  const tradeList = [], maSeries = new Array(n).fill(null);
  const close = (sPx, pPx, i, why) => {
    const sp = sPx * (1 - slip), pp = pPx * (1 + slip);
    const fs = q * sp * fee, fp = q * pp * pfee;
    cash += q * sp - fs + q * (pEntry - pp) - fp; feesPaid += fs + fp;
    tradeList.push({ entry: tEntry, exit: i, ret: cash / vEntry - 1, ...(why ? { why } : {}) });
    closedQ = q; q = 0; held = false;
  };
  // первая свеча, к закрытию которой накопилось N выплат
  let first = -1;
  if (ann.length >= c.payments) { const tN = ann[c.payments - 1].T; first = spot.findIndex((b) => tN < b.t + step); }
  for (let i = 0; i < n; i++) {
    const s = spot[i], p = perp[i];
    let enteredNow = false, exitedNow = false;
    if (pending === "enter" && !held) {
      const buy = s.o * (1 + slip), sell = p.o * (1 - slip);
      vEntry = cash; q = (cash * (1 - fee)) / buy; feesPaid += cash * fee;
      cash = 0; pEntry = sell; const fp = q * sell * pfee; cash -= fp; feesPaid += fp;
      held = true; enteredNow = true; tEntry = i;
    } else if (pending === "exit" && held) { close(s.o, p.o, i); exitedNow = true; }
    pending = null;
    // выплаты фандинга внутри свечи
    while (k < ann.length && ann[k].T < s.t) k++;
    for (let j = k; j < ann.length && ann[j].T < s.t + step; j++) {
      const f = ann[j], atOpen = f.T === s.t;
      let pay = 0;
      if (held && !(atOpen && enteredNow)) pay = q * p.o * f.rate;
      else if (held && atOpen && enteredNow && f.rate < 0) pay = q * p.o * f.rate;
      else if (exitedNow && atOpen && f.rate < 0) pay = closedQ * p.o * f.rate;
      cash += pay; fundIncome += pay;
    }
    // ликвидация фьючерса по худшей точке свечи
    if (held) {
      const coll = q * s.l * c.haircut + cash + q * (pEntry - p.h);
      const m = c.maintPct / 100;
      if (coll < m * q * p.h) {
        // фьючерс закрывается по цене ликвидации (залог = поддерживающая маржа), спот продаётся по минимуму свечи
        const pLiq = (q * s.l * c.haircut + cash + q * pEntry) / (q * (1 + m));
        close(s.l, Math.max(p.o, Math.min(p.h, pLiq)), i, "ликвидация"); liquidations++;
        if (cash <= 0) { ruined = true; cash = 0; }
      }
    }
    if (held) inBars++;
    if (!held) cash *= 1 + cb;
    const V = held ? cash + q * s.c + q * (pEntry - p.c) : cash;
    strat[i] = V / prevV - 1; prevV = V;
    // сигнал по закрытию
    if (i >= first && first !== -1) {
      let hi = k; while (hi < ann.length && ann[hi].T < s.t + step) hi++;
      const win = ann.slice(Math.max(0, hi - c.payments), hi);
      const ma = win.reduce((a, x) => a + x.apr, 0) / win.length, last = win.at(-1).apr;
      maSeries[i] = ma;
      if (!held && !ruined && ma > c.entryApr) pending = "enter"; // на последней свече — это действие на следующей (для бумажной торговли)
      else if (held && (ma < c.exitApr || last < c.emergencyApr)) pending = "exit";
    }
  }
  if (held) tradeList.push({ entry: tEntry, exit: n - 1, ret: prevV / vEntry - 1, open: true });
  const curve = (r) => { let e = 1; return r.map((x) => (e *= 1 + x)); };
  const stratCurve = curve(strat), total = stratCurve.at(-1) - 1;
  const lastMa = maSeries.findLast((x) => x != null);
  return {
    carry: true, params: c, strat, hold, stratCurve, holdCurve: curve(hold),
    trades: tradeList.filter((t) => !t.open).length, tradeList, exposure: inBars / n, side: "long", leverage: 1, liquidations, ruined,
    total, fundingIncome: fundIncome, feesPaid, basisAndOther: total - fundIncome + feesPaid, firstSignalBar: first, maSeries, lastMa,
    endState: { held, action: pending === "enter" ? "buy" : pending === "exit" ? "sell" : held ? "hold" : "wait", ruined: false, entryPx: null, liqPx: null },
  };
}

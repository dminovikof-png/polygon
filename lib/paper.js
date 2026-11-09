// Бумажная торговля: учебная торговля без денег и без подключения к бирже.
// Сессия запоминает правила, монету, капитал и момент старта. Состояние пересчитывается по ЗАКРЫТЫМ свечам
// после старта теми же правилами и тем же движком, что и бэктест: сигнал по закрытию свечи, исполнение
// по цене открытия следующей, комиссия и проскальзывание. Поэтому результат воспроизводим: одни и те же
// свечи всегда дают одно и то же состояние, и нет скрытых «ручных» решений.
import { store } from "./store.js";
import { backtest, normalizeCosts, PERIODS_PER_YEAR } from "./backtest.js";
import { planFor, resolveStrategyParams, STRATEGIES } from "./strategies.js";
import { validateSpec } from "./rules.js";
import { fxFactor } from "./currency.js";
import { gridBacktest, gridParamsOf, gridBounds, normalizeGrid } from "./grid.js";
import { carryBacktest, normalizeCarry } from "./funding.js";
import { dcaBacktest, normalizeDca } from "./dca.js";

// Типы сессий: без поля type — обычные (по сигналам); "grid" — сетка (спот или фьючерс, params.market);
// "carry" — спот + шорт бессрочного фьючерса; "dca" — покупка фиксированной суммы раз в N свечей.
const TYPES = { grid: "grid", carry: "carry", dca: "dca" };

const KEY = "paper.json";
const MAX_SESSIONS = 30;

export function listSessions() {
  const all = store().get(KEY);
  return Array.isArray(all) ? all : [];
}
function save(all) { store().set(KEY, all, { pretty: true }); }
const randomId = () => [...crypto.getRandomValues(new Uint8Array(5))].map((b) => b.toString(16).padStart(2, "0")).join("");

export function createSession(cfg, lastBarT) {
  const all = listSessions();
  if (all.length >= MAX_SESSIONS) throw new Error(`Не больше ${MAX_SESSIONS} сессий: удалите ненужные`);
  const key = cfg.strategy;
  const capital = Math.min(1e9, Math.max(10, Number(cfg.capital) || 1000)); // всегда в USDT
  const params = key === "custom" ? {} : key === "grid" ? gridParamsOf(cfg.grid ?? cfg.params) : key === "carry" ? normalizeCarry(cfg.carry ?? cfg.params)
    : key === "dca" ? normalizeDca(cfg.dca ?? cfg.params, capital) : resolveStrategyParams(key, cfg.params);
  const s = {
    id: randomId(),
    name: String(cfg.name || "").slice(0, 60) || "Сессия",
    createdAt: new Date().toISOString(),
    exchange: cfg.exchange || "bybit", symbol: String(cfg.symbol).toUpperCase(), tf: cfg.tf || "1D",
    strategy: key,
    ...(TYPES[key] ? { type: TYPES[key] } : {}), // сессии без type — обычные (по сигналам)
    params,
    spec: key === "custom" ? validateSpec(cfg.spec) : null,
    capital,
    reportCcy: cfg.reportCcy === "BTC" ? "BTC" : "USDT", // сессии без этого поля (до версии 0.4) — USDT
    startT: lastBarT, // время последней закрытой свечи на момент старта
  };
  if (key !== "custom" && !TYPES[key] && !STRATEGIES[key]) throw new Error("Неизвестная стратегия");
  const c = normalizeCosts({ ...cfg, ppy: PERIODS_PER_YEAR[s.tf] });
  Object.assign(s, { feePct: c.feePct, slipPct: c.slipPct, leverage: c.leverage, carryPct: c.carryPct, maintPct: c.maintPct, positionPct: c.positionPct, cashYieldPct: c.cashYieldPct, cashFlat: c.cashFlat, fundingHistory: !!c.fundingBars, ...(c.fundingBars ? { fundingExchange: c.fundingExchange || s.exchange } : {}) }); // старые сессии без fundingExchange — фандинг Bybit
  all.push(s); save(all);
  return s;
}

export function deleteSession(id) {
  const all = listSessions(), next = all.filter((s) => s.id !== id);
  if (next.length === all.length) throw new Error("Сессия не найдена");
  save(next);
}

export function getSession(id) {
  const s = listSessions().find((x) => x.id === id);
  if (!s) throw new Error("Сессия не найдена");
  return s;
}

const ACTION_TEXT = {
  long: {
    buy: "Купить на открытии следующей свечи",
    sell: "Продать на открытии следующей свечи",
    hold: "Держать позицию",
    wait: "Ждать сигнала, позиции нет",
  },
  // пара к BTC: «вне позиции» значит «капитал в BTC»
  btcPair: {
    buy: "Купить монету за BTC на открытии следующей свечи",
    sell: "Продать монету за BTC на открытии следующей свечи",
    hold: "Держать монету",
    wait: "Держать BTC, монеты нет",
  },
  short: {
    buy: "Открыть шорт (продать в долг) на открытии следующей свечи",
    sell: "Закрыть шорт (выкупить) на открытии следующей свечи",
    hold: "Держать шорт",
    wait: "Ждать сигнала, позиции нет",
  },
  // постоянная доля: позиция есть всегда, решение — вернуть ли долю к цели
  weights: {
    buy: "Купить целевую долю монеты на открытии следующей свечи",
    rebalance: "Вернуть долю монеты к цели на открытии следующей свечи",
    hold: "Держать: доля монеты в пределах допуска",
    wait: "Ждать",
  },
};
// Сессии до 0.4 не хранят долю и процент кэша: подставляются значения того времени (100 %, без процента).
const costsOfSession = (s) => ({ feePct: s.feePct, slipPct: s.slipPct, leverage: s.leverage ?? 1, carryPct: s.carryPct ?? 0, maintPct: s.maintPct ?? 0.5, positionPct: s.positionPct ?? 100, cashYieldPct: s.cashYieldPct ?? 0, cashFlat: !!s.cashFlat, ppy: PERIODS_PER_YEAR[s.tf] });

// Считает состояние сессии по свечам (bars — закрытые свечи, включая прогрев до старта).
// fx = { btcAligned, quote, report } — для пары к BTC или отчёта в BTC: капитал (в USDT) переводится в валюту отчёта
// по цене BTC на момент старта, дальше кривая пересчитывается по цене BTC (см. currency.js).
export function paperStatus(s, bars, fx = {}) {
  if (s.type === "grid") return gridPaperStatus(s, bars, fx);
  if (s.type === "carry") return carryPaperStatus(s, bars, fx);
  if (s.type === "dca") return dcaPaperStatus(s, bars, fx);
  const n = bars.length;
  const plan = planFor(s.strategy, bars, s.params, s.spec);
  const sgn = plan.side === "short" ? -1 : 1, costs = { ...costsOfSession(s), fundingBars: fx.fundingBars || null };
  const T = plan.kind === "weights" ? ACTION_TEXT.weights : plan.side !== "short" && (fx.quote === "BTC" || /BTC$/.test(s.symbol)) ? ACTION_TEXT.btcPair : ACTION_TEXT[plan.side === "short" ? "short" : "long"];
  const lev = costs.leverage;
  const startIdx = bars.findIndex((b) => b.t > s.startT); // первая свеча после старта
  const report = fx.report || s.reportCcy || "USDT", quote = fx.quote || "USDT";
  const f = fxFactor(fx.btcAligned || null, quote, report).f;
  const s0 = Math.max(0, (startIdx === -1 ? n : startIdx) - 1);
  const btcAt = (i) => fx.btcAligned?.[i]?.c;
  if (report === "BTC" && !(btcAt(s0) > 0)) throw new Error("Нет цены BTC на момент старта сессии: показать результат в BTC нельзя");
  const capRep = report === "BTC" ? s.capital / btcAt(s0) : s.capital;
  const fr = (i) => (f ? f[i] / f[s0] : 1);
  const base = { reportCcy: report, capitalRep: capRep, id: s.id, name: s.name, symbol: s.symbol, tf: s.tf, exchange: s.exchange, strategy: s.strategy, capital: s.capital, createdAt: s.createdAt, startT: s.startT, lastBarT: bars[n - 1]?.t, side: plan.side === "short" ? "short" : "long", leverage: costs.leverage, carryPct: costs.carryPct, positionPct: costs.positionPct, weights: plan.kind === "weights", share: null, target: plan.kind === "weights" ? plan.w : null };
  if (startIdx === -1) {
    // Новых свечей ещё нет: показываем, что программа сделает на открытии первой новой свечи.
    const bt = backtest(bars, { ...plan, entryOk: plan.entryOk.map((v, i) => (i === n - 1 ? v : false)) }, costs);
    return { ...base, waiting: true, equity: capRep, returnPct: 0, holdReturnPct: 0, held: false, action: bt.endState.action === "buy" ? "buy" : "wait", actionText: bt.endState.action === "buy" ? T.buy + " (после старта)" : T.wait, trades: [], series: [], newBars: 0 };
  }
  // Сигналы до свечи startIdx-1 не учитываются: до старта сессии позиции не было.
  const entryOk = plan.entryOk.map((v, i) => (i >= startIdx - 1 ? v : false));
  const exitOk = plan.exitOk.map((v, i) => (i >= startIdx - 1 ? v : false));
  const bt = backtest(bars, { ...plan, entryOk, exitOk }, costs);
  const closedTrades = bt.tradeList.filter((t) => !t.open);
  const trades = bt.tradeList.map((t) => ({
    entryT: bars[t.entry].t, exitT: t.open ? null : bars[t.exit].t, open: !!t.open,
    entryPrice: bars[t.entry].o * (1 + sgn * s.slipPct / 100), ret: t.ret, liquidated: !!t.liquidated,
  }));
  // До старта позиции не было, поэтому кривая на свече startIdx−1 равна накопленному кэшу (обычно 1): берём отношение.
  const c0 = bt.stratCurve[s0], baseClose = bars[s0].c;
  const last = (bt.stratCurve[n - 1] / c0) * fr(n - 1);
  const holdLast = (bars[n - 1].c / baseClose) * fr(n - 1);
  const series = bars.slice(s0).map((b, k) => ({ t: b.t, equity: capRep * (bt.stratCurve[s0 + k] / c0) * fr(s0 + k), hold: capRep * (b.c / baseClose) * fr(s0 + k) }));
  const open = bt.tradeList.at(-1)?.open ? bt.tradeList.at(-1) : null;
  return {
    ...base, waiting: false, newBars: n - startIdx,
    equity: capRep * last, returnPct: (last - 1) * 100, holdReturnPct: (holdLast - 1) * 100,
    share: bt.endState.share ?? null,
    held: bt.endState.held, action: bt.endState.action, actionText: bt.ruined ? "Счёт обнулён ликвидацией, торговля остановлена" : T[bt.endState.action], ruined: bt.ruined,
    openTrade: open ? { entryT: bars[open.entry].t, entryPrice: bars[open.entry].o * (1 + sgn * s.slipPct / 100), unrealizedPct: open.ret * 100, liqPrice: lev > 1 || sgn < 0 ? bt.endState.liqPx : null } : null,
    closedTrades: closedTrades.length, wins: closedTrades.filter((t) => t.ret > 0).length,
    trades: trades.slice(-30).reverse(),
    allTrades: bt.tradeList.map((t) => ({ entryT: bars[t.entry].t, entryPx: t.entryPx, exitT: t.open ? null : bars[t.exit].t, exitPx: t.open ? null : t.exitPx, ret: t.ret, note: t.open ? "открыта" : t.liquidated ? "ликвидация" : "" })),
    series: thin(series, 400),
  };
}

// Бумажная сетка: запускается на открытии первой свечи после старта и дальше идёт тем же движком, что и проверка.
function gridPaperStatus(s, bars, fx = {}) {
  const n = bars.length, g = normalizeGrid(s.params), perp = g.market === "perp";
  const report = fx.report || s.reportCcy || "USDT", quote = fx.quote || "USDT";
  const startIdx = bars.findIndex((b) => b.t > s.startT);
  const s0 = Math.max(0, (startIdx === -1 ? n : startIdx) - 1);
  const btcAt = (i) => fx.btcAligned?.[i]?.c;
  if ((report === "BTC" || quote === "BTC") && !(btcAt(s0) > 0)) throw new Error("Нет цены BTC на момент старта сессии");
  const capRep = report === "BTC" ? s.capital / btcAt(s0) : s.capital;
  const capQuote = quote === "BTC" ? s.capital / btcAt(s0) : s.capital; // вложение в котируемой валюте пары
  const base = { grid: true, perp, reportCcy: report, quote, capitalRep: capRep, capitalQuote: capQuote, id: s.id, name: s.name, symbol: s.symbol, tf: s.tf, exchange: s.exchange, strategy: "grid", capital: s.capital, createdAt: s.createdAt, startT: s.startT, lastBarT: bars[n - 1]?.t, side: perp && g.direction === "short" ? "short" : "long", leverage: perp ? g.leverage : 1, params: g };
  if (startIdx === -1) {
    const b = gridBounds([{ o: bars[n - 1].c }], g);
    return { ...base, waiting: true, equity: capRep, returnPct: 0, holdReturnPct: 0, lower: b.lower, upper: b.upper,
      actionText: `Запустить сетку на открытии следующей свечи: ${g.levels} уровней от ${b.lower.toPrecision(6)} до ${b.upper.toPrecision(6)}${g.mode === "pct" ? " (границы пересчитаются от цены открытия)" : ""}`, trades: [], series: [], newBars: 0 };
  }
  const sub = bars.slice(startIdx);
  // у фьючерсной сетки фандинг — по выплатам, разложенным по свечам после старта (без истории — запасная ставка)
  const costs = { ...costsOfSession(s), fundingBars: perp && fx.fundingBars ? fx.fundingBars.slice(startIdx) : null };
  const bt = gridBacktest(sub, g, costs);
  const f = fx.btcAligned ? fxFactor(fx.btcAligned.slice(startIdx), quote, report).f : null;
  const fr = (k) => (f ? f[k] : 1);
  const series = sub.map((b, k) => ({ t: b.t, equity: capRep * bt.stratCurve[k] * fr(k), hold: capRep * bt.holdCurve[k] * fr(k) }));
  const last = series.at(-1), price = sub.at(-1).c;
  const orders = bt.orders.map((o) => ({ ...o, qty: o.qty * capQuote })).sort((a, b) => Math.abs(a.px - price) - Math.abs(b.px - price)).slice(0, 6).sort((a, b) => b.px - a.px);
  return {
    ...base, waiting: false, newBars: sub.length, lower: bt.lower, upper: bt.upper, levels: bt.levels.length, stepPct: bt.stepPct,
    equity: last.equity, returnPct: (last.equity / capRep - 1) * 100, holdReturnPct: (last.hold / capRep - 1) * 100,
    rounds: bt.rounds, gridProfitQuote: bt.gridProfit * capQuote, revaluationQuote: bt.revaluation * capQuote, coinQty: bt.coinQty * capQuote, cashQuote: bt.cash * capQuote,
    stopped: bt.stopped, trailShifts: bt.trailShifts, price, orders,
    ...(perp ? { fundingQuote: bt.funding * capQuote, feesQuote: bt.fees * capQuote, ruined: bt.ruined, liquidatedAt: bt.liquidatedAt, liquidationPx: bt.liquidationPx, liqDown: bt.liqDown, liqUp: bt.liqUp } : {}),
    action: bt.stopped ? "stopped" : "grid",
    actionText: bt.ruined ? "Позиция ликвидирована, вложение потеряно, сетка остановлена" : bt.stopped ? `Сетка остановлена (${bt.stopped}), всё в ${quote}` : `Держать заявки: ${bt.orders.filter((o) => o.side === "buy").length} на покупку, ${bt.orders.filter((o) => o.side === "sell").length} на продажу`,
    trades: bt.events.slice(-30).reverse().map(gridTrade(capQuote)),
    allTrades: bt.events.map(gridTrade(capQuote)),
    series: thin(series, 400),
  };
}
const gridTrade = (cap) => (e) => ({ t: e.t, side: e.side, px: e.px, qty: e.qty * cap, profit: e.profit == null ? null : e.profit * cap, why: e.why || null });

// Бумажный carry: решение по закрытию последней свечи до старта, ноги — по открытию следующей.
// bars — свечи спота, fx.perp — свечи фьючерса (выровнены по времени), fx.funding — выплаты.
function carryPaperStatus(s, bars, fx = {}) {
  const n = bars.length, report = fx.report || s.reportCcy || "USDT";
  const startIdx = bars.findIndex((b) => b.t > s.startT);
  const s0 = Math.max(0, (startIdx === -1 ? n : startIdx) - 1);
  const btcAt = (i) => fx.btcAligned?.[i]?.c;
  if (report === "BTC" && !(btcAt(s0) > 0)) throw new Error("Нет цены BTC на момент старта сессии");
  const capRep = report === "BTC" ? s.capital / btcAt(s0) : s.capital;
  const base = { carry: true, reportCcy: report, quote: "USDT", capitalRep: capRep, id: s.id, name: s.name, symbol: s.symbol, tf: s.tf, exchange: s.exchange, strategy: "carry", capital: s.capital, createdAt: s.createdAt, startT: s.startT, lastBarT: bars[n - 1]?.t, side: "long", leverage: 1, params: s.params };
  const costs = { ...costsOfSession(s), minBars: 1 };
  const bt = carryBacktest(bars.slice(s0), fx.perp.slice(s0), fx.funding, s.params, costs);
  const ACT = { buy: "Купить монету на споте и продать фьючерс на открытии следующей свечи", sell: "Закрыть обе ноги на открытии следующей свечи", hold: "Держать обе ноги", wait: "Ждать: средний фандинг ниже порога входа" };
  const ma = bt.lastMa == null ? "" : ` Средний фандинг за ${s.params.payments} выплат: ${bt.lastMa.toFixed(1)} % годовых (вход выше ${s.params.entryApr}, выход ниже ${s.params.exitApr}).`;
  if (startIdx === -1) return { ...base, waiting: true, equity: capRep, returnPct: 0, holdReturnPct: 0, actionText: (bt.endState.action === "buy" ? ACT.buy : ACT.wait) + "." + ma, trades: [], allTrades: [], series: [], newBars: 0 };
  const f = fx.btcAligned ? fxFactor(fx.btcAligned.slice(s0), "USDT", report).f : null;
  const fr = (k) => (f ? f[k] / f[0] : 1);
  const sub = bars.slice(s0), c0 = sub[0].c;
  const series = sub.map((b, k) => ({ t: b.t, equity: capRep * bt.stratCurve[k] * fr(k), hold: capRep * (b.c / c0) * fr(k) }));
  const last = series.at(-1);
  const tr = (t) => ({ entryT: sub[t.entry].t, exitT: t.open ? null : sub[t.exit].t, ret: t.ret, open: !!t.open, note: t.open ? "открыта" : t.why || "" });
  return {
    ...base, waiting: false, newBars: n - startIdx,
    equity: last.equity, returnPct: (last.equity / capRep - 1) * 100, holdReturnPct: (last.hold / capRep - 1) * 100,
    held: bt.endState.held, action: bt.endState.action, actionText: (bt.ruined ? "Фьючерс ликвидирован, торговля остановлена" : ACT[bt.endState.action]) + "." + ma, ruined: bt.ruined,
    fundingUsd: bt.fundingIncome * s.capital, feesUsd: bt.feesPaid * s.capital, lastMa: bt.lastMa,
    closedTrades: bt.trades, trades: bt.tradeList.map(tr).slice(-30).reverse(), allTrades: bt.tradeList.map(tr),
    series: thin(series, 400),
  };
}

// Бумажный DCA: первая покупка — на открытии первой свечи после старта.
function dcaPaperStatus(s, bars, fx = {}) {
  const n = bars.length, report = fx.report || s.reportCcy || "USDT", quote = fx.quote || "USDT";
  const startIdx = bars.findIndex((b) => b.t > s.startT);
  const s0 = Math.max(0, (startIdx === -1 ? n : startIdx) - 1);
  const btcAt = (i) => fx.btcAligned?.[i]?.c;
  if ((report === "BTC" || quote === "BTC") && !(btcAt(s0) > 0)) throw new Error("Нет цены BTC на момент старта сессии");
  const capRep = report === "BTC" ? s.capital / btcAt(s0) : s.capital;
  const capQuote = quote === "BTC" ? s.capital / btcAt(s0) : s.capital;
  const p = s.params, part = p.amount / s.capital;
  const base = { dca: true, reportCcy: report, quote, capitalRep: capRep, capitalQuote: capQuote, id: s.id, name: s.name, symbol: s.symbol, tf: s.tf, exchange: s.exchange, strategy: "dca", capital: s.capital, createdAt: s.createdAt, startT: s.startT, lastBarT: bars[n - 1]?.t, side: "long", leverage: 1, params: p };
  if (startIdx === -1) return { ...base, waiting: true, equity: capRep, returnPct: 0, holdReturnPct: 0, actionText: `Первая покупка на $${p.amount} — на открытии следующей свечи, дальше раз в ${p.every} свеч.`, trades: [], allTrades: [], series: [], newBars: 0 };
  const sub = bars.slice(startIdx);
  const bt = dcaBacktest(sub, p, s.capital, costsOfSession(s));
  const f = fx.btcAligned ? fxFactor(fx.btcAligned.slice(startIdx), quote, report).f : null;
  const fr = (k) => (f ? f[k] : 1);
  const series = sub.map((b, k) => ({ t: b.t, equity: capRep * bt.stratCurve[k] * fr(k), hold: capRep * bt.lumpCurve[k] * fr(k) }));
  const last = series.at(-1);
  const buy = (x) => ({ t: x.t, px: x.px, qty: x.qty * capQuote, amount: x.amount * capQuote });
  return {
    ...base, waiting: false, newBars: sub.length,
    equity: last.equity, returnPct: (last.equity / capRep - 1) * 100, holdReturnPct: (last.hold / capRep - 1) * 100,
    buys: bt.buys.length, spentQuote: bt.spent * capQuote, cashQuote: bt.cash * capQuote, coinQty: bt.qty * capQuote, avgPrice: bt.avgPrice, price: sub.at(-1).c,
    held: bt.qty > 0, action: bt.done ? "hold" : "dca",
    actionText: bt.done ? "Бюджет вложен целиком: держать монету" : `Следующая покупка на ${quote === "BTC" ? "₿" + (bt.nextAmount * capQuote).toFixed(6) : "$" + (bt.nextAmount * capQuote).toFixed(2)} — на открытии ${bt.nextIn === 1 ? "следующей свечи" : `свечи через ${bt.nextIn}`}`,
    trades: bt.buys.map(buy).slice(-30).reverse(), allTrades: bt.buys.map(buy),
    series: thin(series, 400), partPct: part * 100,
  };
}

/* ---------- выгрузка и сводка ---------- */

const iso = (t) => (t == null ? "" : new Date(t * 1000).toISOString().slice(0, 16).replace("T", " "));
const csvCell = (v) => { const x = v == null ? "" : typeof v === "number" ? String(+v.toPrecision(10)) : String(v); return /[",\n;]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x; };

// Все сделки сессии в CSV (разделитель — запятая, дробная часть — точка, время — UTC).
export function sessionCsv(st) {
  const rows = st.allTrades || [];
  let head, body;
  if (st.grid) {
    head = ["Время (UTC)", "Сделка", "Цена", "Количество монеты", `Прибыль круга (${st.quote})`, "Примечание"];
    body = rows.map((t) => [iso(t.t), t.side === "liq" ? "ликвидация" : t.side === "buy" ? "покупка" : "продажа", t.px, t.qty, t.profit, t.why]);
  } else if (st.dca) {
    head = ["Время (UTC)", `Сумма (${st.quote})`, "Цена", "Количество монеты"];
    body = rows.map((t) => [iso(t.t), t.amount, t.px, t.qty]);
  } else if (st.carry) {
    head = ["Вход (UTC)", "Выход (UTC)", "Результат, %", "Примечание"];
    body = rows.map((t) => [iso(t.entryT), iso(t.exitT), t.ret * 100, t.note]);
  } else {
    head = ["Вход (UTC)", "Цена входа", "Выход (UTC)", "Цена выхода", "Результат, %", "Примечание"];
    body = rows.map((t) => [iso(t.entryT), t.entryPx, iso(t.exitT), t.exitPx, t.ret * 100, t.note]);
  }
  return "\uFEFF" + [head, ...body].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

// Сводка сессий в валюте report. rows: { capital (USDT), equityUsd, btcStart, btcNow, years, cashYieldPct, waiting?, error? }.
// Эталоны: те же деньги в BTC с момента старта каждой сессии и те же деньги в USDT (под процент кэша сессии).
export function portfolioSummary(rows, report = "USDT") {
  const R = (usd, btcPx) => (report === "BTC" ? usd / btcPx : usd);
  const ok = rows.filter((r) => !r.error && r.btcStart > 0 && r.btcNow > 0);
  const out = ok.map((r) => {
    const cash = r.capital * (1 + (r.cashYieldPct || 0) / 100) ** (r.years || 0);
    return { ...r, capitalR: R(r.capital, r.btcStart), equityR: R(r.equityUsd, r.btcNow), btcR: R((r.capital / r.btcStart) * r.btcNow, r.btcNow), cashR: R(cash, r.btcNow) };
  });
  const sum = (k) => out.reduce((a, r) => a + r[k], 0);
  const cap = sum("capitalR"), eq = sum("equityR"), btc = sum("btcR"), cash = sum("cashR");
  return { report, sessions: out, skipped: rows.filter((r) => !ok.includes(r)), capital: cap, equity: eq, btc, cash,
    returnPct: cap > 0 ? (eq / cap - 1) * 100 : 0, btcReturnPct: cap > 0 ? (btc / cap - 1) * 100 : 0, cashReturnPct: cap > 0 ? (cash / cap - 1) * 100 : 0 };
}

function thin(arr, max) {
  if (arr.length <= max) return arr;
  const step = Math.ceil(arr.length / max);
  return arr.filter((_, i) => i % step === 0 || i === arr.length - 1);
}

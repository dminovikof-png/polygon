// Расчётный слой «Честного полигона»: принимает запрос интерфейса и возвращает ответ. Без сети и файлов напрямую:
// данные — через lib/data.js и т. п., хранение — через lib/store.js. Поэтому этот же код работает и в сервере
// на компьютере (server.js), и в рабочем потоке браузера на планшете и телефоне (public/worker.js).
import { loadCandles, cacheStartReached, SYMBOLS, EXCHANGES, EXCHANGE_NAMES, clampBars, DEFAULT_BARS, MAX_BARS, getJson } from "./data.js";
import { backtest, PERIODS_PER_YEAR, normalizeCosts, MAX_LEVERAGE } from "./backtest.js";
import { BENCHMARKS, buildBenchmarks, dilutedMatch, alignBars } from "./benchmarks.js";
import { CURRENCIES, fxFactor, convertBt, convertReturns } from "./currency.js";
import { parseSymbol, loadSeries, synthesize, listBtcPairs } from "./pairs.js";
import { analyse } from "./stats.js";
import { diagnose } from "./diagnostics.js";
import { readJournal, addAttempt, addAttempts, attemptsWith, markRepeats, attemptKey, uniqueAttempts, mergeJournals } from "./journal.js";
import { scanCombo, yearBeatSummary } from "./scan.js";
import { coinFacts } from "./coins.js";
import { marketState } from "./state.js";
import { readProgress, saveProgress } from "./progress.js";
import { plank } from "./stats.js";
import { strategyCatalog, planFor, STRATEGIES, resolveStrategyParams } from "./strategies.js";
import { indicatorCatalog, PRICE_FIELDS } from "./indicators.js";
import { OPS, validateSpec } from "./rules.js";
import { CATALOG, GLOSSARY } from "./catalog.js";
import { listSessions, createSession, deleteSession, getSession, paperStatus, sessionCsv, portfolioSummary } from "./paper.js";
import { gridBacktest, gridParamsOf, halfReturns } from "./grid.js";
import { loadFunding, fundingPerBar, carryBacktest, alignLegs, normalizeCarry, aprOver, annualized } from "./funding.js";
import { packCandles, timedTrades, tradeMarkers, orderMarkers, sessionChart } from "./candles.js";
import { store } from "./store.js";
import { judge } from "./proscons.js";

function costsOf(req, tf) {
  return normalizeCosts({ feePct: req.feePct, slipPct: req.slipPct, leverage: req.leverage, carryPct: req.carryPct, maintPct: req.maintPct, cashYieldPct: req.cashYieldPct, cashFlat: req.cashFlat, positionPct: req.positionPct, ppy: PERIODS_PER_YEAR[tf] });
}

const BTC = "BTCUSDT";
function benchKey(req) {
  const k = req.benchmark || "coin";
  if (!BENCHMARKS[k]) throw new Error("Эталон: " + Object.keys(BENCHMARKS).join(", "));
  return k;
}

const D = (t) => new Date(t * 1000).toISOString().slice(0, 10);

function checkStrategy(req) {
  if (req.strategy === "grid") return { spec: null, params: gridParamsOf(req.grid) };
  if (req.strategy === "custom") return { spec: validateSpec(req.spec), params: {} };
  if (!STRATEGIES[req.strategy]) throw new Error("Неизвестная стратегия");
  return { spec: null, params: resolveStrategyParams(req.strategy, req.params) };
}

function reportOf(req) {
  const r = req.reportCcy || "USDT";
  if (!CURRENCIES.includes(r)) throw new Error("Валюта отчёта: " + CURRENCIES.join(" или "));
  return r;
}

// Общая подготовка проверки: свечи пары (настоящей или синтетической), издержки, свечи BTC, множитель валюты отчёта
// и эталоны. Одна точка правды для проверки, разбора и бумажной торговли.
const OKX_FUNDING_NOTE = " У OKX публичный адрес отдаёт фандинг только за последние ~3 месяца: раньше — запасная ставка, а более ранняя история копится в кэше, если обновлять его хотя бы раз в 3 месяца.";
async function prepare(req, { refresh = false } = {}) {
  const { spec, params } = checkStrategy(req);
  const tf = req.tf || "1D", gridPerp = req.strategy === "grid" && params.market === "perp";
  const chosen = benchKey(req), maxBars = clampBars(req.maxBars), ppy = PERIODS_PER_YEAR[tf], report = reportOf(req);
  const info = parseSymbol(req.symbol);
  if (STRATEGIES[req.strategy]?.needsBtcPair && info.quote !== "BTC") throw new Error("Эта идея работает только на паре к BTC: выберите пару вида SOLBTC или синтетику SOLUSDT/BTCUSDT");
  if (gridPerp && !(info.kind === "spot" && info.quote === "USDT")) throw new Error("Фьючерсная сетка — только для пар к USDT (у них есть бессрочный фьючерс)");
  const notes = [];
  const exchange = req.exchange || "bybit", EX = EXCHANGE_NAMES[exchange] || exchange;
  // Пересчёт из журнала (req.until): только свечи, уже лежащие на устройстве (без сети), не позже until; длина — как была.
  const cacheOnly = !!req.until || !!req.cacheOnly, want = cacheOnly ? 1e9 : maxBars;
  let bars = gridPerp ? await loadCandles(info.symbol, tf, { exchange, maxBars: want, refresh, market: "linear", cacheOnly }) : (await loadSeries(info.symbol, tf, { exchange, maxBars: want, refresh, cacheOnly })).bars;
  if (cacheOnly) bars = bars.filter((b) => req.until == null || b.t <= req.until).slice(-maxBars);
  let costs = costsOf(req, tf);
  if (req.strategy === "grid") {
    if (costs.leverage > 1) throw new Error("Плечо сетки задаётся в настройках сетки (фьючерсная сетка), общее плечо поставьте 1x");
    if (costs.positionPct < 100) notes.push("У сетки вложение делится между ячейками сетки; настройка «Доля капитала в позиции» здесь не применяется.");
    costs = { ...costs, positionPct: 100, cashFlat: false };
  }
  if (gridPerp) {
    const f = await loadFunding(info.symbol, { refresh, exchange, cacheOnly });
    const fb = fundingPerBar(bars, f, (365 * 86400) / ppy);
    costs = { ...costs, fundingBars: fb };
    notes.push(`Фьючерсная сетка на бессрочном фьючерсе ${info.symbol} ${EX}, плечо ${params.leverage}x, направление: ${PERP_DIR[params.direction]}. Вложение — маржа бота, сумма позиций всех ячеек — вложение × плечо. ` +
      `Комиссия фьючерса ${params.perpFeePct} % с каждой стороны каждой заявки, у рыночных — ещё проскальзывание ${costs.slipPct} %. ` +
      `Ликвидация — когда на любой точке свечи (в худшем из двух порядков движения) стоимость счёта опускается до поддерживающей маржи ${params.maintPct} % от позиции; после неё вложение считается потерянным целиком. ` +
      `Фандинг — по истории ${EX} (выплат: ${f.length}, с ${D(f[0].T)}), лонг платит положительный, шорт получает; позиция берётся худшая из начала и конца свечи` +
      (fb.findIndex((x) => x != null) > 0 ? `; до ${D(f[0].T)} — 0,01 % за 8 часов против позиции.` : ".") +
      " Эталоны («держать монету» и другие) посчитаны по цене фьючерса — она близка к споту.");
  }
  if (STRATEGIES[req.strategy]?.weights && costs.positionPct < 100) {
    // У «постоянной доли» доля задаётся в самой идее: вторая доля сверху запутала бы смысл.
    costs = { ...costs, positionPct: 100 };
    notes.push("У «постоянной доли» доля монеты задаётся параметром идеи; настройка «Доля капитала в позиции» здесь не применяется.");
  }
  if (costs.positionPct < 100) notes.push(`В каждую сделку идёт ${costs.positionPct} % текущего капитала, остальное лежит в ${info.quote === "BTC" ? "BTC" : "кэше"}${costs.cashFlat ? ` под ${costs.cashYieldPct} % годовых` : " без процента"}. Внутри сделки доля не выравнивается, плечо и ликвидация касаются только вложенной части.`);
  if (info.kind === "synthetic") {
    costs = { ...costs, feePct: costs.feePct * 2, slipPct: costs.slipPct * 2 };
    notes.push(`Синтетическая пара ${info.base}/BTC: посчитана из ${info.legs.join(" и ")}. Максимумы и минимумы соотношения внутри свечи неизвестны, поэтому стопы и цели проверяются по закрытию свечи и исполняются по открытию следующей, ликвидация — по грубым границам (пессимистично), а индикаторы на максимумах и минимумах (ATR, каналы, стохастик) считаются по телу свечи. Переход между монетой и BTC — две сделки через USDT, поэтому комиссия и проскальзывание удвоены: ${costs.feePct} % и ${costs.slipPct} % с каждой стороны.`);
  }
  if (info.quote === "BTC" && costs.cashFlat) {
    costs = { ...costs, cashFlat: false };
    notes.push("У пары к BTC «вне рынка» означает «в BTC», процент по USDT туда не начисляется.");
  }
  if (req.fundingHistory && req.strategy !== "grid") {
    // Плата за удержание по истории фандинга Bybit (бессрочный фьючерс той же монеты к USDT).
    if (info.quote !== "USDT") notes.push("Фандинг по истории есть только у пар к USDT: для пары к BTC осталась постоянная плата за удержание.");
    else {
      try {
        const f = await loadFunding(info.symbol, { refresh, exchange, cacheOnly });
        const fb = fundingPerBar(bars, f, (365 * 86400) / ppy);
        const known = fb.findIndex((x) => x != null);
        costs = { ...costs, fundingBars: fb, fundingExchange: exchange };
        notes.push(`Плата за удержание — по истории фандинга бессрочного фьючерса ${info.symbol} на ${EX} (выплат: ${f.length}, с ${D(f[0].T)}): шорт получает положительный фандинг и платит отрицательный, покупка с плечом — наоборот, со всей суммы позиции.` +
          (known > 0 ? ` До ${D(f[0].T)} фандинга нет — там постоянная ставка ${costs.carryPct} % годовых.` : "") + (exchange === "okx" ? OKX_FUNDING_NOTE : ""));
      } catch (e) { notes.push("Историю фандинга получить не удалось (" + e.message + "): осталась постоянная плата за удержание."); }
    }
  }
  if (gridPerp && exchange === "okx") notes.push(OKX_FUNDING_NOTE.trim());
  const btcBars = info.symbol === BTC ? bars : await loadCandles(BTC, tf, { exchange, maxBars: want, refresh, cacheOnly });
  const fxr = fxFactor(alignBars(bars, btcBars), info.quote, report);
  notes.push(...fxr.notes);
  const b = buildBenchmarks(bars, info.symbol === BTC ? null : btcBars, { feePct: costs.feePct, slipPct: costs.slipPct, cashYieldPct: costs.cashYieldPct, ppy, quote: info.quote, fx: fxr.f });
  if (info.symbol === BTC) b.btcAligned = bars;
  notes.push(...b.notes);
  if (report !== info.quote) notes.push(`Результат пересчитан из ${info.quote} в ${report} по цене BTCUSDT: пересчёт — только учёт, сделок и комиссий он не добавляет. Доходности отдельных сделок остаются в ${info.quote}.`);
  return { spec, params, tf, exchange, chosen, maxBars, ppy, report, info, bars, costs, notes, btcBars, fx: fxr.f, bench: { ...b, chosen, cashYieldPct: costs.cashYieldPct } };
}

export async function runTest(req, { record = true } = {}) {
  const P = await prepare(req, { refresh: !!req.refresh });
  const { bars, costs, ppy, chosen, bench, info, report, exchange, tf, maxBars, params } = P;
  const plan = planFor(req.strategy, bars, params, P.spec);
  const btN = backtest(bars, plan, costs);
  const bt = convertBt(btN, P.fx);
  const entry = { exchange, symbol: info.symbol, tf, strategy: req.strategy, params: req.strategy === "custom" ? { spec: plan.spec } : params, side: bt.side, leverage: costs.leverage, carryPct: costs.carryPct, feePct: costs.feePct, slipPct: costs.slipPct, positionPct: costs.positionPct, fundingHistory: !!costs.fundingBars,
    benchmark: chosen, cashYieldPct: costs.cashYieldPct, cashFlat: costs.cashFlat, maxBars, reportCcy: report, bars: bars.length };
  // Планка — по уникальным настройкам: повтор той же проверки не считается новой попыткой.
  const journal = readJournal();
  const attempts = attemptsWith(entry, journal);
  const repeat = attempts === uniqueAttempts(journal);
  const result = { ...analyse(bt, ppy, attempts, bench), repeat };
  if (record) addAttempt({ ...entry, toT: bars.at(-1).t, tExcess: +result.tExcess.toFixed(3), strategyTotal: +result.strategy.total.toFixed(4), holdTotal: +result.hold.total.toFixed(4) });
  // Разбавленный эталон: доля монеты с той же максимальной просадкой, что у идеи (в валюте отчёта).
  // У пары к BTC остаток лежит в BTC без процента, у пары к USDT — в USDT под процент кэша.
  const dil = dilutedMatch(bars, result.strategy.maxDrawdown, { feePct: costs.feePct, slipPct: costs.slipPct, cashYieldPct: info.quote === "BTC" ? 0 : costs.cashYieldPct, ppy, fx: P.fx });
  const diluted = { share: dil.w, total: dil.curve.at(-1) - 1, cagr: dil.curve.at(-1) > 0 ? dil.curve.at(-1) ** (1 / result.years) - 1 : -1, maxDrawdown: dil.mdd, trades: dil.trades, capped: dil.capped, restIn: info.quote };
  const liq = btN.tradeList.find((t) => t.liquidated);
  const notes = [...P.notes, ...result.notes];
  if (liq) notes.unshift(`Дата ликвидации: ${D(bars[liq.exit].t)}.`);
  const step = Math.max(1, Math.floor(bars.length / 600));
  const ref = bench.series[chosen];
  let e = 1; const refCurve = ref.map((r) => (e *= 1 + r));
  const series = bars.map((b, i) => ({ t: b.t, s: bt.stratCurve[i], h: bt.holdCurve[i], r: refCurve[i], d: dil.curve[i] })).filter((_, i) => i % step === 0 || i === bars.length - 1);
  return { ...result, notes, diluted, series, exchange, symbol: info.symbol, pair: info, reportCcy: report, tf, from: bars[0].t, to: bars.at(-1).t, bars: bars.length, maxBars, chart: { candles: packCandles(bars), markers: tradeMarkers(timedTrades(btN.tradeList, bars), bt.side) }, liquidationAt: liq ? bars[liq.exit].t : null, endAction: btN.endState.action, endLiqPx: btN.endState.liqPx, positionPct: costs.positionPct, weights: !!btN.weights, endShare: btN.endState.share ?? null };
}

// Пакетный скан: идеи × монеты × свечи с параметрами по умолчанию. Каждая комбинация — отдельная попытка в журнале
// (с пометкой scan), поэтому планка растёт на число новых комбинаций; повтор того же скана её не поднимает.
export const SCAN_TFS = ["1h", "4h", "1D"], SCAN_MAX = 1000;
export function scanPlan(req) {
  const ideas = (req.ideas?.length ? req.ideas : Object.keys(STRATEGIES)).filter((k) => STRATEGIES[k]);
  const symbols = (req.symbols?.length ? req.symbols : SYMBOLS).map((s) => parseSymbol(s).symbol);
  const tfs = (req.tfs?.length ? req.tfs : SCAN_TFS).filter((t) => SCAN_TFS.includes(t));
  if (!ideas.length || !symbols.length || !tfs.length) throw new Error("Выберите хотя бы одну идею, монету и свечу");
  // идеи только для пар к BTC на парах к USDT не запускаются
  const combos = [];
  for (const symbol of symbols) for (const tf of tfs) for (const key of ideas) if (!(STRATEGIES[key].needsBtcPair && parseSymbol(symbol).quote !== "BTC")) combos.push({ symbol, tf, key });
  if (combos.length > SCAN_MAX) throw new Error(`Слишком много комбинаций (${combos.length}): не больше ${SCAN_MAX}`);
  return { ideas, symbols, tfs, combos };
}

export async function runScan(req) {
  const { combos } = scanPlan(req);
  const id = Date.now().toString(36), rows = [], entries = [], skipped = [];
  const groups = new Map();
  for (const c of combos) { const g = `${c.symbol}|${c.tf}`; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(c); }
  for (const [g, list] of groups) {
    const [symbol, tf] = g.split("|");
    let P;
    try { P = await prepare({ ...req, symbol, tf, strategy: "sma_trend", params: {}, fundingHistory: false }); }
    catch (e) { skipped.push(`${symbol} ${tf}: ${e.message}`); continue; }
    const { bars, costs, ppy, info, report, exchange, maxBars, chosen } = P;
    for (const { key } of list) {
      try {
        const r = scanCombo({ bars, key, costs, bench: P.bench, ppy, fx: P.fx });
        const entry = { exchange, symbol: info.symbol, tf, strategy: key, params: r.params, side: r.side, leverage: costs.leverage, carryPct: costs.carryPct, feePct: costs.feePct, slipPct: costs.slipPct, positionPct: costs.positionPct, fundingHistory: false,
          benchmark: chosen, cashYieldPct: costs.cashYieldPct, cashFlat: costs.cashFlat, maxBars, reportCcy: report, bars: bars.length, toT: bars.at(-1).t, scan: id };
        entries.push({ ...entry, tExcess: +r.tExcess.toFixed(3), strategyTotal: +r.total.toFixed(4), holdTotal: +r.coinTotal.toFixed(4) });
        rows.push({ key, title: STRATEGIES[key].title, symbol: info.symbol, tf, bars: bars.length, from: bars[0].t, to: bars.at(-1).t, ...r });
      } catch (e) { skipped.push(`${STRATEGIES[key].title}, ${symbol} ${tf}: ${e.message}`); }
    }
  }
  const before = uniqueAttempts(), journal = readJournal();
  const attempts = attemptsWith(entries, journal);
  if (entries.length) addAttempts(entries);
  const bar = plank(attempts);
  for (const r of rows) r.significant = r.tExcess > bar;
  return { id, report: reportOf(req), benchmark: benchKey(req), exchange: req.exchange || "bybit", combos: rows.length, newAttempts: attempts - before, attempts, plank: bar, plankBefore: plank(before),
    rows, skipped, year: yearBeatSummary(rows) };
}

// Полный разбор: те же правила, плюс сделки, сдвиг исполнения, соседние настройки, годы и другие монеты.
// Для пары к BTC «другие монеты» — синтетические соотношения остальных монет к BTC той же биржи.
export async function runAnalysis(req) {
  const P = await prepare(req);
  const { bars, costs, ppy, bench, info, report, exchange, tf, maxBars, params, spec, btcBars } = P;
  const others = [], skipped = [];
  for (const s of SYMBOLS.filter((x) => x !== BTC && x !== info.base + "USDT" && x !== info.symbol)) {
    try {
      const raw = await loadCandles(s, tf, { exchange, maxBars });
      const ob = info.quote === "BTC" ? synthesize(raw, btcBars) : raw;
      others.push({ symbol: info.quote === "BTC" ? s.replace("USDT", "") + "/BTC" : s, bars: ob, fx: fxFactor(alignBars(ob, btcBars), info.quote, report).f });
    } catch { skipped.push(s); }
  }
  if (info.quote === "USDT" && info.symbol !== BTC) others.unshift({ symbol: BTC, bars: btcBars, fx: fxFactor(alignBars(btcBars, btcBars), "USDT", report).f });
  // Та же пара на другой бирже — для сравнения периодов (обычно у Binance история длиннее).
  let otherExchange = null;
  const otherEx = EXCHANGES.find((x) => x !== exchange);
  try {
    const ob = (await loadSeries(info.symbol, tf, { exchange: otherEx, maxBars })).bars;
    const obtc = info.quote === report && info.quote === "USDT" ? null : await loadCandles(BTC, tf, { exchange: otherEx, maxBars });
    otherExchange = { exchange: otherEx, bars: ob, fx: obtc ? fxFactor(alignBars(ob, obtc), info.quote, report).f : null };
  } catch { /* пары нет на другой бирже */ }
  const d = diagnose({ bars, key: req.strategy, params, spec, costs, others, ppy, bench, exchange, otherExchange });
  return { ...d, notes: P.notes, symbol: info.symbol, pair: info, reportCcy: report, tf, exchange, skippedCoins: skipped, from: bars[0].t, to: bars.at(-1).t };
}

// Запрос проверки из записи журнала: те же настройки и та же история (toT — последняя свеча той проверки).
export function replayReq(e) {
  const custom = e.strategy === "custom";
  const req = { exchange: e.exchange, symbol: e.symbol, tf: e.tf, strategy: e.strategy, params: custom ? {} : e.params ?? {}, ...(custom ? { spec: e.params?.spec } : {}),
    feePct: e.feePct, slipPct: e.slipPct, leverage: e.strategy === "grid" ? 1 : e.leverage, carryPct: e.carryPct, benchmark: e.benchmark, cashYieldPct: e.cashYieldPct, cashFlat: e.cashFlat,
    maxBars: e.maxBars, reportCcy: e.reportCcy, positionPct: e.positionPct, fundingHistory: e.fundingHistory };
  if (e.toT) req.until = e.toT;
  return req;
}

// Карточка попытки: пересчёт без записи в журнал; плюсы и минусы идеи и этой проверки.
export async function runReplay({ index, time, key }) {
  const journal = readJournal();
  // Номер записи мог сдвинуться (журнал пополнился на другом устройстве): сверяем время и ключ настройки
  // (у комбинаций одного скана время одинаковое, поэтому одного времени мало).
  const same = (x) => x && (time == null || x.time === time) && (key == null || attemptKey(x) === key);
  if (time != null && !same(journal[index])) {
    index = journal.findIndex(same);
    if (index < 0) throw new Error("Журнал изменился: такой записи больше нет, откройте журнал заново");
  }
  const entry = journal[index];
  if (!entry) throw new Error("Такой записи в журнале нет");
  if (entry.strategy === "carry") throw new Error("Запись carry пересчитать нельзя: карточка есть у проверок идей и сеток");
  const grid = entry.strategy === "grid", req = { ...replayReq(entry), cacheOnly: true }; // история — всё, что есть в кэше, даже у записей без toT
  if (grid) { delete req.params; req.grid = entry.params; }
  const run = (r) => (grid ? runGrid(r, { record: false }) : runTest(r, { record: false }));
  const result = await run(req);
  const zero = await run({ ...req, feePct: 0, slipPct: 0 });
  const S = STRATEGIES[entry.strategy];
  // «Та же история»: известна последняя свеча, совпали длина и последняя свеча (история могла быть обрезана).
  const sameHistory = !!entry.toT && (entry.bars == null || result.bars === entry.bars) && result.to === entry.toT;
  return { index, entry, result, sameHistory,
    idea: S ? { title: S.title, plain: S.plain, source: S.source, verdict: S.verdict, pros: S.pros || [], cons: S.cons || [] } : null,
    judged: judge(result, { zeroCostTotal: zero.strategy.total }) };
}

const GRID_WARNING = "Сетка на свечах завышает результат: модель не видит колебаний внутри свечи и порядка, в котором цена проходила уровни. В исследовании проекта сетка, посчитанная на часовых свечах, дала +275,7 п.п., а та же сетка на минутных — −931 %. Здесь модель строже (круги внутри свечи не засчитываются, худший порядок движения), но проверьте на минутных свечах ниже.";
const PERP_DIR = { long: "лонг", short: "шорт", neutral: "нейтральная" };
// Сетка: отдельный движок, те же эталоны и журнал. Добавлен эталон «50/50 без сетки».
export async function runGrid(req, { record = true } = {}) {
  const P = await prepare({ ...req, strategy: "grid" }, { refresh: !!req.refresh });
  const { bars, costs, ppy, chosen, info, report, exchange, tf, maxBars, params } = P;
  const perp = params.market === "perp";
  const btN = gridBacktest(bars, params, costs);
  const bt = convertBt(btN, P.fx);
  const bench = { ...P.bench, series: { ...P.bench.series, half: convertReturns(halfReturns(bars, costs), P.fx) }, labels: { half: "50/50 без сетки" } };
  const entry = { exchange, symbol: info.symbol, tf, strategy: "grid", params, side: perp && params.direction === "short" ? "short" : "long", leverage: perp ? params.leverage : 1, carryPct: 0, feePct: costs.feePct, slipPct: costs.slipPct, positionPct: 100,
    benchmark: chosen, cashYieldPct: costs.cashYieldPct, cashFlat: false, maxBars, reportCcy: report, bars: bars.length };
  const journal = readJournal();
  const attempts = attemptsWith(entry, journal);
  const repeat = attempts === uniqueAttempts(journal);
  const result = { ...analyse(bt, ppy, attempts, bench), repeat };
  if (record) addAttempt({ ...entry, toT: bars.at(-1).t, tExcess: +result.tExcess.toFixed(3), strategyTotal: +result.strategy.total.toFixed(4), holdTotal: +result.hold.total.toFixed(4) });
  const step = Math.max(1, Math.floor(bars.length / 600));
  let e1 = 1, e2 = 1; const ref = bench.series[chosen].map((r) => (e1 *= 1 + r)), half = bench.series.half.map((r) => (e2 *= 1 + r));
  const series = bars.map((b, i) => ({ t: b.t, s: bt.stratCurve[i], h: bt.holdCurve[i], r: ref[i], d: half[i] })).filter((_, i) => i % step === 0 || i === bars.length - 1);
  const notes = [GRID_WARNING, ...P.notes, ...result.notes];
  if (params.mode === "price") notes.push("Границы заданы ценами. Если вы выбрали их, глядя на график этого периода, проверка заглядывает в будущее: диапазон подогнан под уже известный путь цены. Честнее — границы в процентах от цены старта.");
  if (info.kind === "synthetic") notes.push("У синтетики максимумы и минимумы внутри свечи неизвестны: сетка видит только движение тела свечи (кругов меньше, чем было бы), а стоп проверяется по грубым границам.");
  const D2 = (t) => new Date(t * 1000).toISOString().slice(0, 16).replace("T", " ");
  if (btN.ruined) notes.unshift(`Ликвидация ${D2(btN.liquidatedAt)} по цене около ${+btN.liquidationPx.toPrecision(6)}: вложение потеряно.`);
  const perpOut = perp ? { perp: true, direction: params.direction, leverage: params.leverage, funding: btN.funding, fees: btN.fees, ruined: btN.ruined, liquidatedAt: btN.liquidatedAt, liquidationPx: btN.liquidationPx,
    liqDown: btN.liqDown, liqUp: btN.liqUp, liqNow: btN.liqNow, maxLev: btN.maxLev, avgLev: btN.exposure, netQty: btN.coinQty, lastPx: bars.at(-1).c } : {};
  return { ...result, notes, series, chart: { candles: packCandles(bars), markers: orderMarkers(btN.events) }, exchange, symbol: info.symbol, pair: info, reportCcy: report, tf, from: bars[0].t, to: bars.at(-1).t, bars: bars.length, maxBars,
    grid: { params, lower: btN.lower, upper: btN.upper, levels: btN.levels, stepPct: btN.stepPct, rounds: btN.rounds, gridProfit: btN.gridProfit, revaluation: btN.revaluation, total: btN.total,
      inRangeShare: btN.inRangeShare, belowShare: btN.belowShare, aboveShare: btN.aboveShare, trailShifts: btN.trailShifts, stopped: btN.stopped, quote: info.quote,
      orders: btN.orders, lastEvents: btN.events.slice(-12).reverse().map((x) => ({ ...x, time: D2(x.t) })), fee: perp ? params.perpFeePct : costs.feePct, slip: costs.slipPct, ...perpOut } };
}

// Та же сетка на минутных свечах за последние days суток и на выбранных свечах за то же окно — насколько крупные свечи
// завышают результат. Считается в котируемой валюте пары, в журнал не пишется (это проверка модели, а не новая идея).
export async function runGridMinutes(req) {
  const P = await prepare({ ...req, strategy: "grid" });
  const days = Math.min(60, Math.max(7, Math.round(Number(req.days) || 30)));
  const perp = P.params.market === "perp";
  const m = perp ? await loadCandles(P.info.symbol, "1m", { exchange: P.exchange, maxBars: days * 1440, market: "linear" }) : (await loadSeries(P.info.symbol, "1m", { exchange: P.exchange, maxBars: days * 1440 })).bars;
  if (m.length < 1440) throw new Error("Минутных свечей слишком мало");
  const coarse = P.bars.filter((b) => b.t >= m[0].t);
  if (coarse.length < 2) throw new Error("За это окно нет свечей выбранного размера");
  const stepSec = (365 * 86400) / P.ppy, mm = m.filter((b) => b.t >= coarse[0].t && b.t < coarse.at(-1).t + stepSec); // ровно то же окно
  const sum = (bt, bars) => ({ bars: bars.length, from: bars[0].t, to: bars.at(-1).t, total: bt.total, gridProfit: bt.gridProfit, revaluation: bt.revaluation, rounds: bt.rounds, inRangeShare: bt.inRangeShare, stopped: bt.stopped, hold: bt.holdCurve.at(-1) - 1, ruined: !!bt.ruined, funding: bt.funding ?? null });
  // у фьючерсной сетки фандинг — по тем же выплатам, разложенным по своим свечам
  const funding = perp ? await loadFunding(P.info.symbol, { exchange: P.exchange }) : null;
  const cc = perp ? { ...P.costs, fundingBars: P.costs.fundingBars.slice(P.bars.length - coarse.length) } : P.costs;
  const cm = perp ? { ...P.costs, fundingBars: fundingPerBar(mm, funding, 60) } : P.costs;
  const res = {};
  for (const mode of ["strict", "one"]) {
    const p = { ...P.params, intrabar: mode };
    res[mode] = { coarse: sum(gridBacktest(coarse, p, cc), coarse), minute: sum(gridBacktest(mm, p, cm), mm) };
  }
  return { days, tf: P.tf, quote: P.info.quote, symbol: P.info.symbol, chosen: P.params.intrabar, ...res };
}

// Carry: спот + шорт бессрочного фьючерса Bybit. Свечи спота, свечи фьючерса и выплаты фандинга — публичные данные.
export async function runCarry(req) {
  const tf = req.tf || "1h", maxBars = clampBars(req.maxBars), ppy = PERIODS_PER_YEAR[tf], report = reportOf(req), chosen = benchKey(req);
  const symbol = String(req.symbol || "").toUpperCase();
  if (!/^[A-Z0-9]{2,15}USDT$/.test(symbol)) throw new Error("Carry считается только для пар к USDT (у них есть бессрочный фьючерс)");
  const params = normalizeCarry(req.carry);
  const refresh = !!req.refresh, exchange = req.exchange || "bybit", EX = EXCHANGE_NAMES[exchange];
  if (!EXCHANGES.includes(exchange)) throw new Error("Допустимые биржи: " + EXCHANGES.join(", "));
  const costs = normalizeCosts({ feePct: req.feePct, slipPct: req.slipPct, cashYieldPct: req.cashYieldPct, cashFlat: req.cashFlat, ppy });
  const [spotRaw, perpRaw, funding] = await Promise.all([
    loadCandles(symbol, tf, { exchange, maxBars, refresh }),
    loadCandles(symbol, tf, { exchange, maxBars, refresh, market: "linear" }),
    loadFunding(symbol, { refresh, exchange }),
  ]);
  const { spot, perp } = alignLegs(spotRaw, perpRaw);
  const bt0 = carryBacktest(spot, perp, funding, params, costs);
  const first = Math.max(0, bt0.firstSignalBar);
  const bars = spot.slice(first), pb = perp.slice(first);
  const btN = first ? carryBacktest(bars, pb, funding, params, costs) : bt0; // период — с первой свечи, когда средняя уже считается
  const btcBars = symbol === BTC ? bars : await loadCandles(BTC, tf, { exchange, maxBars, refresh });
  const fxr = fxFactor(alignBars(bars, btcBars), "USDT", report);
  const bt = convertBt(btN, fxr.f);
  const b = buildBenchmarks(bars, symbol === BTC ? null : btcBars, { feePct: costs.feePct, slipPct: costs.slipPct, cashYieldPct: costs.cashYieldPct, ppy, quote: "USDT", fx: fxr.f });
  const bench = { ...b, chosen, cashYieldPct: costs.cashYieldPct };
  const entry = { exchange, symbol, tf, strategy: "carry", params, side: "long", leverage: 1, carryPct: 0, feePct: costs.feePct, slipPct: costs.slipPct, positionPct: 100,
    benchmark: chosen, cashYieldPct: costs.cashYieldPct, cashFlat: costs.cashFlat, maxBars, reportCcy: report, bars: bars.length };
  const journal = readJournal();
  const attempts = attemptsWith(entry, journal);
  const repeat = attempts === uniqueAttempts(journal);
  const result = { ...analyse(bt, ppy, attempts, bench), repeat };
  addAttempt({ ...entry, tExcess: +result.tExcess.toFixed(3), strategyTotal: +result.strategy.total.toFixed(4), holdTotal: +result.hold.total.toFixed(4) });
  const step = Math.max(1, Math.floor(bars.length / 600));
  let e1 = 1; const ref = bench.series[chosen].map((r) => (e1 *= 1 + r));
  const series = bars.map((x, i) => ({ t: x.t, s: bt.stratCurve[i], h: bt.holdCurve[i], r: ref[i], m: btN.maSeries[i] })).filter((_, i) => i % step === 0 || i === bars.length - 1);
  // годы: доход по календарным годам и доля времени в позиции
  const years = {};
  bars.forEach((x, i) => { const y = new Date(x.t * 1000).getUTCFullYear(); (years[y] ||= { e: 1, n: 0 }).e *= 1 + bt.strat[i]; years[y].n++; });
  const inPos = new Array(bars.length).fill(false);
  for (const t of btN.tradeList) for (let i = t.entry; i <= t.exit; i++) inPos[i] = true;
  bars.forEach((x, i) => { if (inPos[i]) years[new Date(x.t * 1000).getUTCFullYear()].p = (years[new Date(x.t * 1000).getUTCFullYear()].p || 0) + 1; });
  const notes = [
    `Модель: единый счёт ${EX} — вся сумма покупает монету на споте, фьючерс продаётся на то же количество монет, спот служит залогом фьючерса с коэффициентом ${params.haircut ?? 0.9}. Без единого счёта (отдельная маржа) доходность на весь капитал примерно вдвое ниже.`,
    `Фандинг ${EX} по ${symbol} начинается ${D(funding[0].T)}; проверка начинается, когда накопилось ${params.payments} выплат.`,
    ...fxr.notes, ...b.notes, ...result.notes.filter((x) => !/бета/.test(x)),
  ];
  if (bt.liquidations) notes.unshift(`Ликвидаций фьючерса: ${bt.liquidations}.`);
  const nowApr = aprOver(funding, 7);
  if (exchange === "okx") notes.unshift("OKX отдаёт фандинг только за последние ~3 месяца, поэтому проверка carry здесь короткая и от удачи почти не отличима. Длинная история — на Bybit (с 2020) и Binance (с 2019).");
  return { ...result, notes, series, exchange, symbol, pair: { kind: "spot", quote: "USDT", symbol }, reportCcy: report, tf, from: bars[0].t, to: bars.at(-1).t, bars: bars.length, maxBars,
    carry: { params, fundingIncome: btN.fundingIncome, feesPaid: btN.feesPaid, basisAndOther: btN.basisAndOther, total: btN.total, exposure: btN.exposure, trades: btN.trades, liquidations: btN.liquidations,
      lastMa: btN.lastMa, apr7: nowApr.apr, action: btN.endState.action, held: btN.endState.held, perpFee: params.perpFeePct,
      years: Object.entries(years).map(([y, v]) => ({ year: +y, ret: v.e - 1, inPos: (v.p || 0) / v.n })),
      trades10: btN.tradeList.slice(-10).reverse().map((t) => ({ from: bars[t.entry].t, to: bars[t.exit].t, ret: t.ret, open: !!t.open, why: t.why || null })) } };
}

// Сторож ставок: текущий годовой фандинг (7 и 30 дней) и годовая доходность базиса срочных фьючерсов на Bybit,
// Binance и OKX. Только чтение публичных данных.
const LINEAR = "к USDT", INVERSE = "инверсный (к USD, расчёт в монете)";
const basisRow = (now, r) => {
  const days = (r.delivery - now) / 86400;
  if (!(days > 0 && r.bid > 0 && r.index > 0)) return null;
  const basis = r.bid / r.index - 1;
  return { ...r, kind: r.inverse ? INVERSE : r.settle && r.settle !== "USDT" ? `к USD, расчёт в ${r.settle}` : LINEAR, days, basisPct: basis * 100, apr: (basis * 365 / days) * 100 };
};

async function futuresBybit(bases, now) {
  const out = [];
  for (const cat of ["linear", "inverse"]) {
    const [ins, tk] = await Promise.all([getJson(`https://api.bybit.com/v5/market/instruments-info?category=${cat}&limit=1000`), getJson(`https://api.bybit.com/v5/market/tickers?category=${cat}`)]);
    const tick = new Map((tk.result?.list || []).map((x) => [x.symbol, x]));
    for (const x of ins.result?.list || []) {
      if (!/Futures/.test(x.contractType) || x.status !== "Trading" || !bases.has(x.baseCoin)) continue;
      const t = tick.get(x.symbol);
      if (!t) continue;
      out.push(basisRow(now, { exchange: "bybit", symbol: x.symbol, base: x.baseCoin, inverse: cat === "inverse", delivery: +x.deliveryTime / 1000, bid: +t.bid1Price, index: +t.indexPrice, turnover24h: +t.turnover24h || 0 }));
    }
  }
  return out;
}

// Binance: квартальные к USDT (fapi) и инверсные к USD (dapi); индекс — из premiumIndex, цена покупателя — bookTicker.
async function futuresBinance(bases, now) {
  const out = [];
  for (const [host, path, inverse] of [["https://fapi.binance.com", "fapi", false], ["https://dapi.binance.com", "dapi", true]]) {
    const [info, book, prem, day] = await Promise.all(["exchangeInfo", "ticker/bookTicker", "premiumIndex", "ticker/24hr"].map((e) => getJson(`${host}/${path}/v1/${e}`)));
    const by = (arr) => new Map((Array.isArray(arr) ? arr : []).map((x) => [x.symbol, x]));
    const B = by(book), P = by(prem), V = by(day);
    for (const x of info.symbols || []) {
      if (!/QUARTER/.test(x.contractType) || (x.status || x.contractStatus) !== "TRADING" || !bases.has(x.baseAsset)) continue;
      const b = B.get(x.symbol), pr = P.get(x.symbol), v = V.get(x.symbol);
      if (!b || !pr) continue;
      out.push(basisRow(now, { exchange: "binance", symbol: x.symbol, base: x.baseAsset, inverse, delivery: +x.deliveryDate / 1000, bid: +b.bidPrice, index: +pr.indexPrice, turnover24h: v ? +(inverse ? v.baseVolume : v.quoteVolume) || 0 : 0 }));
    }
  }
  return out;
}

// OKX: все срочные фьючерсы (instType=FUTURES); индекс — index-tickers по USD и USDT.
async function futuresOkx(bases, now) {
  const [ins, tk, iUsd, iUsdt] = await Promise.all([
    getJson("https://www.okx.com/api/v5/public/instruments?instType=FUTURES"), getJson("https://www.okx.com/api/v5/market/tickers?instType=FUTURES"),
    getJson("https://www.okx.com/api/v5/market/index-tickers?quoteCcy=USD"), getJson("https://www.okx.com/api/v5/market/index-tickers?quoteCcy=USDT")]);
  if (ins.code !== "0") throw new Error("OKX: " + ins.msg);
  const tick = new Map((tk.data || []).map((x) => [x.instId, x]));
  const idx = new Map([...(iUsd.data || []), ...(iUsdt.data || [])].map((x) => [x.instId, +x.idxPx]));
  const out = [];
  for (const x of ins.data || []) {
    const [base] = (x.uly || "").split("-");
    if (x.state !== "live" || !bases.has(base) || /XPERP/.test(x.instId)) continue; // XPERP — бессрочные с фандингом, а не срочные
    const t = tick.get(x.instId), inverse = x.ctType === "inverse";
    if (!t) continue;
    out.push(basisRow(now, { exchange: "okx", symbol: x.instId, base, inverse, settle: x.settleCcy, delivery: +x.expTime / 1000, bid: +t.bidPx, index: idx.get(x.uly), turnover24h: inverse ? +t.volCcy24h || 0 : (+t.volCcy24h || 0) * (+t.last || 0) }));
  }
  return out;
}

export async function runRates(req = {}) {
  const now = Date.now() / 1000;
  // биржи параллельно, внутри биржи — по очереди (не перегружать публичные адреса)
  const perEx = await Promise.all(EXCHANGES.map(async (ex) => {
    const rows = [];
    for (const s of SYMBOLS) {
      try {
        const f = await loadFunding(s, { refresh: !!req.refresh, exchange: ex });
        const a = annualized(f), last = a.at(-1);
        rows.push({ exchange: ex, symbol: s, apr7: aprOver(f, 7, now).apr, apr30: aprOver(f, 30, now).apr, lastApr: last.apr, lastT: last.T, intervalH: a.length > 1 ? (a.at(-1).T - a.at(-2).T) / 3600 : null });
      } catch (e) { rows.push({ exchange: ex, symbol: s, error: e.message }); }
    }
    return rows;
  }));
  const funding = SYMBOLS.flatMap((s) => perEx.map((rows) => rows.find((r) => r.symbol === s)));
  const bases = new Set(SYMBOLS.map((s) => s.replace("USDT", "")));
  const futures = [];
  await Promise.all([["bybit", futuresBybit], ["binance", futuresBinance], ["okx", futuresOkx]].map(async ([ex, fn]) => {
    try { futures.push(...(await fn(bases, now)).filter(Boolean)); } catch (e) { futures.push({ error: `${EXCHANGE_NAMES[ex]}: ${e.message}` }); }
  }));
  futures.sort((a, b) => (a.base || "").localeCompare(b.base || "") || a.delivery - b.delivery || (a.exchange || "").localeCompare(b.exchange || ""));
  return { time: now, funding, futures };
}

// Этап «Монеты»: факты по дневным свечам выбранной биржи и средний фандинг за 30 дней. Только публичные данные.
export async function runCoins(req = {}) {
  const exchange = EXCHANGES.includes(req.exchange) ? req.exchange : "bybit", refresh = !!req.refresh;
  const symbols = [...new Set((req.symbols?.length ? req.symbols : SYMBOLS).map((s) => String(s).toUpperCase()))].slice(0, 30);
  const btc = await loadCandles(BTC, "1D", { exchange, refresh, maxBars: MAX_BARS }).catch(() => null);
  const rows = [];
  for (const symbol of symbols) { // по очереди — не перегружать публичные адреса
    try {
      if (!/^[A-Z0-9]{2,15}USDT$/.test(symbol)) throw new Error("Только пары к USDT, например SUIUSDT");
      const bars = symbol === BTC && btc ? btc : await loadCandles(symbol, "1D", { exchange, refresh, maxBars: MAX_BARS });
      const f = coinFacts(bars, btc, { startReached: await cacheStartReached(symbol, "1D", exchange) });
      let funding30 = null;
      try { funding30 = aprOver(await loadFunding(symbol, { refresh, exchange }), 30).apr; } catch { /* нет бессрочного фьючерса — без фандинга */ }
      rows.push({ symbol, ...f, funding30 });
    } catch (e) { rows.push({ symbol, error: e.message }); }
  }
  return { exchange, time: Date.now() / 1000, rows };
}

// Этап «Состояние рынка»: описание по дневным свечам и базовые частоты из прошлого монеты. Не прогноз.
export async function runState(req = {}) {
  const exchange = EXCHANGES.includes(req.exchange) ? req.exchange : "bybit", refresh = !!req.refresh;
  const symbols = [...new Set((req.symbols?.length ? req.symbols : SYMBOLS).map((s) => String(s).toUpperCase()))].slice(0, 30);
  const rows = [];
  for (const symbol of symbols) {
    try {
      if (!/^[A-Z0-9]{2,15}USDT$/.test(symbol)) throw new Error("Только пары к USDT");
      rows.push({ symbol, ...marketState(await loadCandles(symbol, "1D", { exchange, refresh, maxBars: MAX_BARS })) });
    } catch (e) { rows.push({ symbol, error: e.message }); }
  }
  return { exchange, time: Date.now() / 1000, rows };
}

export async function runPaperCreate(req) {
  if (req.strategy === "carry") {
    const symbol = String(req.symbol || "").toUpperCase(), tf = req.tf || "4h", exchange = req.exchange || "bybit";
    if (!/^[A-Z0-9]{2,15}USDT$/.test(symbol)) throw new Error("Carry — только для пар к USDT (у них есть бессрочный фьючерс)");
    if (!EXCHANGES.includes(exchange)) throw new Error("Допустимые биржи: " + EXCHANGES.join(", "));
    const params = normalizeCarry(req.carry);
    const [spot, perp] = await Promise.all([loadCandles(symbol, tf, { exchange, refresh: true }), loadCandles(symbol, tf, { exchange, refresh: true, market: "linear" })]);
    await loadFunding(symbol, { refresh: true, exchange }); // проверка, что фандинг есть
    const legs = alignLegs(spot, perp);
    if (legs.spot.length < 2) throw new Error("Нет общих свечей спота и фьючерса");
    const c = normalizeCosts({ feePct: req.feePct, slipPct: req.slipPct, cashYieldPct: req.cashYieldPct, cashFlat: req.cashFlat, ppy: PERIODS_PER_YEAR[tf] });
    return createSession({ ...req, ...c, strategy: "carry", carry: params, exchange, tf, symbol, reportCcy: reportOf(req) }, legs.spot.at(-1).t);
  }
  if (req.strategy === "dca") {
    const tf = req.tf || "1D", exchange = req.exchange || "bybit", info = parseSymbol(req.symbol);
    const { bars } = await loadSeries(info.symbol, tf, { exchange, refresh: true, maxBars: 300 });
    let c = normalizeCosts({ feePct: req.feePct, slipPct: req.slipPct, cashYieldPct: req.cashYieldPct, cashFlat: req.cashFlat && info.quote === "USDT", ppy: PERIODS_PER_YEAR[tf] });
    if (info.kind === "synthetic") c = { ...c, feePct: c.feePct * 2, slipPct: c.slipPct * 2 }; // монета ↔ BTC — две сделки через USDT
    return createSession({ ...req, ...c, strategy: "dca", exchange, tf, symbol: info.symbol, reportCcy: reportOf(req) }, bars.at(-1).t);
  }
  const P = await prepare(req, { refresh: true });
  if (req.strategy === "grid") gridBacktest(P.bars.slice(-30), P.params, P.costs); // проверка параметров до записи сессии
  if (P.bars.length < 30) throw new Error("Слишком мало свечей");
  return createSession({ ...req, ...P.costs, spec: P.spec, params: P.params, exchange: P.exchange, tf: P.tf, symbol: P.info.symbol, reportCcy: P.report }, P.bars.at(-1).t);
}

// Сколько свечей скачать: все свечи после старта сессии и 1000 до него (прогрев индикаторов).
const barsSince = (s) => Math.min(MAX_BARS, Math.max(DEFAULT_BARS, Math.ceil((Date.now() / 1000 - s.startT) / ((365 * 86400) / PERIODS_PER_YEAR[s.tf])) + 1000));

// opts.report — валюта отчёта вместо сессионной; opts.withBtc — добавить цену BTC на старте и сейчас (для сводки).
export async function runPaperStatus(id, opts = {}) {
  const s = getSession(id);
  const info = parseSymbol(s.symbol), report = opts.report || s.reportCcy || "USDT";
  const perpGrid = s.type === "grid" && s.params?.market === "perp";
  const o = { exchange: s.exchange, refresh: true, maxBars: barsSince(s) };
  let bars, perp = null, funding = null;
  if (s.type === "carry") {
    const [sp, pp, f] = await Promise.all([loadCandles(info.symbol, s.tf, o), loadCandles(info.symbol, s.tf, { ...o, market: "linear" }), loadFunding(info.symbol, { refresh: true, exchange: s.exchange })]);
    ({ spot: bars, perp } = alignLegs(sp, pp)); funding = f;
  } else if (perpGrid) {
    bars = await loadCandles(info.symbol, s.tf, { ...o, market: "linear" });
  } else bars = (await loadSeries(info.symbol, s.tf, o)).bars;
  // BTC нужен, если пара не к USDT, отчёт не в USDT или для сводки.
  const needBtc = info.quote !== "USDT" || report !== "USDT" || opts.withBtc;
  const btcBars = !needBtc ? null : info.symbol === BTC ? bars : await loadCandles(BTC, s.tf, { exchange: s.exchange, refresh: true, maxBars: o.maxBars });
  const btcAligned = btcBars ? alignBars(bars, btcBars) : null;
  let fundingBars = null;
  if (perpGrid || (s.fundingHistory && info.quote === "USDT")) {
    const fex = perpGrid ? s.exchange : s.fundingExchange || "bybit"; // старые сессии без fundingExchange — фандинг Bybit
    try { fundingBars = fundingPerBar(bars, await loadFunding(info.symbol, { refresh: true, exchange: fex }), (365 * 86400) / PERIODS_PER_YEAR[s.tf]); } catch { /* нет данных — постоянная (у сетки — запасная) ставка */ }
  }
  const st = paperStatus({ ...s, reportCcy: report }, bars, { btcAligned, quote: info.quote, report, fundingBars, perp, funding });
  if (opts.withBtc) {
    const k = bars.findLastIndex((b) => b.t <= s.startT);
    st.btcStart = btcAligned?.[Math.max(0, k)]?.c; st.btcNow = btcAligned?.findLast((b) => b)?.c;
  }
  if (opts.chart) { const c = sessionChart(s, st, bars); if (c) st.chart = c; }
  return st;
}

// Сводка всех сессий в валюте report: капитал, результат, те же деньги в BTC и в кэше с момента старта каждой сессии.
export async function runPaperPortfolio(req = {}) {
  const report = req.report === "BTC" ? "BTC" : "USDT", rows = [];
  for (const s of listSessions()) {
    const row = { id: s.id, name: s.name, symbol: s.symbol, tf: s.tf, exchange: s.exchange, strategy: s.strategy, type: s.type || null, capital: s.capital, cashYieldPct: s.cashYieldPct || 0 };
    try {
      const st = await runPaperStatus(s.id, { report: "USDT", withBtc: true });
      rows.push({ ...row, equityUsd: st.equity, btcStart: st.btcStart, btcNow: st.btcNow, waiting: !!st.waiting, years: Math.max(0, (st.lastBarT - s.startT) / (365 * 86400)), actionText: st.actionText, ruined: !!st.ruined });
    } catch (e) { rows.push({ ...row, error: e.message }); }
  }
  let lastAuto = null;
  const log = store().text?.("paper-log.jsonl");
  if (log) { try { lastAuto = JSON.parse(log.trim().split("\n").at(-1)).time; } catch { /* журнал испорчен — не показываем */ } }
  return { ...portfolioSummary(rows, report), rows, lastAuto };
}

export async function runPaperCsv(id) {
  const s = getSession(id), st = await runPaperStatus(id);
  return { csv: sessionCsv(st), file: `${s.symbol}_${s.strategy}_${s.id}.csv` };
}

// Описание программы для интерфейса: списки монет, идей, индикаторов, словарь. Его же сборка сайта кладёт в meta.json.
export function metaPayload() {
  return { symbols: SYMBOLS, currencies: CURRENCIES, exchanges: EXCHANGES, strategies: strategyCatalog(), indicators: indicatorCatalog(), catalog: CATALOG, glossary: GLOSSARY, ops: OPS, priceFields: PRICE_FIELDS, maxLeverage: MAX_LEVERAGE, benchmarks: BENCHMARKS, defaultBars: DEFAULT_BARS, maxBars: MAX_BARS };
}

// Обмен с другим устройством файлом: журнал попыток, прогресс курса и бумажные сессии.
// Импорт ничего не удаляет — только добавляет недостающее.
const SYNC_KIND = "polygon-sync";
export function syncExport() {
  const now = new Date().toISOString();
  store().set("sync.json", { ...(store().get("sync.json") || {}), lastExport: now });
  return { kind: SYNC_KIND, v: 1, at: now, journal: readJournal(), progress: readProgress(), sessions: listSessions() };
}
export function syncImport(d) {
  if (!d || d.kind !== SYNC_KIND) throw new Error("Это не файл обмена «Честного полигона»");
  const before = readJournal(), merged = mergeJournals(before, Array.isArray(d.journal) ? d.journal : []);
  store().set("journal.json", merged, { pretty: true });
  if (d.progress?.lessons) saveProgress(d.progress);
  const have = listSessions(), ids = new Set(have.map((s) => s.id)), added = [], skipped = [];
  for (const s of Array.isArray(d.sessions) ? d.sessions : []) {
    if (!s?.id || ids.has(s.id)) continue;
    if (have.length + added.length >= 30) { skipped.push(s.name || s.id); continue; }
    added.push(s); ids.add(s.id);
  }
  if (added.length) store().set("paper.json", [...have, ...added], { pretty: true });
  const now = new Date().toISOString();
  store().set("sync.json", { ...(store().get("sync.json") || {}), lastImport: now, lastImportFrom: d.at || null });
  const n = uniqueAttempts(merged);
  return { journalAdded: merged.length - before.length, sessionsAdded: added.length, sessionsSkipped: skipped, attempts: n, plankBefore: plank(uniqueAttempts(before)), plank: plank(n) };
}

// Один список запросов для сервера на компьютере и для рабочего потока на устройстве.
// call(метод, адрес, тело) → данные ответа. Файл сделок CSV отдаётся отдельно (runPaperCsv).
const ROUTES = {
  "GET api/meta": () => metaPayload(),
  "GET api/pairs": async () => { const out = {}; for (const ex of EXCHANGES) { try { out[ex] = await listBtcPairs(ex); } catch (e) { out[ex] = { error: String(e.message || e) }; } } return out; },
  "GET api/journal": () => markRepeats(readJournal()),
  "GET api/paper": () => listSessions(),
  "GET api/progress": () => readProgress(),
  "POST api/progress": (b) => saveProgress(b),
  "POST api/replay": runReplay,
  "POST api/test": runTest, "POST api/carry": runCarry, "POST api/state": runState, "POST api/coins": runCoins, "POST api/rates": runRates, "POST api/scan": runScan,
  "POST api/scan/plan": (b) => { const p = scanPlan(b); const n = uniqueAttempts(); return { combos: p.combos.length, attemptsNow: n, plankNow: plank(n), plankAfterMax: plank(n + p.combos.length) }; },
  "POST api/grid": runGrid, "POST api/grid/minutes": runGridMinutes, "POST api/analysis": runAnalysis,
  "POST api/paper/create": runPaperCreate,
  "POST api/paper/status": async (b) => { const { allTrades, ...st } = await runPaperStatus(b.id, { chart: true }); return st; },
  "POST api/paper/portfolio": runPaperPortfolio,
  "POST api/paper/delete": (b) => { deleteSession(b.id); return { ok: true }; },
  "POST api/paper/csv": (b) => runPaperCsv(b.id),
  "GET api/sync/export": () => syncExport(),
  "POST api/sync/import": (b) => syncImport(b),
  "GET api/sync/status": () => store().get("sync.json") || {},
};
export const hasRoute = (method, url) => !!ROUTES[`${method} ${url.replace(/^\//, "")}`];
export async function call(method, url, body = {}) {
  const f = ROUTES[`${method} ${url.replace(/^\//, "")}`];
  if (!f) throw new Error("Не найдено");
  return f(body);
}

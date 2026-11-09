// Углублённый разбор идеи: на чём держится результат и где он ломается.
// Всё считается кодом. Проверки не пишутся в журнал попыток (это диагностика одной идеи),
// но число просмотренных вариантов показывается в отчёте.
import { backtest, maxDrawdown } from "./backtest.js";
import { shiftPlan } from "./rules.js";
import { STRATEGIES, planFor, resolveStrategyParams } from "./strategies.js";
import { INDICATORS } from "./indicators.js";
import { BENCHMARKS } from "./benchmarks.js";
import { convertBt } from "./currency.js";

const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : NaN; };

// Список сделок: доходность каждой от входа до выхода (с издержками).
export const extractTrades = (bt) => bt.tradeList;

const FACTORS = [0.5, 0.75, 1, 1.5, 2];
function scaled(base, f, p) {
  const v = base * f;
  return Math.min(p.max, Math.max(p.min, p.float ? +v.toFixed(2) : Math.round(v)));
}

// Варианты «соседних» настроек: [{ label, plan(bars) }]
function variants(key, params, spec, costsOnlyPlan) {
  const out = [];
  if (key === "custom") {
    const base = JSON.parse(JSON.stringify(spec));
    out.push({ label: "исходные", spec: base });
    base.indicators.forEach((it, idx) => {
      const def = INDICATORS[it.id];
      for (const p of def.params) {
        const b = Number(it.params?.[p.key] ?? p.def);
        for (const f of FACTORS) {
          const v = scaled(b, f, p);
          if (v === b) continue;
          const s = JSON.parse(JSON.stringify(base));
          s.indicators[idx].params = { ...(s.indicators[idx].params || {}), [p.key]: v };
          out.push({ label: `${it.name}.${p.key}=${v}`, spec: s, edge: f === FACTORS[0] || f === FACTORS.at(-1) });
        }
      }
    });
    for (const k of ["stopAtr", "takeAtr", "trailAtr"]) {
      if (Number(base[k]) > 0) for (const f of FACTORS) { if (f === 1) continue; out.push({ label: `${k}=${+(base[k] * f).toFixed(2)}`, spec: { ...JSON.parse(JSON.stringify(base)), [k]: +(base[k] * f).toFixed(2) }, edge: f === FACTORS[0] || f === FACTORS.at(-1) }); }
    }
    return out.map((v, i) => ({ label: v.label, params: null, spec: v.spec, edge: !!v.edge, isBase: i === 0 }));
  }
  const def = STRATEGIES[key];
  const p0 = resolveStrategyParams(key, params);
  const axes = def.params.map((p) => [...new Set(FACTORS.map((f) => scaled(p0[p.key], f, p)))].sort((a, b) => a - b));
  // «Край сетки»: хотя бы один параметр на крайнем проверенном значении (половина или удвоение исходного).
  const atEdge = (i, v) => axes[i].length > 1 && (v === axes[i][0] || v === axes[i].at(-1));
  if (def.params.length <= 3) {
    const combos = axes.reduce((acc, vals) => acc.flatMap((c) => vals.map((v) => [...c, v])), [[]]);
    for (const cmb of combos) out.push({ label: cmb.join("/"), params: Object.fromEntries(def.params.map((s, i) => [s.key, cmb[i]])), edge: cmb.some((v, i) => atEdge(i, v)), isBase: cmb.every((v, i) => v === p0[def.params[i].key]) });
  } else {
    out.push({ label: "исходные", params: p0, edge: false, isBase: true });
    def.params.forEach((p, i) => { for (const v of axes[i]) if (v !== p0[p.key]) out.push({ label: `${p.key}=${v}`, params: { ...p0, [p.key]: v }, edge: atEdge(i, v), isBase: false }); });
  }
  return out;
}

function neighbours(bars, key, params, spec, costs, fx = null) {
  const out = [];
  for (const v of variants(key, params, spec)) {
    try {
      const bt = convertBt(backtest(bars, planFor(key, bars, v.params ?? params, v.spec ?? spec), costs), fx);
      out.push({ params: v.params ?? { variant: v.label }, label: v.label, total: bt.stratCurve.at(-1) - 1, edge: v.edge, isBase: v.isBase });
    } catch { /* недопустимая комбинация (например, быстрая средняя длиннее медленной) пропускается */ }
  }
  return out;
}

function byYear(bars, bt, series = {}) {
  const years = {};
  const btc = series.btc || bt.hold, cash = series.cash || bars.map(() => 0);
  bars.forEach((b, i) => {
    const y = new Date(b.t * 1000).getUTCFullYear();
    (years[y] ??= { s: 1, h: 1, b: 1, c: 1, n: 0 });
    years[y].s *= 1 + bt.strat[i]; years[y].h *= 1 + bt.hold[i]; years[y].b *= 1 + btc[i]; years[y].c *= 1 + cash[i]; years[y].n++;
  });
  return Object.entries(years).map(([year, v]) => ({ year: +year, strategy: v.s - 1, hold: v.h - 1, btc: v.b - 1, cash: v.c - 1, bars: v.n }));
}

// План, в котором до свечи start позиции не было: сигналы раньше start−1 обнуляются (как в бумажной торговле),
// а индикаторы посчитаны по всей истории — это и есть разминка до даты старта.
export function startAt(plan, start) {
  return { ...plan, entryOk: plan.entryOk.map((v, i) => (i >= start - 1 ? v : false)), exitOk: plan.exitOk.map((v, i) => (i >= start - 1 ? v : false)) };
}

// Чувствительность к дате старта: старт 1 января и 1 июля каждого года после разминки индикаторов;
// до конца данных должно оставаться хотя бы полгода.
export function startDates(bars, plan, costs, ppy, bench) {
  const n = bars.length, fee = (costs.feePct ?? 0.1) / 100, slip = (costs.slipPct ?? 0.05) / 100;
  const buy = (b, end) => (b ? (end.c / (b.o * (1 + slip))) * (1 - fee) - 1 : null);
  const half = (t) => { const d = new Date(t * 1000); return d.getUTCFullYear() * 2 + (d.getUTCMonth() >= 6 ? 1 : 0); };
  const first = Math.max(1, (plan.warmup || 0) + 1);
  const chosen = bench?.chosen || "coin", al = bench?.btcAligned, fx = bench?.fx || null, quote = bench?.quote || "USDT";
  const rows = [];
  for (let k = first; k < n; k++) {
    if (half(bars[k].t) === half(bars[k - 1].t)) continue;
    if (n - k < ppy / 2) break;
    // Всё считается в валюте пары, затем переводится в валюту отчёта множителем f (от закрытия k−1 до конца).
    const fr = fx ? fx[n - 1] / fx[k - 1] : 1, rep = (x) => (x == null ? null : (1 + x) * fr - 1);
    const bt = convertBt(backtest(bars, startAt(plan, k), costs), fx);
    const strategy = bt.stratCurve.at(-1) / bt.stratCurve[k - 1] - 1;
    const coin = rep(buy(bars[k], bars.at(-1)));
    const growth = (1 + (bench?.cashYieldPct || 0) / 100) ** ((n - k) / ppy);
    let btc, cash;
    if (quote === "BTC") {
      btc = rep(0);
      cash = al?.[k] ? rep(growth * (1 - fee) * (1 - slip) * (al[k].o / al.at(-1).c) - 1) : null;
    } else {
      btc = al ? (al[k] ? rep(buy(al[k], al.at(-1))) : null) : coin;
      cash = rep(growth - 1);
    }
    const ref = { coin, btc, cash }[chosen];
    rows.push({ t: bars[k].t, years: (n - k) / ppy, strategy, coin, btc, cash, beat: ref == null ? null : strategy > ref + 1e-9, liquidated: bt.liquidations > 0 });
  }
  const judged = rows.filter((r) => r.beat !== null), wins = judged.filter((r) => r.beat).length;
  const share = judged.length ? wins / judged.length : null;
  let summary;
  if (!judged.length) summary = "Данных слишком мало: после разминки индикаторов не осталось ни одного старта с запасом в полгода.";
  else if (share >= 0.8) summary = `Превосходство над эталоном «${BENCHMARKS[chosen]}» держится почти при любом старте: ${wins} из ${judged.length}.`;
  else if (share >= 0.5) summary = `Превосходство над эталоном «${BENCHMARKS[chosen]}» зависит от даты старта: ${wins} из ${judged.length}. Результат полного периода во многом определяется удачным началом.`;
  else summary = `Превосходство над эталоном «${BENCHMARKS[chosen]}» не держится: только ${wins} из ${judged.length} стартов.`;
  return { rows, wins, count: judged.length, share, summary };
}

// Та же идея на другой бирже. Главное сравнение — на ОБЩЕМ периоде: с момента, когда на обеих биржах закончилась
// разминка индикаторов, до последней общей свечи; на обеих биржах считается одно и то же окно (как в датах старта:
// индикаторы посчитаны по всей истории, позиции до начала окна нет). Полная история каждой биржи — для справки.
export function otherVenue(main, other, key, params, spec, costs) {
  if (!other?.bars?.length || other.bars.length < 30) return null;
  const ob = other.bars;
  const plan = planFor(key, ob, params, spec);
  const bt = convertBt(backtest(ob, plan, costs), other.fx || null);
  const liq = bt.tradeList.find((t) => t.liquidated);
  const res = { exchange: other.exchange, from: ob[0].t, to: ob.at(-1).t, total: bt.stratCurve.at(-1) - 1, holdTotal: bt.holdCurve.at(-1) - 1, maxDrawdown: maxDrawdown(bt.stratCurve), liquidations: bt.liquidations, liquidationAt: liq ? ob[liq.exit].t : null };
  const D = (t) => new Date(t * 1000).toISOString().slice(0, 10), Pc = (x) => (x * 100).toFixed(0) + " %";
  // окно [from, to]: начало — позже из двух концов разминки, конец — раньше из двух последних свечей
  const otherFrom = ob[Math.min(ob.length - 1, (plan.warmup || 0) + 1)].t;
  const from = Math.max(main.tradeFrom, otherFrom), to = Math.min(main.bars.at(-1).t, ob.at(-1).t);
  const windowOf = (bars, p, fx, cs) => {
    const k = bars.findIndex((b) => b.t >= from);
    let e = -1; for (let i = bars.length - 1; i >= 0; i--) if (bars[i].t <= to) { e = i; break; }
    if (k < 1 || e - k < 30) return null;
    const b = convertBt(backtest(bars, startAt(p, k), cs), fx || null);
    const l = b.tradeList.find((t) => t.liquidated && t.exit <= e);
    return { total: b.stratCurve[e] / b.stratCurve[k - 1] - 1, holdTotal: b.holdCurve[e] / b.holdCurve[k - 1] - 1, liquidationAt: l ? bars[l.exit].t : null, bars: e - k + 1 };
  };
  const cm = windowOf(main.bars, main.plan ?? planFor(key, main.bars, params, spec), main.fx, main.costs ?? costs);
  const co = windowOf(ob, plan, other.fx, costs);
  if (cm && co) res.common = { from, to, main: cm, other: co };
  const parts = [];
  if (res.common) {
    const ratio = (1 + co.total) / (1 + cm.total);
    const close = ratio > 0.8 && ratio < 1.25;
    parts.push(`На одном и том же периоде (${D(from)} — ${D(to)}) идея дала ${Pc(cm.total)} на ${main.exchange} и ${Pc(co.total)} на ${other.exchange}` +
      (close ? ": результаты близки — биржа почти не влияет." : ". Даже на одном периоде результаты заметно расходятся: идея чувствительна к мелким различиям цен между биржами (свечи, гэпы, время закрытия), и это само по себе признак хрупкости."));
  } else parts.push("Общего периода, достаточного для сравнения, нет.");
  const longer = ob[0].t < main.bars[0].t - 180 * 86400;
  if (longer) parts.push(`Полная история на ${other.exchange} длиннее (с ${D(ob[0].t)}, на ${main.exchange} — с ${D(main.bars[0].t)}) и включает периоды, которых нет в короткой; поэтому цифры полной истории ниже сравнивать между собой нельзя.`);
  else if (main.bars[0].t < ob[0].t - 180 * 86400) parts.push(`Полная история на ${other.exchange} короче (с ${D(ob[0].t)}), чем на ${main.exchange} (с ${D(main.bars[0].t)}); цифры полной истории между собой не сравнимы.`);
  if (res.liquidationAt) parts.push(`В полной истории ${other.exchange} позиция ликвидирована ${D(res.liquidationAt)}${res.common && res.liquidationAt < res.common.from ? " — раньше общего периода" : ""}: залог потерян, дальше торговля не считается.`);
  if (main.liquidationAt) parts.push(`На ${main.exchange} позиция ликвидирована ${D(main.liquidationAt)}.`);
  res.explain = parts.join(" ");
  return res;
}

// bench = { chosen, series: { coin, btc, cash }, btcAligned, cashYieldPct } — эталоны (см. benchmarks.js).
// otherExchange = { exchange, bars } — та же монета на другой бирже (необязательно).
export function diagnose({ bars, key, params, spec, costs, others = [], ppy, bench = null, exchange = "", otherExchange = null }) {
  const plan = planFor(key, bars, params, spec);
  const fx = bench?.fx || null;
  const btN = backtest(bars, plan, costs); // в валюте пары (для сделок)
  const bt = convertBt(btN, fx); // в валюте отчёта (для итогов, лет, просадок)
  const total = bt.stratCurve.at(-1) - 1, holdTotal = bt.holdCurve.at(-1) - 1;
  const chosen = bench?.chosen && bench.series?.[bench.chosen] ? bench.chosen : "coin";
  const benchSeries = chosen === "coin" ? bt.hold : bench.series[chosen];
  const benchTotal = benchSeries.reduce((e, r) => e * (1 + r), 1) - 1, benchLabel = BENCHMARKS[chosen];

  // 1. Сделки и зависимость от лучших
  const tr = extractTrades(btN);
  const sorted = [...tr].sort((a, b) => b.ret - a.ret);
  const without = (k) => sorted.slice(0, k).reduce((e, t) => e / (1 + t.ret), btN.stratCurve.at(-1)) - 1;
  const trades = {
    count: tr.length,
    wins: tr.filter((t) => t.ret > 0).length,
    best: sorted[0]?.ret ?? 0,
    worst: sorted.at(-1)?.ret ?? 0,
    totalNative: btN.stratCurve.at(-1) - 1,
    withoutBest: tr.length ? without(1) : btN.stratCurve.at(-1) - 1,
    withoutTwoBest: tr.length > 1 ? without(2) : btN.stratCurve.at(-1) - 1,
  };

  // 2. Сдвиг исполнения на одну свечу
  const shifted = convertBt(backtest(bars, shiftPlan(plan), costs), fx);
  const shift = { total: shifted.stratCurve.at(-1) - 1 };

  // 3. Соседние параметры
  const nb = neighbours(bars, key, params, spec, costs, fx);
  const totals = nb.map((x) => x.total);
  const neighbourStats = {
    variants: nb.length,
    min: Math.min(...totals), median: median(totals), max: Math.max(...totals),
    beatHoldShare: totals.filter((t) => t > holdTotal).length / (totals.length || 1),
    positiveShare: totals.filter((t) => t > 0).length / (totals.length || 1),
    best: nb.reduce((a, b) => (b.total > a.total ? b : a), nb[0]),
    worst: nb.reduce((a, b) => (b.total < a.total ? b : a), nb[0]),
  };
  // Где лучший вариант и держится ли знак превышения над выбранным эталоном у соседей.
  {
    const sign = Math.sign(total - benchTotal), rest = nb.filter((x) => !x.isBase);
    neighbourStats.sameSignShare = rest.length ? rest.filter((x) => Math.sign(x.total - benchTotal) === sign).length / rest.length : null;
    neighbourStats.baseBeatsBench = total > benchTotal;
    neighbourStats.bestPosition = !neighbourStats.best ? null : neighbourStats.best.isBase ? "base" : neighbourStats.best.edge ? "edge" : "inside";
    neighbourStats.edgeVariants = nb.filter((x) => x.edge).length;
  }

  // 4. По годам
  const years = byYear(bars, bt, bench?.series);
  const starts = startDates(bars, plan, costs, ppy, { ...(bench || {}), chosen });

  // 5. Другие монеты (те же правила)
  const coins = [];
  for (const o of others) {
    try {
      const b2 = convertBt(backtest(o.bars, planFor(key, o.bars, params, spec), { ...costs, fundingBars: null }), o.fx || null); // фандинг по истории — только у основной монеты
      coins.push({ symbol: o.symbol, strategy: b2.stratCurve.at(-1) - 1, hold: b2.holdCurve.at(-1) - 1 });
    } catch { /* монета с короткой историей пропускается */ }
  }
  const coinStats = coins.length ? {
    count: coins.length,
    medianStrategy: median(coins.map((c) => c.strategy)),
    medianHold: median(coins.map((c) => c.hold)),
    positiveShare: coins.filter((c) => c.strategy > 0).length / coins.length,
    beatHoldShare: coins.filter((c) => c.strategy > c.hold).length / coins.length,
  } : null;

  // Текущая просадка от пика
  const peak = Math.max(...bt.stratCurve);
  const currentDD = bt.stratCurve.at(-1) / peak - 1;
  const mdd = maxDrawdown(bt.stratCurve), holdMdd = maxDrawdown(bt.holdCurve);

  // 6. Плечо: что было бы без него
  const leverage = bt.leverage, side = bt.side;
  let unleveraged = null;
  if (leverage > 1) {
    const b1 = convertBt(backtest(bars, plan, { ...costs, leverage: 1 }), fx);
    unleveraged = { total: b1.stratCurve.at(-1) - 1, maxDrawdown: maxDrawdown(b1.stratCurve) };
  }

  const liqTrade = bt.tradeList.find((t) => t.liquidated);
  const liquidationAt = liqTrade ? bars[liqTrade.exit].t : null;
  const venue = otherVenue({ exchange, bars, plan, fx, costs, total, liquidationAt, tradeFrom: bars[Math.min(bars.length - 1, (plan.warmup || 0) + 1)].t }, otherExchange, key, params, spec, { ...costs, fundingBars: null });

  const { strengths, weaknesses } = judge({ weights: !!btN.weights, benchTotal, benchLabel, starts, venue, total, holdTotal, trades, shift, neighbours: neighbourStats, years, coinStats, currentDD, mdd, holdMdd, exposure: bt.exposure, years_n: bars.length / ppy, side, leverage, liquidations: bt.liquidations, unleveraged });

  return { weights: !!btN.weights, rebalances: btN.weights ? btN.trades : null, benchmark: chosen, benchmarkLabel: benchLabel, benchTotal, starts, venue, liquidationAt, side, leverage, liquidations: bt.liquidations, unleveraged, total, holdTotal, trades, tradeList: sorted.slice(0, 5).map((t) => ({ ...t, from: bars[t.entry].t, to: bars[t.exit].t })), shift, neighbours: neighbourStats, years, coins, coinStats, currentDrawdown: currentDD, maxDrawdown: mdd, holdMaxDrawdown: holdMdd, strengths, weaknesses };
}

const P = (x) => (x * 100).toFixed(0) + " %";

function judge(d) {
  const strengths = [], weaknesses = [];

  // Сильные стороны
  if (d.total > d.benchTotal) strengths.push(`За весь период идея обогнала эталон «${d.benchLabel}» (${P(d.total)} против ${P(d.benchTotal)}).`);
  if (d.starts.count >= 4 && d.starts.share >= 0.8) strengths.push(d.starts.summary);
  if (d.mdd > d.holdMdd + 0.05) strengths.push(`Просадка (падение от пика) меньше, чем у удержания: ${P(d.mdd)} против ${P(d.holdMdd)}.`);
  const protectedYears = d.years.filter((y) => y.bars > 90 && y.hold < -0.1 && y.strategy > y.hold + 0.1);
  if (protectedYears.length) strengths.push(`В падающие годы идея теряла меньше удержания: ${protectedYears.map((y) => `${y.year} (${P(y.strategy)} против ${P(y.hold)})`).join(", ")}.`);
  if (d.shift.total > d.holdTotal && d.shift.total > 0.75 * d.total) strengths.push("Результат почти не меняется, если исполнять сделки на свечу позже.");
  if (d.neighbours.variants >= 5 && d.neighbours.beatHoldShare >= 0.7 && d.neighbours.positiveShare >= 0.6) strengths.push(`Устойчивость к параметрам: ${P(d.neighbours.beatHoldShare)} соседних настроек обгоняют удержание, ${P(d.neighbours.positiveShare)} в плюсе.`);
  if (d.coinStats && d.coinStats.count >= 3 && d.coinStats.beatHoldShare >= 0.6 && d.coinStats.medianStrategy > 0) strengths.push(`Работает и на других монетах: медианный результат ${P(d.coinStats.medianStrategy)}, обгоняет удержание на ${P(d.coinStats.beatHoldShare)} монет.`);
  if (d.trades.count >= 30 && d.trades.withoutBest > 0) strengths.push(`Достаточно сделок (${d.trades.count}), и результат остаётся положительным без лучшей из них.`);
  if (!strengths.length) strengths.push("Явных сильных сторон по этим проверкам не найдено.");

  // Слабые стороны
  if (d.total <= d.benchTotal) weaknesses.push(`Идея не обогнала эталон «${d.benchLabel}» (${P(d.total)} против ${P(d.benchTotal)}).`);
  if (d.starts.count >= 2 && d.starts.share < 0.8) weaknesses.push(d.starts.summary);
  if (d.neighbours.bestPosition === "edge") weaknesses.push("Лучший из соседних вариантов лежит на краю проверенной сетки параметров: либо оптимум за её пределами, либо это случайный выброс. Подбирать параметры «по лучшему» здесь особенно опасно.");
  if (d.neighbours.sameSignShare != null && d.neighbours.sameSignShare < 0.7) weaknesses.push(`У соседних настроек знак превышения над эталоном не держится: тот же знак, что у исходных, только у ${P(d.neighbours.sameSignShare)}.`);
  if (d.venue?.liquidationAt && !d.liquidations) weaknesses.push(`На более длинной истории (${d.venue.exchange}) эта же идея ликвидируется ${new Date(d.venue.liquidationAt * 1000).toISOString().slice(0, 10)}. Короткая история её просто не застала.`);
  if (!d.weights && d.trades.count < 30) weaknesses.push(`Мало сделок (${d.trades.count}): статистика слабая, на малом числе сделок удача и закономерность неразличимы.`);
  if (d.total > 0 && d.trades.count > 0 && d.trades.withoutBest <= 0) weaknesses.push(`Результат держится на одной сделке (+${P(d.trades.best)}): без неё итог ${P(d.trades.withoutBest)}, без двух лучших ${P(d.trades.withoutTwoBest)}.`);
  if (d.trades.count >= 5 && d.trades.wins / d.trades.count < 0.4) weaknesses.push(`Прибыльных сделок только ${d.trades.wins} из ${d.trades.count}: идея много раз теряет понемногу, ожидая редкого крупного выигрыша.`);
  const laggingBull = d.years.filter((y) => y.bars > 90 && y.hold > 0.3 && y.strategy < 0.6 * y.hold);
  if (laggingBull.length) weaknesses.push(`В растущие годы сильно отстаёт от удержания: ${laggingBull.map((y) => `${y.year} (${P(y.strategy)} против ${P(y.hold)})`).join(", ")}.`);
  if (d.total > 0 && d.shift.total < 0.75 * d.total) weaknesses.push(`Чувствительна к дню исполнения: при входе на свечу позже итог падает с ${P(d.total)} до ${P(d.shift.total)}.`);
  if (d.neighbours.variants >= 5 && d.neighbours.max - d.neighbours.min > 1.5) weaknesses.push(`Результат зависит от выбора параметров: соседние настройки дают от ${P(d.neighbours.min)} до ${P(d.neighbours.max)}. Выбрать «правильные» заранее нельзя.`);
  if (d.neighbours.variants >= 5 && d.neighbours.beatHoldShare < 0.5) weaknesses.push(`Только ${P(d.neighbours.beatHoldShare)} соседних настроек обгоняют удержание.`);
  if (d.coinStats && d.coinStats.count >= 3 && d.coinStats.positiveShare < 0.5) weaknesses.push(`На других монетах не работает: в плюсе только ${P(d.coinStats.positiveShare)} из ${d.coinStats.count}, медианный результат ${P(d.coinStats.medianStrategy)}.`);
  if (d.currentDD < -0.3) weaknesses.push(`Сейчас идея ниже своего пика на ${P(-d.currentDD)}: давно не обновляла максимум.`);
  if (d.mdd < -0.5) weaknesses.push(`Глубокая максимальная просадка ${P(d.mdd)}: психологически почти невыносима.`);
  if (d.holdTotal < 0) weaknesses.push(`Удержание за период в минусе (${P(d.holdTotal)}): обогнать его на падающем рынке легко, это слабая планка. Смотрите и на то, заработала ли идея в плюс.`);
  if (d.liquidations > 0) weaknesses.push(`ЛИКВИДАЦИЯ: при плече ${d.leverage}x позиция была принудительно закрыта, счёт обнулён. Любой результат, где возможна ликвидация, — это результат человека, которому повезло не дожить до худшей свечи.`);
  if (d.leverage > 1 && d.unleveraged) weaknesses.push(`Плечо ${d.leverage}x: итог ${P(d.total)} против ${P(d.unleveraged.total)} без плеча, максимальная просадка ${P(d.mdd)} против ${P(d.unleveraged.maxDrawdown)}. Плечо не создаёт края, оно только увеличивает масштаб и риск.`);
  if (d.side === "short" && d.holdTotal > 0.5) weaknesses.push(`Шорт против растущего рынка: удержание за период выросло на ${P(d.holdTotal)}. Шорт теряет в росте, а рост в криптовалютах бывает кратным.`);
  if (d.side === "short") weaknesses.push("Шорт: убыток теоретически не ограничен, а плата за удержание и риск «выдавливания» (резкого скачка против позиции) в тесте учтены только приблизительно.");
  weaknesses.push("Тест идёт на выжившей вселенной (исчезнувшие монеты в данных отсутствуют), поэтому результат завышен.");
  weaknesses.push("Один прогон по одной монете — это одно наблюдение. Монета, выбранная после взгляда на график, смещает оценку.");
  return { strengths, weaknesses };
}

// Пакетный скан: одна комбинация «идея × монета × свеча» с параметрами по умолчанию — те же движок, издержки и эталоны,
// что у обычной проверки. Здесь только метрики строки; загрузка свечей и журнал — в server.js.
import { backtest, maxDrawdown } from "./backtest.js";
import { planFor, resolveStrategyParams } from "./strategies.js";
import { convertBt } from "./currency.js";
import { analyse } from "./stats.js";

const YEAR = 365 * 86400;
const curveOf = (r) => { let e = 1; return r.map((x) => (e *= 1 + x)); };

// Индекс первой свечи последнего года (null, если истории меньше года).
export function yearStart(bars) {
  if (!bars.length || bars.at(-1).t - bars[0].t < YEAR - 86400) return null;
  const from = bars.at(-1).t - YEAR;
  return bars.findIndex((b) => b.t > from);
}

// Доходность кривой с закрытия свечи i0−1 (или с начала) до конца.
export const tailReturn = (curve, i0) => curve.at(-1) / (i0 > 0 ? curve[i0 - 1] : 1) - 1;

// Доля свечей в позиции на отрезке [i0, n): по списку сделок.
export function exposureFrom(tradeList, n, i0 = 0) {
  if (n - i0 <= 0) return 0;
  let k = 0;
  for (const t of tradeList) {
    const a = Math.max(t.entry, i0), b = Math.min(t.exit, n - 1);
    if (b >= a) k += b - a + 1;
  }
  return Math.min(1, k / (n - i0));
}

// bars — свечи пары; bench = { chosen, series: { coin?, btc, cash } } в валюте отчёта; fx — множитель валюты отчёта.
export function scanCombo({ bars, key, costs, bench, ppy, fx = null }) {
  const params = resolveStrategyParams(key, {});
  const plan = planFor(key, bars, params);
  const btN = backtest(bars, plan, costs);
  const bt = convertBt(btN, fx);
  const a = analyse(bt, ppy, 1, bench); // планка — общая для скана, ставится после подсчёта попыток
  const total = (k) => a.benchmarks.find((x) => x.key === k)?.total ?? null;
  const y0 = yearStart(bars);
  const year = (r) => (y0 == null || !r ? null : tailReturn(curveOf(r), y0));
  const holdR = bt.hold;
  return {
    params, side: btN.side, weights: !!btN.weights,
    total: a.strategy.total, cagr: a.strategy.cagr, maxDrawdown: a.strategy.maxDrawdown, trades: btN.trades, exposure: btN.weights ? 1 : btN.exposure,
    coinTotal: total("coin"), btcTotal: total("btc") ?? total("coin"), cashTotal: total("cash"),
    year: y0 == null ? null : tailReturn(bt.stratCurve, y0), yearCoin: year(holdR), yearBtc: year(bench.series.btc ?? holdR), yearCash: year(bench.series.cash),
    yearExposure: y0 == null ? null : btN.weights ? 1 : exposureFrom(btN.tradeList, bars.length, y0),
    tExcess: a.tExcess, ruined: !!btN.ruined, holdDrawdown: maxDrawdown(bt.holdCurve),
  };
}

// Сводка про «обгон BTC за последний год»: сколько времени такие строки были в рынке по сравнению с остальными.
export function yearBeatSummary(rows) {
  const withYear = rows.filter((r) => r.year != null && r.yearBtc != null);
  const beat = withYear.filter((r) => r.year > r.yearBtc), rest = withYear.filter((r) => !(r.year > r.yearBtc));
  const avg = (xs) => (xs.length ? xs.reduce((s, r) => s + r.yearExposure, 0) / xs.length : null);
  return { rows: withYear.length, beat: beat.length, beatExposure: avg(beat), restExposure: avg(rest),
    beatMostlyCash: beat.filter((r) => r.yearExposure < 0.5).length };
}

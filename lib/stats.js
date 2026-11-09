// Статистика честной проверки: t-статистика превосходства над удержанием,
// планка значимости с учётом числа попыток, лет до значимости, скрытая направленная ставка.
import { maxDrawdown } from "./backtest.js";
import { BENCHMARKS } from "./benchmarks.js";

const mean = (x) => x.reduce((a, b) => a + b, 0) / x.length;
const sd = (x) => {
  const m = mean(x);
  return Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / (x.length - 1));
};

// Ожидаемый максимум t-статистики среди N независимых попыток шума ≈ sqrt(2 ln N).
// Нижняя граница 1.96 (обычный порог для одной проверки).
export const plank = (attempts) => Math.max(1.96, Math.sqrt(2 * Math.log(Math.max(attempts, 1))));

const curveOf = (r) => { let e = 1; return r.map((x) => (e *= 1 + x)); };
const tStat = (a, b) => {
  const ex = a.map((v, i) => v - b[i]), m = mean(ex), s = sd(ex);
  return s > 0 ? (m / s) * Math.sqrt(ex.length) : 0;
};

// bench = { chosen: "coin" | "btc" | "cash", series: { coin, btc, cash } } — ряды доходностей эталонов по свечам.
// Без bench сравнение идёт с удержанием той же монеты (как в 0.3).
export function analyse({ strat, hold, stratCurve, holdCurve, trades, exposure, side = "long", leverage = 1, liquidations = 0 }, ppy, attempts, bench = null) {
  const n = strat.length;
  const chosen = bench?.chosen && bench.series?.[bench.chosen] ? bench.chosen : "coin";
  const ref = chosen === "coin" ? hold : bench.series[chosen];
  const refLabel = BENCHMARKS[chosen];
  const excess = strat.map((v, i) => v - ref[i]);
  const mE = mean(excess), sE = sd(excess);
  const t = sE > 0 ? (mE / sE) * Math.sqrt(n) : 0;
  const srYear = sE > 0 ? (mE / sE) * Math.sqrt(ppy) : 0; // превосходство над удержанием в год / шум в год
  const bar = plank(attempts);
  const yearsData = n / ppy;
  const yearsNeeded = srYear > 0 ? (bar / srYear) ** 2 : Infinity;

  const mS = mean(strat), mH = mean(hold);
  const varH = sd(hold) ** 2;
  const cov = strat.reduce((a, v, i) => a + (v - mS) * (hold[i] - mH), 0) / (n - 1);
  const beta = varH > 0 ? cov / varH : 0;

  const tot = (c) => c.at(-1) - 1;
  const cagr = (c) => (c.at(-1) > 0 ? c.at(-1) ** (1 / Math.max(yearsData, 1 / 365)) - 1 : -1);
  const refCurve = curveOf(ref);

  const significant = t > bar;
  let verdict;
  if (tot(stratCurve) <= tot(refCurve)) {
    verdict = `Идея не обогнала эталон «${refLabel}» за этот период.`;
  } else if (significant) {
    verdict = `Идея обогнала эталон «${refLabel}», и разница превышает планку значимости. Это ещё не доказательство: проверьте на другом периоде и на других монетах.`;
  } else {
    verdict = `Идея обогнала эталон «${refLabel}», но разницу нельзя отличить от удачи при вашем числе попыток.`;
  }
  const series = { coin: hold, ...(bench?.series || {}) };
  delete series.coin; // coin — всегда собственное удержание бэктеста
  const benchmarks = [["coin", hold], ...Object.entries(series)].map(([key, r]) => {
    const c = curveOf(r);
    return { key, label: BENCHMARKS[key] || bench?.labels?.[key] || key, total: tot(c), cagr: cagr(c), maxDrawdown: maxDrawdown(c), tExcess: tStat(strat, r), chosen: key === chosen };
  });

  return {
    bars: n,
    years: yearsData,
    strategy: { total: tot(stratCurve), cagr: cagr(stratCurve), maxDrawdown: maxDrawdown(stratCurve), trades, exposure },
    hold: { total: tot(holdCurve), cagr: cagr(holdCurve), maxDrawdown: maxDrawdown(holdCurve) },
    tExcess: t,
    benchmark: chosen, benchmarkLabel: refLabel, benchmarks,
    plank: bar,
    attempts,
    significant,
    yearsToSignificance: Number.isFinite(yearsNeeded) ? yearsNeeded : null,
    beta,
    verdict,
    side, leverage, liquidations,
    notes: [
      liquidations > 0
        ? `ЛИКВИДАЦИЯ: при плече ${leverage}x цена дошла до уровня принудительного закрытия, залог потерян, счёт обнулён, дальнейшие сделки не считаются. Итог ниже показан с учётом этого.`
        : null,
      leverage > 1 ? `Плечо ${leverage}x: прибыль и убытки умножаются на ${leverage}, а уровень ликвидации расположен всего в ${(100 / leverage).toFixed(1)} % от цены входа (минус поддерживающая маржа).` : null,
      side === "short" ? "Шорт: убыток при росте цены теоретически не ограничен, а за удержание позиции нужно платить (параметр «плата за удержание» задаёте вы, реальные ставки меняются)." : null,
      beta > 0.5 && exposure > 0.5
        ? `Скрытая ставка на рост цены: чувствительность к цене актива (бета) ${beta.toFixed(2)}. Идея заметно зависит от направления рынка.`
        : null,
      beta < -0.5 && exposure > 0.3
        ? `Скрытая ставка на падение цены: чувствительность к цене актива (бета) ${beta.toFixed(2)}. Идея выигрывает, только когда рынок падает.`
        : null,
      "Тест идёт на выжившей вселенной: монеты, исчезнувшие с биржи, в данных отсутствуют, поэтому результат завышен.",
    ].filter(Boolean),
  };
}

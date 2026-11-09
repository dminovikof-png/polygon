// Движок бэктеста: покупки (лонг) и шорты, с плечом или без.
//   • сигнал определяется по закрытию свечи, исполнение — по цене открытия следующей свечи;
//   • комиссия и проскальзывание берутся с каждой стороны (комиссия — с полной суммы позиции, то есть с плечом она больше);
//   • стоп-лосс, тейк-профит и скользящий стоп (в единицах ATR) проверяются внутри свечи ПЕССИМИСТИЧНО:
//     если за одну свечу задеты и стоп, и цель, считается, что сработал стоп; если свеча открылась
//     за уровнем (гэп), исполнение по цене открытия;
//   • после стопа или выхода по времени повторный вход возможен только после того, как сигнал входа
//     сначала погаснет (новый сигнал), иначе стратегия «входила бы снова в ту же самую ситуацию».
//
// Плечо и ликвидация (изолированная маржа, весь счёт в одной позиции):
//   • покупка без плеча (1x) — это спот, она не ликвидируется никогда;
//   • стоимость позиции после входа: G(p) = 1 + плечо · направление · (p / цена_входа − 1), где направление +1 для покупки и −1 для шорта;
//   • ликвидация наступает на цене входа · (1 − направление · (1/плечо − поддерживающая_маржа)); если за свечу задет этот
//     уровень (в том числе гэпом), считается, что весь счёт потерян (−100 %), торговля прекращается. Это пессимистичное допущение:
//     если в одной свече задеты и стоп, и уровень ликвидации, считается ликвидация;
//   • плата за удержание (проценты по займу / фандинг) задаётся в % годовых и начисляется за каждую свечу в позиции:
//     для покупки с плечом — на заёмную часть (плечо − 1), для шорта — на всю сумму позиции.
// Доходность кэша (cashYieldPct, % годовых) начисляется стратегии, только если включено cashFlat, и только за
// свечи, которые стратегия ЦЕЛИКОМ провела вне рынка (свечи входа и выхода по стопу внутри свечи не считаются —
// пессимистично). Удержание и эталоны в рынке её не получают.
// Доля капитала в позиции (positionPct, 1–100 %, по умолчанию 100): при входе в позицию идёт эта доля ТЕКУЩЕГО
// капитала, остальное лежит в кэше. Комиссия, проскальзывание, плата за удержание и ликвидация касаются только
// вложенной части (изолированная маржа): при доле меньше 100 % ликвидация теряет вложенное, а торговля продолжается
// на оставшемся кэше. Внутри сделки доля не выравнивается — она плавает вместе с ценой.
// Кэш (и вне позиции, и остаток при доле < 100 %) получает доходность кэша только при включённом cashFlat.
//
// Синтетические свечи (соотношение двух пар, см. pairs.js; у свечи есть hb/lb) или план с stopsOnClose:
//   • стоп, цель и скользящий стоп проверяются по ЗАКРЫТИЮ свечи и исполняются по открытию следующей —
//     настоящих максимумов и минимумов соотношения внутри свечи нет;
//   • ликвидация проверяется по грубым границам hb/lb (шире настоящего размаха) — пессимистично.
// Всё считается кодом, без участия ИИ.
//
// plan = {
//   side: "long" | "short",
//   entryOk[i], exitOk[i]  — условия входа/выхода, вычисленные по закрытию свечи i;
//   mode: "until_exit" — войти по сигналу, держать до выхода/стопа/таймера;
//         "while_true" — держать, пока условие входа истинно;
//   maxBars  — закрыть после стольких закрытых свечей в позиции (0 — выкл.);
//   stopAtr, takeAtr, trailAtr, atr[] — стопы в ATR (atr — массив значений ATR)
// }
// opts = { feePct, slipPct, leverage, carryPct, maintPct, ppy, cashYieldPct, cashFlat, positionPct, fundingBars }

export const PERIODS_PER_YEAR = { "1m": 525600, "1h": 8760, "4h": 2190, "1D": 365 };
export const MAX_LEVERAGE = 50;

// Проверка и приведение настроек плеча/издержек (одна точка правды для сервера и движка).
export function normalizeCosts(o = {}) {
  const num = (v, d) => (v === undefined || v === null || v === "" ? d : Number(v));
  const c = {
    feePct: num(o.feePct, 0.1), slipPct: num(o.slipPct, 0.05),
    leverage: num(o.leverage, 1), carryPct: num(o.carryPct, 0), maintPct: num(o.maintPct, 0.5),
    ppy: num(o.ppy, 365),
    cashYieldPct: num(o.cashYieldPct, 0), cashFlat: o.cashFlat === true || o.cashFlat === "true",
    positionPct: num(o.positionPct, 100),
    fundingBars: Array.isArray(o.fundingBars) ? o.fundingBars : null,
  };
  if (!(c.feePct >= 0 && c.feePct <= 5) || !(c.slipPct >= 0 && c.slipPct <= 5)) throw new Error("Комиссия и проскальзывание: от 0 до 5 %");
  if (!(c.leverage >= 1 && c.leverage <= MAX_LEVERAGE)) throw new Error(`Плечо: от 1 до ${MAX_LEVERAGE}`);
  if (!(c.carryPct >= 0 && c.carryPct <= 500)) throw new Error("Плата за удержание: от 0 до 500 % годовых");
  if (!(c.maintPct >= 0 && c.maintPct <= 10)) throw new Error("Поддерживающая маржа: от 0 до 10 %");
  if (!(1 / c.leverage - c.maintPct / 100 > 0)) throw new Error("Плечо слишком велико для такой поддерживающей маржи: позиция ликвидировалась бы сразу после входа");
  if (!(c.cashYieldPct >= 0 && c.cashYieldPct <= 100)) throw new Error("Доходность кэша: от 0 до 100 % годовых");
  if (!(c.positionPct >= 1 && c.positionPct <= 100)) throw new Error("Доля капитала в позиции: от 1 до 100 %");
  if (!(c.ppy > 0)) throw new Error("Неверное число свечей в году");
  return c;
}

// Совместимость: массив желаемых позиций 0/1 → план.
export function planFromPos(pos) {
  return { entryOk: pos.map((x) => x === 1), exitOk: pos.map((x) => x === 0), mode: "until_exit" };
}

export function backtest(bars, planIn, optsIn = {}) {
  const plan = Array.isArray(planIn) ? planFromPos(planIn) : planIn;
  if (plan.kind === "weights") return weightsBacktest(bars, plan, normalizeCosts(optsIn));
  const { entryOk, exitOk, mode = "until_exit", maxBars = 0, stopAtr = 0, takeAtr = 0, trailAtr = 0, atr = null } = plan;
  const o = normalizeCosts(optsIn);
  if (bars.length < 30) throw new Error("Слишком мало свечей для проверки (нужно хотя бы 30)");
  const s = plan.side === "short" ? -1 : 1;
  const L = o.leverage;
  const fee = o.feePct / 100, slip = o.slipPct / 100;
  const feeL = fee * L; // комиссия с полной суммы позиции, в долях от счёта
  const liqDist = 1 / L - o.maintPct / 100; // на сколько цена должна уйти против позиции до ликвидации (доля от цены входа)
  const canLiq = s < 0 || L > 1; // покупка без плеча — спот: ликвидировать нечего, даже если цена почти обнулилась
  const carryBar = ((o.carryPct / 100) * (s > 0 ? L - 1 : L)) / o.ppy;
  // Плата за удержание по истории фандинга (o.fundingBars — сумма ставок выплат в свече, null — нет данных):
  // позиция на бессрочном фьючерсе, лонг с плечом платит ставку со всей суммы, шорт получает. На свече входа и
  // выхода выплата засчитывается, только если она против нас (неизвестно, была ли позиция в момент выплаты).
  const fb = Array.isArray(o.fundingBars) && (s < 0 || L > 1) ? o.fundingBars : null;
  const carryAt = (i, partial) => {
    if (!fb || fb[i] == null) return carryBar;
    const v = s * fb[i] * L;
    return partial ? Math.max(v, 0) : v;
  };
  const cashBar = o.cashFlat ? (1 + o.cashYieldPct / 100) ** (1 / o.ppy) - 1 : 0;
  const n = bars.length;
  const strat = new Array(n).fill(0), hold = new Array(n).fill(0);
  const tradeList = [];
  let held = 0, needFresh = false, barsHeld = 0, inMarket = 0, ruined = false, liquidations = 0;
  let entryPx = 0, atrE = NaN, ext = 0, tStart = 1, tEntry = -1, eq = 1, stopPending = false;
  const w = o.positionPct / 100;
  let pf = 0; // доля позиции в капитале на закрытии предыдущей свечи
  const onClose = !!plan.stopsOnClose || bars.some((b) => b.lb !== undefined);
  const G = (p) => 1 + L * s * (p / entryPx - 1);

  hold[0] = (bars[0].c / (bars[0].o * (1 + slip))) * (1 - fee) - 1;
  for (let i = 1; i < n; i++) hold[i] = bars[i].c / bars[i - 1].c - 1;

  for (let i = 0; i < n; i++) {
    if (ruined) continue;
    const b = bars[i];
    const sigE = i > 0 && !!entryOk[i - 1], sigX = i > 0 && !!exitOk[i - 1];
    const prevC = i > 0 ? bars[i - 1].c : b.o;
    if (!held && needFresh && !sigE) needFresh = false;
    let r = 0, closed = false, entered = false, liquidated = false, xPx = null; // xPx — цена выхода (для списка сделок)
    const heldAtOpen = !!held;
    let exitAtOpen = false;

    if (held) {
      const timeUp = maxBars > 0 && barsHeld >= maxBars;
      const sigExit = mode === "while_true" ? !sigE : sigX;
      if (sigExit || timeUp || stopPending) {
        r = (G(b.o * (1 - s * slip)) / G(prevC)) * (1 - feeL) - 1;
        held = 0; closed = true; exitAtOpen = true; xPx = b.o * (1 - s * slip);
        if (timeUp || stopPending) needFresh = true;
        stopPending = false;
      }
    } else if (sigE && !needFresh) {
      held = 1; entered = true; barsHeld = 0;
      entryPx = b.o * (1 + s * slip);
      atrE = atr ? atr[i - 1] : NaN;
      ext = entryPx; tEntry = i; tStart = eq;
    }

    if (held) {
      const refG = entered ? 1 : G(prevC);
      let exitPx = null;
      // 1) ликвидация (проверяется первой: пессимистично)
      const liqPx = entryPx * (1 - s * liqDist);
      const lo = b.lb ?? b.l, hi = b.hb ?? b.h;
      if (canLiq && (s > 0 ? lo <= liqPx : hi >= liqPx)) {
        liquidated = true; xPx = liqPx;
      } else if (Number.isFinite(atrE) && (stopAtr > 0 || takeAtr > 0 || trailAtr > 0)) {
        let stopLvl = stopAtr > 0 ? entryPx - s * stopAtr * atrE : -s * Infinity;
        if (trailAtr > 0) {
          const t = ext - s * trailAtr * atrE;
          stopLvl = s > 0 ? Math.max(stopLvl, t) : Math.min(stopLvl, t);
        }
        const takeLvl = takeAtr > 0 ? entryPx + s * takeAtr * atrE : s * Infinity;
        if (onClose) {
          // по закрытию: выход назначается на открытие следующей свечи
          if (s > 0 ? b.c <= stopLvl || b.c >= takeLvl : b.c >= stopLvl || b.c <= takeLvl) stopPending = true;
          ext = s > 0 ? Math.max(ext, b.c) : Math.min(ext, b.c);
        } else if (s > 0) {
          if (b.l <= stopLvl) exitPx = Math.min(b.o, stopLvl);
          else if (b.h >= takeLvl) exitPx = Math.max(b.o, takeLvl);
          ext = Math.max(ext, b.h);
        } else {
          if (b.h >= stopLvl) exitPx = Math.max(b.o, stopLvl);
          else if (b.l <= takeLvl) exitPx = Math.min(b.o, takeLvl);
          ext = Math.min(ext, b.l);
        }
      }
      inMarket++;
      if (liquidated) {
        r = -1; held = 0; closed = true; liquidations++;
        if (w >= 1) ruined = true; else needFresh = true; // при доле < 100 % теряется только вложенное
      } else if (exitPx !== null) {
        r = (G(exitPx * (1 - s * slip)) / refG) * (1 - feeL) * (entered ? 1 - feeL : 1) * (1 - carryAt(i, true)) - 1;
        xPx = exitPx * (1 - s * slip);
        held = 0; closed = true; needFresh = true;
      } else {
        r = (G(b.c) / refG) * (entered ? 1 - feeL : 1) * (1 - carryAt(i, entered)) - 1;
        barsHeld++;
      }
    }
    // r выше — доходность вложенной части; переводим в доходность всего капитала.
    let credit = 0;
    if (!heldAtOpen && !entered) {
      credit = cashBar; // вся свеча вне рынка
    } else {
      const a = entered ? w : pf;
      const rPos = r;
      if (heldAtOpen && exitAtOpen) { r = a * rPos; credit = cashBar; } // вышли на открытии: остаток свечи всё в кэше
      else r = a * rPos + (1 - a) * cashBar;
      pf = held ? (a * (1 + rPos)) / (1 + r) : 0;
    }
    if (credit) r = (1 + r) * (1 + credit) - 1;
    strat[i] = r;
    eq *= 1 + r;
    if (closed) tradeList.push({ entry: tEntry, exit: i, ret: eq / (1 + credit) / tStart - 1, entryPx, exitPx: xPx, ...(liquidated ? { liquidated: true } : {}) });
  }
  if (held === 1) tradeList.push({ entry: tEntry, exit: n - 1, ret: eq / tStart - 1, open: true, entryPx, exitPx: null });

  // Что программа сделает на открытии следующей свечи (нужно для бумажной торговли).
  const lastE = !!entryOk[n - 1], lastX = !!exitOk[n - 1];
  let action;
  if (ruined) {
    action = "wait";
  } else if (held) {
    const timeUp = maxBars > 0 && barsHeld >= maxBars;
    action = (mode === "while_true" ? !lastE : lastX) || timeUp || stopPending ? "sell" : "hold";
  } else {
    const fresh = needFresh && lastE ? false : true;
    action = lastE && fresh ? "buy" : "wait";
  }

  const curve = (r) => { let e = 1; return r.map((x) => (e *= 1 + x)); };
  return {
    strat, hold, stratCurve: curve(strat), holdCurve: curve(hold),
    trades: tradeList.length, tradeList, exposure: inMarket / n,
    side: s > 0 ? "long" : "short", leverage: L, liquidations, ruined,
    stopsOnClose: onClose,
    endState: { held: held === 1, action, barsHeld, ruined, entryPx: held ? entryPx : null, liqPx: held && canLiq ? entryPx * (1 - s * liqDist) : null },
  };
}

// «Постоянная доля»: держим долю w монеты, остальное в кэше, возвращаем долю, когда она отклонилась больше чем на
// band от целевой (проверка по закрытию, сделка по открытию следующей свечи, издержки с оборота).
// Начинается с первой свечи, на которую разрешён вход (entryOk предыдущей свечи), — так работают проверки
// дат старта, сдвига и бумажная торговля. Плечо здесь не применяется.
function weightsBacktest(bars, plan, o) {
  if (o.leverage > 1) throw new Error("Плечо к «постоянной доле» не применяется: поставьте плечо 1x");
  if (bars.length < 30) throw new Error("Слишком мало свечей для проверки (нужно хотя бы 30)");
  const n = bars.length, fee = o.feePct / 100, slip = o.slipPct / 100;
  const cb = o.cashFlat ? (1 + o.cashYieldPct / 100) ** (1 / o.ppy) - 1 : 0;
  const { w, band } = plan;
  const start = plan.entryOk.findIndex((v, i) => v && i < n - 1) + 1; // 0 — входа нет
  const strat = new Array(n).fill(0), hold = new Array(n).fill(0);
  hold[0] = (bars[0].c / (bars[0].o * (1 + slip))) * (1 - fee) - 1;
  for (let i = 1; i < n; i++) hold[i] = bars[i].c / bars[i - 1].c - 1;
  let units = 0, cash = 1, prevV = 1, pending = false, trades = 0, wSum = 0;
  for (let i = 0; i < n; i++) {
    const b = bars[i];
    if (start > 0 && i === start) pending = true;
    if (pending) {
      const V = units * b.o + cash, d = w * V - units * b.o;
      if (d > 0) { units += (d * (1 - fee)) / (b.o * (1 + slip)); cash -= d; }
      else if (d < 0) { units -= -d / b.o; cash += -d * (1 - slip) * (1 - fee); }
      pending = false; trades++;
    }
    cash *= 1 + cb;
    const V = units * b.c + cash;
    strat[i] = V / prevV - 1; prevV = V;
    const share = V > 0 ? (units * b.c) / V : 0;
    wSum += share;
    if (start > 0 && i >= start && Math.abs(share - w) > band * w) pending = true;
  }
  const curve = (r) => { let e = 1; return r.map((x) => (e *= 1 + x)); };
  const started = start > 0;
  const lastShare = started ? (units * bars[n - 1].c) / (units * bars[n - 1].c + cash) : 0;
  const action = !started ? (plan.entryOk[n - 1] ? "buy" : "wait") : pending ? "rebalance" : "hold";
  return {
    strat, hold, stratCurve: curve(strat), holdCurve: curve(hold),
    trades, tradeList: [], exposure: wSum / n, side: "long", leverage: 1, liquidations: 0, ruined: false, weights: true,
    endState: { held: started, action, barsHeld: 0, ruined: false, entryPx: null, liqPx: null, share: lastShare, target: w },
  };
}

export function maxDrawdown(curve) {
  let peak = -Infinity, mdd = 0;
  for (const v of curve) { peak = Math.max(peak, v); mdd = Math.min(mdd, v / peak - 1); }
  return mdd;
}

// Спотовая сетка (как грид-бот Bybit): много одновременных лимитных заявок, поэтому отдельный движок, не backtest().
//
// Устройство. Уровни цены p0 < p1 < … < p(L−1) делят диапазон на L−1 ячеек. У каждой ячейки своя доля вложения
// (вложение / число ячеек). Пустая ячейка держит заявку на покупку по нижнему краю, полная — заявку на продажу
// по верхнему. Покупка тратит долю ячейки целиком (с комиссией), продажа возвращает выручку; разница — прибыль круга,
// она остаётся в кэше и в новые покупки не идёт (как у бота: прибыль сетки копится отдельно).
//
// Старт (открытие первой свечи): ячейки целиком выше цены заполняются рыночной покупкой («стартовая покупка»,
// комиссия + проскальзывание); ячейка, в которой находится цена, и ячейки ниже ждут покупки. Без стартовой покупки
// ячейки выше цены пусты и начинают работать, только когда цена закроется выше их нижнего края.
//
// Честность исполнения:
// - Порядок движения внутри свечи неизвестен. Считаются оба пути: закрытие прошлой → открытие → максимум → минимум →
//   закрытие и закрытие прошлой → открытие → минимум → максимум → закрытие. Берётся худший по стоимости счёта на
//   закрытии свечи.
// - Строгий режим (по умолчанию): ячейка не может продать то, что купила в этой же свече, то есть круг внутри
//   свечи (покупка и продажа одной ячейки в одной свече) не засчитывается. Покупки по пути вниз засчитываются
//   всегда, в том числе после продажи в этой же свече: набор монеты при падении не занижается. Мягкий режим
//   «не больше одного круга»: за свечу ячейка может один раз купить и продать внутри свечи.
// - Лимитная заявка исполняется ровно по своей цене, даже если цена перескочила уровень гэпом (лучшая цена
//   гэпа в пользу сетки не засчитывается). Комиссия — с каждой стороны, проскальзывания у лимитной заявки нет.
// - Рыночные сделки (стартовая покупка, стоп, тейк, докупка при трейлинге) — с комиссией и проскальзыванием.
// - Стоп-лосс по цене: если путь свечи дошёл до него, продаётся всё по цене стопа (минус проскальзывание),
//   сетка останавливается. Покупки выше стопа на том же пути успевают исполниться — так хуже. Тейк-профит — так же
//   вверх. У синтетической пары стоп проверяется по грубой нижней границе.
// - Трейлинг вверх: если свеча закрылась выше верхнего уровня, на открытии следующей свечи нижняя ячейка снимается,
//   а сверху добавляется новая ячейка того же шага, наполненная рыночной покупкой (так делает бот Bybit).
//
// Сетка на крупных свечах завышает результат: она не видит колебаний внутри свечи и того, в каком порядке цена
// проходила уровни. В исследовании проекта сетка на часовых свечах дала +275,7 п.п., а на минутных — −931 %.

const num = (x, d) => (x === undefined || x === null || x === "" ? d : Number(x));

export function normalizeGrid(p = {}) {
  const g = {
    mode: p.mode === "price" ? "price" : "pct",
    lower: num(p.lower, NaN), upper: num(p.upper, NaN),
    lowerPct: num(p.lowerPct, 15), upperPct: num(p.upperPct, 15),
    levels: Math.round(num(p.levels, 17)),
    spacing: p.spacing === "arith" ? "arith" : "geom",
    startBuy: p.startBuy !== false && p.startBuy !== "false",
    trailing: p.trailing === true || p.trailing === "true",
    stopPx: num(p.stopPx, 0), takePx: num(p.takePx, 0),
    intrabar: p.intrabar === "one" ? "one" : "strict",
    market: p.market === "perp" ? "perp" : "spot",
    direction: ["short", "neutral"].includes(p.direction) ? p.direction : "long",
    leverage: num(p.leverage, 1), maintPct: num(p.maintPct, 0.5), perpFeePct: num(p.perpFeePct, 0.055),
  };
  if (!(g.levels >= 3 && g.levels <= 200)) throw new Error("Число уровней сетки: от 3 до 200");
  if (g.mode === "price") {
    if (!(g.lower > 0 && g.upper > g.lower)) throw new Error("Границы сетки: нижняя больше нуля и меньше верхней");
  } else {
    if (!(g.lowerPct > 0 && g.lowerPct < 100)) throw new Error("Нижняя граница: от 0 до 100 % ниже цены старта");
    if (!(g.upperPct > 0 && g.upperPct <= 1000)) throw new Error("Верхняя граница: от 0 до 1000 % выше цены старта");
  }
  if (!(g.stopPx >= 0 && g.takePx >= 0)) throw new Error("Стоп и тейк: цена не меньше нуля (0 — не используется)");
  if (g.market === "perp") {
    if (!(g.leverage >= 1 && g.leverage <= 50)) throw new Error("Плечо фьючерсной сетки: от 1 до 50");
    if (!(g.maintPct > 0 && g.maintPct < 10)) throw new Error("Поддерживающая маржа: от 0 до 10 %");
    if (!(g.perpFeePct >= 0 && g.perpFeePct < 1)) throw new Error("Комиссия фьючерса: от 0 до 1 %");
    if (g.trailing && g.direction === "neutral") throw new Error("У нейтральной сетки трейлинга нет: сдвиг за ценой добавлял бы позицию против движения");
  }
  return g;
}

// Параметры без полей другого режима — для журнала попыток и бумажной сессии.
export function gridParamsOf(p) {
  const g = normalizeGrid(p);
  const { lower, upper, lowerPct, upperPct, market, direction, leverage, maintPct, perpFeePct, ...rest } = g;
  // у спотовой сетки поля фьючерса не пишутся: ключи старых попыток в журнале не меняются
  const perp = market === "perp" ? { market, direction, leverage, maintPct, perpFeePct } : {};
  return g.mode === "price" ? { ...rest, lower, upper, ...perp } : { ...rest, lowerPct, upperPct, ...perp };
}

// Уровни цены: геометрическая сетка — одинаковый шаг в процентах, арифметическая — одинаковый шаг в цене.
export function gridLevels(lower, upper, n, spacing = "geom") {
  if (spacing === "arith") return Array.from({ length: n }, (_, i) => lower + ((upper - lower) * i) / (n - 1));
  const r = (upper / lower) ** (1 / (n - 1));
  return Array.from({ length: n }, (_, i) => lower * r ** i);
}

// Границы для свечей bars: в режиме «%» — от цены открытия первой свечи.
export function gridBounds(bars, g) {
  const p0 = bars[0].o;
  return g.mode === "price" ? { lower: g.lower, upper: g.upper } : { lower: p0 * (1 - g.lowerPct / 100), upper: p0 * (1 + g.upperPct / 100) };
}

const clone = (st) => ({ ...st, slots: st.slots.map((s) => ({ ...s })), log: [] });
const value = (st, px) => st.cash + st.slots.reduce((a, s) => a + (s.held ? s.qty * px : 0), 0);

// Один путь цены внутри свечи. path — точки цены по порядку. lim.intra — сколько кругов внутри свечи разрешено ячейке.
function walk(st, path, o, lim, t) {
  const fee = o.fee, slip = o.slip;
  for (let k = 1; k < path.length && !st.stopped; k++) {
    const a = path[k - 1], b = path[k];
    if (b < a) {
      // вниз: покупки сверху вниз, стоп — когда до него дошли
      const ev = [];
      st.slots.forEach((s, i) => { if (!s.held && s.armed && s.lo < a && s.lo >= b) ev.push([s.lo, i]); });
      if (o.stopPx > 0 && o.stopPx < a && b <= o.stopPx) ev.push([o.stopPx, -1]);
      ev.sort((x, y) => y[0] - x[0] || (x[1] === -1 ? 1 : -1));
      for (const [px, i] of ev) {
        if (i === -1) { exitAll(st, px * (1 - slip), fee, t, "стоп"); break; }
        const s = st.slots[i];
        s.qty = s.alloc / (px * (1 + fee)); s.cost = s.alloc; s.held = true; s.boughtNow = true;
        st.cash -= s.alloc; st.log.push({ t, side: "buy", px, qty: s.qty });
      }
    } else if (b > a) {
      const ev = [];
      st.slots.forEach((s, i) => { if (s.held && s.hi > a && s.hi <= b && (!s.boughtNow || s.intra < lim.intra)) ev.push([s.hi, i]); });
      if (o.takePx > 0 && o.takePx > a && b >= o.takePx) ev.push([o.takePx, -1]);
      ev.sort((x, y) => x[0] - y[0] || (x[1] === -1 ? 1 : -1));
      for (const [px, i] of ev) {
        if (i === -1) { exitAll(st, px * (1 - slip), fee, t, "тейк"); break; }
        const s = st.slots[i], got = s.qty * px * (1 - fee);
        st.cash += got; st.profit += got - s.cost; st.rounds++;
        st.log.push({ t, side: "sell", px, qty: s.qty, profit: got - s.cost });
        if (s.boughtNow) s.intra++;
        s.held = false; s.qty = 0; s.cost = 0; s.boughtNow = false;
      }
    }
  }
}

function exitAll(st, px, fee, t, why) {
  for (const s of st.slots) if (s.held) {
    st.cash += s.qty * px * (1 - fee);
    st.log.push({ t, side: "sell", px, qty: s.qty, why });
    s.held = false; s.qty = 0; s.cost = 0;
  }
  st.stopped = why;
}

// bars — свечи пары (котируемая валюта пары); costs = { feePct, slipPct }.
// Возвращает объект в форме результата backtest(): strat, hold, кривые, trades (= круги), exposure (средняя доля
// монеты в счёте) — чтобы работали эталоны, t-статистика и пересчёт валюты. Плюс поля сетки.
export function gridBacktest(bars, params, costs = {}) {
  const g = normalizeGrid(params);
  if (bars.length < 2) throw new Error("Слишком мало свечей для сетки");
  if (g.market === "perp") return perpGridBacktest(bars, g, costs);
  const fee = num(costs.feePct, 0.1) / 100, slip = num(costs.slipPct, 0.05) / 100;
  if (!(fee >= 0 && fee < 0.1 && slip >= 0 && slip < 0.1)) throw new Error("Комиссия и проскальзывание: от 0 до 10 %");
  const { lower, upper } = gridBounds(bars, g);
  const lv = gridLevels(lower, upper, g.levels, g.spacing);
  const step = g.spacing === "arith" ? lv[1] - lv[0] : lv[1] / lv[0];
  const nextUp = (p) => (g.spacing === "arith" ? p + step : p * step);
  const n = bars.length, nS = lv.length - 1, alloc = 1 / nS;
  const p0 = bars[0].o;
  let st = { cash: 1, profit: 0, rounds: 0, stopped: false, log: [], slots: [] };
  for (let i = 0; i < nS; i++) {
    const s = { lo: lv[i], hi: lv[i + 1], alloc, held: false, qty: 0, cost: 0, armed: lv[i] < p0, boughtNow: false, intra: 0 };
    if (lv[i] >= p0 && g.startBuy) {
      s.qty = alloc / (p0 * (1 + slip) * (1 + fee)); s.cost = alloc; s.held = true; s.armed = true;
      st.cash -= alloc;
    }
    st.slots.push(s);
  }
  const startBought = st.slots.filter((s) => s.held).length;
  if (startBought) st.log.push({ t: bars[0].t, side: "buy", px: p0 * (1 + slip), qty: st.slots.reduce((a, s) => a + s.qty, 0), why: "стартовая покупка" });
  const lim = { intra: g.intrabar === "one" ? 1 : 0 };
  const strat = new Array(n), hold = new Array(n), events = [...st.log];
  const holdQty = 1 / (p0 * (1 + slip) * (1 + fee));
  let prevV = 1, prevC = p0, inRange = 0, shareSum = 0, pendingShift = 0, trailShifts = 0, wentBelow = 0, wentAbove = 0;
  for (let i = 0; i < n; i++) {
    const b = bars[i];
    // трейлинг: сдвиг, решённый на закрытии прошлой свечи, исполняется на открытии этой
    for (; pendingShift > 0 && !st.stopped; pendingShift--) {
      const low = st.slots.shift();
      if (low.held) st.cash += low.qty * b.o * (1 - slip) * (1 - fee);
      const top = st.slots.at(-1);
      const s = { lo: top.hi, hi: nextUp(top.hi), alloc: low.alloc, held: true, qty: 0, cost: low.alloc, armed: true, boughtNow: false, intra: 0 };
      s.qty = s.alloc / (b.o * (1 + slip) * (1 + fee)); st.cash -= s.alloc;
      st.slots.push(s); trailShifts++;
      events.push({ t: b.t, side: "buy", px: b.o * (1 + slip), qty: s.qty, why: "трейлинг вверх" });
    }
    pendingShift = 0;
    for (const s of st.slots) { s.boughtNow = false; s.intra = 0; }
    if (!st.stopped) {
      const o = { fee, slip, stopPx: g.stopPx, takePx: g.takePx };
      const A = clone(st), B = clone(st);
      walk(A, [prevC, b.o, b.h, b.l, b.c], o, lim, b.t);
      walk(B, [prevC, b.o, b.l, b.h, b.c], o, lim, b.t);
      // стоп по грубой нижней границе синтетики: если тело до стопа не дошло, но граница дошла — считаем стоп
      for (const X of [A, B]) if (!X.stopped && g.stopPx > 0 && (b.lb ?? b.l) <= g.stopPx) exitAll(X, Math.min(g.stopPx, b.o) * (1 - slip), fee, b.t, "стоп");
      st = value(A, b.c) <= value(B, b.c) ? A : B;
      events.push(...st.log);
    }
    const V = value(st, b.c);
    strat[i] = V / prevV - 1; prevV = V;
    hold[i] = i === 0 ? holdQty * b.c - 1 : b.c / bars[i - 1].c - 1;
    const lo = st.slots[0].lo, hi = st.slots.at(-1).hi;
    if (!st.stopped && b.c >= lo && b.c <= hi) inRange++;
    if (b.c < lo) wentBelow++;
    if (b.c > hi) wentAbove++;
    shareSum += V > 0 ? (V - st.cash) / V : 0;
    for (const s of st.slots) if (!s.armed && b.c > s.lo) s.armed = true;
    if (g.trailing && !st.stopped && b.c > hi) {
      let top = hi, k = 0;
      while (top < b.c && k < nS) { top = nextUp(top); k++; }
      pendingShift = k;
    }
    prevC = b.c;
  }
  const curve = (r) => { let e = 1; return r.map((x) => (e *= 1 + x)); };
  const last = bars[n - 1].c, V = value(st, last);
  const orders = st.stopped ? [] : st.slots.flatMap((s) => (s.held ? [{ side: "sell", px: s.hi, qty: s.qty }] : s.armed ? [{ side: "buy", px: s.lo, qty: s.alloc / (s.lo * (1 + fee)) }] : []));
  const coinQty = st.slots.reduce((a, s) => a + (s.held ? s.qty : 0), 0);
  return {
    grid: true, params: g, lower, upper, levels: lv, stepPct: g.spacing === "arith" ? (step / lower) * 100 : (step - 1) * 100,
    strat, hold, stratCurve: curve(strat), holdCurve: curve(hold),
    trades: st.rounds, rounds: st.rounds, tradeList: [], exposure: shareSum / n, side: "long", leverage: 1, liquidations: 0, ruined: false,
    gridProfit: st.profit, total: V - 1, revaluation: V - 1 - st.profit,
    inRangeShare: inRange / n, belowShare: wentBelow / n, aboveShare: wentAbove / n, trailShifts, startBought,
    stopped: st.stopped || null, coinQty, cash: st.cash, orders, events,
    endState: { held: coinQty > 0, action: st.stopped ? "stopped" : "grid", ruined: false, entryPx: null, liqPx: null, share: V > 0 ? (V - st.cash) / V : 0 },
  };
}

// Фьючерсная сетка (как фьючерсный грид-бот Bybit, бессрочный фьючерс к USDT).
//
// Вложение — маржа бота. Сумма позиций всех ячеек = вложение × плечо, у каждой ячейки равная доля в USDT по цене
// её заявки. Направление:
// - «лонг»: каждая ячейка покупает по нижнему краю и продаёт по верхнему; ячейки выше цены старта открываются
//   рыночной покупкой (как у спотовой сетки);
// - «шорт»: зеркально — ячейка продаёт по верхнему краю и откупает по нижнему; ячейки ниже цены старта открываются
//   рыночной продажей;
// - «нейтральная»: ячейки ниже цены старта работают как лонг, выше — как шорт, ячейка с ценой старта не работает;
//   стартовой позиции нет. При падении копится лонг, при росте — шорт.
// Позиция на бирже одна (сумма ячеек со знаком), поэтому маржа и ликвидация считаются по чистой позиции.
//
// Честность исполнения — как у спотовой сетки (оба пути внутри свечи, худший; строгий режим; лимитные заявки ровно
// по цене; рыночные — с проскальзыванием), плюс:
// - Комиссия фьючерса — с каждой стороны каждой заявки, по умолчанию тарифом taker 0,055 % (у Bybit заявки сетки
//   обычно проходят как maker 0,02 %, здесь берётся худшее).
// - Ликвидация: на каждой точке пути (открытие, максимум, минимум, закрытие и цена каждой заявки) проверяется, что
//   стоимость счёта больше поддерживающей маржи (доля от чистой позиции). Если нет — позиция ликвидирована и вложение
//   потеряно целиком: при изолированной марже бота остаток маржи после ликвидации уходит бирже. Счёт больше не торгует.
// - Фандинг — по истории выплат Bybit: лонг платит положительную ставку, шорт получает (и наоборот при
//   отрицательной). Позиция внутри свечи меняется, а время выплаты внутри свечи известно не точно, поэтому берётся
//   худшее из двух — позиция на открытии свечи или на закрытии. Где истории нет — 0,01 % за 8 часов против нас.
// - Трейлинг (лонг — вверх, шорт — вниз): если свеча закрылась за границей сетки, на открытии следующей свечи
//   дальняя ячейка закрывается по рынку, а со стороны цены добавляется новая ячейка того же шага, открытая по рынку
//   (с комиссией и проскальзыванием). У нейтральной сетки трейлинга нет.
function perpValue(st, px) { return st.cash + st.slots.reduce((a, s) => a + (s.held ? s.dir * s.qty * (px - s.entry) : 0), 0); }
const netQty = (st) => st.slots.reduce((a, s) => a + (s.held ? s.dir * s.qty : 0), 0);

// Цена, при которой стоимость счёта сравняется с поддерживающей маржей, при неизменной позиции.
function liqPrice(st, m) {
  const Q = netQty(st);
  if (Math.abs(Q) < 1e-15) return null;
  const K = st.cash - st.slots.reduce((a, s) => a + (s.held ? s.dir * s.qty * s.entry : 0), 0);
  const p = K / (m * Math.abs(Q) - Q);
  return p > 0 ? p : null;
}

function liquidate(st, px, t) {
  st.log.push({ t, side: "liq", px, qty: Math.abs(netQty(st)), why: "ликвидация" });
  for (const s of st.slots) { s.held = false; s.qty = 0; }
  st.cash = 0; st.ruined = true; st.stopped = "ликвидация"; st.liqPx = px; st.liqT = t;
}

function closeAllPerp(st, px, o, t, why) {
  for (const s of st.slots) if (s.held) {
    const fill = px * (1 - s.dir * o.slip); // лонг продаёт ниже, шорт откупает выше
    st.cash += s.dir * s.qty * (fill - s.entry) - s.qty * fill * o.fee; st.fees += s.qty * fill * o.fee;
    st.log.push({ t, side: s.dir > 0 ? "sell" : "buy", px: fill, qty: s.qty, why });
    s.held = false; s.qty = 0;
  }
  st.stopped = why;
}

function walkPerp(st, path, o, lim, t) {
  let cur = path[0];
  // проверка ликвидации при движении цены от cur к px с текущей позицией
  const hit = (px) => {
    if (st.ruined) return true;
    const Q = netQty(st);
    if (Math.abs(Q) > 1e-15 && perpValue(st, px) <= o.m * Math.abs(Q) * px) {
      const p = liqPrice(st, o.m), lo = Math.min(cur, px), hi = Math.max(cur, px);
      liquidate(st, p == null ? px : Math.min(hi, Math.max(lo, p)), t);
      return true;
    }
    cur = px;
    return false;
  };
  if (hit(cur)) return;
  for (let k = 1; k < path.length && !st.stopped; k++) {
    const a = path[k - 1], b = path[k];
    if (b === a) continue;
    const down = b < a, ev = [];
    st.slots.forEach((s, i) => {
      if (!s.dir) return;
      const canClose = !s.openedNow || s.intra < lim.intra;
      if (down) {
        if (s.dir > 0 && !s.held && s.armed && s.lo < a && s.lo >= b) ev.push([s.lo, i]);
        if (s.dir < 0 && s.held && canClose && s.lo < a && s.lo >= b) ev.push([s.lo, i]);
      } else {
        if (s.dir > 0 && s.held && canClose && s.hi > a && s.hi <= b) ev.push([s.hi, i]);
        if (s.dir < 0 && !s.held && s.armed && s.hi > a && s.hi <= b) ev.push([s.hi, i]);
      }
    });
    for (const [px, why] of [[o.stopPx, "стоп"], [o.takePx, "тейк"]]) if (px > 0 && (down ? px < a && b <= px : px > a && b >= px)) ev.push([px, -1, why]);
    ev.sort((x, y) => (down ? y[0] - x[0] : x[0] - y[0]) || (x[1] === -1 ? 1 : -1));
    for (const [px, i, why] of ev) {
      if (hit(px)) return;
      if (i === -1) { closeAllPerp(st, px, o, t, why); return; }
      const s = st.slots[i];
      if (!s.held) {
        s.qty = s.notional / px; s.entry = px; s.held = true; s.openedNow = true; s.openFee = s.qty * px * o.fee;
        st.cash -= s.openFee; st.fees += s.openFee;
        st.log.push({ t, side: s.dir > 0 ? "buy" : "sell", px, qty: s.qty });
      } else {
        const fee = s.qty * px * o.fee, pnl = s.dir * s.qty * (px - s.entry);
        st.cash += pnl - fee; st.fees += fee; st.profit += pnl - fee - s.openFee; st.rounds++;
        st.log.push({ t, side: s.dir > 0 ? "sell" : "buy", px, qty: s.qty, profit: pnl - fee - s.openFee });
        if (s.openedNow) s.intra++;
        s.held = false; s.qty = 0; s.openedNow = false;
      }
    }
    if (hit(b)) return;
  }
}

const clonePerp = (st) => ({ ...st, slots: st.slots.map((s) => ({ ...s })), log: [] });

function perpGridBacktest(bars, g, costs = {}) {
  const fee = g.perpFeePct / 100, slip = num(costs.slipPct, 0.05) / 100, m = g.maintPct / 100, L = g.leverage;
  if (!(slip >= 0 && slip < 0.1)) throw new Error("Проскальзывание: от 0 до 10 %");
  const { lower, upper } = gridBounds(bars, g);
  const lv = gridLevels(lower, upper, g.levels, g.spacing);
  const step = g.spacing === "arith" ? lv[1] - lv[0] : lv[1] / lv[0];
  const nextUp = (p) => (g.spacing === "arith" ? p + step : p * step), nextDown = (p) => (g.spacing === "arith" ? p - step : p / step);
  const n = bars.length, nS = lv.length - 1, notional = L / nS, p0 = bars[0].o;
  const fb = Array.isArray(costs.fundingBars) ? costs.fundingBars : null;
  const barSec = n > 1 ? bars[1].t - bars[0].t : 3600, fallback = 0.0001 * (barSec / (8 * 3600));
  const o = { fee, slip, m, stopPx: g.stopPx, takePx: g.takePx };
  let st = { cash: 1, profit: 0, fees: 0, funding: 0, rounds: 0, stopped: false, ruined: false, log: [], slots: [] };
  for (let i = 0; i < nS; i++) {
    const s = { lo: lv[i], hi: lv[i + 1], notional, dir: 0, held: false, qty: 0, entry: 0, openFee: 0, armed: false, openedNow: false, intra: 0 };
    if (g.direction === "long" || (g.direction === "neutral" && s.hi <= p0)) {
      s.dir = 1; s.armed = s.lo < p0;
      if (g.direction === "long" && s.lo >= p0 && g.startBuy) { s.entry = p0 * (1 + slip); s.held = true; s.armed = true; }
    } else if (g.direction === "short" || (g.direction === "neutral" && s.lo >= p0)) {
      s.dir = -1; s.armed = s.hi > p0;
      if (g.direction === "short" && s.hi <= p0 && g.startBuy) { s.entry = p0 * (1 - slip); s.held = true; s.armed = true; }
    }
    if (s.held) { s.qty = notional / s.entry; s.openFee = s.qty * s.entry * fee; st.cash -= s.openFee; st.fees += s.openFee; }
    st.slots.push(s);
  }
  const startQty = netQty(st), startBought = st.slots.filter((s) => s.held).length;
  if (startBought) st.log.push({ t: bars[0].t, side: startQty > 0 ? "buy" : "sell", px: st.slots.find((s) => s.held).entry, qty: Math.abs(startQty), why: "стартовая позиция" });
  const lim = { intra: g.intrabar === "one" ? 1 : 0 };
  const strat = new Array(n), hold = new Array(n), events = [...st.log];
  const holdQty = 1 / (p0 * (1 + slip) * (1 + num(costs.feePct, 0.1) / 100));
  let prevV = 1, prevC = p0, inRange = 0, levSum = 0, maxLev = 0, wentBelow = 0, wentAbove = 0, knownFunding = 0, pendingShift = 0, trailShifts = 0;
  for (let i = 0; i < n; i++) {
    const b = bars[i];
    for (const s of st.slots) { s.openedNow = false; s.intra = 0; }
    // трейлинг: сдвиг, решённый на закрытии прошлой свечи, исполняется на открытии этой по рынку
    for (; pendingShift > 0 && !st.stopped; pendingShift--) {
      const up = g.direction === "long";
      const far = up ? st.slots.shift() : st.slots.pop();
      if (far.held) {
        const fill = b.o * (1 - far.dir * slip), fee = far.qty * fill * o.fee;
        st.cash += far.dir * far.qty * (fill - far.entry) - fee; st.fees += fee;
        events.push({ t: b.t, side: far.dir > 0 ? "sell" : "buy", px: fill, qty: far.qty, why: "трейлинг: закрыта дальняя ячейка" });
      }
      const edge = up ? st.slots.at(-1).hi : st.slots[0].lo;
      const s = { lo: up ? edge : nextDown(edge), hi: up ? nextUp(edge) : edge, notional, dir: far.dir, held: true, qty: 0, entry: b.o * (1 + far.dir * slip), openFee: 0, armed: true, openedNow: false, intra: 0 };
      s.qty = notional / s.entry; s.openFee = s.qty * s.entry * fee; st.cash -= s.openFee; st.fees += s.openFee;
      if (up) st.slots.push(s); else st.slots.unshift(s);
      trailShifts++;
      events.push({ t: b.t, side: s.dir > 0 ? "buy" : "sell", px: s.entry, qty: s.qty, why: up ? "трейлинг вверх" : "трейлинг вниз" });
    }
    pendingShift = 0;
    if (!st.stopped) {
      const Q0 = netQty(st);
      const A = clonePerp(st), B = clonePerp(st);
      walkPerp(A, [prevC, b.o, b.h, b.l, b.c], o, lim, b.t);
      walkPerp(B, [prevC, b.o, b.l, b.h, b.c], o, lim, b.t);
      st = perpValue(A, b.c) <= perpValue(B, b.c) ? A : B;
      events.push(...st.log); st.log = [];
      if (!st.ruined) {
        const Q1 = netQty(st), r = fb ? fb[i] : null;
        let pay;
        if (r != null) { pay = Math.min(-Q0 * b.c * r, -Q1 * b.c * r); knownFunding++; }
        else pay = -Math.max(Math.abs(Q0), Math.abs(Q1)) * b.c * fallback;
        st.cash += pay; st.funding += pay;
        const Q = netQty(st);
        if (Math.abs(Q) > 1e-15 && perpValue(st, b.c) <= m * Math.abs(Q) * b.c) { liquidate(st, b.c, b.t); events.push(...st.log); st.log = []; }
      }
    }
    const V = st.ruined ? 0 : perpValue(st, b.c);
    strat[i] = prevV > 0 ? V / prevV - 1 : 0; prevV = V;
    hold[i] = i === 0 ? holdQty * b.c - 1 : b.c / bars[i - 1].c - 1;
    const lo = st.slots[0].lo, hi = st.slots.at(-1).hi;
    if (!st.stopped && b.c >= lo && b.c <= hi) inRange++;
    if (b.c < lo) wentBelow++;
    if (b.c > hi) wentAbove++;
    const lev = V > 0 ? (Math.abs(netQty(st)) * b.c) / V : 0;
    levSum += lev; maxLev = Math.max(maxLev, lev);
    for (const s of st.slots) if (!s.armed && ((s.dir > 0 && b.c > s.lo) || (s.dir < 0 && b.c < s.hi))) s.armed = true;
    if (g.trailing && !st.stopped) {
      let edge = g.direction === "long" ? hi : lo, k = 0;
      if (g.direction === "long") while (edge < b.c && k < nS) { edge = nextUp(edge); k++; }
      else while (edge > b.c && k < nS && nextDown(edge) > 0) { edge = nextDown(edge); k++; }
      pendingShift = k;
    }
    prevC = b.c;
  }
  const curve = (r) => { let e = 1; return r.map((x) => (e *= 1 + x)); };
  const last = bars[n - 1].c, V = st.ruined ? 0 : perpValue(st, last), Q = netQty(st);
  const orders = st.stopped ? [] : st.slots.flatMap((s) => {
    if (!s.dir) return [];
    if (s.held) return [{ side: s.dir > 0 ? "sell" : "buy", px: s.dir > 0 ? s.hi : s.lo, qty: s.qty }];
    if (!s.armed) return [];
    const px = s.dir > 0 ? s.lo : s.hi;
    return [{ side: s.dir > 0 ? "buy" : "sell", px, qty: s.notional / px }];
  });
  // Где наступит ликвидация, если цена пойдёт в одну сторону и исполнит все заявки на пути (стоп учитывается).
  const project = (to) => {
    if (st.stopped) return null;
    const X = clonePerp(st);
    for (const s of X.slots) { s.openedNow = false; s.intra = 0; }
    walkPerp(X, [last, to], o, { intra: 1 }, 0);
    return X.ruined ? X.liqPx : null;
  };
  return {
    grid: true, perp: true, params: g, lower, upper, levels: lv, stepPct: g.spacing === "arith" ? (step / lower) * 100 : (step - 1) * 100,
    strat, hold, stratCurve: curve(strat), holdCurve: curve(hold),
    trades: st.rounds, rounds: st.rounds, tradeList: [], exposure: levSum / n, side: g.direction === "short" ? "short" : "long", leverage: L,
    liquidations: st.ruined ? 1 : 0, ruined: st.ruined, liquidatedAt: st.liqT ?? null, liquidationPx: st.ruined ? st.liqPx : null,
    gridProfit: st.profit, funding: st.funding, fees: st.fees, total: V - 1, revaluation: V - 1 - st.profit - st.funding,
    inRangeShare: inRange / n, belowShare: wentBelow / n, aboveShare: wentAbove / n, trailShifts, startBought,
    stopped: st.stopped || null, coinQty: Q, cash: st.cash, orders, events, maxLev, fundingKnownShare: knownFunding / n,
    liqDown: project(last / 1000), liqUp: project(last * 1000), liqNow: st.stopped ? null : liqPrice(st, m),
    endState: { held: Math.abs(Q) > 1e-15, action: st.stopped ? "stopped" : "grid", ruined: st.ruined, entryPx: null, liqPx: st.stopped ? null : liqPrice(st, m), share: V > 0 ? (Math.abs(Q) * last) / V : 0 },
  };
}

// «50/50 без сетки»: половина в монете (рыночная покупка на открытии первой свечи), половина в котируемой, без ребалансировки.
export function halfReturns(bars, { feePct = 0.1, slipPct = 0.05 } = {}) {
  const fee = feePct / 100, slip = slipPct / 100, q = 0.5 / (bars[0].o * (1 + slip) * (1 + fee));
  let prev = 1;
  return bars.map((b) => { const v = 0.5 + q * b.c, r = v / prev - 1; prev = v; return r; });
}

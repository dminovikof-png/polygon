// Рисунки модуля 9 «Стратегии». Учебные правила на настоящей истории BTC (public/sim/ta.js), комиссия 0,1 % за смену позиции.
// Это иллюстрации механики, а не проверка: без планки значимости и проверки вне выборки (её делает рабочий режим).
import { C, svg, txt, box, plot, fmt, yearTicks, para } from "./draw.js";
import { rules, equityFromPositions, dca } from "../sim/ta.js";
import { drawdowns } from "../sim/ruin.js";
import { DATA } from "./data.js";

const RULES = {
  smaTrend: ["Тренд: держать, пока цена выше средней за 200 дней", (c) => rules.smaTrend(c, 200)],
  donchian: ["Черепахи: вход на 20-дневном максимуме, выход на 10-дневном минимуме", (c) => rules.donchian(c, 20, 10)],
  rsiRevert: ["Возврат к среднему: купить при RSI < 30, продать при RSI > 55", (c) => rules.rsiRevert(c, 14, 30, 55)],
};

// Итоги учебного правила на всей истории BTC.
export function ruleStats(rule, fee = 0.001) {
  const c = DATA.btc.c, pos = RULES[rule][1](c), r = equityFromPositions(c, pos, fee);
  const hold = c.map((v) => v / c[0]), inMarket = pos.filter((p) => p).length / pos.length;
  return { eq: r.eq, pos, trades: r.trades, final: r.eq.at(-1), hold: hold.at(-1), dd: drawdowns(r.eq).worst, holdDd: drawdowns(hold).worst, inMarket, holdSeries: hold };
}

function strategyOnBtc({ rule = "smaTrend", fee = 0.001 } = {}) {
  const c = DATA.btc.c, s = ruleStats(rule, fee), bands = [];
  for (let i = 0, st = -1; i <= s.pos.length; i++) { if (s.pos[i] && st < 0) st = i; if (!s.pos[i] && st >= 0) { bands.push({ x1: st, x2: i }); st = -1; } }
  const body = plot([{ pts: s.holdSeries.map((v, i) => [i, v]), color: C.dim, width: 1.2, label: "удержание BTC" }, { pts: s.eq.map((v, i) => [i, v]), color: C.gold, label: "правило" }],
    { x0: 60, y0: 58, w: 520, h: 150, log: true, yfmt: (v) => "×" + fmt(v, v < 1 ? 1 : 0), xticks: yearTicks(DATA.btc.t0, c.length), bands }) +
    txt(10, 18, RULES[rule][0], { size: 12, weight: 600 }) +
    txt(10, 36, `Итог ×${fmt(s.final, 1)} против ×${fmt(s.hold, 1)} у удержания; худшая просадка ${fmt(s.dd * 100)} % против ${fmt(s.holdDd * 100)} %; сделок ${s.trades}; в рынке ${fmt(s.inMarket * 100)} % времени.`, { size: 12, color: C.dim });
  return svg(600, 248, body, `Учебное правило на истории BTC: ${RULES[rule][0]}`);
}

// DCA против покупки сразу: вложить одну и ту же сумму, начиная с разных дат.
export function dcaRun({ startYear = 2021, months = 24, amount = 100 } = {}) {
  const c = DATA.btc.c, t0 = DATA.btc.t0, start = Math.max(0, Math.round((Date.UTC(startYear, 0, 1) / 1000 - t0) / 86400));
  const end = Math.min(c.length - 1, start + Math.round(months * 30.44) - 1), n = Math.ceil((end - start + 1) / 30);
  const d = dca(c, { start, every: 30, amount, end }), lump = (n * amount * c[end]) / c[start];
  return { start, end, n, invested: d.invested, dca: d.final, lump, series: d.value, c };
}
function dcaVsLump({ startYear = 2021, months = 24 } = {}) {
  const r = dcaRun({ startYear, months }), lumpPts = r.series.map((v, i) => [i, (r.invested * r.c[r.start + i]) / r.c[r.start]]);
  const body = plot([{ pts: r.series.map((v, i) => [i, v.invested]), color: C.dim, dash: true, label: "вложено (DCA)" }, { pts: r.series.map((v, i) => [i, v.value]), color: C.blue, label: "DCA: $100 раз в 30 дней" }, { pts: lumpPts, color: C.gold, label: "всё сразу в первый день" }],
    { x0: 60, y0: 50, w: 520, h: 150, ymin: 0, yfmt: (v) => "$" + fmt(v), xticks: yearTicks(DATA.btc.t0 + r.start * 86400, r.series.length) }) +
    txt(10, 18, `Старт ${startYear}, ${months} мес.: вложено $${fmt(r.invested)}. DCA → $${fmt(r.dca)}, всё сразу → $${fmt(r.lump)}.`, { size: 12, weight: 600 }) +
    txt(10, 36, r.lump > r.dca ? "Цена в основном росла — покупка сразу выиграла." : "Цена в основном падала — DCA выиграл, купив больше монет дешевле.", { size: 12, color: C.dim });
  return svg(600, 238, body, "DCA против покупки сразу на истории BTC");
}

// Сетка: покупки ниже, продажи выше; при падении набирает монету.
function gridMechanic({ step = 0 } = {}) {
  const path = [100, 103, 99, 104, 98, 101, 95, 91, 87, 84, 86, 82], levels = [84, 88, 92, 96, 100, 104];
  const n = step === 0 ? 6 : path.length, pts = path.slice(0, n).map((v, i) => [i, v]);
  let body = plot([{ pts, color: C.text }], { x0: 50, y0: 40, w: 530, h: 150, ymin: 80, ymax: 106, xmin: 0, xmax: path.length - 1, yticks: levels, yfmt: (v) => fmt(v), hlines: levels.map((y) => ({ y, color: y >= 100 ? C.red : C.green })) });
  const held = step === 0 ? 1 : 5;
  body += txt(10, 18, step === 0 ? "Цена ходит в коридоре: сетка покупает на нижних уровнях и продаёт на соседних верхних. Каждый круг — небольшая прибыль." : "Цена ушла вниз: сработали все покупки, продаж нет. Сетка держит 5 долей монеты и весь её убыток.", { size: 12 }) +
    txt(10, 228, `Монета в сетке: ${held} ${held === 1 ? "доля" : "долей"} из 6. Скрытое предположение: цена вернётся в коридор.`, { size: 12, color: step === 0 ? C.dim : C.red });
  return svg(600, 238, body, "Механика сетки в коридоре и при падении");
}

// Carry: две ноги компенсируют цену, остаётся фандинг.
function carryLegs() {
  const body = box(10, 40, 180, 110, "Спот: купить 1 BTC", ["цена +10 % → +$"], { color: C.green }) + txt(205, 100, "+", { size: 26, anchor: "middle" }) +
    box(220, 40, 180, 110, "Фьючерс: продать 1 BTC", ["цена +10 % → −$"], { color: C.red }) + txt(415, 100, "=", { size: 26, anchor: "middle" }) +
    box(430, 40, 160, 110, "Итог", ["цена почти не влияет", "остаётся фандинг", "минус комиссии"], { color: C.gold }) +
    txt(10, 22, "Carry не угадывает направление. Его ставка другая: что фандинг останется положительным.", { size: 12 }) +
    para(10, 178, "Риски: фандинг уходит в минус (платите вы); биржа, на которой лежат обе ноги; резкий рост и требование доложить залог по шорту.", { size: 12, color: C.dim, max: 95 });
  return svg(600, 215, body, "Две ноги carry-сделки");
}

// Скрытое предположение каждой механики.
function hiddenBets() {
  const rows = [["Удержание и DCA", "цена через годы выше, чем сейчас"], ["Тренд, черепахи", "движения продолжаются дольше, чем кажется"], ["Возврат к среднему", "резкие движения откатываются назад"], ["Сетка", "цена вернётся в коридор, а не уйдёт"], ["Carry и базис", "фандинг и базис останутся положительными"], ["Маркетмейкинг", "заработаю спред быстрее, чем отберут знающие"], ["Стат-арбитраж", "разошедшиеся монеты снова сойдутся"]];
  let body = txt(10, 18, "У каждой механики есть ставка на поведение цены, даже если её называют «нейтральной».", { size: 12 });
  rows.forEach(([a, b], i) => { const y = 32 + i * 29; body += `<rect x="10" y="${y}" width="580" height="25" rx="5" fill="${C.card}" stroke="${C.line}"/>` + txt(20, y + 17, a, { size: 12, weight: 600 }) + txt(220, y + 17, b, { size: 12, color: C.dim }); });
  return svg(600, 240, body, "Скрытое предположение о цене у каждой стратегии");
}

export default { strategyOnBtc, dcaVsLump, gridMechanic, carryLegs, hiddenBets };

// Рисунки модуля 10 «Риск и размер позиции».
import { C, svg, txt, plot, fmt, yearTicks, dayIndex } from "./draw.js";
import { recoveryNeeded, drawdowns, kelly, growthRate, simulateBets, returns, correlation, leveredHistory } from "../sim/ruin.js";
import { DATA } from "./data.js";

function recovery() {
  const rows = [-0.1, -0.2, -0.33, -0.5, -0.75, -0.9];
  let body = txt(10, 18, "Сколько нужно вырасти, чтобы вернуться к прежнему капиталу после падения.", { size: 12 });
  rows.forEach((d, i) => {
    const y = 34 + i * 32, up = recoveryNeeded(d), len = Math.min(380, Math.log10(1 + up) * 380);
    body += txt(70, y + 17, `${fmt(d * 100)} %`, { size: 13, anchor: "end", color: C.red }) + `<rect x="80" y="${y}" width="${Math.abs(d) * 100}" height="22" rx="3" fill="${C.red}" opacity="0.7"/>` +
      `<rect x="190" y="${y}" width="${len}" height="22" rx="3" fill="${C.green}" opacity="0.7"/>` + txt(196 + len, y + 16, `+${fmt(up * 100)} %`, { size: 13 });
  });
  body += txt(80, 232, "падение", { size: 11, color: C.dim }) + txt(190, 232, "нужный рост (логарифмическая длина)", { size: 11, color: C.dim });
  return svg(600, 240, body, "Падение и рост, нужный для восстановления");
}

// «Под водой»: насколько монета ниже своего максимума в каждый день.
function underwater({ coin = "btc" } = {}) {
  const d = DATA[coin], r = drawdowns(d.c), pts = r.dd.map((v, i) => [i, v * 100]);
  const body = plot([{ pts, color: C.red, width: 1.2 }], { x0: 60, y0: 40, w: 520, h: 160, ymax: 0, ymin: -100, yticks: [0, -50, -100], yfmt: (v) => fmt(v) + " %", xticks: yearTicks(d.t0, d.c.length) }) +
    txt(10, 20, `${coin.toUpperCase()}: насколько цена ниже прошлого максимума. Худшее — ${fmt(r.worst * 100)} %; дольше всего ниже максимума — ${fmt(r.longest)} дней подряд.`, { size: 12 });
  return svg(600, 232, body, `Просадки ${coin.toUpperCase()} по дням`);
}

// Рост капитала в зависимости от доли ставки: максимум у Келли, ноль около двойного Келли.
export function kellyCurve({ p = 0.55, b = 1, f = null } = {}) {
  const k = kelly(p, b), fmax = Math.min(0.99, Math.max(0.05, k * 3)), pts = [];
  for (let i = 0; i <= 100; i++) { const x = (fmax * i) / 100; pts.push([x * 100, growthRate(p, b, x) * 100]); }
  const marks = [{ x: k * 100, y: growthRate(p, b, k) * 100, label: `Келли ${fmt(k * 100, 1)} %` }];
  if (f != null && f <= fmax) marks.push({ x: f * 100, y: growthRate(p, b, f) * 100, color: C.blue, label: `вы: ${fmt(f * 100, 1)} %`, dy: 18 });
  const ys = pts.map((q) => q[1]);
  const body = plot([{ pts, color: C.green }], { x0: 60, y0: 40, w: 520, h: 160, ymin: Math.max(Math.min(...ys), -Math.max(...ys) * 2), yfmt: (v) => fmt(v, 2) + " %", xlab: "доля капитала в каждой ставке, %", hlines: [{ y: 0, color: C.dim }], marks, xticks: [[0, "0"], [k * 100, fmt(k * 100, 0)], [k * 200, fmt(k * 200, 0)]] }) +
    txt(10, 20, `Выигрыш ${fmt(p * 100)} %, прибыль ${fmt(b, 1)}R против убытка 1R: средний рост капитала за ставку.`, { size: 12 });
  return svg(600, 248, body, "Кривая роста капитала от доли ставки");
}

// Пути капитала при одной и той же «выгодной» игре с разной долей риска.
export function ruinPaths({ p = 0.5, b = 1.2, f = 0.05, trades = 200, seed = 1 } = {}) {
  const s = simulateBets({ p, b, f, trades, paths: 1000, seed, keep: 50 });
  const series = s.paths.map((path) => ({ pts: path.map((v, i) => [i, Math.max(v, 0.01)]), color: path.at(-1) < 0.1 ? C.red : path.at(-1) >= 1 ? C.green : C.blue, width: 0.8 }));
  const body = plot(series, { x0: 60, y0: 40, w: 520, h: 170, log: true, ymin: 0.01, ymax: Math.max(10, ...s.paths.map((q) => Math.max(...q))), yfmt: (v) => "×" + fmt(v, v < 1 ? 2 : 0), xlab: "номер сделки", hlines: [{ y: 1, color: C.dim }], xticks: [[0, "0"], [trades / 2, String(trades / 2)], [trades, String(trades)]] }) +
    txt(10, 20, `Риск ${fmt(f * 100, 1)} % на сделку, 1000 путей (показаны 50): разорились ${fmt(s.ruinProb * 100, 1)} %, медиана ×${fmt(s.median, 2)}, удвоились ${fmt(s.doubleProb * 100)} %.`, { size: 12 });
  return svg(600, 258, body, "Пути капитала при разной доле риска");
}

// Корреляция BTC и ETH: дневные доходности за последние два года.
function corrScatter() {
  // одни и те же даты у обеих монет: ряды могут кончаться в разные дни
  const n = 730, lastT = Math.min(DATA.btc.t0 + (DATA.btc.c.length - 1) * 86400, DATA.eth.t0 + (DATA.eth.c.length - 1) * 86400);
  const win = (d) => { const e = (lastT - d.t0) / 86400; return d.c.slice(e - n, e + 1); };
  const x = returns(win(DATA.btc)), y = returns(win(DATA.eth)), r = correlation(x, y);
  const S = 22, X = (v) => 300 + Math.max(-1, Math.min(1, v * 100 / S)) * 200, Y = (v) => 135 - Math.max(-1, Math.min(1, v * 100 / S)) * 100;
  let body = `<line x1="100" y1="135" x2="500" y2="135" stroke="${C.line}"/><line x1="300" y1="35" x2="300" y2="235" stroke="${C.line}"/>`;
  x.forEach((v, i) => { const both = v < -0.05 && y[i] < -0.05; body += `<circle cx="${X(v).toFixed(1)}" cy="${Y(y[i]).toFixed(1)}" r="${both ? 3 : 2}" fill="${both ? C.red : C.blue}" opacity="${both ? 0.9 : 0.45}"/>`; });
  body += txt(500, 150, "BTC за день →", { size: 11, color: C.dim, anchor: "end" }) + txt(306, 45, "ETH за день ↑", { size: 11, color: C.dim }) +
    txt(10, 20, `Дневные изменения BTC и ETH за 2 года: корреляция ${fmt(r, 2)}. Красные — дни, когда обе упали больше чем на 5 %.`, { size: 12 }) +
    txt(10, 250, "В плохие дни монеты падают вместе: десять монет вместо одной почти не защищают от обвала рынка.", { size: 12, color: C.dim });
  return svg(600, 258, body, "Корреляция дневных доходностей BTC и ETH");
}

// Плечо на настоящей истории BTC с ежедневной ребалансировкой (без комиссий и фандинга — в жизни хуже).
export function leverHistory({ from = "2020-01-01" } = {}) {
  const d = DATA.btc, i0 = Math.max(0, dayIndex(d.t0, from)), c = d.c.slice(i0), colors = { 1: C.dim, 2: C.blue, 3: C.gold, 5: C.red };
  const series = [1, 2, 3, 5].map((L) => ({ L, eq: leveredHistory(c, L) }));
  const body = plot(series.map(({ L, eq }) => ({ pts: eq.map((v, i) => [i, Math.max(v, 0.001)]), color: colors[L], width: L === 1 ? 1.5 : 1.8, label: `${L}x: ×${fmt(eq.at(-1), eq.at(-1) < 1 ? 3 : 1)}` })),
    { x0: 60, y0: 50, w: 520, h: 160, log: true, ymin: 0.001, yfmt: (v) => "×" + fmt(v, v < 1 ? 3 : 0), xticks: yearTicks(d.t0 + i0 * 86400, c.length) }) +
    txt(10, 18, `BTC с ${from.slice(0, 4)} года с постоянным плечом (каждый день доводим позицию до L × капитал), без комиссий и фандинга.`, { size: 12 });
  return svg(600, 245, body, "Постоянное плечо на истории BTC");
}

export default { recovery, underwater, kellyCurve, ruinPaths, corrScatter, leverHistory };

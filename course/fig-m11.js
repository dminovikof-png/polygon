// Рисунки модуля 11 «Честная проверка». Цены — настоящие дневные закрытия (public/course/data.js).
import { C, svg, txt, box, arrow, plot, fmt, yearTicks, para } from "./draw.js";
import { monkeys, paramSweep, peekEquity, plank } from "../sim/monkeys.js";
import { rules, equityFromPositions } from "../sim/ta.js";
import { ruleStats } from "./fig-m09.js";
import { DATA } from "./data.js";

const COIN = { btc: "BTC", eth: "ETH", sol: "SOL", doge: "DOGE" };
const X = (v) => "×" + fmt(v, v < 10 ? (v < 1 ? 2 : 1) : 0);
const date = (d, i) => new Date((d.t0 + i * 86400) * 1000).toISOString().slice(0, 10).split("-").reverse().join(".");

// Расчёт обезьян занимает доли секунды; кадры анимации и симулятор берут его из памяти.
const cache = new Map();
export function monkeyRun({ coin = "btc", count = 500, seed = 1, fee = 0.001 } = {}) {
  const key = [coin, count, seed, fee].join("|");
  if (!cache.has(key)) { if (cache.size > 12) cache.clear(); cache.set(key, monkeys(DATA[coin].c, { count, seed, fee, keep: 100 })); }
  return cache.get(key);
}

// Сотня случайных стратегий на настоящей истории; на шаге 1 — лучшая из всех.
export function monkeysChart({ coin = "btc", count = 500, seed = 1, fee = 0.001, phase = 1 } = {}) {
  const d = DATA[coin], m = monkeyRun({ coin, count, seed, fee }), thin = (eq) => eq.filter((_, i) => i % 10 === 0 || i === eq.length - 1).map((v, k) => [Math.min(k * 10, eq.length - 1), v]);
  const shown = m.all.filter((x) => x.eq).slice(0, 60);
  const series = shown.map((x) => ({ pts: thin(x.eq), color: C.blue, width: 0.6, opacity: 0.35 }));
  series.push({ pts: thin(m.hold), color: C.gold, width: 2, label: `удержание ${X(m.hold.at(-1))}` });
  const best = m.bestAll;
  if (phase >= 1) series.push({ pts: thin(best.path), color: C.green, width: 2, label: `лучшая обезьяна ${X(best.final)}` });
  const body = plot(series, { x0: 60, y0: 64, w: 520, h: 170, log: true, yfmt: X, xticks: yearTicks(d.t0, d.c.length) }) +
    txt(10, 18, phase === 0 ? `${COIN[coin]}: ${count} обезьян входят и выходят наугад (показаны 60). Жёлтая — просто держать монету.` : `Лучшая из ${count}: ${X(best.final)} против ${X(m.hold.at(-1))} у удержания. Удержание обогнали ${fmt(m.beatHold * 100, 1)} % обезьян.`, { size: 12, weight: 600 }) +
    txt(10, 36, phase === 0 ? "Правило у всех одно: каждый день с вероятностью 5 % поменять решение. Никакого анализа." : `t лучшей против удержания ${fmt(best.t, 2)}; планка для ${count} попыток ${fmt(m.plank, 2)}. Без планки «стратегию» можно было бы продавать.`, { size: 12, color: C.dim });
  return svg(600, 266, body, `${count} случайных стратегий на истории ${COIN[coin]}`);
}

// Песочница и отложенная часть: результат каждой обезьяны там и там.
export function monkeysSplit({ coin = "btc", count = 500, seed = 1 } = {}) {
  const d = DATA[coin], m = monkeyRun({ coin, count, seed }), holdIn = m.hold[m.cut], holdOut = m.hold.at(-1) / m.hold[m.cut];
  const L = (v) => Math.log10(Math.max(v, 1e-3)), xs = m.all.map((a) => L(a.inFinal)), ys = m.all.map((a) => L(a.outFinal));
  const xa = Math.min(...xs), xb = Math.max(...xs), ya = Math.min(...ys, L(holdOut)), yb = Math.max(...ys, L(holdOut));
  const PX = (v) => 70 + ((v - xa) / (xb - xa || 1)) * 500, PY = (v) => 216 - ((v - ya) / (yb - ya || 1)) * 160;
  let body = `<rect x="70" y="56" width="500" height="160" fill="none" stroke="${C.line}"/>`;
  body += `<line x1="70" y1="${PY(L(holdOut)).toFixed(1)}" x2="570" y2="${PY(L(holdOut)).toFixed(1)}" stroke="${C.gold}" stroke-dasharray="4 3"/>` + txt(566, PY(L(holdOut)) - 4, `удержание потом ${X(holdOut)}`, { size: 11, color: C.gold, anchor: "end" });
  m.all.forEach((a, i) => { body += `<circle cx="${PX(xs[i]).toFixed(1)}" cy="${PY(ys[i]).toFixed(1)}" r="2" fill="${C.blue}" opacity="0.5"/>`; });
  const b = m.best;
  body += `<circle cx="${PX(L(b.inFinal)).toFixed(1)}" cy="${PY(L(b.outFinal)).toFixed(1)}" r="6" fill="none" stroke="${C.green}" stroke-width="2"/>` +
    txt(PX(L(b.inFinal)) - 8, PY(L(b.outFinal)) - 9, `лучшая в песочнице: ${X(b.inFinal)} → ${X(b.outFinal)}`, { size: 11, color: C.green, anchor: "end" });
  body += txt(320, 236, `результат в песочнице (до ${date(d, m.cut)}), лог. шкала →`, { size: 11, color: C.dim, anchor: "middle" }) + txt(66, 52, "↑ после, на отложенных данных", { size: 11, color: C.dim }) +
    txt(10, 18, `Каждая точка — обезьяна. Связь «хороша в песочнице → хороша потом»: ${fmt(m.rankCorr, 2)} (0 — никакой).`, { size: 12, weight: 600 }) +
    txt(10, 36, `Удержание в песочнице дало ${X(holdIn)}. Лучшая обезьяна песочницы на новых данных — как случайная.`, { size: 12, color: C.dim });
  return svg(600, 246, body, "Результаты обезьян в песочнице и на отложенных данных");
}

// Планка значимости растёт с числом попыток.
function plankCurve() {
  const pts = []; for (let e = 0; e <= 4.0001; e += 0.05) pts.push([e, plank(10 ** e)]);
  const marks = [[1, "1 попытка"], [20, "20"], [500, "500 обезьян"], [10000, "10 000"]].map(([n, l], k) => ({ x: Math.log10(n), y: plank(n), label: `${l}: ${fmt(plank(n), 2)}`, color: k === 2 ? C.gold : C.blue, dy: k % 2 ? 18 : -10, ...(k === 3 ? { anchor: "end", dx: -10, dy: -8 } : {}) }));
  const body = plot([{ pts, color: C.green }], { x0: 60, y0: 40, w: 510, h: 160, ymin: 1.5, ymax: 4.6, yticks: [2, 3, 4], yfmt: (v) => fmt(v, 0), marks, xticks: [[0, "1"], [1, "10"], [2, "100"], [3, "1000"], [4, "10 000"]], xlab: "сколько вариантов проверено (лог. шкала)" }) +
    txt(10, 20, "Планка: какую t-статистику даёт лучший из N вариантов, если ни один ничего не умеет.", { size: 12 });
  return svg(600, 248, body, "Планка значимости от числа попыток");
}

// Подгонка параметра: SMA n в песочнице и на отложенных данных.
export function paramOverfit({ coin = "btc" } = {}) {
  const d = DATA[coin], s = paramSweep(d.c), hold = d.c.at(-1) / d.c[s.cut];
  const ins = s.rows.map((r) => r.inFinal).sort((a, b) => a - b), inMed = ins[Math.floor(ins.length / 2)];
  const body = plot([{ pts: s.rows.map((r) => [r.n, r.inFinal]), color: C.violet, label: "песочница" }, { pts: s.rows.map((r) => [r.n, r.outFinal]), color: C.green, label: "отложенные данные" }],
    { x0: 60, y0: 64, w: 510, h: 150, log: true, yfmt: X, hlines: [{ y: hold, color: C.gold }], xlab: "длина средней n, дней", xticks: [[10, "10"], [50, "50"], [100, "100"], [200, "200"], [300, "300"]],
      marks: [{ x: s.best.n, y: s.best.inFinal, color: C.violet, label: `лучшая n = ${s.best.n}: ${X(s.best.inFinal)}`, dy: -10 }, { x: s.best.n, y: s.best.outFinal, color: C.green, label: `потом ${X(s.best.outFinal)}`, dy: 18 }] }) +
    txt(10, 18, `${COIN[coin]}, правило «держать выше SMA n», 30 вариантов n. Песочница — до ${date(d, s.cut)}, дальше — отложенные данные.`, { size: 12, weight: 600 }) +
    txt(10, 36, `Лучшая n в песочнице ${X(s.best.inFinal)} (медиана вариантов ${X(inMed)}); потом ${X(s.best.outFinal)} при медиане ${X(s.outMedian)} и удержании ${X(hold)} (жёлтая).`, { size: 12, color: C.dim });
  return svg(600, 252, body, `Подгонка длины средней на ${COIN[coin]}`);
}

// Заглядывание в будущее: решение по закрытию дня получает доходность того же дня.
function peekFig() {
  const d = DATA.btc, pos = rules.smaTrend(d.c, 200), honest = equityFromPositions(d.c, pos).eq, peek = peekEquity(d.c, pos);
  const body = plot([{ pts: honest.map((v, i) => [i, v]), color: C.blue, label: `честно: ${X(honest.at(-1))}` }, { pts: peek.map((v, i) => [i, v]), color: C.red, label: `с заглядыванием: ${X(peek.at(-1))}` }],
    { x0: 60, y0: 64, w: 520, h: 165, log: true, yfmt: X, xticks: yearTicks(d.t0, d.c.length) }) +
    txt(10, 18, "BTC, «держать выше SMA 200». Одна и та же логика, разница — на один день.", { size: 12, weight: 600 }) +
    txt(10, 36, "Красная линия решает по закрытию дня и получает рост того же дня — то есть знает его заранее.", { size: 12, color: C.dim });
  return svg(600, 262, body, "Честный расчёт против расчёта с заглядыванием в будущее");
}

// Издержки: одни и те же правила при разной комиссии.
function costsFig() {
  const fees = [0, 0.001, 0.0025, 0.005], names = { donchian: "черепахи", smaTrend: "SMA 200", rsiRevert: "RSI-возврат" }, colors = [C.green, C.blue, C.gold, C.red];
  let body = txt(10, 18, "BTC с 2017 года: итог трёх правил при комиссии 0 %, 0,1 %, 0,25 % и 0,5 % за смену позиции.", { size: 12 });
  const top = Math.log10(30);
  Object.entries(names).forEach(([rule, name], g) => {
    const x0 = 70 + g * 175;
    body += txt(x0 + 70, 222, name, { size: 12, anchor: "middle" });
    fees.forEach((f, k) => {
      const v = ruleStats(rule, f).final, h = Math.max(2, (Math.log10(Math.max(v, 1)) / top) * 160);
      body += `<rect x="${x0 + k * 36}" y="${(204 - h).toFixed(1)}" width="30" height="${h.toFixed(1)}" fill="${colors[k]}" opacity="0.8"/>` + txt(x0 + k * 36 + 15, 200 - h, X(v), { size: 10, anchor: "middle" });
    });
  });
  body += fees.map((f, k) => `<rect x="${70 + k * 120}" y="236" width="10" height="10" fill="${colors[k]}"/>` + txt(84 + k * 120, 245, `комиссия ${fmt(f * 100, f === 0.0025 ? 2 : 1)} %`, { size: 11, color: C.dim })).join("");
  return svg(600, 256, body, "Итог правил при разной комиссии");
}

const wrap = (s, max) => { const out = []; let cur = ""; for (const w of s.split(" ")) { if ((cur + " " + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + " " + w).trim(); } if (cur) out.push(cur); return out; };

// Порядок честной проверки.
function pipeline() {
  const steps = [["Записать", "правило и условие успеха — до расчёта"], ["Песочница", "считать и подбирать сколько угодно"], ["Планка", "учесть все попытки, а не одну"], ["Отложенные данные", "один раз, без подстройки"], ["Бумага", "вживую, без денег"]];
  let body = txt(10, 20, "Каждый шаг отсеивает самообман. Пропуск любого — и красивый бэктест ничего не значит.", { size: 12 });
  steps.forEach(([t, s], i) => { const x = 10 + i * 118; body += box(x, 40, 104, 110, t, wrap(s, 15), { size: 13 }); if (i < steps.length - 1) body += arrow(x + 104, 95, x + 116, 95); });
  body += para(10, 182, "Отложенные данные открывают один раз. Если после этого правило поправили и проверили снова, они превратились в ещё одну песочницу.", { size: 12, color: C.gold, max: 95 });
  return svg(600, 220, body, "Порядок честной проверки идеи");
}

export default { monkeysChart, monkeysSplit, plankCurve, paramOverfit, peekFig, costsFig, pipeline };

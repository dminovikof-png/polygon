// Рисунки модуля 8 «Технический анализ». Цены — настоящая история (public/course/data.js), индикаторы — public/sim/ta.js.
import { C, svg, txt, line, plot, fmt, yearTicks, rng } from "./draw.js";
import { sma, rsi, bollinger, donchian } from "../sim/ta.js";
import { DATA } from "./data.js";

const COIN = { btc: "BTC", eth: "ETH", sol: "SOL", doge: "DOGE" };
const pf = (v) => (v >= 1000 ? "$" + fmt(v / 1000, v >= 10000 ? 0 : 1) + " тыс." : v >= 1 ? "$" + fmt(v, 0) : "$" + fmt(v, 3));

// Японские свечи: последние n дней BTC.
function candles({ n = 45 } = {}) {
  const all = DATA.btcOhlc.bars, bars = all.slice(-n), t0 = DATA.btcOhlc.t0 + (all.length - n) * 86400;
  const hi = Math.max(...bars.map((b) => b[1])), lo = Math.min(...bars.map((b) => b[2]));
  const x0 = 70, w = 510, y0 = 40, h = 170, step = w / n, Y = (v) => y0 + h - ((v - lo) / (hi - lo)) * h;
  let body = line(x0, y0 + h, x0 + w, y0 + h) + txt(x0 - 6, y0 + 4, pf(hi), { size: 11, color: C.dim, anchor: "end" }) + txt(x0 - 6, y0 + h, pf(lo), { size: 11, color: C.dim, anchor: "end" });
  bars.forEach(([o, h1, l, c], i) => {
    const x = x0 + i * step + step / 2, up = c >= o, col = up ? C.green : C.red;
    body += line(x, Y(h1), x, Y(l), { color: col }) + `<rect x="${(x - step * 0.35).toFixed(1)}" y="${Y(Math.max(o, c)).toFixed(1)}" width="${(step * 0.7).toFixed(1)}" height="${Math.max(1, Math.abs(Y(o) - Y(c))).toFixed(1)}" fill="${col}"/>`;
  });
  const d = (t) => new Date(t * 1000).toISOString().slice(5, 10).split("-").reverse().join(".");
  body += txt(x0, y0 + h + 16, d(t0), { size: 10, color: C.dim }) + txt(x0 + w, y0 + h + 16, d(t0 + (n - 1) * 86400), { size: 10, color: C.dim, anchor: "end" });
  body += txt(10, 20, `BTC, ${n} дневных свечей до ${DATA.asOf.split("-").reverse().join(".")}. Зелёная — день закрылся выше открытия, красная — ниже.`, { size: 12 });
  return svg(600, 232, body, `Японские свечи BTC за ${n} дней`);
}

// Как читать одну свечу.
function candleAnatomy() {
  const body = line(150, 30, 150, 200, { color: C.green, width: 2 }) + `<rect x="125" y="70" width="50" height="90" fill="${C.green}"/>` +
    line(400, 30, 400, 200, { color: C.red, width: 2 }) + `<rect x="375" y="60" width="50" height="70" fill="${C.red}"/>` +
    txt(185, 34, "максимум дня", { size: 12 }) + txt(185, 74, "закрытие", { size: 12 }) + txt(185, 160, "открытие", { size: 12 }) + txt(185, 200, "минимум дня", { size: 12 }) +
    txt(435, 34, "максимум", { size: 12 }) + txt(435, 64, "открытие", { size: 12 }) + txt(435, 130, "закрытие", { size: 12 }) + txt(435, 200, "минимум", { size: 12 }) +
    txt(150, 222, "рост", { size: 13, anchor: "middle", color: C.green, weight: 600 }) + txt(400, 222, "падение", { size: 13, anchor: "middle", color: C.red, weight: 600 }) +
    txt(10, 16, "Тело — от открытия до закрытия, тени — куда цена доходила внутри дня.", { size: 12 });
  return svg(600, 232, body, "Устройство японской свечи");
}

// График монеты с включаемыми индикаторами. years — сколько последних лет показать (0 — всё).
export function priceChart({ coin = "btc", years = 3, sma50 = false, sma200 = true, bb = false, dc = false, showRsi = false } = {}) {
  const d = DATA[coin], all = d.c, from = years ? Math.max(0, all.length - Math.round(years * 365)) : 0;
  const c = all.slice(from), cut = (arr) => arr.slice(from).map((v, i) => [i, v]);
  const series = [{ pts: c.map((v, i) => [i, v]), color: C.text, width: 1.5, label: COIN[coin] }];
  if (sma50) series.push({ pts: cut(sma(all, 50)), color: C.blue, label: "SMA 50" });
  if (sma200) series.push({ pts: cut(sma(all, 200)), color: C.gold, label: "SMA 200" });
  if (bb) { const b = bollinger(all, 20, 2); series.push({ pts: cut(b.upper), color: C.violet, width: 1, label: "Боллинджер 20, 2" }, { pts: cut(b.lower), color: C.violet, width: 1 }); }
  if (dc) { const k = donchian(all, 20); series.push({ pts: cut(k.hi), color: C.green, width: 1, dash: true, label: "Дончиан 20" }, { pts: cut(k.lo), color: C.red, width: 1, dash: true }); }
  const t0 = d.t0 + from * 86400, H = showRsi ? 330 : 250;
  let body = plot(series, { x0: 70, y0: 40, w: 510, h: 170, log: true, yfmt: pf, xticks: yearTicks(t0, c.length) });
  if (showRsi) {
    const r = rsi(all, 14).slice(from).map((v, i) => [i, v]);
    body += plot([{ pts: r, color: C.violet, width: 1.2 }], { x0: 70, y0: 250, w: 510, h: 60, ymin: 0, ymax: 100, yticks: [30, 70], yfmt: (v) => fmt(v), hlines: [] }) + txt(70, 245, "RSI 14", { size: 11, color: C.dim });
  }
  body += txt(10, 16, `${COIN[coin]}, дневные закрытия, логарифмическая шкала: одинаковое расстояние — одинаковый процент.`, { size: 12 });
  return svg(600, H, body, `График ${COIN[coin]} с индикаторами`);
}

// Случайное блуждание против настоящей цены: «фигуры» видны и там, и там.
export function walkOrReal({ reveal = false, seed = 4 } = {}) {
  const r = rng(seed), n = 300, real = DATA.btc.c.slice(-n - 400, -400);
  const walks = [0, 1, 2].map(() => { const p = [100]; for (let i = 1; i < n; i++) p.push(p[i - 1] * Math.exp((r() - 0.5) * 0.065)); return p; });
  const panels = [walks[0], real, walks[1], walks[2]]; // настоящая — вторая
  let body = txt(10, 16, reveal ? "Настоящий BTC — второй график (жёлтый). Остальные три — подбрасывание монетки." : "Один из четырёх графиков — настоящий BTC за 300 дней, три — случайные. Какой?", { size: 12 });
  panels.forEach((p, k) => {
    const x0 = 10 + (k % 2) * 295, y0 = 30 + Math.floor(k / 2) * 110, lo = Math.min(...p), hi = Math.max(...p);
    const d = p.map((v, i) => `${i ? "L" : "M"}${(x0 + (i / (n - 1)) * 280).toFixed(1)} ${(y0 + 95 - ((v - lo) / (hi - lo)) * 90).toFixed(1)}`).join(" ");
    body += `<rect x="${x0}" y="${y0}" width="285" height="100" rx="6" fill="${C.card}" stroke="${reveal && k === 1 ? C.gold : C.line}"/>` + `<path d="${d}" fill="none" stroke="${reveal && k === 1 ? C.gold : C.blue}" stroke-width="1.5"/>` + txt(x0 + 8, y0 + 16, String(k + 1), { size: 12, color: C.dim });
  });
  return svg(600, 252, body, "Четыре графика: три случайных и один настоящий");
}

export default { candles, candleAnatomy, priceChart, walkOrReal };

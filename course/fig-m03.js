// Рисунки модуля 3 «Централизованные биржи».
import { C, svg, txt, box, arrow, line, plot, fmt, rng } from "./draw.js";
import { makeBook, marketOrder, leveredPath, liqPrice } from "../sim/market.js";

export const DEMO_BOOK = { mid: 100, spread: 0.02, tick: 0.01, levels: 8, size: 1, seed: 5 };

// Стакан: продавцы сверху (красные), покупатели снизу (зелёные). buy — объём рыночной покупки, съеденные уровни подсвечены.
export function orderBook({ buy = 0, book = DEMO_BOOK } = {}) {
  const b = makeBook(book), r = buy > 0 ? marketOrder(b, "buy", buy) : null;
  const maxQ = Math.max(...b.asks.map((x) => x[1]), ...b.bids.map((x) => x[1]));
  const rowH = 18, cx = 300, top = 34;
  let body = txt(10, 20, buy > 0 ? `Рыночная покупка ${fmt(buy, 1)} монеты: средняя цена ${fmt(r.avgPrice, 3)}, проскальзывание ${fmt(r.slipBps, 1)} б.п.` : "Стакан: заявки на продажу (выше) и на покупку (ниже). Между ними — спред.", { size: 12 });
  let left = buy;
  [...b.asks].reverse().forEach(([p, q], j) => {
    const i = b.asks.length - 1 - j, y = top + j * rowH;
    const eaten = Math.max(0, Math.min(q, left - b.asks.slice(0, i).reduce((s, a) => s + a[1], 0)));
    const w = (q / maxQ) * 220;
    body += `<rect x="${cx + 60}" y="${y}" width="${w}" height="${rowH - 3}" fill="${C.red}" opacity="0.35"/>`;
    if (eaten > 0) body += `<rect x="${cx + 60}" y="${y}" width="${(eaten / maxQ) * 220}" height="${rowH - 3}" fill="${C.gold}"/>`;
    body += txt(cx + 50, y + 12, fmt(p, 2), { size: 11, anchor: "end", color: C.red }) + txt(cx + 65 + w, y + 12, fmt(q, 2), { size: 10, color: C.dim });
  });
  const ym = top + b.asks.length * rowH + 2;
  body += line(cx - 200, ym + 6, cx + 290, ym + 6, { color: C.dim, dash: true }) + txt(cx - 205, ym + 10, "спред", { size: 11, color: C.dim, anchor: "end" });
  b.bids.forEach(([p, q], i) => {
    const y = ym + 14 + i * rowH, w = (q / maxQ) * 220;
    body += `<rect x="${cx + 60}" y="${y}" width="${w}" height="${rowH - 3}" fill="${C.green}" opacity="0.35"/>`;
    body += txt(cx + 50, y + 12, fmt(p, 2), { size: 11, anchor: "end", color: C.green }) + txt(cx + 65 + w, y + 12, fmt(q, 2), { size: 10, color: C.dim });
  });
  body += txt(20, top + 40, "Продают", { size: 13, color: C.red, weight: 600 }) + txt(20, top + 58, "лимитные заявки", { size: 11, color: C.dim }) + txt(20, top + 74, "ждут покупателя", { size: 11, color: C.dim });
  body += txt(20, ym + 60, "Покупают", { size: 13, color: C.green, weight: 600 }) + txt(20, ym + 78, "лимитные заявки", { size: 11, color: C.dim }) + txt(20, ym + 94, "ждут продавца", { size: 11, color: C.dim });
  if (r) body += txt(20, top + 110, `съедено уровней: ${r.levelsUsed}`, { size: 12, color: C.gold });
  const H = ym + 14 + b.bids.length * rowH + 10;
  return svg(600, H, body, "Стакан заявок с подсветкой исполненной рыночной заявки");
}

// Капитал идеи без преимущества: каждый круг теряет только комиссии.
function feeDrag() {
  const rows = [[0.002, "спот, тейкер 0,1 % × 2", C.red], [0.0011, "фьючерс, тейкер 0,055 % × 2", C.gold], [0.0004, "фьючерс, мейкер 0,02 % × 2", C.green]];
  const series = rows.map(([c, label, color]) => ({ label, color, pts: Array.from({ length: 51 }, (_, i) => [i * 10, 100 * Math.pow(1 - c, i * 10)]) }));
  const body = plot(series, { x0: 55, y0: 40, w: 520, h: 170, ymin: 0, ymax: 100, yfmt: (v) => "$" + fmt(v), xlab: "сколько кругов «купил — продал» (идея без преимущества)" }) +
    txt(10, 20, "$100 и 500 кругов: торговля ничего не угадывает, теряются только комиссии.", { size: 12 });
  return svg(600, 252, body, "Как комиссии съедают капитал при частой торговле");
}

// Бессрочный фьючерс и фандинг.
function perpFunding() {
  const body = box(10, 40, 280, 130, "Фьючерс дороже монеты", ["ставка фандинга > 0", "длинные (лонги) платят", "коротким (шортам)", "покупать фьючерс невыгодно → цена", "возвращается к цене монеты"], { color: C.green }) +
    box(310, 40, 280, 130, "Фьючерс дешевле монеты", ["ставка фандинга < 0", "короткие платят длинным", "", "продавать невыгодно → цена", "возвращается к цене монеты"], { color: C.red }) +
    txt(10, 22, "У бессрочного фьючерса нет даты окончания; к цене монеты его тянет фандинг.", { size: 12 }) +
    txt(10, 195, "Выплата обычно раз в 8 часов: сумма позиции × ставка. 0,01 % за 8 часов ≈ 11 % годовых.", { size: 12, color: C.dim });
  return svg(600, 210, body, "Как фандинг привязывает цену бессрочного фьючерса к цене монеты");
}

// Один и тот же путь цены — разные плечи. lev — плечо.
export function demoPath() {
  const r = rng(122), p = [100];
  for (let i = 1; i < 120; i++) p.push(p[i - 1] * (1 + (r() - 0.5) * 0.03 + (i > 30 && i < 45 ? -0.007 : 0.0012)));
  return p;
}
function leverPath({ lev = 2 } = {}) {
  const prices = demoPath(), res = leveredPath(prices, { lev });
  const pricePts = prices.map((v, i) => [i, (v / prices[0] - 1) * 100]);
  const eqPts = res.equity.map((v, i) => [i, Math.max(-100, v * 100)]);
  const marks = res.liqAt != null ? [{ x: res.liqAt, y: -100, color: C.red, label: "ликвидация: залог потерян" }] : [];
  const body = plot([{ pts: pricePts, color: C.dim, label: "цена, %" }, { pts: eqPts, color: lev >= 10 ? C.red : C.blue, label: `результат на залог при плече ${lev}x, %` }], { x0: 55, y0: 40, w: 520, h: 170, ymin: -100, ymax: Math.max(60, ...eqPts.map((p) => p[1])), xmin: 0, xmax: 119, yfmt: (v) => fmt(v) + " %", xlab: "дни", marks, hlines: [{ y: 0, color: C.line }] }) +
    txt(10, 20, `Плечо ${lev}x: цена ликвидации ${fmt(liqPrice({ entry: 100, lev }), 1)} при входе 100 (на ${fmt(100 / lev - 0.5, 1)} % ниже).`, { size: 12 });
  return svg(600, 252, body, `Позиция с плечом ${lev} на одном и том же пути цены`);
}

function marketsCompare() {
  const body = box(5, 10, 192, 190, "Спот", ["покупаете саму монету", "можно вывести в кошелёк", "плеча нет", "ликвидации нет"], { color: C.green }) +
    box(204, 10, 192, 190, "Срочный фьючерс", ["договор на цену", "с датой исполнения", "разница с монетой — базис;", "к дате он исчезает"], { color: C.gold }) +
    box(403, 10, 192, 190, "Бессрочный фьючерс", ["договор без даты", "к цене монеты тянет фандинг", "плечо и ликвидация", "монеты у вас нет"], { color: C.red });
  return svg(600, 210, body, "Спот, срочный и бессрочный фьючерсы");
}

export default { orderBook, feeDrag, perpFunding, leverPath, marketsCompare };

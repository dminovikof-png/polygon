// Рисунки модуля 4 «Децентрализованные биржи».
import { C, svg, txt, box, arrow, plot, fmt, para } from "./draw.js";
import { makePool, swap, curvePoints, impermanentLoss, sandwich, price } from "../sim/amm.js";

export const DEMO_POOL = { x: 100, y: 200000 }; // 100 ETH и 200 000 USDT, цена 2000

function poolScheme() {
  const body = box(10, 40, 160, 120, "Поставщики", ["вносят ETH и USDT", "поровну по стоимости", "получают долю пула"], { color: C.green }) + arrow(172, 100, 218, 100) +
    box(220, 30, 160, 140, "Пул", ["100 ETH", "200 000 USDT", "цена = USDT / ETH", "= 2000"], { color: C.violet }) +
    arrow(428, 85, 382, 85) + arrow(382, 120, 428, 120) +
    box(430, 40, 160, 120, "Трейдер", ["отдаёт USDT,", "забирает ETH", "платит 0,3 %", "→ поставщикам"], { color: C.blue }) +
    txt(10, 20, "Стакана и продавца нет: трейдер меняется с пулом, цену задаёт формула.", { size: 12 }) +
    txt(10, 195, "Поставщики зарабатывают комиссии и несут риск: пул отдаёт подорожавшую монету и набирает подешевевшую.", { size: 12, color: C.dim });
  return svg(600, 210, body, "Как устроен пул ликвидности");
}

// Кривая x·y=k и точка до и после обмена. buyY — сколько USDT потратить на ETH.
function ammCurve({ buyY = 0, pool = DEMO_POOL } = {}) {
  const p = makePool(pool.x, pool.y), s = swap(p, "Y", buyY);
  const pts = curvePoints(p, 80, 2.6).filter(([x]) => x >= p.x * 0.4 && x <= p.x * 2).map(([x, y]) => [x, y / 1000]);
  const marks = [{ x: p.x, y: p.y / 1000, color: C.green, label: `до: цена ${fmt(price(p))}`, dy: 22 }];
  if (buyY > 0) marks.push({ x: s.pool.x, y: s.pool.y / 1000, color: C.gold, label: `после: ${fmt(s.after)}`, dx: -8, dy: -10, anchor: "end" });
  const body = plot([{ pts, color: C.violet }], { x0: 70, y0: 56, w: 500, h: 156, xmin: p.x * 0.4, xmax: p.x * 2, ymin: (p.y * 0.4) / 1000, ymax: (p.y * 2.6) / 1000, yfmt: (v) => fmt(v) + " тыс.", xlab: "ETH в пуле", ylab: "USDT в пуле", marks }) +
    txt(10, 20, buyY > 0 ? `Купили на ${fmt(buyY)} USDT: получили ${fmt(s.out, 2)} ETH по ${fmt(s.avgPrice)} в среднем (хуже на ${fmt(s.impact * 100, 1)} %).` : "Произведение ETH × USDT в пуле постоянно: точка может двигаться только по кривой.", { size: 12 });
  return svg(600, 252, body, "Кривая постоянного произведения и обмен в пуле");
}

function ilCurve() {
  const pts = [];
  for (let i = 0; i <= 100; i++) { const r = Math.pow(10, -1 + (i / 100) * 2); pts.push([Math.log10(r), impermanentLoss(r) * 100]); }
  const ticks = [0.1, 0.25, 0.5, 1, 2, 4, 10];
  let body = plot([{ pts, color: C.red }], { x0: 60, y0: 40, w: 510, h: 160, xmin: -1, xmax: 1, ymin: -60, ymax: 0, yfmt: (v) => fmt(v) + " %", marks: [{ x: Math.log10(2), y: impermanentLoss(2) * 100, label: `×2: ${fmt(impermanentLoss(2) * 100, 1)} %` }, { x: Math.log10(4), y: impermanentLoss(4) * 100, label: "×4: −20 %" }] });
  for (const t of ticks) { const x = 60 + ((Math.log10(t) + 1) / 2) * 510; body += txt(x, 218, (t < 1 ? "÷" + fmt(1 / t) : "×" + fmt(t)), { size: 11, color: C.dim, anchor: "middle" }); }
  body += txt(315, 238, "во сколько раз изменилась цена одной монеты пула относительно другой", { size: 11, color: C.dim, anchor: "middle" });
  body += txt(10, 20, "Отставание доли в пуле от простого удержания тех же монет (без учёта комиссий).", { size: 12 });
  return svg(600, 250, body, "Кривая непостоянных потерь");
}

// Сэндвич по шагам. step 0..3
function sandwichAnim({ step = 0 } = {}) {
  const p = makePool(1000, 2000000), victim = 100000, front = 60000, s = sandwich(p, victim, front);
  const a = swap(p, "Y", front), v = swap(a.pool, "Y", victim);
  const caps = [
    `Вы отправили обмен: 100 000 USDT → ETH. Без помех получили бы ${fmt(s.clean, 2)} ETH. Заявка ждёт в общей очереди и видна всем.`,
    `Бот увидел её и поставил перед вами свою покупку на 60 000 USDT, заплатив больше за очередь. Цена в пуле выросла до ${fmt(a.after)}.`,
    `Ваш обмен исполнился по сдвинутой цене: ${fmt(s.attacked, 2)} ETH — на ${fmt(s.victimLoss * 100, 1)} % меньше. Цена выросла до ${fmt(v.after)}.`,
    `Бот сразу продал купленное и заработал ${fmt(s.attackerProfit)} USDT. Защита: малый допуск проскальзывания и частная отправка транзакций.`,
  ];
  const lane = (y, label, color, on) => `<rect x="20" y="${y}" width="560" height="34" rx="6" fill="${on ? C.card : C.bg}" stroke="${on ? color : C.line}" stroke-width="2"/>` + txt(36, y + 22, label, { size: 13, color: on ? C.text : C.dim });
  const body = para(10, 20, caps[step], { max: 92 }) +
    lane(60, "1. бот покупает ETH на 60 000 USDT", C.red, step >= 1) +
    lane(102, "2. ваш обмен 100 000 USDT → ETH", C.blue, step === 0 || step >= 2) +
    lane(144, "3. бот продаёт ETH обратно", C.red, step >= 3) +
    txt(20, 205, "порядок транзакций в блоке →", { size: 11, color: C.dim });
  return svg(600, 215, body, "Сэндвич-атака по шагам");
}

// Агрегатор: делит обмен между пулами.
function routeSplit() {
  const pools = [makePool(100, 200000), makePool(60, 120000), makePool(40, 80000)], amount = 40000;
  const one = swap(pools[0], "Y", amount).out;
  const tot = pools.reduce((a, p) => a + p.y, 0), split = pools.reduce((a, p) => a + swap(p, "Y", amount * (p.y / tot)).out, 0);
  const body = box(10, 40, 170, 120, "Обмен", ["40 000 USDT → ETH"], { color: C.blue }) +
    box(240, 15, 170, 50, "Пул A: 200 тыс. USDT", [], { color: C.violet, size: 12 }) + box(240, 75, 170, 50, "Пул B: 120 тыс.", [], { color: C.violet, size: 12 }) + box(240, 135, 170, 50, "Пул C: 80 тыс.", [], { color: C.violet, size: 12 }) +
    arrow(182, 100, 238, 40) + arrow(182, 100, 238, 100) + arrow(182, 100, 238, 160) +
    box(440, 40, 150, 120, "Итог", [`всё в A: ${fmt(one, 2)} ETH`, `поровну по размеру:`, `${fmt(split, 2)} ETH`, `+${fmt((split / one - 1) * 100, 1)} %`], { color: C.green }) +
    txt(10, 215, "Агрегатор ищет, как разделить обмен, чтобы каждая часть меньше двигала цену. Газ за каждый пул — отдельно.", { size: 12, color: C.dim });
  return svg(600, 228, body, "Агрегатор делит обмен между тремя пулами");
}

export default { poolScheme, ammCurve, ilCurve, sandwichAnim, routeSplit };

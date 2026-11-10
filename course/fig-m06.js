// Рисунки модуля 6 «Типы активов».
import { C, svg, txt, box, arrow, plot, fmt, yearTicks, para } from "./draw.js";
import { payoff, breakeven } from "../sim/option.js";
import { drawdowns } from "../sim/ruin.js";
import { DATA } from "./data.js";

// Выплата опциона при экспирации. По горизонтали — цена в день экспирации.
export function optionPayoff({ type = "call", side = "long", strike = 100, premium = 6, spot = 100 } = {}) {
  const o = { type, side, strike, premium };
  const lo = strike * 0.6, hi = strike * 1.4, pts = [];
  for (let i = 0; i <= 80; i++) { const S = lo + ((hi - lo) * i) / 80; pts.push([S, payoff(o, S)]); }
  const be = breakeven(o), name = `${side === "long" ? "купленный" : "проданный"} ${type === "call" ? "колл" : "пут"}`;
  const ys = pts.map((p) => p[1]), top = Math.max(...ys), bot = Math.min(...ys);
  const body = plot([{ pts, color: side === "long" ? C.green : C.red }], { x0: 60, y0: 40, w: 510, h: 160, ymin: Math.min(bot, -premium * 1.5), ymax: Math.max(top, premium * 1.5), yticks: [Math.min(bot, -premium * 1.5), 0, Math.max(top, premium * 1.5)], yfmt: (v) => fmt(v, 1), xlab: "цена монеты в день экспирации", hlines: [{ y: 0, color: C.dim }],
    marks: [{ x: be, y: 0, color: C.gold, label: `безубыточность ${fmt(be, 1)}`, dy: -10 }, { x: spot, y: payoff(o, spot), color: C.blue, label: "цена сейчас", dy: 18 }],
    xticks: [[strike * 0.7, fmt(strike * 0.7)], [strike, "страйк " + fmt(strike)], [strike * 1.3, fmt(strike * 1.3)]] }) +
    txt(10, 20, `${name}: страйк ${fmt(strike)}, премия ${fmt(premium, 1)}. ${side === "long" ? "Убыток не больше премии." : type === "call" ? "Прибыль не больше премии, убыток не ограничен." : "Прибыль не больше премии, убыток до страйка."}`, { size: 12 });
  return svg(600, 248, body, `Выплата: ${name}`);
}

// Цена — это ещё не всё: стоимость в обращении против полной стоимости (FDV) и график разблокировок.
function tokenSupply() {
  const months = 48, total = 1000, pts = [], unlock = [];
  for (let m = 0; m <= months; m++) {
    const circ = 150 + (m >= 12 ? Math.min(600, (m - 11) * 25) : 0) + Math.min(250, m * 5.2); // 15 % на старте, команде и фондам — после годовой паузы
    pts.push([m, circ]); unlock.push([m, total]);
  }
  const body = plot([{ pts, color: C.blue, label: "в обращении" }, { pts: unlock, color: C.dim, dash: true, label: "всего будет (FDV)" }], { x0: 60, y0: 40, w: 510, h: 150, ymin: 0, ymax: 1050, yfmt: (v) => fmt(v) + " млн", xlab: "месяцы после запуска", xticks: [[0, "0"], [12, "12"], [24, "24"], [36, "36"], [48, "48"]],
    marks: [{ x: 12, y: pts[12][1], color: C.gold, label: "конец паузы: команде и фондам начинают выдавать токены", dy: -14 }] }) +
    txt(10, 20, "Пример: на старте в обращении 15 % токенов. Когда выйдут все, для той же цены спрос должен вырасти в 6–7 раз.", { size: 12 });
  return svg(600, 238, body, "Токены в обращении и полное предложение");
}

// Худшие просадки монет на настоящей истории (дневные закрытия).
function coinDrawdowns() {
  const coins = [["BTC", DATA.btc, C.gold], ["ETH", DATA.eth, C.violet], ["SOL", DATA.sol, C.green], ["DOGE", DATA.doge, C.red]];
  let body = txt(10, 20, `Худшее падение от максимума до дна по дневным закрытиям, по ${DATA.asOf.split("-").reverse().join(".")}.`, { size: 12 });
  coins.forEach(([name, d, color], i) => {
    const w = drawdowns(d.c).worst, y = 44 + i * 44, len = Math.abs(w) * 440;
    body += txt(20, y + 18, name, { size: 14, weight: 600 }) + `<rect x="80" y="${y}" width="${len}" height="26" rx="4" fill="${color}" opacity="0.8"/>` + txt(88 + len, y + 18, `${fmt(w * 100)} %`, { size: 13 });
  });
  body += txt(10, 228, "Чтобы отыграть −90 %, нужен рост в 10 раз. Источник: публичные дневные свечи Binance.", { size: 12, color: C.dim });
  return svg(600, 240, body, "Худшие просадки BTC, ETH, SOL и DOGE");
}

// Токенизированный реальный актив: цепочка доверия.
function rwaChain() {
  const body = box(5, 40, 140, 110, "Актив", ["облигации, золото,", "акции, недвижимость"], { color: C.gold }) + arrow(147, 95, 163, 95) +
    box(165, 40, 140, 110, "Хранитель", ["держит актив", "в банке или хранилище"], { color: C.blue }) + arrow(307, 95, 323, 95) +
    box(325, 40, 130, 110, "Эмитент", ["выпускает токен", "и обещает выкуп"], { color: C.violet }) + arrow(457, 95, 473, 95) +
    box(475, 40, 120, 110, "Токен", ["у вас в", "кошельке"], { color: C.green }) +
    txt(10, 22, "Блокчейн хранит запись о токене, а не сам актив. Каждое звено — чьё-то обещание.", { size: 12 }) +
    para(10, 178, "Риски: банкротство эмитента или хранителя; выкуп только для крупных клиентов после проверки личности; заморозка токенов по решению суда; правила страны, где оформлен актив.", { size: 12, color: C.dim, max: 95 });
  return svg(600, 220, body, "Цепочка доверия токенизированного актива");
}

// Базис: срочный фьючерс дороже монеты, к экспирации разница исчезает.
function basisConverge() {
  const days = 90, spot = [], fut = [];
  for (let d = 0; d <= days; d++) { const s = 100 * (1 + 0.04 * Math.sin(d / 9) + d * 0.0006); spot.push([d, s]); fut.push([d, s * (1 + 0.025 * (1 - d / days))]); }
  const body = plot([{ pts: fut, color: C.gold, label: "срочный фьючерс" }, { pts: spot, color: C.blue, label: "монета (спот)" }], { x0: 60, y0: 40, w: 510, h: 150, yfmt: (v) => fmt(v, 1), xlab: "дни до экспирации →", xticks: [[0, "90"], [45, "45"], [90, "0"]] }) +
    txt(10, 20, "Базис 2,5 % за 90 дней ≈ 10 % годовых. Купив монету и продав фьючерс, его можно зафиксировать.", { size: 12 });
  return svg(600, 238, body, "Схождение цены срочного фьючерса с ценой монеты");
}

export default { optionPayoff, tokenSupply, coinDrawdowns, rwaChain, basisConverge };

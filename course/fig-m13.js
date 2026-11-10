// Рисунки модуля 13 «Будущее DeFi: экономика ИИ-агентов». Денег и настоящих адресов нет.
import { C, svg, txt, box, arrow, plot, fmt, para } from "./draw.js";
import { agentBudget, dutchAuction, solverCosts, auctionStats } from "../sim/agents.js";

const wrap = (s, n) => { const out = []; let cur = ""; for (const w of s.split(" ")) { if ((cur + " " + w).trim().length > n && cur) { out.push(cur); cur = w; } else cur = (cur + " " + w).trim(); } if (cur) out.push(cur); return out; };
const usd = (v) => "$" + fmt(v, v > 0 && v < 10 ? 2 : 0);
const pct = (v, d = 2) => fmt(v * 100, d) + " %";

// Из чего состоит агент, который платит сам.
function agentStack() {
  const rows = [["Человек", "владелец: задаёт цель, бюджет и отвечает за итог", C.gold], ["Правила", "лимиты, белый список, что требует подтверждения", C.blue], ["Агент", "языковая модель + инструменты: читает, решает, вызывает", C.violet], ["Кошелёк", "ключ подписи; лучше смарт-аккаунт с ограничениями", C.green], ["Сервисы", "данные, вычисления, другие агенты — за плату", C.line]];
  let body = txt(10, 20, "Агент с кошельком: каждое звено ниже получает только то, что разрешило звено выше.", { size: 12 });
  rows.forEach(([t, s, col], i) => {
    const y = 34 + i * 46;
    body += box(10, y, 130, 36, t, [], { size: 13, color: col }) + txt(152, y + 23, s, { size: 12, color: C.dim });
    if (i < rows.length - 1) body += arrow(75, y + 36, 75, y + 46);
  });
  body += para(10, 274, "Главная защита — не ум агента, а ограничения кошелька: их не отменит ни ошибка модели, ни спрятанное в тексте указание.", { size: 12, color: C.gold, max: 95 });
  return svg(600, 300, body, "Звенья агента с кошельком");
}

// Абстракция аккаунта: операция пользователя, сборщик, точка входа, смарт-аккаунт, оплата газа.
function aaFlow() {
  let body = txt(10, 20, "Смарт-аккаунт: кошелёк — это программа со своими правилами, а не один ключ.", { size: 12 });
  const b = [[6, "Агент", ["подписывает", "операцию"]], [127, "Сборщик", ["(bundler)", "собирает сделку"]], [248, "Точка входа", ["общий", "контракт сети"]], [369, "Смарт-аккаунт", ["проверяет", "правила"]], [490, "Сервис", ["получает", "оплату"]]];
  b.forEach(([x, t, l], i) => { body += box(x, 40, 104, 74, t, l, { size: 12, color: i === 3 ? C.green : C.line }); if (i < b.length - 1) body += arrow(x + 104, 77, x + 119, 77); });
  body += box(248, 140, 104, 56, "Спонсор газа", ["(paymaster)"], { size: 12, color: C.gold }) + arrow(300, 140, 300, 116, { dash: true });
  body += box(370, 140, 220, 104, "Правила аккаунта", ["ключ сессии: 1 день, $10", "не больше $2 за платёж", "только известные получатели", "крупное — подпись человека"], { size: 12, color: C.green }) + arrow(420, 140, 420, 116, { dash: true });
  body += para(10, 222, "Стандарты: ERC-4337 (смарт-аккаунты через общую точку входа) и EIP-7702 (обычный адрес временно получает код смарт-аккаунта).", { size: 11, color: C.dim, max: 58 });
  return svg(600, 262, body, "Схема абстракции аккаунта");
}

// Анимация: агент платит агенту по протоколу «402 — нужна оплата».
export function payFlow({ step = 0 } = {}) {
  const msgs = [
    [true, "1. Запрос: «дай курс BTC за час»"],
    [false, "2. Ответ 402: «нужна оплата: 0,001 USDC, сеть, адрес»"],
    [true, "3. Повтор запроса с подписанным платежом"],
    [false, "4. Проверка платежа и расчёт в сети"],
    [false, "5. Ответ 200: данные и квитанция"],
  ];
  let body = box(10, 30, 150, 60, "Агент-покупатель", ["бюджет и лимиты"], { size: 13, color: C.violet }) + box(440, 30, 150, 60, "Агент-продавец", ["сервис данных"], { size: 13, color: C.green });
  body += `<line x1="85" y1="90" x2="85" y2="300" stroke="${C.line}" stroke-dasharray="3 3"/><line x1="515" y1="90" x2="515" y2="300" stroke="${C.line}" stroke-dasharray="3 3"/>`;
  msgs.forEach(([right, t], i) => {
    if (i > step) return;
    const y = 112 + i * 42, col = i === step ? C.gold : C.dim;
    body += (right ? arrow(90, y, 508, y, { color: col }) : arrow(510, y, 92, y, { color: col })) + txt(300, y - 7, t, { size: 12, anchor: "middle", color: i === step ? C.text : C.dim });
  });
  return svg(600, 320, body, "Агент платит агенту: запрос, требование оплаты, платёж, ответ");
}

// Сколько стоит провести платёж в 1 цент: карта с фиксированной частью платы и перевод стейблкоина во втором уровне.
function feeCompare() {
  const rows = [["Карта: 2,9 % + $0,30 (типичный тариф в США)", 0.01 * 0.029 + 0.3, C.red], ["Стейблкоин во втором уровне: ≈ $0,001 газа", 0.001, C.green], ["Пачка из 100 платежей одной сделкой", 0.001 / 100 + 0.0000, C.blue]];
  let body = txt(10, 20, "Платёж в 1 цент: сколько уходит на проведение (порядок величин, логарифмическая шкала).", { size: 12 });
  const W = (v) => Math.max(4, ((Math.log10(v) + 6) / 6) * 330);
  rows.forEach(([t, v, col], i) => {
    const y = 40 + i * 52;
    body += txt(10, y + 14, t, { size: 12 }) + `<rect x="10" y="${y + 20}" width="${W(v).toFixed(1)}" height="16" rx="3" fill="${col}" opacity="0.85"/>` + txt(18 + W(v), y + 33, `${usd(v)} — ${fmt((v / 0.01) * 100, v / 0.01 < 1 ? 1 : 0)} % от суммы`, { size: 12 });
  });
  body += para(10, 206, "Карты не рассчитаны на платёж за каждый запрос: плата за проведение больше самой покупки. Поэтому платежи агентов идут в стейблкоинах — но газ и курс сети меняются, а ошибочный перевод не отменить.", { size: 12, color: C.dim, max: 95 });
  return svg(600, 250, body, "Стоимость проведения платежа в 1 цент");
}

// Бюджет агента за 30 дней: без лимитов и с лимитами.
export function limitsChart({ attackRate = 0.1, perTx = 2, daily = 10, allowlist = true, seed = 1 } = {}) {
  const b = agentBudget({ attackRate, perTx, daily, allowlist, seed });
  const body = plot([{ pts: b.free.path.map((v, i) => [i, v]), color: C.red, label: `без лимитов: осталось ${usd(b.free.final)}` }, { pts: b.limited.path.map((v, i) => [i, v]), color: C.green, label: `с лимитами: осталось ${usd(b.limited.final)}` }],
    { x0: 60, y0: 66, w: 520, h: 140, ymin: 0, ymax: 500, yfmt: (v) => "$" + fmt(v), xticks: [[0, "день 0"], [10, "10"], [20, "20"], [30, "30"]] }) +
    txt(10, 18, `Поддельных счетов за месяц: ${b.free.attacks}. Без лимитов украдено ${usd(b.free.stolen)}, с лимитами ${usd(b.limited.stolen)}.`, { size: 12, weight: 600 }) +
    txt(10, 36, `Честных задач оплачено: без лимитов ${b.free.paid} из ${b.total}, с лимитами ${b.limited.paid} (отказано из-за лимита: ${b.limited.refused}).`, { size: 12, color: C.dim });
  return svg(600, 236, body, "Баланс агента с лимитами и без");
}

// Голландский аукцион: предложение пользователю снижается, пока одному из решателей не станет выгодно.
export function auctionChart({ n = 5, seed = 3 } = {}) {
  const costs = solverCosts(n, seed), a = dutchAuction({ costs }), steps = 100, start = 1.01, floor = 0.97;
  const pts = []; for (let s = 0; s <= (a.filled ? a.step : steps); s++) pts.push([s, (start - ((start - floor) * s) / steps) * 100]);
  const hl = costs.map((c, i) => ({ y: (1 - c) * 100, color: i === a.winner ? C.green : C.dim, label: i === a.winner ? `лучший решатель: ${fmt((1 - c) * 100, 2)}` : "" }));
  const body = plot([{ pts, color: C.gold, label: "предложение пользователю, % рыночной цены" }], { x0: 60, y0: 60, w: 520, h: 150, ymin: 97, ymax: 101, xmin: 0, xmax: steps, hlines: hl, yfmt: (v) => fmt(v, 1), xticks: [[0, "старт"], [50, "время →"], [100, "предел"]] }) +
    txt(10, 18, `${n} ${n === 1 ? "решатель" : n < 5 ? "решателя" : "решателей"} (линии — сколько каждый может дать). Сделка ушла по ${fmt(a.price * 100, 2)} % рыночной цены.`, { size: 12, weight: 600 }) +
    txt(10, 36, "Пользователь подписал только «что» и нижнюю границу (97 %); «как» решают решатели, соревнуясь.", { size: 12, color: C.dim });
  return svg(600, 240, body, "Голландский аукцион намерения");
}

// Чем больше решателей, тем лучше цена: средняя по 200 розыгрышам против прямого обмена в пуле.
function auctionVsAmm() {
  const ns = [1, 2, 3, 5, 10, 20], st = ns.map((n) => auctionStats(n)), direct = st[0].direct;
  const Y = (v) => 210 - ((v - 0.994) / 0.0055) * 160;
  let body = txt(10, 18, "Средняя цена продажи (% рыночной) в зависимости от числа решателей. Учебная модель.", { size: 12 });
  body += `<line x1="60" y1="${Y(direct).toFixed(1)}" x2="590" y2="${Y(direct).toFixed(1)}" stroke="${C.red}" stroke-dasharray="4 3"/>` +
    `<line x1="10" y1="33" x2="30" y2="33" stroke="${C.red}" stroke-dasharray="4 3"/>` + txt(36, 37, `обмен прямо в пуле, без аукциона: ${fmt(direct * 100, 2)}`, { size: 11, color: C.red });
  st.forEach((s, i) => {
    const x = 80 + i * 84, low = s.avg < direct, y = Math.min(Y(s.avg), 204);
    body += `<rect x="${x}" y="${y.toFixed(1)}" width="44" height="${(210 - y).toFixed(1)}" fill="${low ? C.red : C.green}" opacity="0.8"/>` + txt(x + 22, low ? Y(direct) - 8 : y - 5, fmt(s.avg * 100, 2) + (low ? " ↓" : ""), { size: 11, anchor: "middle", color: low ? C.red : C.text }) + txt(x + 22, 226, `${ns[i]}`, { size: 12, anchor: "middle" });
  });
  body += txt(320, 244, "число решателей", { size: 11, color: C.dim, anchor: "middle" }) +
    para(10, 266, "Один решатель отдаёт ровно нижнюю границу (97 %) — хуже, чем прямой обмен в пуле. Выгода намерений — в конкуренции, а не в самой подписи.", { size: 12, color: C.gold, max: 95 });
  return svg(600, 290, body, "Цена при разном числе решателей");
}

// Кто отвечает, если агент потерял деньги.
function responsibility() {
  const rows = [["Модель ошиблась или выдумала адрес", "владелец: агент действовал от его имени"], ["Указание спрятано в чужом тексте", "владелец; доказать вину автора текста трудно"], ["Сервис не выдал оплаченное", "продавец, если найдётся; перевод не отменить"], ["Украли ключ", "владелец; биржа или банк деньги не вернут"], ["Ошибка в смарт-контракте", "часто никто: «код — это договор»"]];
  let body = txt(10, 20, "Агент — не лицо и не платит за ошибки. Отвечает тот, кто дал ему ключ.", { size: 12 });
  body += txt(10, 44, "Что случилось", { size: 12, color: C.dim, weight: 600 }) + txt(300, 44, "Кто обычно несёт убыток", { size: 12, color: C.dim, weight: 600 });
  rows.forEach(([a, b], i) => { const y = 54 + i * 38; body += `<rect x="6" y="${y}" width="588" height="32" rx="4" fill="${C.card}"/>` + txt(14, y + 21, a, { size: 12 }) + txt(300, y + 21, b, { size: 12, color: i === 4 ? C.red : C.text }); });
  body += para(10, 260, "Юридически это зависит от страны и пока почти не проверено судами. Практический вывод один: агенту — небольшой бюджет и права без вывода средств.", { size: 12, color: C.gold, max: 95 });
  return svg(600, 290, body, "Кто отвечает за убытки агента");
}

export default { agentStack, aaFlow, payFlow, feeCompare, limitsChart, auctionChart, auctionVsAmm, responsibility };

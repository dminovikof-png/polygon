// Рисунки модуля 12 «Алготрейдинг и ИИ-трейдинг».
import { C, svg, txt, box, arrow, plot, fmt, yearTicks, para } from "./draw.js";
import { walkForward, inSample } from "../sim/ml.js";
import { DATA } from "./data.js";

const X = (v) => (v > 1e6 ? "больше ×1 млн" : "×" + fmt(v, v < 10 ? 2 : 0));
const pct = (v) => fmt(v * 100, 1) + " %";

// Цикл бота и где он ломается.
function botLoop() {
  const steps = [["Данные", "пропуски, задержка, чужая биржа"], ["Сигнал", "ошибка в коде, заглядывание"], ["Заявка", "отказ биржи, лимиты запросов"], ["Исполнение", "проскальзывание, частичное"], ["Учёт", "комиссии, фандинг, остатки"]];
  let body = txt(10, 20, "Бот — это цикл. Правило занимает одно звено из пяти; остальные ломаются чаще.", { size: 12 });
  steps.forEach(([t, s], i) => {
    const x = 10 + i * 118;
    body += box(x, 40, 104, 46, t, [], { size: 13, color: i === 1 ? C.blue : C.line }) + para(x + 2, 106, s, { max: 17, size: 11, color: C.dim });
    if (i < steps.length - 1) body += arrow(x + 104, 63, x + 116, 63);
  });
  body += `<path d="M 540 86 C 540 170, 70 170, 60 92" fill="none" stroke="${C.dim}" stroke-dasharray="4 3" marker-end="url(#ar)"/>` + txt(300, 168, "и снова: каждую свечу, минуту или секунду", { size: 11, color: C.dim, anchor: "middle" }) +
    para(10, 196, "Перед деньгами бот работает на бумаге: так видны ошибки звеньев, которых нет в бэктесте.", { size: 12, color: C.gold, max: 95 });
  return svg(600, 215, body, "Цикл торгового бота");
}

// Скорость: кто успевает первым.
function latency() {
  const rows = [["Сервер у биржи (маркетмейкеры)", 0.3, C.green], ["Облачный сервер в том же регионе", 5, C.blue], ["Домашний интернет", 120, C.gold], ["Человек увидел и нажал", 1500, C.red]];
  let body = txt(10, 20, "Сколько миллисекунд проходит от события до заявки на бирже (порядок величин).", { size: 12 });
  rows.forEach(([name, ms, col], i) => {
    const y = 40 + i * 42, w = Math.max(3, (Math.log10(ms * 10) / Math.log10(15000)) * 330);
    body += txt(10, y + 18, name, { size: 12 }) + `<rect x="250" y="${y + 5}" width="${w.toFixed(1)}" height="20" rx="3" fill="${col}" opacity="0.8"/>` + txt(256 + w, y + 20, ms < 1 ? "меньше 1 мс" : fmt(ms) + " мс", { size: 12 });
  });
  body += para(10, 222, "На коротких движениях выигрывает тот, кто ближе к бирже. Частному боту остаются горизонты, где скорость не решает: часы и дни.", { size: 12, color: C.dim, max: 95 });
  return svg(600, 250, body, "Задержка от события до заявки");
}

// Проверка вперёд: окна обучения сдвигаются, прогноз — только на следующий отрезок.
function walkScheme() {
  let body = txt(10, 20, "Проверка вперёд: учимся на прошлом окне, прогнозируем следующий отрезок, сдвигаемся.", { size: 12 });
  for (let k = 0; k < 4; k++) {
    const y = 40 + k * 32, x = 60 + k * 70;
    body += txt(10, y + 15, `шаг ${k + 1}`, { size: 11, color: C.dim }) + `<rect x="${x}" y="${y}" width="280" height="20" rx="3" fill="${C.blue}" opacity="0.6"/>` + txt(x + 140, y + 14, "обучение", { size: 11, anchor: "middle" }) +
      `<rect x="${x + 284}" y="${y}" width="66" height="20" rx="3" fill="${C.green}" opacity="0.8"/>` + txt(x + 317, y + 14, "прогноз", { size: 11, anchor: "middle" });
  }
  body += txt(60, 184, "время →", { size: 11, color: C.dim }) +
    para(10, 206, "Так модель ни разу не видит день, который прогнозирует. Проверка «на тех же данных» или с перемешанными днями этого не гарантирует — и всегда выглядит лучше.", { size: 12, color: C.gold, max: 95 });
  return svg(600, 240, body, "Схема проверки вперёд");
}

// Кэш расчётов: модели считаются доли секунды, но рисунок перерисовывается при каждом изменении поля.
const cache = new Map();
function run(kind, opts) {
  const key = kind + JSON.stringify(opts);
  if (!cache.has(key)) { if (cache.size > 40) cache.clear(); cache.set(key, kind === "wf" ? walkForward(DATA[opts.coin].c, opts) : inSample(DATA[opts.coin].c, opts)); }
  return cache.get(key);
}

// Точность на обучении и при проверке вперёд для BTC, признаки — доходности за 5 дней.
// Числа посчитаны заранее (8 моделей считаются несколько секунд); test/sim2.test.js сверяет их с расчётом.
export const ML_SUMMARY = [
  ["k ближ. соседей, k=1", { model: "knn", k: 1 }, 1, 0.4903],
  ["k=5", { model: "knn", k: 5 }, 0.7018, 0.5025],
  ["k=25", { model: "knn", k: 25 }, 0.5957, 0.5116],
  ["логистическая", { model: "logit" }, 0.5256, 0.5142],
];
function mlInVsOut() {
  const coin = "btc", models = ML_SUMMARY;
  let body = txt(10, 18, `${coin.toUpperCase()}: доля угаданных направлений «завтра вверх или вниз», признаки — доходности за 5 дней.`, { size: 12 });
  const Y = (a) => 210 - ((a - 0.4) / 0.6) * 170;
  body += `<line x1="60" y1="${Y(0.5)}" x2="590" y2="${Y(0.5)}" stroke="${C.gold}" stroke-dasharray="4 3"/>`;
  for (const v of [0.4, 0.6, 0.8, 1]) body += txt(54, Y(v) + 4, fmt(v * 100) + " %", { size: 11, color: C.dim, anchor: "end" });
  models.forEach(([name, o], i) => {
    const [, , a, b] = models[i], x = 80 + i * 128;
    body += `<rect x="${x}" y="${Y(a).toFixed(1)}" width="40" height="${(210 - Y(a)).toFixed(1)}" fill="${C.violet}" opacity="0.8"/>` + txt(x + 20, Y(a) - 4, pct(a), { size: 11, anchor: "middle" }) +
      `<rect x="${x + 46}" y="${Y(b).toFixed(1)}" width="40" height="${(210 - Y(b)).toFixed(1)}" fill="${C.green}" opacity="0.8"/>` + txt(x + 66, Y(b) - 4, pct(b), { size: 11, anchor: "middle" }) +
      txt(x + 43, 226, name, { size: 11, anchor: "middle" });
  });
  body += `<rect x="80" y="236" width="10" height="10" fill="${C.violet}"/>` + txt(94, 245, "на тех же данных, где училась", { size: 11, color: C.dim }) +
    `<rect x="330" y="236" width="10" height="10" fill="${C.green}"/>` + txt(344, 245, "проверка вперёд", { size: 11, color: C.dim }) +
    `<line x1="470" y1="241" x2="490" y2="241" stroke="${C.gold}" stroke-dasharray="4 3"/>` + txt(496, 245, "50 % — монетка", { size: 11, color: C.gold });
  return svg(600, 256, body, "Точность модели на обучении и при проверке вперёд");
}

// Стратегия по модели (в рынке, если вероятность роста больше 50 %) против удержания, только проверка вперёд.
export function mlWalk({ coin = "btc", model = "logit", k = 15, lags = 5, train = 730 } = {}) {
  const d = DATA[coin], w = run("wf", { coin, model, k, lags, train }), ins = run("is", { coin, model, k, lags });
  const i0 = w.preds[0].i, t0 = d.t0 + i0 * 86400;
  const body = plot([{ pts: w.hold.map((v, i) => [i, v]), color: C.gold, label: `удержание ${X(w.hold.at(-1))}` }, { pts: w.eq.map((v, i) => [i, v]), color: C.green, label: `модель ${X(w.eq.at(-1))}` }],
    { x0: 60, y0: 62, w: 520, h: 150, log: true, yfmt: X, xticks: yearTicks(t0, w.eq.length) }) +
    txt(10, 18, `Проверка вперёд, ${w.n} дней: угадано ${pct(w.acc)} направлений; связь прогноза с завтрашней доходностью (IC) ${fmt(w.ic, 3)}.`, { size: 12, weight: 600 }) +
    txt(10, 36, `Дней роста было ${pct(w.upShare)}. На тех же данных, где модель училась: угадано ${pct(ins.acc)}, итог ${X(ins.eq.at(-1))}.`, { size: 12, color: C.dim });
  return svg(600, 245, body, "Модель на ценах: проверка вперёд");
}

// Языковые модели: где помогают, где нет.
function llmRoles() {
  const good = ["объяснить термин или чужой код", "написать и проверить расчёт", "найти ошибку заглядывания", "составить список проверок", "свести отчёт по журналу"];
  const bad = ["угадать завтрашнюю цену", "«найти прибыльную стратегию»", "решать за вас без проверки", "знать свежие новости и цены", "держать ключи от счёта"];
  let body = txt(10, 20, "Языковая модель — сильный помощник в работе и плохой источник прогнозов.", { size: 12 });
  body += box(10, 36, 285, 180, "Хорошо подходит", good, { color: C.green }) + box(305, 36, 285, 180, "Плохо подходит", bad, { color: C.red });
  return svg(600, 230, body, "Где языковые модели помогают в торговле, а где нет");
}

export default { botLoop, latency, walkScheme, mlInVsOut, mlWalk, llmRoles };

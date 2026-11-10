// Рисунки модуля 14 «Налоги и правила: обзор по странам». Данные таблицы — COUNTRIES (проверены 2026-11-09).
// Правила меняются часто: перед каждым выпуском таблица сверяется заново, у каждой строки — источник.
import { C, svg, txt, box, arrow, fmt, para } from "./draw.js";
import { realize, DEMO_TRADES } from "../sim/tax.js";

// gain — как облагается прибыль частного лица; swap — облагается ли обмен монеты на монету;
// lic — лицензируются ли биржи; lev — плечо и деривативы для частных лиц; carf — обмен данными (CARF или своё).
// tone: g — мягко для частного лица, y — обычный налог, r — высокий налог или запрет.
export const COUNTRIES = [
  { id: "za", name: "ЮАР", gain: ["капитал: до 18 %; торговля как дело: до 45 %", "y"], swap: ["да", "y"], lic: ["да, FSCA (CASP)", "g"], lev: ["да, у лицензированных", "y"], carf: ["сбор с 1.03.2026", "r"], src: "https://www.sars.gov.za/individuals/crypto-assets-tax/" },
  { id: "us", name: "США", gain: ["до года — как доход (до 37 %); дольше — 0/15/20 %", "y"], swap: ["да", "y"], lic: ["штаты и FinCEN; закон о рынке не принят", "y"], lev: ["да, на биржах под CFTC", "y"], carf: ["своя форма 1099-DA с 2025", "r"], src: "https://www.irs.gov/filing/digital-assets" },
  { id: "eu", name: "Евросоюз", gain: ["по стране: от 0 % до ~30 % и выше", "y"], swap: ["почти везде да", "y"], lic: ["MiCA, без переходного периода с 1.07.2026", "g"], lev: ["CFD — плечо до 2:1", "y"], carf: ["DAC8: сбор с 1.01.2026", "r"], src: "https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica" },
  { id: "uk", name: "Великобритания", gain: ["18 % / 24 %, без налога до £3 000 в год", "y"], swap: ["да", "y"], lic: ["регистрация FCA; полный режим с 25.10.2027", "y"], lev: ["запрещено частным лицам с 2021", "r"], carf: ["сбор с 1.01.2026", "r"], src: "https://www.gov.uk/government/publications/tax-on-cryptoassets" },
  { id: "ru", name: "Россия", gain: ["НДФЛ 13 % / 15 %", "y"], swap: ["по проекту — да", "y"], lic: ["реестр Банка России с 1.09.2026", "y"], lev: ["только квалифицированным", "r"], carf: ["не участвует", "g"], src: "https://www.cbr.ru/press/event/?id=32719" },
  { id: "ae", name: "ОАЭ", gain: ["налога на доход частных лиц нет", "g"], swap: ["нет", "g"], lic: ["да, VARA и другие", "g"], lev: ["по лицензии, с ограничениями", "y"], carf: ["сбор с 1.01.2027", "r"], src: "https://mof.gov.ae/wp-content/uploads/2026/10/CARF-Readiness-Circular.pdf" },
  { id: "sg", name: "Сингапур", gain: ["прирост капитала не облагается; торговля как дело — доход", "g"], swap: ["обычно нет", "g"], lic: ["да, MAS", "g"], lev: ["плечо частным клиентам запрещено", "r"], carf: ["сбор с 1.01.2027", "r"], src: "https://www.iras.gov.sg/taxes/international-tax/crypto-asset-reporting-framework-%28carf%29" },
  { id: "hk", name: "Гонконг", gain: ["прирост капитала не облагается; торговля как дело — налог на прибыль", "g"], swap: ["обычно нет", "g"], lic: ["да, SFC", "g"], lev: ["только профессиональным", "r"], carf: ["план: сбор с 1.01.2027", "r"], src: "https://www.ird.gov.hk/eng/tax/dta_carf.htm" },
  { id: "jp", name: "Япония", gain: ["прочий доход: до ~55 %; закон о 20 % принят, дата не назначена", "r"], swap: ["да", "y"], lic: ["да, FSA", "g"], lev: ["до 2× для частных лиц", "y"], carf: ["сбор с 1.01.2026", "r"], src: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1524.htm" },
  { id: "ch", name: "Швейцария", gain: ["частный прирост капитала не облагается; есть налог на имущество", "g"], swap: ["нет (для частного лица)", "g"], lic: ["да, FINMA", "g"], lev: ["через лицензированных", "y"], carf: ["закон есть, обмен не раньше 2027", "y"], src: "https://www.sif.admin.ch/dam/en/sd-web/3DLzoBB6uMYz/CARF%20FAQ%20Update%20EN.pdf" },
];
export const COLUMNS = { gain: "Налог на прибыль частного лица", swap: "Облагается ли обмен монеты на монету", lic: "Лицензируются ли биржи", lev: "Плечо и деривативы для частных лиц", carf: "Обмен налоговыми данными (CARF)" };
const TONE = { g: C.green, y: C.gold, r: C.red };

// Сравнительная таблица по одному столбцу (кадр анимации) — по строке на страну, чтобы читалось на телефоне.
export function countryTable({ col = "gain" } = {}) {
  let body = txt(10, 22, COLUMNS[col], { size: 15, weight: 600 }) + txt(590, 22, "проверено 9.11.2026", { size: 11, color: C.dim, anchor: "end" });
  COUNTRIES.forEach((c, i) => {
    const y = 36 + i * 34, [v, t] = c[col];
    body += `<rect x="6" y="${y}" width="588" height="29" rx="4" fill="${C.card}"/><rect x="6" y="${y}" width="6" height="29" rx="2" fill="${TONE[t]}"/>` +
      txt(20, y + 20, c.name, { size: 13, weight: 600 }) + txt(150, y + 20, v, { size: Math.min(13, 436 / (v.length * 0.56)) });
  });
  body += para(10, 390, "Зелёный — мягче для частного лица, жёлтый — обычный налог или условия, красный — высокий налог, запрет или обмен данными.", { size: 11, color: C.dim, max: 100, lh: 15 });
  return svg(600, 414, body, "Сравнение стран: " + COLUMNS[col]);
}

// Карточка одной страны: все пять вопросов таблицы.
export function countryCard({ id = "za" } = {}) {
  const c = COUNTRIES.find((x) => x.id === id) || COUNTRIES[0];
  let body = txt(10, 24, c.name, { size: 17, weight: 600 }) + txt(590, 24, "проверено 9.11.2026", { size: 11, color: C.dim, anchor: "end" });
  Object.entries(COLUMNS).forEach(([k, title], i) => {
    const y = 40 + i * 50, [v, t] = c[k];
    body += `<rect x="6" y="${y}" width="588" height="44" rx="4" fill="${C.card}"/><rect x="6" y="${y}" width="6" height="44" rx="2" fill="${TONE[t]}"/>` +
      txt(20, y + 17, title, { size: 11, color: C.dim }) + txt(20, y + 35, v, { size: 14 });
  });
  return svg(600, 296, body, `${c.name}: краткая сводка правил`);
}

// Что считается налоговым событием, а что нет (в большинстве стран, где прирост облагается).
function taxEvents() {
  const yes = ["продали монету за деньги", "обменяли монету на монету", "заплатили монетой за товар", "награда стейкинга (часто — как доход)"];
  const no = ["купили монету за деньги", "перевели между своими кошельками", "просто держите (бывает налог на имущество)", "монета в подарок (зависит от страны)"];
  let body = txt(10, 20, "Где прирост облагается, налог обычно возникает при «отчуждении» — когда монета ушла от вас.", { size: 12 });
  body += box(10, 36, 285, 170, "Обычно налоговое событие", yes, { color: C.red }) + box(305, 36, 285, 170, "Обычно не событие", no, { color: C.green });
  body += para(10, 228, "Монета на монету — частая ловушка: денег не было, а налог есть, потому что первая монета «продана» по рыночной цене.", { size: 12, color: C.gold, max: 95 });
  return svg(600, 252, body, "Что считается налоговым событием");
}

// Капитал или доход: одна и та же прибыль облагается по-разному.
function capitalVsIncome() {
  let body = txt(10, 20, "Одна и та же прибыль 100 000 — по-разному в зависимости от того, как её видит налоговая.", { size: 12 });
  body += box(10, 36, 285, 150, "Прирост капитала", ["держал, продал время от времени", "часто льготная ставка", "иногда льгота за долгое владение", "пример ЮАР: в базу идёт 40 % прироста"], { color: C.green });
  body += box(305, 36, 285, 150, "Доход (торговля как дело)", ["частые сделки, расчёт на прибыль", "ставка как на зарплату", "можно учесть расходы", "пример ЮАР: вся сумма, до 45 %"], { color: C.red });
  body += para(10, 206, "Граница между ними определяется по фактам: частота сделок, намерение, срок владения, доля в доходах. Боту с сотнями сделок в месяц льгота для «инвестора» обычно не достаётся.", { size: 12, color: C.dim, max: 95 });
  return svg(600, 246, body, "Прирост капитала и доход");
}

// Способы учёта: какая цена покупки списывается при продаже.
export function costMethods({ method = "fifo" } = {}) {
  const r = realize(DEMO_TRADES, method), buys = DEMO_TRADES.filter((t) => t.side === "buy"), sell = DEMO_TRADES.at(-1);
  const name = { fifo: "FIFO — первыми продаются ранние покупки", lifo: "LIFO — первыми продаются поздние покупки", avg: "средняя цена (общий пул)" }[method];
  let body = txt(10, 18, "Купили 3 BTC по 20 000, 60 000 и 30 000, продали 1,5 BTC по 70 000.", { size: 12 }) + txt(10, 36, `Способ: ${name}.`, { size: 12, weight: 600 });
  const used = method === "fifo" ? [1, 0.5, 0] : method === "lifo" ? [0, 0.5, 1] : [0.5, 0.5, 0.5];
  buys.forEach((b, i) => {
    const x = 10 + i * 150;
    body += `<rect x="${x}" y="54" width="130" height="60" rx="6" fill="${C.card}" stroke="${C.line}"/><rect x="${x}" y="54" width="${130 * used[i]}" height="60" rx="6" fill="${C.gold}" opacity="0.35"/>` +
      txt(x + 65, 78, `покупка ${fmt(b.price)}`, { size: 12, anchor: "middle", weight: 600 }) + txt(x + 65, 98, used[i] ? `продано ${fmt(used[i], 1)} BTC` : "осталось", { size: 11, anchor: "middle", color: C.dim });
  });
  body += box(460, 54, 130, 60, `продажа ${fmt(sell.price)}`, ["1,5 BTC"], { size: 12, color: C.blue });
  body += txt(10, 146, `Выручка ${fmt(r.sales[0].proceeds)} − цена покупки ${fmt(r.sales[0].cost)} = прибыль к налогу ${fmt(r.gain)}`, { size: 14, weight: 600 });
  const all = ["fifo", "lifo", "avg"].map((m) => [m, realize(DEMO_TRADES, m).gain]);
  body += txt(10, 172, "Тот же набор сделок: " + all.map(([m, g]) => `${m === "avg" ? "средняя" : m.toUpperCase()} — ${fmt(g)}`).join(", ") + ".", { size: 12, color: C.dim });
  body += para(10, 198, "Способ задаёт закон страны, а не удобство. Сменить его задним числом, чтобы показать меньше прибыли, обычно нельзя.", { size: 12, color: C.gold, max: 95 });
  return svg(600, 222, body, "Способы учёта цены покупки");
}

// Когда страны начинают собирать и передавать данные по CARF.
function carfTimeline() {
  const ys = [2026, 2027, 2028], X = (y) => 80 + (y - 2026) * 220;
  const rows = [["ЕС, Великобритания, ЮАР, Япония", 2026, C.red], ["ОАЭ, Сингапур, Швейцария (не раньше)", 2027, C.gold], ["Гонконг", 2027, C.gold], ["США — своя форма 1099-DA", 2025, C.blue], ["Россия — не участвует", null, C.dim]];
  let body = txt(10, 20, "CARF: биржа передаёт данные клиентов налоговой, а та — стране их резидентства.", { size: 12 });
  ys.forEach((y) => { body += `<line x1="${X(y)}" y1="40" x2="${X(y)}" y2="226" stroke="${C.line}" stroke-dasharray="3 3"/>` + txt(X(y), 240, y, { size: 12, anchor: "middle", color: C.dim }); });
  rows.forEach(([t, y, col], i) => {
    const yy = 52 + i * 36;
    if (y) { const x1 = Math.max(X(y), 70); body += `<rect x="${x1}" y="${yy}" width="${590 - x1}" height="22" rx="4" fill="${col}" opacity="0.3"/>` + `<circle cx="${x1}" cy="${yy + 11}" r="5" fill="${col}"/>`; }
    body += txt(y ? Math.max(X(y), 70) + 10 : 80, yy + 16, t, { size: 12 });
  });
  body += para(10, 262, "Первый год сбора — это сделки этого года; передача — на следующий. Сделки 2026 года на биржах ЕС, Великобритании и ЮАР налоговая увидит уже в 2027.", { size: 12, color: C.gold, max: 95 });
  return svg(600, 290, body, "Сроки начала CARF по странам");
}

// Где живёт налог: важна страна налогового резидентства, а не страна биржи.
function residence() {
  let body = txt(10, 20, "Налог платится там, где вы налоговый резидент, — а не там, где зарегистрирована биржа.", { size: 12 });
  body += box(10, 40, 170, 70, "Вы", ["резидент ЮАР"], { color: C.gold }) + box(215, 40, 170, 70, "Биржа", ["зарегистрирована", "на Сейшелах"]) + box(420, 40, 170, 70, "Налоговая", ["ЮАР (SARS)"], { color: C.red });
  body += arrow(180, 75, 213, 75) + arrow(385, 75, 418, 75, { dash: true }) + txt(402, 128, "данные по CARF", { size: 11, color: C.dim, anchor: "middle" });
  body += para(10, 156, "Резидентство определяется по правилам страны: дни пребывания, постоянный дом, центр интересов. При переезде бывает «налог на выезд» — с прироста, накопленного до отъезда.", { size: 12, color: C.dim, max: 95 });
  return svg(600, 200, body, "Налоговое резидентство и страна биржи");
}

export default { countryTable, countryCard, taxEvents, capitalVsIncome, costMethods, carfTimeline, residence };

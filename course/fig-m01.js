// Рисунки модуля 1 «Блокчейн и монеты».
import { C, svg, txt, box, arrow, line, plot, fmt } from "./draw.js";
import { buildChain, checkChain, mine } from "../sim/block.js";

const DATAS = ["Алиса → Боб: 2", "Боб → Вера: 1", "Вера → Глеб: 0,5"];
const ZEROS = 2;
let chainCache = null;
const baseChain = () => (chainCache ||= buildChain(DATAS, ZEROS));

// Три блока, связанные хешами. tamper — номер блока, в котором подменили данные; fix — перемайнить его заново.
function chainBlocks({ tamper = null, fix = false } = {}) {
  const chain = baseChain().map((b) => ({ ...b }));
  if (tamper != null) {
    chain[tamper].data = chain[tamper].data.replace(/: .*/, ": 200");
    if (fix) { const r = mine(chain[tamper], ZEROS); chain[tamper].nonce = r.nonce; chain[tamper].hash = r.hash; }
  }
  const st = checkChain(chain, ZEROS);
  const color = { ok: C.green, hash: C.red, link: C.gold };
  const word = { ok: "в порядке", hash: "хеш не сходится", link: "ссылка на старый хеш" };
  let body = "";
  chain.forEach((b, i) => {
    const x = 12 + i * 200;
    body += `<rect x="${x}" y="30" width="180" height="170" rx="8" fill="${C.card}" stroke="${color[st[i]]}" stroke-width="2"/>`;
    body += txt(x + 10, 52, `Блок ${b.index + 1}`, { size: 14, weight: 600 });
    body += txt(x + 10, 76, `пред.: ${b.prev.slice(0, 10)}…`, { size: 11, color: C.dim });
    body += txt(x + 10, 98, b.data, { size: 12 });
    body += txt(x + 10, 120, `nonce: ${b.nonce}`, { size: 11, color: C.dim });
    body += txt(x + 10, 144, `хеш: ${b.hash.slice(0, 10)}…`, { size: 11, color: st[i] === "ok" ? C.text : C.red });
    body += txt(x + 10, 186, word[st[i]], { size: 12, color: color[st[i]], weight: 600 });
    if (i) body += arrow(x - 18, 76, x - 2, 76, { color: C.dim });
  });
  body += txt(12, 20, `Каждый блок хранит хеш предыдущего. Хеш должен начинаться с ${ZEROS} нулей.`, { size: 12, color: C.dim });
  return svg(612, 220, body, "Три блока цепочки, связанные хешами");
}

// Два способа решить, кто добавит следующий блок.
function consensus() {
  const body = box(10, 10, 285, 200, "Доказательство работы (PoW)", ["майнеры перебирают nonce", "шанс ∝ вычислительной мощности", "атака: больше половины мощности", "плата: электричество и железо", "Bitcoin"], { color: C.gold }) +
    box(305, 10, 285, 200, "Доказательство доли (PoS)", ["валидаторы вносят залог монетами", "шанс ∝ размеру залога", "атака: больше трети или половины залога", "плата: залог можно отнять (слэшинг)", "Ethereum с 2022 года"], { color: C.violet });
  return svg(600, 220, body, "Сравнение доказательства работы и доказательства доли");
}

// Сколько биткоинов выпущено к блоку: награда 50 и делится пополам каждые 210 000 блоков.
export function btcSupplyAt(height) {
  let s = 0, reward = 50, h = height;
  while (h > 0 && reward >= 1e-8) { const n = Math.min(h, 210000); s += n * reward; h -= n; reward /= 2; }
  return s;
}
function btcSupply({ now = 960000 } = {}) {
  const pts = [];
  for (let h = 0; h <= 2100000; h += 21000) pts.push([h / 1000, btcSupplyAt(h) / 1e6]);
  const years = ["2009", "2012", "2016", "2020", "2024", "~2028", "~2032"];
  let body = plot([{ pts }], { x0: 60, y0: 40, w: 510, h: 170, ymin: 0, ymax: 21, yfmt: (v) => fmt(v) + " млн", xlab: "номер блока, тысяч (новый блок — примерно раз в 10 минут)", marks: [{ x: now / 1000, y: btcSupplyAt(now) / 1e6, label: `ноябрь 2026: ≈ ${fmt(btcSupplyAt(now) / 1e6, 2)} млн` }] });
  years.forEach((y, i) => { const x = 60 + (i * 210 / 2100) * 510; body += line(x, 210, x, 215, { color: C.dim }) + txt(x, 228, y, { size: 10, color: C.dim, anchor: "middle" }); });
  body += txt(60, 22, "Выпуск биткоина: награда за блок 50 → 25 → 12,5 → 6,25 → 3,125 (с апреля 2024) …", { size: 12 });
  return svg(600, 262, body, "Кривая выпуска биткоина, предел 21 миллион");
}

// Смарт-контракт как автомат: правило записано кодом, исполняет сеть.
function contractFlow() {
  const body = box(10, 60, 150, 90, "Вы", ["подписали", "транзакцию"], { color: C.blue }) + arrow(162, 105, 218, 105) +
    box(220, 30, 200, 150, "Смарт-контракт", ["если пришло 1 ETH —", "выдать 2000 токенов", "иначе — отказ", "код виден всем,", "менять его нельзя*"], { color: C.violet }) + arrow(422, 105, 478, 105) +
    box(480, 60, 110, 90, "Состояние", ["балансы", "обновлены"], { color: C.green }) +
    txt(10, 205, "* если контракт не сделан обновляемым — тогда менять его может владелец ключа администратора.", { size: 11, color: C.dim }) +
    txt(10, 20, "Исполняют тысячи узлов сети одинаково; ошибка в коде исполнится так же точно, как правильный код.", { size: 12, color: C.dim });
  return svg(600, 220, body, "Схема работы смарт-контракта");
}

// Три вида стейблкоинов.
function stableTypes() {
  const body = box(5, 10, 192, 200, "Обеспечен деньгами", ["USDT, USDC", "в банке и в облигациях", "лежит $1 на каждую монету", "риск: эмитент, банк,", "заморозка по требованию"], { color: C.green }) +
    box(204, 10, 192, 200, "Обеспечен криптой", ["DAI (USDS)", "залог с запасом 150 %+", "в смарт-контракте", "риск: обвал залога,", "ошибка в коде"], { color: C.gold }) +
    box(403, 10, 192, 200, "Алгоритмический", ["UST (Terra), 2022", "обеспечен «своим» токеном", "и обещанием обмена", "риск: спираль продаж —", "UST упал почти до нуля"], { color: C.red });
  return svg(600, 220, body, "Три вида стейблкоинов и их риски");
}

// Второй уровень (L2): много переводов → одна пачка в основной сети. step 0..3
function rollup({ step = 0 } = {}) {
  let body = txt(10, 20, ["Каждый перевод отдельно платит газ основной сети.", "Переводы отправляются во второй уровень (L2).", "L2 собирает их в одну пачку и записывает в основную сеть.", "Газ основной сети делится на всех: каждый платит в разы меньше."][step], { size: 13 });
  for (let i = 0; i < 8; i++) {
    const x = 20 + (i % 4) * 46, y = 50 + Math.floor(i / 4) * 40;
    body += `<rect x="${x}" y="${y}" width="38" height="28" rx="5" fill="${C.card}" stroke="${C.blue}"/>` + txt(x + 19, y + 18, "tx", { size: 11, anchor: "middle" });
    if (step === 0) body += arrow(x + 19, y + 30, x + 19 + (300 - x) * 0.0, 196, { color: C.red, width: 1 });
  }
  if (step >= 1) body += arrow(205, 85, 265, 85) + box(270, 50, 150, 70, "L2 (роллап)", step >= 2 ? ["8 переводов →", "1 пачка"] : ["собирает", "переводы"], { color: C.violet });
  if (step >= 2) body += arrow(345, 122, 345, 190, { color: C.violet });
  body += `<rect x="10" y="198" width="580" height="44" rx="8" fill="${C.card}" stroke="${C.gold}" stroke-width="2"/>` + txt(300, 225, step === 0 ? "Основная сеть (L1): 8 записей, 8 оплат газа" : step === 1 ? "Основная сеть (L1)" : "Основная сеть (L1): 1 запись на всех", { size: 13, anchor: "middle" });
  if (step === 3) body += box(440, 50, 150, 70, "Каждый платит", ["≈ 1/8 газа L1", "+ плата L2"], { color: C.green });
  return svg(600, 252, body, "Как второй уровень объединяет переводы в пачку");
}

// Газ: сколько работы × цена работы.
function gasFee() {
  const body = box(10, 40, 160, 90, "Газ", ["сколько работы:", "перевод 21 000", "обмен ~150 000"], { color: C.blue }) + txt(185, 92, "×", { size: 26, anchor: "middle" }) +
    box(200, 40, 200, 90, "Цена газа", ["базовая (сжигается)", "+ чаевые валидатору", "растёт при очереди"], { color: C.gold }) + txt(415, 92, "=", { size: 26, anchor: "middle" }) +
    box(430, 40, 160, 90, "Плата", ["в ETH, не зависит", "от суммы перевода"], { color: C.green }) +
    txt(10, 22, "Перевод на $10 и на $10 млн стоит одинаково: платят за вычисления, а не за сумму.", { size: 12 }) +
    txt(10, 160, "Когда сеть загружена, базовая цена растёт с каждым полным блоком, пока очередь не рассосётся.", { size: 12, color: C.dim });
  return svg(600, 175, body, "Формула платы за газ");
}

export default { chainBlocks, consensus, btcSupply, contractFlow, stableTypes, rollup, gasFee };

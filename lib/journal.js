// Журнал попыток: каждая проверка записывается; от числа УНИКАЛЬНЫХ попыток зависит планка значимости.
// Попытка — это настройка: биржа, монета, свеча, идея с параметрами, направление, плечо, издержки, эталон,
// доходность кэша, запрошенная длина истории, валюта отчёта и доля капитала в позиции. Повтор той же настройки (в том числе на день позже, когда
// добавилась новая свеча) — не новая гипотеза, планку он не поднимает. Записи при этом не удаляются:
// журнал хранит всё, схлопывание делается при чтении, поэтому старые журналы читаются как есть.
import { store } from "./store.js";

const KEY = "journal.json";

export function readJournal() {
  const j = store().get(KEY);
  return Array.isArray(j) ? j : [];
}

// JSON с отсортированными ключами: одинаковые параметры в разном порядке дают один ключ.
function stable(v) {
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  if (v && typeof v === "object") return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + stable(v[k])).join(",") + "}";
  return JSON.stringify(v ?? null);
}

// Поля, которых нет в старых записях, подставляются значениями по умолчанию того времени.
// Настройки, которые на результат не влияют, обнуляются: плата за удержание — без плеча у покупки,
// доходность кэша — если она не начисляется стратегии и эталон не «кэш».
export function attemptKey(e) {
  const num = (x, d) => (x === undefined || x === null ? d : Number(x));
  const side = e.side || "long", leverage = num(e.leverage, 1), benchmark = e.benchmark || "coin", cashFlat = !!e.cashFlat;
  return stable({
    exchange: e.exchange || "bybit", symbol: e.symbol, tf: e.tf, strategy: e.strategy, params: e.params ?? {},
    side, leverage, carryPct: side === "short" || leverage > 1 ? num(e.carryPct, 0) : 0,
    fundingHistory: (side === "short" || leverage > 1) && !!e.fundingHistory,
    feePct: num(e.feePct, 0.1), slipPct: num(e.slipPct, 0.05),
    benchmark, cashFlat, cashYieldPct: benchmark === "cash" || cashFlat ? num(e.cashYieldPct, 0) : 0,
    maxBars: num(e.maxBars, 5000), reportCcy: e.reportCcy || "USDT", positionPct: num(e.positionPct, 100),
  });
}

// Каждой записи — номер первой записи с той же настройкой (null, если запись первая такая).
export function markRepeats(all) {
  const first = new Map();
  return all.map((e, i) => {
    const k = attemptKey(e);
    if (first.has(k)) return { ...e, key: k, repeatOf: first.get(k) + 1 };
    first.set(k, i);
    return { ...e, key: k, repeatOf: null };
  });
}

export const uniqueAttempts = (all = readJournal()) => new Set(all.map(attemptKey)).size;

// Сколько уникальных попыток будет, если добавить entry (для планки текущей проверки).
export function attemptsWith(entry, all = readJournal()) {
  const keys = new Set(all.map(attemptKey));
  for (const e of Array.isArray(entry) ? entry : [entry]) keys.add(attemptKey(e));
  return keys.size;
}

// Пакетная запись (скан): каждая комбинация — своя попытка; файл пишется один раз.
export function addAttempts(entries) {
  const all = readJournal(), time = new Date().toISOString();
  for (const e of entries) all.push({ time, ...e });
  store().set(KEY, all, { pretty: true });
  return uniqueAttempts(all);
}

// Слияние журналов двух устройств: записи объединяются, одинаковые (то же время и та же настройка) не задваиваются.
// Планка после слияния считает попытки со всех устройств — иначе 100 попыток на телефоне и 100 на компьютере
// выглядели бы как две отдельные сотни.
export function mergeJournals(a = [], b = []) {
  const seen = new Set(), out = [];
  for (const e of [...a, ...b]) {
    if (!e || typeof e !== "object" || !e.symbol) continue;
    const k = `${e.time || ""}|${attemptKey(e)}`;
    if (!seen.has(k)) { seen.add(k); out.push(e); }
  }
  return out.sort((x, y) => String(x.time || "").localeCompare(String(y.time || "")));
}

export function addAttempt(entry) {
  const all = readJournal();
  all.push({ time: new Date().toISOString(), ...entry });
  store().set(KEY, all, { pretty: true });
  return uniqueAttempts(all);
}

// Движок правил: стратегия описывается данными (JSON), а не кодом. В правилах можно использовать
// несколько индикаторов одновременно и объединять условия по «все сразу» (AND) или «любое из» (OR).
//
// spec = {
//   indicators: [{ name: "fast", id: "ema", params: { period: 50 } }, ...],
//   entry: { match: "all" | "any", conditions: [{ left, op, right }, ...] },   // условия входа
//   exit:  { match: "all" | "any", conditions: [...] },                        // условия выхода (можно пусто)
//   maxBars: 0,        // выйти через столько свечей после входа (0 — не использовать)
//   stopAtr: 0,        // стоп-лосс: на столько ATR ниже цены входа (0 — нет)
//   takeAtr: 0,        // тейк-профит: на столько ATR выше цены входа
//   trailAtr: 0,       // скользящий стоп: на столько ATR ниже максимума после входа
//   atrPeriod: 14,     // период ATR для стопов
//   side: "long" | "short"  // направление: покупка или шорт. Для шорта «вход» = открыть шорт, «выход» = закрыть,
//                           // стоп — выше цены входа, цель — ниже, скользящий стоп — выше минимума после входа
// }
// Операнд: число, поле цены (close, open, high, low, volume), имя индикатора (если у него один выход)
// или «имя.выход» (например macd.signal). Операции: > < >= <= == crossesAbove crossesBelow.

import { INDICATORS, PRICE_FIELDS, resolveParams, atr as atrCalc } from "./indicators.js";

export const OPS = { ">": "больше", "<": "меньше", ">=": "не меньше", "<=": "не больше", "==": "равно", crossesAbove: "пересекает снизу вверх", crossesBelow: "пересекает сверху вниз" };
const NAME_RE = /^[a-z][a-z0-9_]{0,15}$/;
const MAX_IND = 10, MAX_COND = 8;

const fail = (m) => { throw new Error(m); };

export function validateSpec(spec) {
  if (!spec || typeof spec !== "object") fail("Не задана стратегия");
  const inds = Array.isArray(spec.indicators) ? spec.indicators : [];
  if (inds.length > MAX_IND) fail(`Индикаторов не больше ${MAX_IND}`);
  const names = new Set();
  const clean = { indicators: [], entry: null, exit: null };
  for (const it of inds) {
    if (!NAME_RE.test(it?.name || "")) fail("Имя индикатора: латинские буквы, цифры и _, начинается с буквы");
    if (PRICE_FIELDS[it.name]) fail(`Имя «${it.name}» занято полем цены`);
    if (names.has(it.name)) fail(`Имя «${it.name}» повторяется`);
    names.add(it.name);
    const def = INDICATORS[it.id];
    if (!def) fail("Неизвестный индикатор: " + it.id);
    clean.indicators.push({ name: it.name, id: it.id, params: resolveParams(def, it.params || {}) });
  }
  const operandOk = (o) => {
    if (typeof o === "number") return Number.isFinite(o);
    if (typeof o !== "string") return false;
    if (PRICE_FIELDS[o]) return true;
    const [n, out] = o.split(".");
    const it = clean.indicators.find((x) => x.name === n);
    if (!it) return false;
    const outs = INDICATORS[it.id].outputs;
    if (out === undefined) return outs.length === 1;
    return outs.some((x) => x.key === out);
  };
  const block = (b, label, required) => {
    const conds = Array.isArray(b?.conditions) ? b.conditions : [];
    if (required && !conds.length) fail(`Добавьте хотя бы одно условие ${label}`);
    if (conds.length > MAX_COND) fail(`Условий ${label} не больше ${MAX_COND}`);
    const match = b?.match === "any" ? "any" : "all";
    const out = conds.map((c) => {
      if (!(c.op in OPS)) fail("Неизвестная операция: " + c.op);
      if (!operandOk(c.left)) fail(`Условие ${label}: неверный левый операнд «${c.left}» (для индикатора с несколькими выходами укажите имя.выход)`);
      if (!operandOk(c.right)) fail(`Условие ${label}: неверный правый операнд «${c.right}»`);
      return { left: c.left, op: c.op, right: c.right };
    });
    return { match, conditions: out };
  };
  clean.entry = block(spec.entry, "входа", true);
  clean.exit = block(spec.exit, "выхода", false);
  const num = (v, lo, hi, label) => { const x = Number(v ?? 0); if (!(x >= lo && x <= hi)) fail(`${label}: от ${lo} до ${hi}`); return x; };
  clean.maxBars = Math.round(num(spec.maxBars, 0, 5000, "Выход по времени"));
  clean.stopAtr = num(spec.stopAtr, 0, 20, "Стоп, ATR");
  clean.takeAtr = num(spec.takeAtr, 0, 50, "Цель, ATR");
  clean.trailAtr = num(spec.trailAtr, 0, 20, "Скользящий стоп, ATR");
  clean.atrPeriod = Math.round(num(spec.atrPeriod ?? 14, 2, 200, "Период ATR"));
  if (spec.holdMode === "while_true" || spec.holdMode === "until_exit") clean.holdMode = spec.holdMode;
  if (spec.side !== undefined && spec.side !== "long" && spec.side !== "short") fail("Направление: long (покупка) или short (шорт)");
  clean.side = spec.side === "short" ? "short" : "long";
  return clean;
}

function resolveSeries(bars, series, operand) {
  if (typeof operand === "number") return null;
  if (operand === "close") return bars.map((b) => b.c);
  if (operand === "open") return bars.map((b) => b.o);
  if (operand === "high") return bars.map((b) => b.h);
  if (operand === "low") return bars.map((b) => b.l);
  if (operand === "volume") return bars.map((b) => b.v);
  const [n, out] = operand.split(".");
  return series[n][out ?? "value"] ?? series[n][Object.keys(series[n])[0]];
}

function condSeries(bars, series, conds, match) {
  const n = bars.length;
  const res = new Array(n).fill(false);
  if (!conds.length) return res;
  const evals = conds.map((c) => {
    const L = resolveSeries(bars, series, c.left), R = resolveSeries(bars, series, c.right);
    const l = (i) => (L ? L[i] : c.left), r = (i) => (R ? R[i] : c.right);
    return (i) => {
      const a = l(i), b = r(i);
      if (Number.isNaN(a) || Number.isNaN(b)) return false;
      switch (c.op) {
        case ">": return a > b;
        case "<": return a < b;
        case ">=": return a >= b;
        case "<=": return a <= b;
        case "==": return a === b;
        case "crossesAbove": { if (i === 0) return false; const pa = l(i - 1), pb = r(i - 1); return !Number.isNaN(pa) && !Number.isNaN(pb) && pa <= pb && a > b; }
        case "crossesBelow": { if (i === 0) return false; const pa = l(i - 1), pb = r(i - 1); return !Number.isNaN(pa) && !Number.isNaN(pb) && pa >= pb && a < b; }
        default: return false;
      }
    };
  });
  for (let i = 0; i < n; i++) res[i] = match === "any" ? evals.some((f) => f(i)) : evals.every((f) => f(i));
  return res;
}

// Возвращает { pos, exec }: желаемая позиция после закрытия каждой свечи и параметры исполнения (стопы).
export function computeSignals(bars, rawSpec) {
  const spec = validateSpec(rawSpec);
  const series = {};
  for (const it of spec.indicators) series[it.name] = INDICATORS[it.id].calc(bars, it.params);
  const n = bars.length;
  const entryOk = condSeries(bars, series, spec.entry.conditions, spec.entry.match);
  const exitOk = condSeries(bars, series, spec.exit.conditions, spec.exit.match);
  const useStops = spec.stopAtr > 0 || spec.takeAtr > 0 || spec.trailAtr > 0;
  // «Держать, пока условие истинно» — только если нет ни выхода, ни таймера, ни стопов.
  const mode = spec.holdMode || (spec.exit.conditions.length > 0 || spec.maxBars > 0 || useStops ? "until_exit" : "while_true");
  // Разминка: первая свеча, на которой все индикаторы уже посчитаны (нужно для проверки разных дат старта).
  let warmup = 0;
  for (const outs of Object.values(series)) {
    for (const arr of Object.values(outs)) {
      const k = arr.findIndex((v) => Number.isFinite(v));
      if (k > warmup) warmup = k;
    }
  }
  if (warmup >= n) warmup = 0;
  return {
    side: spec.side, entryOk, exitOk, mode, maxBars: spec.maxBars, warmup,
    stopAtr: spec.stopAtr, takeAtr: spec.takeAtr, trailAtr: spec.trailAtr,
    atr: useStops ? atrCalc(bars, spec.atrPeriod) : null,
    spec,
  };
}

// Сдвиг плана на одну свечу позже (проверка «а если исполнить на день позже»).
export function shiftPlan(plan) {
  const sh = (a) => [false, ...a.slice(0, -1)];
  return { ...plan, entryOk: sh(plan.entryOk), exitOk: sh(plan.exitOk) };
}

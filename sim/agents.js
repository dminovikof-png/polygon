// Экономика ИИ-агентов на учебных примерах: бюджет агента с лимитами и без, голландский аукцион решателей.
// Денег, ключей и сетей здесь нет — только арифметика с повторяемыми случайными числами.
import { rng } from "./ruin.js";

// Агент days дней платит за задачи (tasks в день по цене около price). С вероятностью attackRate в день
// ему подсовывают «счёт» на attack к неизвестному получателю (внедрение указаний, поддельный счёт).
// Лимиты: perTx — не больше за один платёж, daily — не больше за день, allowlist — платить только известным.
// Возвращает два пути баланса: без лимитов и с лимитами, сколько украдено и сколько честных задач не оплачено.
export function agentBudget({ days = 30, balance = 500, tasks = 20, price = 0.2, attackRate = 0.1, attack = 200, perTx = 2, daily = 10, allowlist = true, seed = 1 } = {}) {
  const r = rng(seed);
  const plan = [];
  for (let d = 0; d < days; d++) {
    const pays = [];
    for (let k = 0; k < tasks; k++) pays.push({ amt: +(price * (0.5 + r())).toFixed(4), known: true });
    if (r() < attackRate) pays.splice(Math.floor(r() * pays.length), 0, { amt: attack, known: false });
    plan.push(pays);
  }
  const run = (limited) => {
    let bal = balance, stolen = 0, paid = 0, refused = 0, attacks = 0, blocked = 0;
    const path = [bal];
    for (const pays of plan) {
      let today = 0;
      for (const p of pays) {
        if (!p.known) attacks++;
        let amt = p.amt;
        if (limited) {
          if (!p.known && allowlist) { blocked++; continue; }
          if (amt > perTx || today + amt > daily) {
            if (!p.known) { amt = Math.min(perTx, Math.max(0, daily - today)); if (amt <= 0) { blocked++; continue; } }
            else { refused++; continue; }
          }
        }
        amt = Math.min(amt, bal);
        if (amt <= 0) { if (p.known) refused++; continue; }
        bal -= amt; today += amt;
        if (p.known) paid++; else stolen += amt;
      }
      path.push(bal);
    }
    return { path, stolen, paid, refused, attacks, blocked, final: bal };
  };
  return { free: run(false), limited: run(true), total: plan.reduce((a, p) => a + p.filter((x) => x.known).length, 0) };
}

// Голландский аукцион намерения: пользователь хочет продать 1 монету не дешевле floor (в долях рыночной цены).
// Предложение начинается с start и снижается каждый шаг; решатель i может дать market·(1 − cost_i).
// Самому сильному решателю незачем брать сделку, пока она выгодна только ему: он ждёт, пока предложение
// не опустится до уровня второго по силе (тот вот-вот вмешается), а без соперников — до нижней границы.
export function dutchAuction({ start = 1.01, floor = 0.97, steps = 100, costs = [] } = {}) {
  const sorted = [...costs].sort((a, b) => a - b), can = 1 - (sorted[0] ?? Infinity);
  const rival = sorted.length > 1 ? 1 - sorted[1] : floor; // уровень, ниже которого сделку заберёт соперник или закончится аукцион
  for (let s = 0; s <= steps; s++) {
    const p = start - ((start - floor) * s) / steps;
    if (p <= can && (p <= rival + 1e-12 || s === steps)) return { step: s, price: p, winner: costs.indexOf(sorted[0]), filled: true };
  }
  return { step: steps, price: null, winner: -1, filled: false };
}

// Издержки решателей: от 0,05 % до 0,6 % (свой запас, газ, риск цены за время исполнения).
export function solverCosts(n, seed = 1) {
  const r = rng(seed);
  return Array.from({ length: n }, () => 0.0005 + r() * 0.0055);
}

// Средняя цена для пользователя при n решателях (по trials розыгрышам) против прямого обмена в пуле с комиссией pool.
export function auctionStats(n, { trials = 200, pool = 0.003, impact = 0.002, seed = 1, ...o } = {}) {
  let sum = 0, filled = 0;
  for (let t = 0; t < trials; t++) {
    const a = dutchAuction({ ...o, costs: solverCosts(n, seed + t * 7919) });
    if (a.filled) { sum += a.price; filled++; }
  }
  return { avg: filled ? sum / filled : null, filled: filled / trials, direct: 1 - pool - impact };
}

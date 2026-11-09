// Симуляторы уроков: поля ввода и пересчёт на месте. Расчёты — в public/sim/*.js (с тестами), рисунки — в fig-*.js.
// Каждый симулятор — функция (args) → DOM-элемент. Денег, ключей и заявок здесь нет; живой стакан только читается.
import { FIGURES } from "./figures.js";
import { blockHash, meetsTarget, expectedTries } from "../sim/block.js";
import { makePool, swap, lpVsHold } from "../sim/amm.js";
import { healthFactor, liquidationPrice, maxBorrow, liquidate, rates } from "../sim/lending.js";
import { makeBook, marketOrder, liqPrice, fee } from "../sim/market.js";
import { DEMO_BOOK } from "./fig-m03.js";
import { DEMO_POOL } from "./fig-m04.js";

const fmt = (v, d = 0) => (v == null || !isFinite(v) ? "—" : Number(v).toLocaleString("ru-RU", { minimumFractionDigits: d, maximumFractionDigits: d }));
function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) { if (v == null || v === false) continue; if (k === "class") e.className = v; else if (k.startsWith("on")) e[k] = v; else e.setAttribute(k, v === true ? "" : v); }
  for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}
// поле с подписью; onChange вызывается при каждом изменении
function field(label, attrs, onChange) {
  const inp = el("input", { type: "number", step: "any", ...attrs });
  inp.oninput = onChange;
  return { inp, node: el("label", { class: "simfield" }, el("span", { class: "help" }, label), inp) };
}
function range(label, attrs, onChange) {
  const inp = el("input", { type: "range", ...attrs }), out = el("b");
  inp.oninput = onChange;
  return { inp, out, node: el("label", { class: "simfield wide" }, el("span", { class: "help" }, label, " ", out), inp) };
}
function select(label, options, onChange) {
  const s = el("select", null, options.map(([v, t]) => el("option", { value: v }, t)));
  s.onchange = onChange;
  return { inp: s, node: el("label", { class: "simfield" }, el("span", { class: "help" }, label), s) };
}
// цена с разумным числом знаков: 74 912,90 · 3,4521 · 0,072315
const pf = (p) => fmt(p, p >= 100 ? 2 : p >= 1 ? 4 : 6);
const qf = (q) => fmt(q, q >= 100 ? 0 : 4);
const num = (i) => parseFloat(String(i.value).replace(",", "."));
const frame = (title, ...kids) => el("div", { class: "box sim" }, el("b", null, title), ...kids);

// «Собери блок»: меняете данные — хеш меняется целиком; подбор nonce перебором, порциями, чтобы экран не замирал.
function block() {
  const data = el("input", { type: "text", value: "Алиса → Боб: 2 BTC" });
  const nonce = field("nonce", { value: 0, min: 0, step: 1 }, show);
  const zeros = select("нулей в начале хеша", [["2", "2 (≈256 попыток)"], ["3", "3 (≈4 тыс.)"], ["4", "4 (≈65 тыс.)"]], show);
  const hash = el("code", { class: "hash" }), st = el("div", { class: "plain" });
  let busy = null;
  data.oninput = show;
  const blockOf = () => ({ index: 1, prev: "0000a1f3", data: data.value, nonce: Math.max(0, Math.floor(num(nonce.inp)) || 0) });
  function show() {
    const b = blockOf(), h = blockHash(b), z = +zeros.inp.value, ok = meetsTarget(h, z);
    hash.textContent = h; hash.className = "hash " + (ok ? "good" : "bad");
    st.textContent = ok ? "Хеш подходит: блок можно добавить в цепочку." : `Не подходит: нужно ${z} нуля в начале. Меняйте nonce или подберите автоматически.`;
  }
  const go = el("button", { class: "small", onclick: () => {
    if (busy) { busy = null; go.textContent = "Подобрать nonce"; return; }
    const z = +zeros.inp.value, start = Date.now(); let n = blockOf().nonce, tries = 0;
    busy = {}; const me = busy; go.textContent = "■ Стоп";
    const step = () => {
      if (busy !== me) return;
      for (let k = 0; k < 2000; k++, n++, tries++) {
        if (meetsTarget(blockHash({ ...blockOf(), nonce: n }), z)) {
          nonce.inp.value = n; show(); busy = null; go.textContent = "Подобрать nonce";
          st.textContent = `Найден nonce ${n}. Попыток: ${fmt(tries)}, время: ${fmt((Date.now() - start) / 1000, 1)} с; в среднем нужно ${fmt(expectedTries(z))}. Сеть Bitcoin делает примерно 10²¹ попыток в секунду.`;
          return;
        }
      }
      nonce.inp.value = n; st.textContent = `Перебор… попыток: ${fmt(tries)}`; setTimeout(step, 0);
    };
    step();
  } }, "Подобрать nonce");
  show();
  return frame("Соберите блок", el("label", { class: "simfield wide" }, el("span", { class: "help" }, "данные блока (поменяйте одну букву)"), data), el("div", { class: "simrow" }, nonce.node, zeros.node), el("div", { class: "help" }, "Хеш SHA-256:"), hash, st, el("div", { class: "inline" }, go));
}

// Учебный стакан: рыночная покупка или продажа выбранного объёма.
function book() {
  const qty = range("объём рыночной заявки, монет:", { min: 0.1, max: 12, step: 0.1, value: 1 }, show);
  const side = select("сторона", [["buy", "купить"], ["sell", "продать"]], show);
  const pic = el("div", { class: "fig" }), res = el("div", { class: "plain" });
  function show() {
    const q = num(qty.inp), b = makeBook(DEMO_BOOK), r = marketOrder(b, side.inp.value, q);
    qty.out.textContent = fmt(q, 1);
    pic.innerHTML = side.inp.value === "buy" ? FIGURES.orderBook({ buy: q }) : FIGURES.orderBook({});
    res.textContent = r.unfilled > 0 ? `Стакана не хватило: исполнено ${fmt(r.filled, 2)} из ${fmt(q, 1)}.` :
      `Средняя цена ${fmt(r.avgPrice, 4)}, худшая ${fmt(r.worst, 2)}, уровней ${r.levelsUsed}. Проскальзывание от лучшей цены ${fmt(r.slipBps, 1)} б.п., от середины ${fmt(r.vsMidBps, 1)} б.п. Комиссия тейкера 0,1 %: ${fmt(fee(r.notional, 0.001), 3)} при сумме ${fmt(r.notional, 2)}.`;
  }
  show();
  return frame("Рыночная заявка в учебном стакане", el("div", { class: "simrow" }, qty.node, side.node), pic, res);
}

// Живой стакан Bybit: только чтение публичных данных, без ключей. Сколько стоит купить на сумму X прямо сейчас.
function liveBook({ symbol = "BTCUSDT" } = {}) {
  const sym = select("пара", [["BTCUSDT", "BTC/USDT"], ["ETHUSDT", "ETH/USDT"], ["SOLUSDT", "SOL/USDT"], ["DOGEUSDT", "DOGE/USDT"]], load);
  sym.inp.value = symbol;
  const usd = field("купить на сумму, USDT", { value: 100000, min: 1 }, show);
  const res = el("div", { class: "plain" }, "Нажмите «Загрузить» — программа прочитает стакан с публичного адреса Bybit."), tbl = el("div");
  let book = null, at = null;
  async function load() {
    res.textContent = "Загрузка…";
    try {
      const r = await fetch(`https://api.bybit.com/v5/market/orderbook?category=spot&symbol=${sym.inp.value}&limit=200`);
      const j = await r.json();
      if (j.retCode !== 0) throw new Error(j.retMsg);
      book = { bids: j.result.b.map(([p, q]) => [+p, +q]), asks: j.result.a.map(([p, q]) => [+p, +q]) }; at = new Date();
      show();
    } catch (e) { book = null; res.textContent = "Не удалось загрузить стакан (нет сети или биржа не ответила). Остальной урок работает без сети."; tbl.replaceChildren(); }
  }
  function show() {
    if (!book) return;
    const best = book.asks[0][0], want = num(usd.inp), mid = (book.asks[0][0] + book.bids[0][0]) / 2;
    // перевести сумму в количество: идти по уровням, пока не потратим want
    let left = want, qty = 0;
    for (const [p, q] of book.asks) { const take = Math.min(q, left / p); qty += take; left -= take * p; if (left <= 1e-9) break; }
    const r = marketOrder(book, "buy", qty);
    const depth = book.asks.reduce((s, [p, q]) => s + p * q, 0);
    res.textContent = `${at.toLocaleTimeString("ru-RU")}: лучшая цена продавца ${pf(best)}, спред ${fmt(((book.asks[0][0] - book.bids[0][0]) / mid) * 1e4, 2)} б.п. ` +
      (left > 1e-6 ? `В загруженных 200 уровнях всего ${fmt(depth)} USDT — сумма больше, чем видно в стакане.` : `Покупка на ${fmt(want)} USDT: средняя цена ${pf(r.avgPrice)}, уровней ${r.levelsUsed}, проскальзывание ${fmt(r.slipBps, 2)} б.п. плюс комиссия тейкера.`);
    tbl.replaceChildren(el("div", { class: "help" }, `Первые 5 уровней продавцов: ${book.asks.slice(0, 5).map(([p, q]) => `${pf(p)} × ${qf(q)}`).join("; ")}`));
  }
  return frame("Живой стакан Bybit (только чтение)", el("div", { class: "simrow" }, sym.node, usd.node), el("div", { class: "inline" }, el("button", { class: "small", onclick: load }, "Загрузить")), res, tbl);
}

// Калькулятор ликвидации позиции с плечом.
function liq() {
  const entry = field("цена входа", { value: 2000, min: 0 }, show), lev = range("плечо:", { min: 1, max: 100, step: 1, value: 10 }, show);
  const side = select("направление", [["long", "лонг (на рост)"], ["short", "шорт (на падение)"]], show), mmr = field("поддерживающая маржа, %", { value: 0.5, min: 0, step: 0.1 }, show);
  const res = el("div", { class: "plain" });
  function show() {
    const o = { entry: num(entry.inp), lev: num(lev.inp), side: side.inp.value, mmr: num(mmr.inp) / 100 }, lp = liqPrice(o);
    lev.out.textContent = o.lev + "x";
    const d = Math.abs(lp / o.entry - 1) * 100;
    res.textContent = o.lev <= 1 && o.side === "long" ? "Без плеча лонг не ликвидируется: цена должна упасть до нуля." :
      `Цена ликвидации ≈ ${fmt(lp, 2)}: достаточно движения на ${fmt(d, 2)} % против позиции. Для BTC такой ход за день бывает ${d < 3 ? "несколько раз в месяц" : d < 8 ? "несколько раз в год" : d < 15 ? "редко, но бывает" : "очень редко"}. Комиссии и фандинг приближают ликвидацию.`;
  }
  show();
  return frame("Калькулятор ликвидации (упрощённый)", el("div", { class: "simrow" }, entry.node, side.node, mmr.node), lev.node, res);
}

// Пул x·y=k: обмен и сдвиг цены.
function amm() {
  const x = field("ETH в пуле", { value: DEMO_POOL.x, min: 1 }, show), y = field("USDT в пуле", { value: DEMO_POOL.y, min: 1 }, show);
  const buy = range("купить ETH на, USDT:", { min: 0, max: 100000, step: 1000, value: 10000 }, show);
  const pic = el("div", { class: "fig" }), res = el("div", { class: "plain" });
  function show() {
    const p = makePool(num(x.inp), num(y.inp)), b = num(buy.inp), s = swap(p, "Y", b);
    buy.out.textContent = fmt(b);
    pic.innerHTML = FIGURES.ammCurve({ buyY: b, pool: p });
    res.textContent = b > 0 ? `Получено ${fmt(s.out, 4)} ETH. Цена пула была ${fmt(s.before, 2)}, стала ${fmt(s.after, 2)}; в среднем вы заплатили ${fmt(s.avgPrice, 2)} — на ${fmt(s.impact * 100, 2)} % дороже (из них 0,3 % — комиссия поставщикам).` : "Сдвиньте ползунок.";
  }
  show();
  return frame("Пул x·y = k", el("div", { class: "simrow" }, x.node, y.node), buy.node, pic, res);
}

// Непостоянные потери и комиссии.
function il() {
  const r = range("цена ETH изменилась в, раз:", { min: -100, max: 100, step: 1, value: 30 }, show);
  const apr = field("доход от комиссий, % годовых", { value: 15, min: 0 }, show), days = field("срок, дней", { value: 365, min: 0 }, show);
  const res = el("div", { class: "plain" });
  function show() {
    const k = Math.pow(10, num(r.inp) / 100), v = lpVsHold(1000, k, { feesApr: num(apr.inp) / 100, days: num(days.inp) });
    r.out.textContent = k >= 1 ? "×" + fmt(k, 2) : "÷" + fmt(1 / k, 2);
    res.textContent = `Вложили $1000 поровну в ETH и USDT. Удержание: $${fmt(v.hold)}. Доля в пуле без комиссий: $${fmt(v.lpNoFees)} (${fmt(v.il * 100, 1)} %). С комиссиями: $${fmt(v.lp)} — ${v.vsHold >= 0 ? "лучше" : "хуже"} удержания на ${fmt(Math.abs(v.vsHold) * 100, 1)} %.`;
  }
  show();
  return frame("Пул против удержания", r.node, el("div", { class: "simrow" }, apr.node, days.node), res);
}

// Заём под залог: здоровье и ликвидация при падении цены.
function lending() {
  const amt = field("залог, ETH", { value: 1, min: 0 }, show), price = field("цена ETH сейчас", { value: 2000, min: 0 }, show), debt = field("долг, USDC", { value: 1000, min: 0 }, show);
  const drop = range("цена ETH упала на, %:", { min: 0, max: 80, step: 1, value: 0 }, show);
  const res = el("div", { class: "plain" });
  function show() {
    const a = num(amt.inp), p0 = num(price.inp), d = num(debt.inp), p = p0 * (1 - num(drop.inp) / 100);
    drop.out.textContent = drop.inp.value + " %";
    const hf = healthFactor(a * p, d), lp = liquidationPrice(a, d), mb = maxBorrow(a * p0);
    let s = `Можно занять до $${fmt(mb)} (75 % залога). Здоровье займа при цене ${fmt(p)}: ${fmt(hf, 2)}. Ликвидация при цене ${fmt(lp)} (падение на ${fmt((1 - lp / p0) * 100, 1)} %).`;
    if (d > mb) s += " Долг больше допустимого — протокол такой заём не выдаст.";
    const L = liquidate({ amount: a, price: p, debt: d });
    if (L.liquidated) s += ` Ликвидация: погашено $${fmt(L.repaid)} долга, забрано ${fmt(L.seized, 4)} ETH; премия ликвидатору — ваша потеря $${fmt(L.penalty)}. Осталось ${fmt(L.amount, 4)} ETH и долг $${fmt(L.debt)}.`;
    res.textContent = s; res.className = "plain " + (hf < 1 ? "bad" : hf < 1.2 ? "warn" : "");
  }
  show();
  return frame("Заём под залог", el("div", { class: "simrow" }, amt.node, price.node, debt.node), drop.node, res);
}

// Ставки от загрузки пула.
function ratesSim() {
  const u = range("загрузка пула, %:", { min: 0, max: 100, step: 1, value: 60 }, show);
  const pic = el("div", { class: "fig" }), res = el("div", { class: "plain" });
  function show() {
    const x = num(u.inp) / 100, r = rates(x);
    u.out.textContent = u.inp.value + " %";
    pic.innerHTML = FIGURES.ratesCurve({ u: x });
    res.textContent = `Заёмщики платят ${fmt(r.borrow * 100, 2)} % годовых, вкладчики получают ${fmt(r.supply * 100, 2)} %: проценты платят только с занятой части (${u.inp.value} %), а 10 % забирает протокол.`;
  }
  show();
  return frame("Откуда процент вкладчика", u.node, pic, res);
}

export const SIMS = { block, book, liveBook, liq, amm, il, lending, rates: ratesSim };

// Симуляторы уроков: поля ввода и пересчёт на месте. Расчёты — в public/sim/*.js (с тестами), рисунки — в fig-*.js.
// Каждый симулятор — функция (args) → DOM-элемент. Денег, ключей и заявок здесь нет; живой стакан только читается.
import { FIGURES } from "./figures.js";
import { blockHash, meetsTarget, expectedTries } from "../sim/block.js";
import { makePool, swap, lpVsHold } from "../sim/amm.js";
import { healthFactor, liquidationPrice, maxBorrow, liquidate, rates } from "../sim/lending.js";
import { makeBook, marketOrder, liqPrice, fee } from "../sim/market.js";
import { DEMO_BOOK } from "./fig-m03.js";
import { DEMO_POOL } from "./fig-m04.js";
import { blackScholes, breakeven, probProfit } from "../sim/option.js";
import { kelly, positionSize } from "../sim/ruin.js";
import { DATA } from "./data.js";

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

// Опцион: цена по модели и выплата при экспирации.
function option() {
  const type = select("опцион", [["call", "колл (право купить)"], ["put", "пут (право продать)"]], show), side = select("сторона", [["long", "купить"], ["short", "продать"]], show);
  const spot = field("цена монеты сейчас", { value: 100, min: 0 }, show), strike = field("страйк", { value: 110, min: 0 }, show);
  const days = field("дней до экспирации", { value: 30, min: 1 }, show), vol = field("волатильность, % годовых", { value: 60, min: 1 }, show);
  const pic = el("div", { class: "fig" }), res = el("div", { class: "plain" });
  function show() {
    const o = { type: type.inp.value, S: num(spot.inp), K: num(strike.inp), days: num(days.inp), vol: num(vol.inp) / 100 };
    const prem = blackScholes(o), be = breakeven({ type: o.type, strike: o.K, premium: prem }), pp = probProfit({ ...o, premium: prem });
    pic.innerHTML = FIGURES.optionPayoff({ type: o.type, side: side.inp.value, strike: o.K, premium: prem, spot: o.S });
    const long = side.inp.value === "long";
    res.textContent = `Премия по модели: ${fmt(prem, 2)} (${fmt((prem / o.S) * 100, 1)} % цены монеты). Безубыточность ${fmt(be, 2)}. По той же модели купленный опцион окажется в плюсе примерно в ${fmt(pp * 100)} % случаев — ${long ? "в остальных теряется вся премия или её часть" : "в остальных продавец оставляет премию себе, но в редких случаях теряет много"}. Модель грубая: настоящие цены на бирже другие.`;
  }
  show();
  return frame("Опцион: премия и выплата", el("div", { class: "simrow" }, type.node, side.node, spot.node, strike.node, days.node, vol.node), pic, res);
}

const check = (label, on, onChange) => { const i = el("input", { type: "checkbox", style: "width:auto" }); i.checked = on; i.onchange = onChange; return { i, node: el("label", { style: "font-weight:normal;margin:0" }, i, " ", label) }; };

// График монеты с включаемыми индикаторами.
function chart() {
  const coin = select("монета", [["btc", "BTC"], ["eth", "ETH"], ["sol", "SOL"], ["doge", "DOGE"]], show), years = select("период", [["1", "1 год"], ["3", "3 года"], ["0", "вся история"]], show);
  years.inp.value = "3";
  const o = { sma50: check("SMA 50", false, show), sma200: check("SMA 200", true, show), bb: check("Боллинджер", false, show), dc: check("Дончиан", false, show), rsi: check("RSI", false, show) };
  const pic = el("div", { class: "fig" });
  function show() { pic.innerHTML = FIGURES.priceChart({ coin: coin.inp.value, years: +years.inp.value, sma50: o.sma50.i.checked, sma200: o.sma200.i.checked, bb: o.bb.i.checked, dc: o.dc.i.checked, showRsi: o.rsi.i.checked }); }
  show();
  return frame("График с индикаторами", el("div", { class: "simrow" }, coin.node, years.node), el("div", { class: "inline" }, Object.values(o).map((x) => x.node)), pic, el("div", { class: "help" }, `Данные: Binance, дневные свечи по UTC (публичные данные), по ${DATA.asOf.split("-").reverse().join(".")}.`));
}

// DCA против покупки сразу.
function dcaSim() {
  const year = select("начать в", [2018, 2019, 2020, 2021, 2022, 2023, 2024].map((y) => [String(y), String(y)]), show), months = select("покупать в течение", [["12", "1 года"], ["24", "2 лет"], ["36", "3 лет"]], show);
  year.inp.value = "2021"; months.inp.value = "24";
  const pic = el("div", { class: "fig" });
  function show() { pic.innerHTML = FIGURES.dcaVsLump({ startYear: +year.inp.value, months: +months.inp.value }); }
  show();
  return frame("DCA или всё сразу", el("div", { class: "simrow" }, year.node, months.node), pic, el("div", { class: "help" }, "Сравнивается одна и та же сумма: DCA вкладывает её частями, «всё сразу» — в первый день. Стоимость показана на последний день периода покупок."));
}

// Учебная лаборатория: три механики на истории BTC с выбранной комиссией.
function strategyLab({ rule: start = "smaTrend" } = {}) {
  const rule = select("правило", [["smaTrend", "тренд: цена выше SMA 200"], ["donchian", "черепахи: пробой 20, выход 10"], ["rsiRevert", "возврат: RSI < 30, выход RSI > 55"]], show);
  const fee = select("комиссия за сделку", [["0", "0 %"], ["0.001", "0,1 %"], ["0.003", "0,3 %"]], show);
  fee.inp.value = "0.001"; rule.inp.value = start;
  const pic = el("div", { class: "fig" });
  function show() { pic.innerHTML = FIGURES.strategyOnBtc({ rule: rule.inp.value, fee: +fee.inp.value }); }
  show();
  return frame("Три механики на истории BTC", el("div", { class: "simrow" }, rule.node, fee.node), pic, el("div", { class: "help" }, "Иллюстрация, а не проверка: одна монета, одни параметры, без планки значимости и отложенных данных. Честная проверка — в рабочем режиме."));
}

// Размер позиции по риску.
function possize() {
  const eq = field("капитал, $", { value: 10000, min: 0 }, show), risk = field("риск на сделку, % капитала", { value: 1, min: 0, step: 0.1 }, show);
  const entry = field("цена входа", { value: 100, min: 0 }, show), stop = field("стоп", { value: 92, min: 0 }, show);
  const res = el("div", { class: "plain" });
  function show() {
    const r = positionSize({ equity: num(eq.inp), riskPct: num(risk.inp) / 100, entry: num(entry.inp), stop: num(stop.inp) });
    const dist = Math.abs(num(stop.inp) / num(entry.inp) - 1) * 100;
    res.textContent = `Купить ${fmt(r.units, 4)} монеты на $${fmt(r.notional)} (${fmt(r.share * 100, 1)} % капитала). Стоп в ${fmt(dist, 1)} % от входа: при срабатывании потеря $${fmt(r.risk)}, это ${fmt(num(risk.inp), 1)} % счёта${r.share > 1 ? ". Позиция больше капитала — понадобится плечо: стоп слишком близко или риск слишком велик" : ""}. Проскальзывание на стопе сделает потерю чуть больше.`;
  }
  show();
  return frame("Размер позиции по риску", el("div", { class: "simrow" }, eq.node, risk.node, entry.node, stop.node), res);
}

// Разорение: выгодная игра и разная доля риска.
function ruinSim() {
  const p = field("доля выигрышей, %", { value: 50, min: 1, max: 99 }, show), b = field("выигрыш, R (убыток = 1R)", { value: 1.2, min: 0.1, step: 0.1 }, show);
  const f = range("риск на сделку, % капитала:", { min: 0.5, max: 40, step: 0.5, value: 5 }, show);
  const pic = el("div", { class: "fig" }), curve = el("div", { class: "fig" }), res = el("div", { class: "plain" });
  function show() {
    const pp = num(p.inp) / 100, bb = num(b.inp), ff = num(f.inp) / 100, k = kelly(pp, bb);
    f.out.textContent = fmt(ff * 100, 1) + " %";
    pic.innerHTML = FIGURES.ruinPaths({ p: pp, b: bb, f: ff });
    curve.innerHTML = k > 0 ? FIGURES.kellyCurve({ p: pp, b: bb, f: ff }) : "";
    res.textContent = k > 0 ? `Доля по Келли: ${fmt(k * 100, 1)} %. Больше Келли — рост медленнее при большем риске; больше двух Келли — капитал в среднем тает, хотя каждая сделка выгодна.` : "У такой игры нет преимущества: ожидание сделки не больше нуля. Никакой размер ставки её не спасёт.";
  }
  show();
  return frame("Симулятор разорения", el("div", { class: "simrow" }, p.node, b.node), f.node, pic, curve, res);
}

// Постоянное плечо на истории BTC с выбранного года.
function leverSim() {
  const from = select("с начала", [2018, 2019, 2020, 2021, 2022, 2023].map((y) => [`${y}-01-01`, String(y)]), show);
  from.inp.value = "2020-01-01";
  const pic = el("div", { class: "fig" });
  function show() { pic.innerHTML = FIGURES.leverHistory({ from: from.inp.value }); }
  show();
  return frame("Плечо на истории BTC", from.node, pic);
}

// 500 обезьян: случайные стратегии на настоящей истории.
function monkeysSim() {
  const coin = select("монета", [["btc", "BTC"], ["eth", "ETH"], ["sol", "SOL"], ["doge", "DOGE"]], show), count = select("сколько обезьян", [["20", "20"], ["100", "100"], ["500", "500"], ["2000", "2000"]], show);
  const fee = select("комиссия за сделку", [["0", "0 %"], ["0.001", "0,1 %"], ["0.003", "0,3 %"]], show);
  count.inp.value = "500"; fee.inp.value = "0.001";
  let seed = 1;
  const again = el("button", { class: "sec small", onclick: () => { seed++; show(); } }, "Новые обезьяны");
  const pic = el("div", { class: "fig" }), split = el("div", { class: "fig" });
  function show() {
    const o = { coin: coin.inp.value, count: +count.inp.value, seed, fee: +fee.inp.value };
    pic.innerHTML = FIGURES.monkeysChart(o); split.innerHTML = FIGURES.monkeysSplit(o);
  }
  show();
  return frame("500 обезьян", el("div", { class: "simrow" }, coin.node, count.node, fee.node), again, pic, split);
}

// Подгонка длины средней: песочница и отложенные данные.
function overfitSim() {
  const coin = select("монета", [["btc", "BTC"], ["eth", "ETH"], ["sol", "SOL"], ["doge", "DOGE"]], show);
  const pic = el("div", { class: "fig" });
  function show() { pic.innerHTML = FIGURES.paramOverfit({ coin: coin.inp.value }); }
  show();
  return frame("Подгонка параметра", coin.node, pic, el("div", { class: "help" }, "Песочница — первые 70 % истории монеты, отложенные данные — последние 30 %. Комиссия 0,1 % за смену позиции."));
}

// Модель на ценах с проверкой вперёд.
function mlSim() {
  const coin = select("монета", [["btc", "BTC"], ["eth", "ETH"], ["sol", "SOL"], ["doge", "DOGE"]], show);
  const model = select("модель", [["logit", "логистическая регрессия"], ["knn", "k ближайших соседей"]], show);
  const k = select("k (для соседей)", [["1", "1"], ["5", "5"], ["15", "15"], ["50", "50"]], show), lags = select("признаки", [["1", "доходность за 1 день"], ["5", "за 5 дней"], ["20", "за 20 дней"]], show);
  const train = select("окно обучения", [["365", "1 год"], ["730", "2 года"]], show);
  k.inp.value = "15"; lags.inp.value = "5"; train.inp.value = "730";
  const pic = el("div", { class: "fig" });
  function show() { k.node.hidden = model.inp.value !== "knn"; pic.innerHTML = FIGURES.mlWalk({ coin: coin.inp.value, model: model.inp.value, k: +k.inp.value, lags: +lags.inp.value, train: +train.inp.value }); }
  show();
  return frame("Модель на ценах: проверка вперёд", el("div", { class: "simrow" }, coin.node, model.node, k.node, lags.node, train.node), pic, el("div", { class: "help" }, "Модель переобучается каждые 30 дней только на прошлом. В рынке — когда вероятность роста больше 50 %, комиссия 0,1 % за смену позиции. Расчёт занимает до секунды."));
}

// Бюджет агента: лимиты кошелька против поддельных счетов.
function agentLimitsSim() {
  const rate = select("поддельные счета", [["0.05", "редко (5 % дней)"], ["0.1", "иногда (10 % дней)"], ["0.3", "часто (30 % дней)"]], show);
  const perTx = select("лимит на платёж", [["1", "$1"], ["2", "$2"], ["5", "$5"], ["50", "$50"]], show), daily = select("лимит на день", [["3", "$3"], ["10", "$10"], ["30", "$30"]], show);
  const allow = select("белый список получателей", [["1", "включён"], ["0", "выключен"]], show);
  rate.inp.value = "0.1"; perTx.inp.value = "2"; daily.inp.value = "10";
  let seed = 1;
  const again = el("button", { class: "sec small", onclick: () => { seed++; show(); } }, "Другой месяц");
  const pic = el("div", { class: "fig" });
  function show() { pic.innerHTML = FIGURES.limitsChart({ attackRate: +rate.inp.value, perTx: +perTx.inp.value, daily: +daily.inp.value, allowlist: allow.inp.value === "1", seed }); }
  show();
  return frame("Лимиты кошелька агента", el("div", { class: "simrow" }, rate.node, perTx.node, daily.node, allow.node), again, pic,
    el("div", { class: "help" }, "Учебная модель: $500 на старте, 20 честных платежей в день по 10–30 центов, поддельный счёт — на $200. Денег и сетей здесь нет."));
}

// Способ учёта цены покупки для налога.
function taxLotsSim() {
  const method = select("способ учёта", [["fifo", "FIFO"], ["lifo", "LIFO"], ["avg", "средняя цена"]], show);
  const pic = el("div", { class: "fig" });
  function show() { pic.innerHTML = FIGURES.costMethods({ method: method.inp.value }); }
  show();
  return frame("Какая цена покупки списывается", method.node, pic);
}

export const SIMS = { block, book, liveBook, liq, amm, il, lending, rates: ratesSim, option, chart, dca: dcaSim, strategyLab, possize, ruin: ruinSim, lever: leverSim, monkeys: monkeysSim, overfit: overfitSim, ml: mlSim, agentLimits: agentLimitsSim, taxLots: taxLotsSim };

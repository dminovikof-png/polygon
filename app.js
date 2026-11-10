// Интерфейс «Честного полигона». Вся логика расчётов — на сервере (lib/), здесь только показ.
const $ = (id) => document.getElementById(id);
const T = (s) => window.PolygonI18n?.tr(s) ?? s; // перевод текста, который не попадает на страницу (окна подтверждения, подписи на графике)
let meta, lastReq = null, custom = null, indSeq = 1, btcPairs = {};
const pct = (x) => (x * 100).toFixed(1) + " %";
const pct0 = (x) => (x * 100).toFixed(0) + " %";
const EXN = { bybit: "Bybit", binance: "Binance", okx: "OKX" };
const date = (t) => new Date(t * 1000).toISOString().slice(0, 10);
const dt = (t) => new Date(t * 1000).toISOString().slice(0, 16).replace("T", " ");

function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === "class") e.className = v; else if (k.startsWith("on")) e[k] = v; else if (k === "value") e.value = v; else e.setAttribute(k, v === true ? "" : v); }
  for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}
function table(head, rows) { return h("table", null, h("tr", null, head.map((x) => h("th", null, x))), rows.map((r) => h("tr", null, r.map((x) => h("td", null, x))))); }
const list = (items, cls) => h("ul", null, items.map((x) => h("li", { class: cls }, x)));
const badge = (status) => h("span", { class: "badge " + ({ "❌": "b-no", "✅": "b-ok", "🟡": "b-mid", "⏸": "b-mid", "учебная": "b-learn" }[status] || "") }, status);
// Запросы идут на сервер компьютера, а на планшете и телефоне — в рабочий поток (public/worker.js) с тем же расчётом.
let worker = null, workerSeq = 0, device = false;
const workerWaiting = new Map();
async function api(url, body) {
  if (worker) return new Promise((ok, fail) => { const id = ++workerSeq; workerWaiting.set(id, { ok, fail }); worker.postMessage({ id, method: body ? "POST" : "GET", url, body }); });
  const r = await fetch(url, body ? { method: "POST", body: JSON.stringify(body) } : undefined);
  const d = await r.json(); if (d.error) throw new Error(d.error); return d;
}
function startWorker() {
  worker = new Worker("worker.js", { type: "module" });
  worker.onmessage = (e) => { const w = workerWaiting.get(e.data.id); workerWaiting.delete(e.data.id); e.data.error ? w?.fail(new Error(e.data.error)) : w?.ok(e.data.data); };
  worker.onerror = (e) => { for (const w of workerWaiting.values()) w.fail(new Error("Рабочий поток остановился: " + (e.message || "ошибка"))); workerWaiting.clear(); };
}
window.polygonApi = api;

/* ---------- режимы: учебный и рабочий ---------- */
// Язык: список в шапке; смена перезагружает страницу (так все надписи, включая уже показанные, пересобираются).
(function langUi() {
  const I = window.PolygonI18n; if (!I?.set) return;
  for (const [k, v] of Object.entries(I.LANGS)) $("langSel").add(new Option(v, k, false, k === I.lang));
  $("langSel").onchange = (e) => I.set(e.target.value);
  $("langNote").hidden = I.lang === "ru";
})();
const MODE_KEY = "polygon.mode";
function setMode(m) {
  document.querySelectorAll("#modeSeg button").forEach((b) => b.classList.toggle("on", b.dataset.mode === m));
  $("learnArea").hidden = m !== "learn"; $("workArea").hidden = m !== "work";
  try { localStorage.setItem(MODE_KEY, m); } catch { /* выбор не запомнится */ }
  if (m === "learn") window.initCourse?.();
}
document.querySelectorAll("#modeSeg button").forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));
// Из урока — сразу на нужный этап рабочего режима.
// Из урока: открыть этап; opts.strategy и opts.symbol — сразу выбрать идею и монету в проверке («проверить в полигоне»).
window.goWork = (stage, sub, opts = {}) => {
  setMode("work");
  if (opts.symbol && [...$("symbol").options].some((o) => o.value === opts.symbol)) { $("symbol").value = opts.symbol; onSymbol(); }
  if (opts.strategy && [...$("strategy").options].some((o) => o.value === opts.strategy)) { $("strategy").value = opts.strategy; onStrategy(); settingsSummary(); chooseIdea(); }
  showTab(stage); if (sub && stage === "test") testMode(sub); if (sub && stage === "ref") refMode(sub); window.scrollTo(0, 0);
};
// На сенсорном экране наведения нет: подсказка (title) показывается по нажатию.
if (matchMedia("(pointer:coarse)").matches) document.addEventListener("click", (e) => {
  document.querySelectorAll(".tipbox").forEach((x) => x.remove());
  const t = e.target.closest?.("[title]");
  if (t && !t.closest("button,a,input,select")) { const box = h("div", { class: "tipbox" }, t.title); document.body.append(box); setTimeout(() => box.remove(), 6000); }
});

/* ---------- устройство: расчёт без компьютера ---------- */
// Binance не отдаёт данные браузеру; авто-обновления бумажных сессий нет — телефон не работает в фоне.
function deviceMode() {
  try { navigator.storage?.persist?.(); } catch { /* браузер решает сам */ }
  $("storageBox").hidden = false; $("deviceNote").hidden = false;
  $("deviceNote").textContent = "Расчёты идут на этом устройстве: свечи скачиваются с биржи сюда же. Binance отсюда недоступен (он не отдаёт данные браузеру) — Bybit и OKX работают. Бумажные сессии пересчитываются при открытии.";
}
async function syncStatus() {
  try {
    const s = await api("api/sync/status"), d = (x) => (x ? x.slice(0, 16).replace("T", " ") : "ни разу");
    $("syncStatus").textContent = `Последняя загрузка файла: ${d(s.lastImport)} · последняя выгрузка: ${d(s.lastExport)}.` + (device && !s.lastImport ? " Планка здесь посчитана без попыток на других устройствах." : "");
    if (device) { const st = await api("device/storage"); $("storageInfo").textContent = st.usage == null ? "" : `Занято на устройстве: ${(st.usage / 1e6).toFixed(1)} МБ${st.quota ? ` из доступных ${(st.quota / 1e6).toFixed(0)} МБ` : ""}. Свечи скачаются заново при следующей проверке.`; }
  } catch { /* старый сервер без обмена */ }
}
const saveFile = (name, text, type) => { const a = h("a", { href: URL.createObjectURL(new Blob([text], { type })), download: name }); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); };
$("syncOut").onclick = async () => {
  try { const d = await api("api/sync/export"); saveFile(`polygon-${device ? "device" : "pc"}-${d.at.slice(0, 10)}.json`, JSON.stringify(d), "application/json"); syncStatus(); }
  catch (e) { $("syncStatus").textContent = e.message; }
};
$("syncIn").onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = "";
  if (!f) return;
  try {
    const r = await api("api/sync/import", JSON.parse(await f.text()));
    $("syncStatus").textContent = `Добавлено записей журнала: ${r.journalAdded}, бумажных сессий: ${r.sessionsAdded}${r.sessionsSkipped.length ? ` (не поместились: ${r.sessionsSkipped.join(", ")})` : ""}. Уникальных попыток теперь ${r.attempts}, планка ${r.plankBefore.toFixed(2)} → ${r.plank.toFixed(2)}.`;
    loadJournal(); loadSessions?.();
  } catch (err) { $("syncStatus").textContent = "Не получилось: " + err.message; }
};
$("clearCandles").onclick = async () => { if (!confirm(T("Удалить скачанные свечи с этого устройства? Журнал и сессии останутся."))) return; await api("device/clear", {}); syncStatus(); };
$("syncBox").addEventListener("toggle", () => { if ($("syncBox").open) syncStatus(); });

/* ---------- этапы ---------- */
// Старые имена вкладок ведут на новые этапы: scan — режим этапа «Проверка», ind и cat — разделы справки.
const STAGES = ["start", "coins", "state", "idea", "test", "paper", "ref"];
const ALIAS = { rates: ["coins"], scan: ["test", "scan"], ind: ["ref", "ind"], cat: ["ref", "cat"] };
document.querySelectorAll("#nav button").forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));
document.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => { if (b.closest("#tab-start")) { wiz.path = b.dataset.go === "idea" ? "idea" : "coins"; wizSave(); } showTab(b.dataset.go); window.scrollTo(0, 0); }));
function showTab(name) {
  const [stage, sub] = ALIAS[name] || [name];
  document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("on", b.dataset.tab === stage));
  for (const t of STAGES) $("tab-" + t).hidden = t !== stage;
  if (stage === "test" && sub) testMode(sub);
  if (stage === "ref" && sub) refMode(sub);
  if (stage === "paper") { updateNewSummary(); loadSessions(); }
  if (stage === "coins" && !$("rFunding").children.length) loadRates();
  if (stage === "coins" && !coinData) loadCoins();
  if (stage === "state") loadState(); // список монет мог измениться на этапе 1
  if (stage === "test" && !$("scanPane").hidden) scanPlanUpdate();
  if (stage === "idea") renderApproach();
  renderWizard();
}
/* ---------- мастер шагов ---------- */
// Логика — в wizard.js (там же тесты); здесь только факты со страницы и отрисовка. Шаг отмечается по факту.
const WIZ_KEY = "polygon.wizard";
const wiz = (() => { try { return JSON.parse(localStorage.getItem(WIZ_KEY)) || {}; } catch { return {}; } })();
const wizSave = () => { try { localStorage.setItem(WIZ_KEY, JSON.stringify(wiz)); } catch { /* без хранилища — до перезагрузки */ } };
let W = null, wizJournal = [], wizSessions = [], plankNow = 1.96, lastCheck = null;
import("./wizard.js").then((m) => { W = m; renderWizard(); }).catch(() => { /* без мастера этапы работают как прежде */ });
const curStage = () => STAGES.find((t) => !$("tab-" + t).hidden);
function chooseIdea() { wiz.idea = $("strategy").value; wizSave(); renderWizard(); }
function openLessonFromWork(id) { window.polygonLesson?.(id); setMode("learn"); window.scrollTo(0, 0); }
function renderWizard() {
  if (!W || !meta) return;
  const box = $("wizard"), off = wiz.on === false;
  box.hidden = off; $("wizOn").hidden = !off;
  if (off) return;
  const w = W.wizardState({ path: wiz.path, picked: coinStore.picked ? [...picked()] : null, stateSeen: wiz.stateSeen, idea: wiz.idea, journal: wizJournal, sessions: wizSessions, stage: curStage(),
    coinYears: coinData ? Object.fromEntries(coinData.rows.filter((r) => r.years != null).map((r) => [r.symbol, r.years])) : null });
  const T = (k) => W.STEPS[k - 1].title, go = (k) => () => { showTab(W.STEPS[k - 1].stage); window.scrollTo(0, 0); };
  const pathName = w.path === "idea" ? "путь «с идеи»" : "путь «с монет»";
  const head = h("div", { class: "wizhead" },
    h("b", null, w.inPath ? `Шаг ${w.pos} из ${w.total} — ${w.step.title}` : `${w.step.title} — не входит в ${pathName}`),
    h("span", { class: "tag" }, `${w.done[w.n] ? "✓ " : ""}${w.note[w.n]}`), h("span", { style: "flex:1" }),
    h("button", { class: "small sec", onclick: () => { wiz.collapsed = !wiz.collapsed; wizSave(); renderWizard(); } }, wiz.collapsed ? "Развернуть" : "Свернуть"),
    h("button", { class: "small sec", title: "Включить снова можно на экране «Начало»", onclick: () => { wiz.on = false; wizSave(); renderWizard(); } }, "Выключить"));
  if (wiz.collapsed) return box.replaceChildren(head);
  const here = !$("tab-" + w.step.stage).hidden;
  box.replaceChildren(...[head,
    h("div", { class: "wizdots" }, w.order.map((k, i) => h("button", { class: "small" + (w.done[k] ? " ok" : "") + (k === w.n ? " on" : ""), title: `${T(k)}: ${w.note[k]}`, onclick: go(k) }, `${w.done[k] ? "✓" : i + 1} ${T(k)}`))),
    h("div", { class: "plain" }, h("b", null, "Что сделать: "), w.what),
    h("div", { class: "help" }, h("b", null, "Зачем: "), w.step.why),
    h("div", { class: "help" }, h("b", null, "Частая ошибка: "), w.step.mistake),
    ...w.warnings.map((x) => h("div", { class: "warn" }, "⚠ " + x)),
    w.allDone ? h("div", { class: "help good" }, "Все шаги пройдены. Помните: бумажная сессия — не проверка. Месяц наблюдения почти ничего не доказывает, смысл — увидеть, как правило ведёт себя вживую.") : null,
    h("div", { class: "inline" },
      here ? null : h("button", { class: "small", onclick: go(w.n) }, "Открыть этот шаг"),
      w.n === 1 && !coinStore.picked && here ? h("button", { class: "small sec", onclick: () => { coinStore.picked = [...picked()]; coinSave(); syncScanCoins(); } }, "Работать со всеми отмеченными") : null,
      w.next ? h("button", { class: "small" + (w.done[w.n] ? "" : " sec"), onclick: go(w.next) }, `Дальше: ${T(w.next)} →`) : null,
      w.step.lesson ? h("button", { class: "small sec", onclick: () => openLessonFromWork(w.step.lesson) }, "Подробнее в уроке") : null)].filter(Boolean)); // null в replaceChildren печатается как текст
}
$("wizOnBtn").onclick = () => { wiz.on = true; wizSave(); renderWizard(); };

// Таблицы на телефоне — карточками: подпись столбца переносится в каждую ячейку (CSS показывает её только на узком экране).
function cardify(t) {
  const head = [...t.rows].find((r) => r.querySelector("th"));
  if (!head || t.classList.contains("cards")) return;
  const labels = []; for (const th of head.cells) for (let k = 0; k < (th.colSpan || 1); k++) labels.push(th.textContent);
  head.classList.add("head"); t.classList.add("cards");
  for (const r of t.rows) { if (r === head) continue; let c = 0; for (const td of r.cells) { td.dataset.label = td.colSpan > 1 ? "" : labels[c] ?? ""; c += td.colSpan || 1; } }
}
new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) { if (n.nodeType !== 1) continue; if (n.tagName === "TABLE") cardify(n); else if (n.tagName === "TR") { const t = n.closest("table"); if (t) { t.classList.remove("cards"); cardify(t); } } else n.querySelectorAll?.("table").forEach(cardify); } })
  .observe($("workArea"), { childList: true, subtree: true });

const seg = (id, on) => document.querySelectorAll(`#${id} button`).forEach((b) => b.classList.toggle("on", b.dataset.m === on));
function testMode(m) { seg("testMode", m); $("onePane").hidden = m !== "one"; $("scanPane").hidden = m !== "scan"; if (m === "scan") scanPlanUpdate(); }
function refMode(m) { seg("refMode", m); $("refCat").hidden = m !== "cat"; $("refInd").hidden = m !== "ind"; $("refPlank").hidden = m !== "plank"; }
document.querySelectorAll("#testMode button").forEach((b) => (b.onclick = () => testMode(b.dataset.m)));
document.querySelectorAll("#refMode button").forEach((b) => (b.onclick = () => refMode(b.dataset.m)));

// Строки-итоги свёрнутых блоков: видно, что выбрано, не раскрывая их.
function settingsSummary() {
  const b = $("benchmark").selectedOptions[0]?.textContent || "";
  $("settingsSum").textContent = `Общие настройки: ${EXN[$("exchange").value] || ""} · комиссия ${$("fee").value} % · проскальзывание ${$("slip").value} % · отчёт в ${$("reportCcy").value} · до ${$("maxBars").value} свечей · эталон: ${b.toLowerCase()}${Number($("cashYield").value) > 0 ? ` · кэш ${$("cashYield").value} %` : ""}`;
  const perp = $("gMarket").value === "perp";
  $("gAdvSum").textContent = `Ещё настройки сетки: шаг ${$("gSpacing").value === "geom" ? "одинаковый в %" : "одинаковый в цене"} · ${Number($("gStop").value) || Number($("gTake").value) ? `стоп ${$("gStop").value || 0}, тейк ${$("gTake").value || 0}` : "без стопа и тейка"} · круги внутри свечи ${$("gIntrabar").value === "one" ? "мягко" : "строго"}${$("gStartBuy").checked ? "" : " · без стартовой позиции"}${$("gTrailing").checked ? " · трейлинг" : ""}${perp ? ` · комиссия фьючерса ${$("gPerpFee").value} %, маржа ${$("gMaint").value} %` : ""}`;
  $("cAdvSum").textContent = `Ещё настройки carry: аварийный выход ниже ${$("cEm").value} % · комиссия фьючерса ${$("cPerpFee").value} % · залог спота ${$("cHaircut").value}`;
  $("advSum").textContent = `Дополнительно: доля в позиции ${$("positionPct").disabled ? "по идее" : $("positionPct").value + " %"} · плечо ${$("lev").value}x${$("fundHist").checked ? " · фандинг по истории" : ""}`;
}
["exchange", "fee", "slip", "reportCcy", "maxBars", "benchmark", "cashYield", "positionPct", "lev", "fundHist", "strategy", "gMarket", "gPerpFee", "gMaint", "gSpacing", "gStop", "gTake", "gIntrabar", "gStartBuy", "gTrailing", "cEm", "cPerpFee", "cHaircut"].forEach((id) => { $(id).addEventListener("input", settingsSummary); $(id).addEventListener("change", () => setTimeout(settingsSummary)); });

/* ---------- этап 3: подход и идея ---------- */
// К какому подходу относится идея. Неизвестные новые идеи попадают в «тренд», чтобы не пропасть из списка.
const APPROACH_OF = { rsi_revert: "revert", mrbb: "revert", range_fader: "revert", down_streak: "revert", candle_patterns: "revert", rsi_short: "revert", const_share: "accum" };
const APPROACHES = [
  ["trend", "Следование тренду", "Войти, когда цена пошла, выйти, когда развернулась.", true, "нужно угадать направление"],
  ["revert", "Возврат к среднему", "Купить после резкого падения (или продать после роста) в расчёте на откат.", true, "нужно угадать короткое движение"],
  ["flat", "Без направления", "Сетка зарабатывает на колебаниях, carry — на фандинге.", false, "направление не нужно, нужен размах или ставка"],
  ["accum", "Накопление и доля", "Покупать частями по расписанию (DCA) или держать постоянную долю монеты.", false, "направление не нужно"],
];
let approach = "trend";
function renderApproach() {
  $("apprList").replaceChildren(...APPROACHES.map(([k, t, d, dir, tag]) => h("div", { class: "appr" + (k === approach ? " on" : ""), onclick: () => { approach = k; renderApproach(); } },
    h("b", null, t), h("span", { class: "help" }, d), h("br"), h("span", { class: "tagdir " + (dir ? "yes" : "no") }, tag))));
  const pick = (key) => { $("strategy").value = key; onStrategy(); settingsSummary(); chooseIdea(); showTab("test"); testMode("one"); window.scrollTo(0, 0); };
  const scanBox = (key) => $("scIdeas").querySelector(`input[value="${key}"]`);
  const item = (title, status, plain, key, extra = null) => h("div", { class: "idea" },
    h("div", null, status ? badge(status) : null, h("b", null, title), extra),
    h("div", { class: "plain" }, plain),
    h("div", { class: "inline" }, h("button", { class: "small", onclick: () => pick(key) }, "Проверить"),
      scanBox(key) ? h("label", { style: "margin:0" }, h("input", { type: "checkbox", style: "width:auto", checked: scanBox(key).checked, onchange: (e) => { scanBox(key).checked = e.target.checked; } }), " в скан") : null));
  const rows = [];
  const ideas = meta.strategies.filter((s) => (APPROACH_OF[s.key] || "trend") === approach);
  for (const s of ideas) rows.push(item(s.title, s.verdict.status, s.plain, s.key, [s.side === "short" ? h("span", { class: "badge b-no", style: "margin-left:6px" }, "шорт") : null, s.needsBtcPair ? h("span", { class: "tag", style: "margin-left:6px" }, "только для пар к BTC") : null]));
  if (approach === "flat") {
    rows.push(item("Сетка (грид-бот): спот или фьючерс с плечом", null, "Много лимитных заявок на покупку ниже цены и на продажу выше. Зарабатывает, пока цена ходит в диапазоне; при уходе цены вниз оказывается вся в монете, при уходе вверх — вся в деньгах.", "grid"));
    rows.push(item("Carry: спот + шорт бессрочного фьючерса", null, "Монета на споте и шорт фьючерса на то же количество: цена почти не влияет, доход — фандинг. Текущие ставки — на этапе 1.", "carry"));
  }
  if (approach === "trend" || approach === "revert") rows.push(item("Своя стратегия", null, "Конструктор: правила входа и выхода из нескольких индикаторов сразу.", "custom"));
  if (approach === "accum") rows.push(h("div", { class: "idea" }, h("b", null, "DCA: покупка частями"), h("div", { class: "plain" }, "Покупать на одну и ту же сумму раз в N свечей, пока не кончится бюджет. Это способ растянуть вход во времени, а не обогнать рынок. Запускается как бумажная сессия на этапе 5."),
    h("button", { class: "small", onclick: () => { showTab("paper"); $("dAmount").focus(); } }, "К DCA на этапе 5")));
  const keys = ideas.map((s) => s.key).filter((k) => scanBox(k));
  $("apprIdeas").replaceChildren(h("b", null, "Идеи этого подхода"),
    h("div", { class: "help" }, "Вердикт — из исследований проекта на других данных и периодах; программа может дать другие цифры. «Проверить» откроет идею на этапе 4."),
    ...rows,
    keys.length > 1 ? h("button", { class: "sec", onclick: () => { $("scIdeas").querySelectorAll("input").forEach((x) => (x.checked = keys.includes(x.value))); showTab("test"); testMode("scan"); window.scrollTo(0, 0); } }, `Скан всех идей этого подхода (${keys.length})`) : null);
}

/* ---------- стратегия: описание, параметры, конструктор ---------- */
const S = () => meta.strategies.find((s) => s.key === $("strategy").value);
const isCustom = () => $("strategy").value === "custom";
const isGrid = () => $("strategy").value === "grid";
const isCarry = () => $("strategy").value === "carry";

function onStrategy() {
  $("stratInfo").replaceChildren(); $("params").replaceChildren();
  $("builder").hidden = !isCustom(); $("toBuilder").hidden = isCustom() || isGrid() || !!S()?.weights;
  $("positionPct").disabled = isGrid() || !!(!isCustom() && S()?.weights);
  $("gridBox").hidden = !isGrid();
  $("carryBox").hidden = !isCarry();
  $("advBox").hidden = isGrid() || isCarry(); // у сетки и carry своё плечо и свои издержки фьючерса
  if (isCarry()) {
    $("positionPct").disabled = true; $("toBuilder").hidden = true;
    if (isBtcPair($("symbol").value)) { $("symbol").value = "BTCUSDT"; onSymbol(); }
    if ($("tf").value === "1D" || $("tf").value === "1h") $("tf").value = "4h";
    if (Number($("maxBars").value) === meta.defaultBars) $("maxBars").value = meta.maxBars; // 20 000 свечей 4ч ≈ вся история фьючерса
    return;
  }
  if (isGrid()) { gridInfo(); return; }
  if (isCustom()) {
    if (!custom) custom = emptySpec();
    $("stratInfo").append(h("div", { class: "plain" }, "Своя стратегия: соберите правила из нескольких индикаторов. Покупка происходит, когда выполняются условия входа; продажа — по условиям выхода, стопу, цели, скользящему стопу или по времени. Если ничего из выхода не задано, позиция держится, пока истинны условия входа."));
    renderBuilder();
    return;
  }
  const s = S();
  $("stratInfo").append(
    h("div", { class: "plain" }, h("b", null, s.title), " ", badge(s.verdict.status), s.side === "short" ? h("span", { class: "badge b-no" }, "шорт") : null, h("span", { class: "tag" }, s.group === "project" ? "из исследований проекта" : "классический пример")),
    h("div", { class: "plain" }, s.plain),
    h("details", { class: "box" }, h("summary", null, "Что показало исследование проекта"), h("div", { class: "plain" }, s.verdict.text), h("div", { class: "small-note" }, "Источник: " + s.source)),
    s.needsBtcPair ? h("div", { class: "warn" }, "Эта идея работает только на паре к BTC: выберите в списке «Монета или пара» настоящую пару к BTC (например, SOLBTC) или синтетику (например, SOLUSDT/BTCUSDT — для длинной истории). Результат удобнее смотреть в валюте отчёта BTC.") : "",
  );
  if (s.needsBtcPair && !isBtcPair($("symbol").value)) { const syn = [...$("symbol").options].find((o) => o.value === "SOLUSDT/BTCUSDT"); if (syn) { $("symbol").value = syn.value; onSymbol(); } }
  if (s.needsBtcPair) $("reportCcy").value = "BTC";
  if (s.weights) $("stratInfo").append(h("div", { class: "warn" }, "Доля монеты задаётся параметром идеи ниже; общая настройка «Доля капитала в позиции» для этой идеи отключена. Плечо должно быть 1x."));
  for (const p of s.params) $("params").append(h("div", null, h("label", null, p.label), h("input", { type: "number", value: p.def, min: p.min, max: p.max, step: p.float ? "any" : "1", "data-key": p.key })));
}

/* ---------- монета или пара ---------- */
const isBtcPair = (sym) => sym.includes("/") || (sym.endsWith("BTC") && !sym.endsWith("USDT"));
function fillSymbols() {
  const keep = $("symbol").value, ex = $("exchange").value;
  const sel = $("symbol"); sel.replaceChildren();
  const g1 = h("optgroup", { label: "К USDT" }), g2 = h("optgroup", { label: `К BTC на ${EXN[ex]} (настоящие пары)` }), g3 = h("optgroup", { label: "Синтетика X/BTC из двух пар к USDT (длинная история)" });
  for (const s of meta.symbols) g1.append(new Option(s, s));
  const list = Array.isArray(btcPairs[ex]) ? btcPairs[ex] : [];
  for (const s of list) g2.append(new Option(s, s));
  if (!list.length) g2.append(new Option(btcPairs[ex]?.error ? "список не скачался" : "загружаю список…", "", false, false)), g2.lastChild.disabled = true;
  for (const s of meta.symbols.filter((x) => x !== "BTCUSDT")) g3.append(new Option(`${s.replace("USDT", "")}/BTC (${s} ÷ BTCUSDT)`, s + "/BTCUSDT"));
  sel.append(g1, g2, g3);
  if ([...sel.options].some((o) => o.value === keep && keep)) sel.value = keep;
  onSymbol();
}
function onSymbol() {
  const v = $("symbol").value;
  $("pairInfo").textContent = v.includes("/")
    ? "Синтетика: соотношение двух пар к USDT в одни и те же моменты. Цены открытия и закрытия точные, а максимумы и минимумы внутри свечи неизвестны: стопы и цели проверяются по закрытию, ликвидация — по грубым границам, комиссия удвоена (переход через USDT — две сделки)."
    : isBtcPair(v) ? "Настоящая пара к BTC: цена монеты в биткоинах, сделки за BTC. Результат в котируемой валюте — BTC; «вне рынка» значит «в BTC»." : "";
}
$("exchange").addEventListener("change", fillSymbols);
$("symbol").addEventListener("change", onSymbol);

function emptySpec() { return { side: "long", indicators: [], entry: { match: "all", conditions: [] }, exit: { match: "all", conditions: [] }, maxBars: 0, stopAtr: 0, takeAtr: 0, trailAtr: 0 }; }

$("toBuilder").onclick = () => {
  const s = S(); const params = readParams();
  // пересобираем правила на сервере невозможно без запроса, поэтому используем набор по умолчанию и подставляем параметры локально
  custom = JSON.parse(JSON.stringify(s.spec));
  custom.indicators.forEach((i) => (i.params = i.params || {}));
  $("strategy").value = "custom"; onStrategy();
  $("error").textContent = "Правила стратегии «" + s.title + "» (со значениями по умолчанию) открыты в конструкторе: можно добавлять индикаторы и менять условия.";
  void params;
};

function indDef(id) { return meta.indicators.find((i) => i.id === id); }
function operandOptions() {
  const opts = Object.entries(meta.priceFields).map(([k, v]) => [k, `${k} — ${v}`]);
  for (const it of custom.indicators) { const d = indDef(it.id); if (!d) continue; for (const o of d.outputs) opts.push([d.outputs.length === 1 ? it.name : `${it.name}.${o.key}`, `${it.name}${d.outputs.length === 1 ? "" : "." + o.key} — ${o.label}`]); }
  return opts;
}

function renderBuilder() {
  const b = $("builder"); b.replaceChildren();
  b.append(h("div", { class: "box" }, h("b", null, "Направление сделок"),
    h("div", { class: "inline" }, h("select", { onchange: (e) => { custom.side = e.target.value; renderBuilder(); } },
      h("option", { value: "long", selected: custom.side !== "short" }, "Покупка (лонг): зарабатываем на росте"),
      h("option", { value: "short", selected: custom.side === "short" }, "Шорт: зарабатываем на падении"))),
    h("div", { class: "help" }, custom.side === "short"
      ? "Шорт: «вход» открывает шорт (продаём в долг), «выход» закрывает (выкупаем). Стоп-лосс стоит ВЫШЕ цены входа, цель — ниже, скользящий стоп идёт сверху за минимумом. Убыток при росте цены теоретически не ограничен."
      : "Покупка: «вход» покупает, «выход» продаёт. Стоп-лосс стоит ниже цены входа, цель выше.")));
  // индикаторы
  const addSel = h("select", null, meta.indicators.map((i) => h("option", { value: i.id }, i.title)));
  b.append(h("div", { class: "box" }, h("b", null, "1. Индикаторы"), h("div", { class: "help" }, "Добавьте один или несколько. Каждому можно задать период и другие параметры. Подробное описание — раздел «Индикаторы» в справке."),
    custom.indicators.map((it, idx) => {
      const d = indDef(it.id);
      return h("div", { class: "box" },
        h("div", { class: "inline" },
          h("input", { type: "text", value: it.name, style: "width:110px", onchange: (e) => { it.name = e.target.value.trim(); renderBuilder(); } }),
          h("span", null, d.title),
          d.params.map((p) => h("label", { style: "margin:0;display:inline-flex;gap:4px;align-items:center" }, p.label.split(",")[0], h("input", { type: "number", step: p.float ? "any" : "1", value: it.params[p.key] ?? p.def, style: "width:80px", onchange: (e) => { it.params[p.key] = Number(e.target.value); } }))),
          h("button", { class: "danger small", onclick: () => { custom.indicators.splice(idx, 1); renderBuilder(); } }, "Убрать")),
        h("details", null, h("summary", null, "Что это простыми словами"), h("div", { class: "plain" }, d.plain)));
    }),
    h("div", { class: "inline" }, addSel, h("button", { class: "sec small", onclick: () => {
      const id = addSel.value; let name = id.replace(/[^a-z0-9_]/g, "").slice(0, 11) + indSeq++;
      custom.indicators.push({ name, id, params: {} }); renderBuilder(); } }, "Добавить индикатор"))));
  // условия
  const block = (key, title, hint) => {
    const bl = custom[key];
    const rows = bl.conditions.map((c, idx) => {
      const opts = operandOptions();
      const operand = (side) => {
        const isNum = typeof c[side] === "number";
        const sel = h("select", { onchange: (e) => { c[side] = e.target.value === "__num__" ? 0 : e.target.value; renderBuilder(); } }, opts.map(([v, l]) => h("option", { value: v, selected: !isNum && c[side] === v }, l)), h("option", { value: "__num__", selected: isNum }, "число…"));
        if (!isNum && !opts.some(([v]) => v === c[side])) c[side] = "close", sel.value = "close";
        return [sel, isNum ? h("input", { type: "number", step: "any", value: c[side], style: "width:90px", onchange: (e) => { c[side] = Number(e.target.value); } }) : null];
      };
      return h("div", { class: "inline", style: "margin:4px 0" }, operand("left"), h("select", { onchange: (e) => { c.op = e.target.value; } }, Object.entries(meta.ops).map(([k, v]) => h("option", { value: k, selected: c.op === k }, v))), operand("right"), h("button", { class: "danger small", onclick: () => { bl.conditions.splice(idx, 1); renderBuilder(); } }, "Убрать"));
    });
    return h("div", { class: "box" }, h("b", null, title), h("div", { class: "help" }, hint),
      bl.conditions.length > 1 ? h("div", { class: "inline" }, "Выполняется:", h("select", { onchange: (e) => { bl.match = e.target.value; renderBuilder(); } }, h("option", { value: "all", selected: bl.match === "all" }, "всё сразу (И)"), h("option", { value: "any", selected: bl.match === "any" }, "хотя бы одно (ИЛИ)"))) : null,
      rows, h("button", { class: "sec small", style: "margin-top:6px", onclick: () => { bl.conditions.push({ left: "close", op: ">", right: custom.indicators.length ? operandOptions().find(([v]) => !(v in meta.priceFields))?.[0] ?? 0 : 0 }); renderBuilder(); } }, "Добавить условие"));
  };
  b.append(block("entry", "2. Когда покупать (условия входа)", "Например: цена закрытия больше EMA, а RSI меньше 60."));
  b.append(block("exit", "3. Когда продавать (условия выхода, необязательно)", "Можно оставить пустым и использовать стоп, цель или выход по времени."));
  const num = (key, label) => h("div", null, h("label", null, label), h("input", { type: "number", step: "any", min: 0, value: custom[key], onchange: (e) => { custom[key] = Number(e.target.value); renderBuilder(); } }));
  b.append(h("div", { class: "box" }, h("b", null, "4. Защита и время (0 — выключено)"), h("div", { class: "row" }, num("stopAtr", "Стоп-лосс, ATR ниже входа"), num("takeAtr", "Цель, ATR выше входа"), num("trailAtr", "Скользящий стоп, ATR ниже максимума"), num("maxBars", "Продать через N свечей"))));
  b.append(h("div", { class: "box" }, h("b", null, "Правила словами"), h("div", { class: "plain" }, describe(custom))));
}

function describeCond(c) { return `${typeof c.left === "number" ? c.left : c.left} ${meta.ops[c.op] || c.op} ${typeof c.right === "number" ? c.right : c.right}`; }
function describe(s) {
  const part = (bl) => bl.conditions.map(describeCond).join(bl.match === "any" ? " ИЛИ " : " И ");
  const out = [];
  const sh = s.side === "short";
  out.push(s.entry.conditions.length ? `${sh ? "Открыть шорт" : "Купить"}, когда: ${part(s.entry)}.` : "Условия входа не заданы.");
  if (s.exit.conditions.length) out.push(`${sh ? "Закрыть шорт" : "Продать"}, когда: ${part(s.exit)}.`);
  if (s.stopAtr > 0) out.push(`Стоп-лосс: ${s.stopAtr} ATR ${sh ? "выше" : "ниже"} цены входа.`);
  if (s.takeAtr > 0) out.push(`Цель: ${s.takeAtr} ATR ${sh ? "ниже" : "выше"} цены входа.`);
  if (s.trailAtr > 0) out.push(`Скользящий стоп: ${s.trailAtr} ATR ${sh ? "выше минимума" : "ниже максимума"} после входа.`);
  if (s.maxBars > 0) out.push(`${sh ? "Закрыть шорт" : "Продать"} через ${s.maxBars} свечей после входа.`);
  if (!s.exit.conditions.length && !(s.stopAtr > 0 || s.takeAtr > 0 || s.trailAtr > 0 || s.maxBars > 0)) out.push("Выход: позиция держится, пока истинны условия входа.");
  return out.join(" ");
}

/* ---------- сетка ---------- */
function gridReq() {
  return { mode: $("gMode").value, lowerPct: Number($("gLowPct").value), upperPct: Number($("gUpPct").value), lower: Number($("gLow").value), upper: Number($("gUp").value),
    levels: Number($("gLevels").value), spacing: $("gSpacing").value, stopPx: Number($("gStop").value) || 0, takePx: Number($("gTake").value) || 0,
    intrabar: $("gIntrabar").value, startBuy: $("gStartBuy").checked, ...(perpGrid()
      ? { market: "perp", direction: $("gDir").value, leverage: Number($("gLev").value), perpFeePct: Number($("gPerpFee").value), maintPct: Number($("gMaint").value), trailing: $("gTrailing").checked && $("gDir").value !== "neutral" }
      : { trailing: $("gTrailing").checked }) };
}
const perpGrid = () => $("gMarket").value === "perp";
function gridInfo() {
  const g = gridReq(), pctMode = g.mode === "pct";
  document.querySelectorAll("[data-g]").forEach((el) => (el.hidden = el.dataset.g !== g.mode));
  const pg = perpGrid();
  document.querySelectorAll("#gridBox [data-perp]").forEach((el) => (el.hidden = !pg));
  document.querySelectorAll("#gridBox [data-spot]").forEach((el) => (el.hidden = pg));
  const lo = pctMode ? 1 - g.lowerPct / 100 : g.lower, hi = pctMode ? 1 + g.upperPct / 100 : g.upper;
  if (!(lo > 0 && hi > lo && g.levels >= 3)) { $("gInfo").textContent = "Задайте границы (нижняя меньше верхней) и не меньше 3 уровней."; return; }
  const step = g.spacing === "geom" ? ((hi / lo) ** (1 / (g.levels - 1)) - 1) * 100 : (((hi - lo) / (g.levels - 1)) / lo) * 100;
  const fee = (pg ? Number($("gPerpFee").value) : Number($("fee").value)) || 0;
  const lev = pg ? Math.max(1, Number($("gLev").value) || 1) : 1;
  const levNote = !pg ? "" : g.direction === "neutral" ? ` С плечом ${lev}x круг приносит в ${lev} раза больше от вложения, и во столько же раз быстрее растёт убыток, когда цена уходит из диапазона в любую сторону.`
    : ` С плечом ${lev}x круг приносит в ${lev} раза больше от вложения, и во столько же раз быстрее растёт убыток, когда цена уходит ${g.direction === "short" ? "вверх" : "вниз"} из диапазона. Цена ликвидации на старте видна в результате.`;
  $("gInfo").textContent = `Ячеек: ${g.levels - 1}, шаг ${g.spacing === "geom" ? "" : "у нижней границы "}≈ ${step.toFixed(2)} %. Один круг после комиссии (${fee} % с каждой стороны) приносит примерно ${(step - 2 * fee).toFixed(2)} % от доли ячейки` + (step - 2 * fee <= 0 ? " — то есть убыток: шаг меньше двух комиссий." : ".") + (g.intrabar === "one" ? " Выбран мягкий режим: круги внутри одной свечи засчитываются, это завышает результат." : "") + levNote;
}
["gMarket", "gDir", "gLev", "gPerpFee", "gMaint", "gMode", "gLowPct", "gUpPct", "gLow", "gUp", "gLevels", "gSpacing", "gIntrabar", "fee"].forEach((id) => $(id).addEventListener("input", () => isGrid() && gridInfo()));

function renderGridResult(d) {
  const g = d.grid, q = g.quote, P = (v) => v.toPrecision(6);
  const rows = [
    ["Валюта отчёта", d.reportCcy + (q !== d.reportCcy ? ` (сетка торгует в ${q}, итог пересчитан)` : "")],
    ["Диапазон / уровней / шаг", `${P(g.lower)} — ${P(g.upper)} ${q} / ${g.levels.length} / ${g.stepPct.toFixed(2)} %` + (g.params.mode === "pct" ? " (от цены старта)" : "")],
    ["Итог сетки / удержания монеты", pct(d.strategy.total) + " / " + pct(d.hold.total)],
    [g.perp ? "Из итога: прибыль закрытых кругов / переоценка открытой позиции и стартовые издержки" : `Из итога сетки (в ${q}): прибыль закрытых кругов / переоценка удерживаемых монет и стартовые издержки`, pct(g.gridProfit) + " / " + pct(g.revaluation)],
    ["Кругов (покупка + продажа) за период", String(g.rounds) + (g.params.intrabar === "one" ? " (мягкий режим)" : " (строгий режим)")],
    ["Цена была в диапазоне / ниже / выше (доля свечей)", `${pct0(g.inRangeShare)} / ${pct0(g.belowShare)} / ${pct0(g.aboveShare)}`],
    ["Максимальная просадка сетки / удержания", pct(d.strategy.maxDrawdown) + " / " + pct(d.hold.maxDrawdown)],
    [`t-статистика превосходства над эталоном «${d.benchmarkLabel}»`, d.tExcess.toFixed(2)],
    ["Планка значимости при " + d.attempts + " уникальных попытках" + (d.repeat ? " (повтор — планку не поднял)" : ""), d.plank.toFixed(2)],
    ["Чувствительность к цене монеты (бета)", d.beta.toFixed(2)],
  ];
  if (g.perp) {
    const dirs = { long: "лонг", short: "шорт", neutral: "нейтральная" };
    rows.splice(1, 0, ["Фьючерсная сетка", `${dirs[g.direction]}, плечо ${g.leverage}x, комиссия ${g.fee} % с каждой стороны`]);
    rows.splice(4, 0, ["Из итога: фандинг / все комиссии", `${pct(g.funding)} / ${pct(-g.fees)}`]);
    rows.push(["Позиция к стоимости счёта (фактическое плечо): в среднем / максимум", `${g.avgLev.toFixed(2)}x / ${g.maxLev.toFixed(2)}x`]);
    if (g.ruined) rows.push(["Ликвидация", `${new Date(g.liquidatedAt * 1000).toISOString().slice(0, 16).replace("T", " ")} UTC, цена около ${P(g.liquidationPx)}: вложение потеряно`]);
    else if (!g.stopped) rows.push(["Ликвидация на конец периода, если цена пойдёт в одну сторону и исполнит все заявки на пути", `вниз: ${g.liqDown ? P(g.liqDown) + " (" + pct(g.liqDown / g.lastPx - 1) + ")" : "не наступит"}; вверх: ${g.liqUp ? P(g.liqUp) + " (" + pct(g.liqUp / g.lastPx - 1) + ")" : "не наступит"}`]);
  }
  if (g.params.trailing) rows.push([`Сдвигов сетки ${g.perp && g.direction === "short" ? "вниз" : "вверх"} (трейлинг)`, String(g.trailShifts)]);
  if (g.stopped && !g.ruined) rows.push(["Сетка остановлена", g.stopped === "стоп" ? "по стоп-лоссу" : "по тейк-профиту"]);
  rows.push(["Заявки на конец периода", g.stopped ? "нет (сетка остановлена)" : `${g.orders.filter((o) => o.side === "buy").length} на покупку, ${g.orders.filter((o) => o.side === "sell").length} на продажу`]);
  $("tbl").replaceChildren(...rows.map(([a, b]) => h("tr", null, h("td", null, a), h("td", { class: a.startsWith("t-") ? (d.significant ? "good" : "bad") : "" }, b))));
  const box = $("gridExtra"); box.replaceChildren();
  box.append(h("div", { class: "help" }, "Прибыль кругов растёт почти всегда — это то, что показывает интерфейс бота. Настоящий итог — с переоценкой монет, которые сетка держит: если цена ушла вниз, сетка купила монету по дороге и несёт её убыток."));
  if (g.lastEvents.length) box.append(h("div", { style: "margin-top:8px" }, h("b", null, "Последние сделки сетки (прибыль круга — в доле всего вложения)")),
    table(["Время (UTC)", "Сделка", "Цена", "Прибыль круга"], g.lastEvents.map((e) => [e.time, (e.side === "liq" ? "ликвидация" : e.side === "buy" ? "покупка" : "продажа") + (e.why && e.side !== "liq" ? ` (${e.why})` : ""), P(e.px), e.profit == null ? "—" : pct(e.profit)])));
  const out = h("div");
  const days = h("select", null, new Option("последние 30 дней", "30"), new Option("последние 60 дней", "60"));
  const btn = h("button", { class: "sec" }, "Сравнить с минутными свечами");
  btn.onclick = async () => {
    btn.disabled = true; btn.textContent = "Скачиваю минутные свечи… (до минуты)"; out.replaceChildren();
    try { renderGridMinutes(out, await api("api/grid/minutes", { ...lastReq, days: Number(days.value) })); } catch (e) { out.replaceChildren(h("div", { class: "err" }, e.message)); }
    btn.disabled = false; btn.textContent = "Сравнить с минутными свечами";
  };
  box.append(h("div", { style: "margin-top:12px" }, h("b", null, "Проверка модели на минутных свечах")),
    h("div", { class: "help" }, `Те же параметры сетки на минутных свечах ${EXN[d.exchange]} и на свечах «${d.tf}» за одно и то же окно. Если на минутных итог заметно хуже, модель на крупных свечах завышает результат и цифрам выше верить нельзя. Около 44–87 запросов к бирже (у синтетики вдвое больше), дальше из кэша; в журнал не пишется.`),
    h("div", { class: "inline" }, days, btn), out);
}
function renderGridMinutes(out, m) {
  const row = (name, x) => [name, String(x.bars), pct(x.total) + (x.ruined ? " (ликвидация)" : ""), pct(x.gridProfit), pct(x.revaluation), String(x.rounds), pct(x.hold)];
  const sel = m[m.chosen], gap = sel.coarse.total - sel.minute.total;
  out.append(table(["Свечи", "Число", "Итог сетки", "Прибыль кругов", "Переоценка", "Кругов", "Удержание"], [
    row(`${m.tf}, строго`, m.strict.coarse), row("1 мин, строго", m.strict.minute), row(`${m.tf}, мягко`, m.one.coarse), row("1 мин, мягко", m.one.minute)]),
    h("div", { class: gap > 0.005 ? "warn" : "help" }, `Окно ${date(sel.minute.from)} — ${date(sel.minute.to)}, результат в ${m.quote}. В выбранном режиме крупные свечи дают ${pct(sel.coarse.total)}, минутные ${pct(sel.minute.total)}: ` +
      (gap > 0.005 ? `модель на крупных свечах завышает итог на ${(gap * 100).toFixed(1)} п.п.` : "заметного завышения на этом окне нет (на другом окне может быть иначе).") + " Минутные свечи тоже не знают порядка движения внутри минуты, но ошибка там гораздо меньше."));
}

/* ---------- carry ---------- */
function carryReq() {
  return { payments: Number($("cN").value), entryApr: Number($("cIn").value), exitApr: Number($("cOut").value), emergencyApr: Number($("cEm").value), perpFeePct: Number($("cPerpFee").value), haircut: Number($("cHaircut").value) };
}
function renderCarryResult(d) {
  const c = d.carry;
  const rows = [
    ["Валюта отчёта", d.reportCcy],
    ["Итог carry / удержания монеты", pct(d.strategy.total) + " / " + pct(d.hold.total)],
    ["Среднегодовая доходность carry", pct(d.strategy.cagr)],
    ["Из итога (в USDT): фандинг / комиссии и проскальзывание / базис и прочее", `${pct(c.fundingIncome)} / ${pct(-c.feesPaid)} / ${pct(c.basisAndOther)}`],
    ["Максимальная просадка carry / удержания", pct(d.strategy.maxDrawdown) + " / " + pct(d.hold.maxDrawdown)],
    ["Доля времени в позиции / сделок", `${pct0(c.exposure)} / ${c.trades}`],
    [`t-статистика превосходства над эталоном «${d.benchmarkLabel}»`, d.tExcess.toFixed(2)],
    ["Планка значимости при " + d.attempts + " уникальных попытках" + (d.repeat ? " (повтор — планку не поднял)" : ""), d.plank.toFixed(2)],
    ["Средняя ставка фандинга на конец периода / за 7 дней, % годовых", `${c.lastMa == null ? "—" : c.lastMa.toFixed(1)} / ${c.apr7 == null ? "—" : c.apr7.toFixed(1)}`],
    ["Что программа сделает на открытии следующей свечи", { buy: "войти: купить спот и продать фьючерс", sell: "выйти: продать спот и выкупить фьючерс", hold: "держать позицию", wait: "ждать: ставка ниже порога входа" }[c.action]],
  ];
  if (c.liquidations) rows.splice(5, 0, ["Ликвидаций фьючерса", String(c.liquidations)]);
  $("tbl").replaceChildren(...rows.map(([a, b]) => h("tr", null, h("td", null, a), h("td", { class: a.startsWith("t-") ? (d.significant ? "good" : "bad") : "" }, b))));
  const box = $("gridExtra"); box.replaceChildren();
  box.append(h("div", { style: "margin-top:8px" }, h("b", null, "По годам")),
    table(["Год", "Доходность carry", "Время в позиции"], c.years.map((y) => [String(y.year), pct(y.ret), pct0(y.inPos)])),
    h("div", { class: "help" }, "Carry зарабатывает только в «горячем» рынке, когда лонги переплачивают. В холодном рынке ставка ниже порога, и правило годами не входит — это свойство идеи, а не ошибка."));
  if (c.trades10.length) box.append(h("div", { style: "margin-top:8px" }, h("b", null, "Последние сделки")),
    table(["Вход", "Выход", "Результат"], c.trades10.map((t) => [date(t.from), t.open ? "открыта" : date(t.to) + (t.why ? ` (${t.why})` : ""), pct(t.ret)])));
}

/* ---------- этап 1: монеты ---------- */
// Добавленные монеты и отметки «в работу» хранятся только в этом браузере.
const COINS_KEY = "polygon.coins", SYMBOL_BASE = [];
const coinStore = (() => { try { return JSON.parse(localStorage.getItem(COINS_KEY)) || {}; } catch { return {}; } })();
const coinSave = () => { try { localStorage.setItem(COINS_KEY, JSON.stringify(coinStore)); } catch { /* без хранилища — до перезагрузки */ } };
let coinData = null, coinSeq = 0;
// ничего не отмечено вручную — отмечены все
const picked = () => new Set(coinStore.picked ? coinStore.picked.filter((s) => meta.symbols.includes(s)) : meta.symbols);
const turnover = (x) => x >= 1e9 ? (x / 1e9).toFixed(1) + " млрд" : x >= 1e6 ? (x / 1e6).toFixed(1) + " млн" : Math.round(x / 1e3) + " тыс.";
// отмеченные монеты — выбор монет в скане
function syncScanCoins() {
  const p = picked();
  $("scSyms").querySelectorAll("input").forEach((x) => (x.checked = p.has(x.value)));
  $("coinPicked").textContent = `Отмечено: ${p.size} из ${meta.symbols.length}`;
  renderWizard();
  if (!$("tab-test").hidden && !$("scanPane").hidden) scanPlanUpdate();
}
async function loadCoins(refresh = false) {
  const seq = ++coinSeq;
  $("coinError").textContent = ""; $("coinRefresh").disabled = true; $("coinRefresh").textContent = "Загружаю…";
  if (!coinData) $("coinTable").replaceChildren(h("div", { class: "help" }, "Скачиваю дневные свечи и фандинг… В первый раз это занимает до минуты на компьютере и до 2–3 минут на телефоне, дальше — из кэша."));
  try {
    const d = await api("api/coins", { exchange: $("exchange").value, symbols: meta.symbols, refresh });
    if (seq === coinSeq) { coinData = d; renderCoins(); }
  } catch (e) { if (seq === coinSeq) $("coinError").textContent = e.message; }
  if (seq === coinSeq) { $("coinRefresh").disabled = false; $("coinRefresh").textContent = "Обновить"; }
}
function renderCoins() {
  const d = coinData, p = picked(), td = (x, cls, title) => h("td", { class: cls, title }, x);
  const toggle = (s, on) => { const q = picked(); on ? q.add(s) : q.delete(s); coinStore.picked = [...q]; coinSave(); syncScanCoins(); };
  const rows = d.rows.map((r) => {
    const chk = h("td", null, h("input", { type: "checkbox", style: "width:auto", checked: p.has(r.symbol), onchange: (e) => toggle(r.symbol, e.target.checked) }));
    const name = h("td", null, r.symbol, SYMBOL_BASE.includes(r.symbol) ? null : h("button", { class: "small sec", style: "margin-left:6px;padding:1px 6px", title: "Убрать из списка", onclick: () => removeCoin(r.symbol) }, "×"));
    if (r.error) return h("tr", null, chk, name, h("td", { colspan: 8, class: "err" }, r.error));
    return h("tr", null, chk, name,
      td(`${r.historyFull ? "с " : "не меньше, с "}${date(r.from)} (${r.years.toFixed(1)} г.)`, r.years < 3 ? "bad" : ""),
      td(turnover(r.turnover30), r.turnover30 < 1e6 ? "bad" : ""),
      td(r.vol1y == null ? "—" : pct0(r.vol1y)), td(r.ret1y == null ? "—" : pct0(r.ret1y)),
      td(pct0(r.maxDD), "", `с ${date(r.ddFrom)} по ${date(r.ddTo)}`), td(pct0(r.belowPeak)),
      td(r.corrBtc == null ? (r.symbol === "BTCUSDT" ? "это BTC" : "—") : r.corrBtc.toFixed(2)),
      td(r.funding30 == null ? "нет фьючерса" : r.funding30.toFixed(1) + " %"));
  });
  const last = d.rows.filter((r) => r.to).map((r) => r.to);
  $("coinTable").replaceChildren(h("table", null, h("tr", null, ["В работу", "Монета", "История", "Оборот в день, USDT", "Размах за год", "За год", "Худшее падение", "Ниже максимума", "Связь с BTC", "Фандинг, 30 дн."].map((x) => h("th", null, x))), ...rows),
    h("div", { class: "small-note" }, `${EXN[d.exchange]}, дневные свечи${last.length ? " по " + date(Math.max(...last)) + " включительно" : ""}. Красным — мало истории (меньше 3 лет) или маленький оборот (меньше 1 млн USDT в день).`));
  syncScanCoins();
}
function coinsChanged() { fillSymbols(); scanFill(); syncScanCoins(); loadCoins(); }
function removeCoin(s) {
  meta.symbols = meta.symbols.filter((x) => x !== s);
  coinStore.extra = (coinStore.extra || []).filter((x) => x !== s);
  if (coinStore.picked) coinStore.picked = coinStore.picked.filter((x) => x !== s);
  coinSave(); coinsChanged();
}
$("coinAddBtn").onclick = () => {
  let s = $("coinAdd").value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s && !s.endsWith("USDT")) s += "USDT";
  if (!/^[A-Z0-9]{2,15}USDT$/.test(s)) { $("coinError").textContent = "Тикер монеты к USDT, например SUI или SUIUSDT"; return; }
  if (meta.symbols.includes(s)) { $("coinError").textContent = s + " уже в списке"; return; }
  meta.symbols.push(s); coinStore.extra = [...(coinStore.extra || []), s];
  if (coinStore.picked) coinStore.picked.push(s);
  coinSave(); $("coinAdd").value = ""; coinsChanged();
};
$("coinAdd").onkeydown = (e) => { if (e.key === "Enter") $("coinAddBtn").click(); };
$("coinRefresh").onclick = () => loadCoins(true);
$("coinToScan").onclick = () => { syncScanCoins(); showTab("test"); testMode("scan"); window.scrollTo(0, 0); };
$("exchange").addEventListener("change", () => { coinData = null; if (!$("tab-coins").hidden) loadCoins(); });

/* ---------- этап 2: состояние рынка ---------- */
let stateData = null, stateSeq = 0;
async function loadState(refresh = false) {
  const seq = ++stateSeq, syms = [...picked()];
  $("stCoins").textContent = `Монеты с этапа 1: ${syms.length}`;
  $("stError").textContent = ""; $("stRefresh").disabled = true; $("stRefresh").textContent = "Загружаю…";
  if (!stateData) $("stTable").replaceChildren(h("div", { class: "help" }, "Скачиваю дневные свечи… В первый раз это занимает до минуты на компьютере и до 2–3 минут на телефоне, дальше — из кэша."));
  try {
    const d = await api("api/state", { exchange: $("exchange").value, symbols: syms, refresh });
    if (seq === stateSeq) { stateData = d; renderState(); }
  } catch (e) { if (seq === stateSeq) $("stError").textContent = e.message; }
  if (seq === stateSeq) { $("stRefresh").disabled = false; $("stRefresh").textContent = "Обновить"; }
}
const pctRank = (p) => (p == null ? "" : `, ${Math.round(p * 100)}-й процентиль`);
function renderState() {
  const d = stateData, td = (x, title) => h("td", { title }, x);
  const rows = d.rows.map((r) => {
    if (r.error) return h("tr", null, h("td", null, r.symbol), h("td", { colspan: 7, class: "err" }, r.error));
    const t = r.trend, f = r.forward;
    return h("tr", null, h("td", null, r.symbol),
      td([h("b", { class: t.above ? "good" : "bad" }, t.above ? "выше" : "ниже"), ` на ${pct0(Math.abs(t.gapPct))}, ${t.age} дн.`], `с ${date(t.since)}; пересечений средней за последний год: ${t.switchesYear}`),
      td(t.pastCount ? `${t.pastCount} раз${[2, 3, 4].includes(t.pastCount % 10) && ![12, 13, 14].includes(t.pastCount % 100) ? "а" : ""}, обычно ${Math.round(t.pastMedian)} дн.` : "раньше не было"),
      td(t.longer == null ? "—" : `${pct0(t.longer)} из ${t.reached}`),
      td(`${pct0(r.vol.value)}: ${r.vol.level}`, `годовая волатильность за 30 дней${pctRank(r.vol.pct)}`),
      td(`${r.clean.value.toFixed(2)}: ${r.clean.level}`, `коэффициент эффективности за 30 дней${pctRank(r.clean.pct)}`),
      td(r.bands.squeeze ? h("b", null, "сжатие") : "нет", `ширина полос ${pct(r.bands.value)}${pctRank(r.bands.pct)}`),
      td(f.upSame == null ? "—" : `рост в ${pct0(f.upSame)} случаев против ${pct0(f.upAll)} во все дни`, `медиана через ${f.horizon} дней: ${pct(f.medSame)} против ${pct(f.medAll)}; дней в том же положении: ${f.nSame}, независимых наблюдений ≈ ${f.independent}`));
  });
  $("stTable").replaceChildren(h("table", null, h("tr", null, ["Монета", "Относительно средней 200", "Прошлые такие периоды", "Дольше продлились", "Размах за 30 дней", "Чистота движения", "Сжатие полос", "Что было дальше (30 дней)"].map((x) => h("th", null, x))), ...rows),
    h("div", { class: "small-note" }, `${EXN[d.exchange]}, дневные свечи по ${date(Math.max(...d.rows.filter((r) => r.t).map((r) => r.t), 0))} включительно. Наведите на ячейку, чтобы увидеть подробности.`));
  if (!$("tab-state").hidden && d.rows.some((r) => !r.error)) { wiz.stateSeen = true; wizSave(); renderWizard(); }
}
$("stRefresh").onclick = () => loadState(true);
$("exchange").addEventListener("change", () => { stateData = null; if (!$("tab-state").hidden) loadState(); });

/* ---------- сторож ставок ---------- */
async function loadRates(refresh = false) {
  $("rError").textContent = ""; $("rRefresh").disabled = true; $("rRefresh").textContent = "Загружаю…";
  try {
    const r = await api("api/rates", { refresh });
    const thr = Number($("rThr").value) || 0;
    const cell = (v) => h("td", { class: v != null && v > thr ? "good" : "" }, v == null ? "—" : v.toFixed(1) + " %");
    const best = {};
    for (const x of r.funding) if (!x.error && x.apr7 != null && !(best[x.symbol]?.apr7 >= x.apr7)) best[x.symbol] = x;
    $("rFunding").replaceChildren(h("table", null, h("tr", null, ["Монета", "Биржа", "Средняя за 7 дней", "Средняя за 30 дней", "Последняя выплата", "Интервал"].map((x) => h("th", null, x))),
      ...r.funding.map((x, i) => {
        const first = i === 0 || r.funding[i - 1].symbol !== x.symbol, ex = h("td", null, best[x.symbol] === x ? h("b", null, EXN[x.exchange]) : EXN[x.exchange]);
        const coin = h("td", { style: first ? "border-top:2px solid var(--line, #444)" : "" }, first ? x.symbol : "");
        return x.error ? h("tr", null, coin, ex, h("td", { colspan: 4, class: "err" }, x.error))
          : h("tr", null, coin, ex, cell(x.apr7), cell(x.apr30), cell(x.lastApr), h("td", null, x.intervalH ? x.intervalH + " ч" : "—"));
      })));
    const fut = r.futures.filter((x) => !x.error);
    $("rFutures").replaceChildren(fut.length ? h("table", null, h("tr", null, ["Биржа", "Контракт", "Тип", "Экспирация", "Дней", "Базис", "Годовых", "Оборот за сутки"].map((x) => h("th", null, x))),
      ...fut.map((x) => h("tr", null, h("td", null, EXN[x.exchange]), h("td", null, x.symbol), h("td", null, x.kind), h("td", null, date(x.delivery)), h("td", null, x.days.toFixed(0)), h("td", null, x.basisPct.toFixed(2) + " %"), cell(x.apr), h("td", null, (x.turnover24h >= 1e6 ? (x.turnover24h / 1e6).toFixed(1) + " млн" : Math.round(x.turnover24h).toLocaleString("ru-RU")) + (x.inverse ? " " + x.base : " USDT")))))
      : h("div", { class: "help" }, "Срочных фьючерсов по этим монетам сейчас нет."),
      ...r.futures.filter((x) => x.error).map((x) => h("div", { class: "err" }, x.error)),
      h("div", { class: "small-note" }, "Данные на " + dt(r.time) + " UTC. У контрактов с маленьким оборотом цена покупателя может быть случайной."));
  } catch (e) { $("rError").textContent = e.message; }
  $("rRefresh").disabled = false; $("rRefresh").textContent = "Обновить";
}
$("rRefresh").onclick = () => loadRates(true);
$("rThr").oninput = () => loadRates(false);

function readParams() { const p = {}; document.querySelectorAll("#params input").forEach((i) => (p[i.dataset.key] = Number(i.value))); return p; }
function currentReq() {
  return { exchange: $("exchange").value, symbol: $("symbol").value, tf: $("tf").value, strategy: $("strategy").value,
    params: isCustom() ? {} : readParams(), spec: isCustom() ? custom : undefined, feePct: Number($("fee").value), slipPct: Number($("slip").value),
    leverage: Number($("lev").value), carryPct: Number($("carry").value), maintPct: Number($("maint").value),
    reportCcy: $("reportCcy").value, maxBars: Number($("maxBars").value), benchmark: $("benchmark").value, cashYieldPct: Number($("cashYield").value), cashFlat: $("cashFlat").checked, positionPct: Number($("positionPct").value), grid: isGrid() ? gridReq() : undefined, carry: isCarry() ? carryReq() : undefined, fundingHistory: $("fundHist").checked };
}

/* ---------- график ---------- */
function draw(canvas, series, keys) {
  const g = canvas.getContext("2d"); g.clearRect(0, 0, canvas.width, canvas.height);
  if (!series.length) return;
  const all = series.flatMap((p) => keys.map((k) => p[k.key])), lo = Math.min(...all), hi = Math.max(...all);
  const x = (i) => 10 + (i / (series.length - 1 || 1)) * (canvas.width - 20), y = (v) => canvas.height - 15 - ((v - lo) / (hi - lo || 1)) * (canvas.height - 30);
  keys.forEach((k, n) => {
    g.beginPath(); g.strokeStyle = k.color; g.lineWidth = 2;
    series.forEach((p, i) => (i ? g.lineTo(x(i), y(p[k.key])) : g.moveTo(x(i), y(p[k.key])))); g.stroke();
    g.fillStyle = k.color; g.fillText(T(k.label), 14 + n * 150, 14);
  });
}

/* ---------- проверка ---------- */
// Главное одной строкой: обогнала ли эталон и прошла ли планку. Подробности — в вердикте и таблице ниже.
function sumLine(d) {
  const ref = d.benchmarks?.find((b) => b.chosen), yes = (v) => h("b", { class: v ? "good" : "bad" }, v ? "да" : "нет");
  const beat = ref ? d.strategy.total > ref.total : null;
  lastCheck = { strategy: lastReq?.strategy, symbol: lastReq?.symbol, beat, tExcess: d.tExcess, plank: d.plank, benchmarkLabel: d.benchmarkLabel };
  $("sumLine").replaceChildren(
    `Обогнала эталон «${d.benchmarkLabel}»: `, beat == null ? "—" : yes(beat), ref ? ` (${pct(d.strategy.total)} против ${pct(ref.total)})` : "",
    " · Выше планки: ", yes(d.tExcess > d.plank), ` (t = ${d.tExcess.toFixed(2)} при планке ${d.plank.toFixed(2)})`);
}
$("run").onclick = async () => {
  $("error").textContent = ""; $("run").disabled = true; $("run").textContent = "Считаю…";
  try {
    lastReq = currentReq(); $("analysis").hidden = true;
    const d = await api(isGrid() ? "api/grid" : isCarry() ? "api/carry" : "api/test", lastReq);
    $("deep").hidden = !!(d.grid || d.carry); $("toPaper").hidden = false; $("gridExtra").replaceChildren();
    $("result").hidden = false; $("verdict").textContent = d.verdict; sumLine(d);
    const keys = [{ key: "h", color: "#8b95a3", label: "Удержание монеты" }, { key: "s", color: "#2f7de1", label: d.grid ? "Сетка" : d.carry ? "Carry" : "Идея" }, { key: "d", color: "#b07fe0", label: d.grid ? "50/50 без сетки" : "Разбавленное" }];
    if (d.benchmark !== "coin") keys.splice(1, 0, { key: "r", color: "#e0b341", label: d.benchmarkLabel });
    draw($("chart"), d.series, keys);
    $("chartLegend").textContent = `${d.symbol}${d.pair.kind === "synthetic" ? " (синтетика)" : ""}. Период: ${date(d.from)} — ${date(d.to)} (${d.bars} свечей, ${d.years.toFixed(1)} лет). Все цифры и кривые — в ${d.reportCcy}${d.pair.quote !== d.reportCcy ? ` (пересчитано из ${d.pair.quote})` : ""}; кривые — рост капитала от 1.`;
    $("historyHint").textContent = d.years < 6 ? `Проверка охватывает только ${d.years.toFixed(1)} лет. Проверьте на Binance с 2017 года (выберите биржу Binance${$("tf").value !== "1D" ? ", свечу 1 день" : ""}): короткая история может не содержать обвалов вроде 2018 года, и результат с плечом может оказаться совсем другим.` : "";
    const rows = [
      [`Валюта отчёта`, d.reportCcy],
      ["Доходность идеи / удержания", pct(d.strategy.total) + " / " + pct(d.hold.total)],
      ["Среднегодовая доходность идеи / удержания", pct(d.strategy.cagr) + " / " + pct(d.hold.cagr)],
      ["Максимальная просадка (глубина падения от пика) идеи / удержания", pct(d.strategy.maxDrawdown) + " / " + pct(d.hold.maxDrawdown)],
      d.weights ? ["Ребалансировок (считая первую покупку) / средняя доля монеты в счёте", d.strategy.trades + " / " + pct(d.strategy.exposure)]
        : ["Число сделок / доля времени в рынке" + (d.positionPct < 100 ? ` (в каждой сделке ${d.positionPct} % капитала)` : ""), d.strategy.trades + " / " + pct(d.strategy.exposure)],
      [`t-статистика превосходства над эталоном «${d.benchmarkLabel}» (мера «насколько отличается от шума»)`, d.tExcess.toFixed(2)],
      ["Планка значимости при " + d.attempts + " уникальных попытках" + (d.repeat ? " (эта настройка уже проверялась — повтор планку не поднял)" : ""), d.plank.toFixed(2)],
      ["Лет данных / лет, нужных, чтобы отличить от удачи", d.years.toFixed(1) + " / " + (d.yearsToSignificance == null ? "никогда (идея хуже эталона)" : d.yearsToSignificance.toFixed(1))],
      ["Чувствительность к цене актива (бета)", d.beta.toFixed(2)],
      ["Что программа сделает на открытии следующей свечи", (d.weights ? { buy: "купить целевую долю", rebalance: "вернуть долю монеты к цели", hold: `держать: доля монеты ${pct(d.endShare ?? 0)}, в пределах допуска`, wait: "ждать" } : d.side === "short" ? { buy: "открыть шорт", sell: "закрыть шорт", hold: "держать шорт", wait: "ждать сигнала" } : { buy: "купить", sell: "продать", hold: "держать", wait: "ждать сигнала" })[d.endAction]],
    ];
    if (d.side === "short" || d.leverage > 1) rows.splice(3, 0, ["Направление / плечо", (d.side === "short" ? "шорт" : "покупка") + " / " + d.leverage + "x"]);
    if (d.leverage > 1 || d.side === "short") rows.splice(4, 0, ["Ликвидаций (принудительных закрытий, счёт обнуляется)", String(d.liquidations || 0)]);
    if (d.endLiqPx) rows.push(["Цена ликвидации текущей позиции", d.endLiqPx.toFixed(4)]);
    $("tbl").replaceChildren(...rows.map(([a, b]) => h("tr", null, h("td", null, a), h("td", { class: a.startsWith("t-") ? (d.significant ? "good" : "bad") : "" }, b))));
    if (d.grid) renderGridResult(d);
    if (d.carry) { renderCarryResult(d); keys.pop(); draw($("chart"), d.series, keys); }
    renderBenchTable(d);
    $("notes").textContent = d.notes.join(" "); loadJournal();
  } catch (e) { $("error").textContent = e.message; }
  $("run").disabled = false; $("run").textContent = "Проверить";
};

function renderBenchTable(d) {
  const rows = [["Идея", d.strategy.total, d.strategy.cagr, d.strategy.maxDrawdown, "—", false]];
  for (const b of d.benchmarks) rows.push([b.label[0].toUpperCase() + b.label.slice(1) + (b.chosen ? " (выбран)" : ""), b.total, b.cagr, b.maxDrawdown, b.tExcess.toFixed(2), b.chosen]);
  const dl = d.diluted;
  if (!dl) {
    const nm = (n) => (n === "Идея" ? (d.carry ? "Carry" : "Сетка") : n);
    $("benchTbl").replaceChildren(table(["", "Доходность", "Годовых", "Макс. просадка", d.carry ? "t carry против этого эталона" : "t сетки против этого эталона"], rows.map(([n, t, c, m, tt, ch]) => [ch ? h("b", null, nm(n)) : nm(n), pct(t), pct(c), pct(m), tt])));
    return;
  }
  const rest = dl.restIn === "BTC" ? "в BTC" : "в кэше";
  rows.push([`Разбавленное удержание: ${pct0(dl.share)} монеты, остальное ${rest}`, dl.total, dl.cagr, dl.maxDrawdown, "—", false]);
  $("benchTbl").replaceChildren(
    table(["", "Доходность", "Годовых", "Макс. просадка", "t идеи против этого эталона"], rows.map(([n, t, c, m, tt, ch]) => [ch ? h("b", null, n) : n, pct(t), pct(c), pct(m), tt])),
    h("div", { class: "help" }, dl.capped
      ? `Разбавленное удержание: просадка идеи (${pct(d.strategy.maxDrawdown)}) глубже, чем у удержания всей суммы (${pct(dl.maxDrawdown)}), — сравнение при равном риске без плеча невозможно, показано удержание 100 %.`
      : `Разбавленное удержание — честное сравнение при равном риске: держим постоянную долю монеты (${pct0(dl.share)}), остальное ${dl.restIn === "BTC" ? "в BTC" : `в кэше под ${$("cashYield").value} % годовых`}, и возвращаем долю, когда она отклонилась больше чем на 20 % от целевой (сделок: ${dl.trades}). Доля подобрана так, чтобы максимальная просадка совпала с просадкой идеи. Если идея зарабатывает меньше разбавленного удержания, её «защита от просадок» дороже, чем просто держать меньше монеты.`));
}

function renderAnalysis(a) {
  const body = $("deepBody"); body.replaceChildren();
  const sec = (title, ...c) => h("div", { style: "margin-top:14px" }, h("b", null, title), c);
  body.append(sec("Сильные стороны", list(a.strengths, "good")), sec("Слабые стороны", list(a.weaknesses, "bad")));
  if (a.leverage > 1 || a.side === "short") {
    body.append(sec("0. Направление и плечо",
      h("div", { class: "help" }, `Направление: ${a.side === "short" ? "шорт" : "покупка"}, плечо ${a.leverage}x, ликвидаций: ${a.liquidations}.` + (a.unleveraged ? ` Без плеча та же идея дала бы ${pct(a.unleveraged.total)} при максимальной просадке ${pct(a.unleveraged.maxDrawdown)}; с плечом ${pct(a.total)} и ${pct(a.maxDrawdown)}.` : ""))));
  }
  if (a.notes?.length) body.prepend(h("div", { class: "warn" }, a.notes.join(" ")));
  const t = a.trades, native = a.pair.quote !== a.reportCcy;
  body.append(sec("1. Сделки и зависимость от лучших",
    a.weights ? h("div", { class: "help" }, `У постоянной доли нет отдельных сделок со входом и выходом: монета держится всё время, а ${a.rebalances} раз доля возвращалась к цели (считая первую покупку). Поэтому проверка «без лучших сделок» здесь не применяется. Итог ${pct(native ? t.totalNative : a.total)}.`) : h("div", { class: "help" }, `Сделок ${t.count}, прибыльных ${t.wins}. Лучшая ${pct(t.best)}, худшая ${pct(t.worst)}. Итог идеи ${pct(native ? t.totalNative : a.total)}; без лучшей сделки ${pct(t.withoutBest)}; без двух лучших ${pct(t.withoutTwoBest)}.` + (native ? ` Сделки считаются в валюте пары (${a.pair.quote}), остальные разделы — в ${a.reportCcy}.` : "")),
    table(["Лучшие сделки", "Вход", "Выход", "Результат"], a.tradeList.map((x, i) => [String(i + 1), date(x.from), x.open ? "открыта" : date(x.to), pct(x.ret) + (x.liquidated ? " (ликвидация)" : "")]))));
  body.append(sec("2. Сдвиг исполнения на одну свечу", h("div", { class: "help" }, `Если входить и выходить на свечу позже, итог идеи ${pct(a.shift.total)} (без сдвига ${pct(a.total)}). Сильное падение значит, что результат держится на точном моменте входа.`)));
  const n = a.neighbours;
  const pos = { base: "лучший вариант — ваши исходные параметры", inside: "лучший вариант — внутри проверенной сетки (не на краю)", edge: "лучший вариант — на краю проверенной сетки (половина или удвоение исходного значения): оптимум может лежать за её пределами, или это случайный выброс" }[n.bestPosition] || "";
  body.append(sec("3. Соседние параметры", h("div", { class: "help" }, `Проверено ${n.variants} вариантов вокруг ваших значений (от половины до удвоенного). Итог: минимум ${pct(n.min)}, медиана ${pct(n.median)}, максимум ${pct(n.max)}. Обгоняют удержание монеты ${pct0(n.beatHoldShare)} вариантов, в плюсе ${pct0(n.positiveShare)}. Лучший: ${JSON.stringify(n.best.params)} (${pct(n.best.total)}); худший: ${JSON.stringify(n.worst.params)} (${pct(n.worst.total)}). Эти варианты в журнал попыток не записаны, но выбор лучшего среди них был бы самообманом.`),
    h("div", { class: "box" }, h("b", null, "Сводка: "), `${pos}. `, n.sameSignShare == null ? "Соседей нет." : `Исходные параметры ${n.baseBeatsBench ? "обгоняют" : "не обгоняют"} эталон «${a.benchmarkLabel}»; тот же результат (${n.baseBeatsBench ? "обгон" : "отставание"}) у ${pct0(n.sameSignShare)} соседних вариантов. ${n.sameSignShare >= 0.7 ? "Знак устойчив к выбору параметров." : "Знак зависит от выбора параметров — признак подгонки или случайности."}`)));
  const st = a.starts;
  body.append(sec("4. Чувствительность к дате старта", h("div", { class: "help" }, "Та же идея, начатая 1 января и 1 июля каждого года. Индикаторы считаются по всей истории (разминка до даты старта), сделок до старта нет. Все цифры — от даты старта до конца данных."),
    h("div", { class: "box" }, st.summary),
    st.rows.length ? table(["Старт", "Лет", "Идея", "Удержание монеты", "Удержание BTC", "Кэш", "Обогнала эталон"], st.rows.map((r) => [date(r.t), r.years.toFixed(1), pct(r.strategy) + (r.liquidated ? " (ликвидация)" : ""), pct(r.coin), r.btc == null ? "нет данных" : pct(r.btc), pct(r.cash), r.beat == null ? "—" : h("span", { class: r.beat ? "good" : "bad" }, r.beat ? "да" : "нет")])) : null));
  body.append(sec("5. По годам", table(["Год", "Идея", "Удержание монеты", "Удержание BTC", "Кэш"], a.years.map((y) => [y.year + (y.bars < 300 && a.tf === "1D" ? " (неполный)" : ""), pct(y.strategy), pct(y.hold), pct(y.btc), pct(y.cash)]))));
  const cs = a.coinStats;
  body.append(sec("6. Другие монеты (те же правила)", cs ? h("div", { class: "help" }, `Монет: ${cs.count}. Медианный результат идеи ${pct(cs.medianStrategy)}, удержания ${pct(cs.medianHold)}. В плюсе ${pct0(cs.positiveShare)}, обгоняют удержание ${pct0(cs.beatHoldShare)}.${a.skippedCoins.length ? " Не удалось скачать: " + a.skippedCoins.join(", ") + "." : ""}`) : h("div", { class: "help" }, "Другие монеты скачать не удалось."),
    a.coins.length ? table(["Монета", "Идея", "Удержание"], a.coins.map((c) => [c.symbol, pct(c.strategy), pct(c.hold)])) : null));
  const v = a.venue;
  body.append(sec("7. Та же монета на другой бирже", v
    ? h("div", null,
      v.common ? h("div", null, h("div", { class: "help" }, `Один и тот же период на обеих биржах: ${date(v.common.from)} — ${date(v.common.to)} (с момента, когда на обеих закончилась разминка индикаторов).`),
        table(["Биржа", "Идея", "Удержание монеты", "Ликвидация"], [
          [a.exchange + " (основная)", pct(v.common.main.total), pct(v.common.main.holdTotal), v.common.main.liquidationAt ? date(v.common.main.liquidationAt) : "нет"],
          [v.exchange, pct(v.common.other.total), pct(v.common.other.holdTotal), v.common.other.liquidationAt ? date(v.common.other.liquidationAt) : "нет"]])) : null,
      h("div", { class: "box" }, h("b", null, "Вывод: "), v.explain),
      h("details", null, h("summary", null, "Полная история каждой биржи (периоды разные, между собой не сравнивать)"),
        table(["Биржа", "Период", "Идея", "Удержание монеты", "Ликвидация"], [
          [a.exchange + " (основная)", date(a.from) + " — " + date(a.to), pct(a.total), pct(a.holdTotal), a.liquidationAt ? date(a.liquidationAt) : "нет"],
          [v.exchange, date(v.from) + " — " + date(v.to), pct(v.total), pct(v.holdTotal), v.liquidationAt ? date(v.liquidationAt) : "нет"]])))
    : h("div", { class: "help" }, "На другой бирже этой монеты нет или данные не скачались.")));
  body.append(h("div", { class: "warn", style: "margin-top:10px" }, `Максимальная просадка идеи ${pct(a.maxDrawdown)} (удержания ${pct(a.holdMaxDrawdown)}); сейчас идея ниже своего пика на ${pct(-a.currentDrawdown)}. Прошлые результаты не гарантируют будущих. Это учебный разбор, не инвестиционный совет.`));
}
$("deep").onclick = async () => {
  if (!lastReq) return;
  $("deepError").textContent = ""; $("deep").disabled = true; $("deep").textContent = "Разбираю…";
  try { const d = await api("api/analysis", lastReq); renderAnalysis(d); $("analysis").hidden = false; $("analysis").scrollIntoView({ behavior: "smooth" }); }
  catch (e) { $("deepError").textContent = e.message; }
  $("deep").disabled = false; $("deep").textContent = "Полный разбор стратегии";
};

async function loadJournal() {
  const j = await api("api/journal");
  const title = (e) => (e.strategy === "custom" ? "Своя стратегия" : e.strategy === "carry" ? `Carry: вход > ${e.params.entryApr} %, выход < ${e.params.exitApr} %, N=${e.params.payments}` : e.strategy === "grid" ? `Сетка ${e.params.levels} ур., ${e.params.mode === "pct" ? `−${e.params.lowerPct}…+${e.params.upperPct} %` : `${e.params.lower}–${e.params.upper}`}${e.params.intrabar === "one" ? ", мягко" : ""}` : meta.strategies.find((s) => s.key === e.strategy)?.title || e.strategy);
  const unique = j.filter((e) => e.repeatOf == null).length;
  const bar = Math.max(1.96, Math.sqrt(2 * Math.log(Math.max(unique, 1)))); // та же формула, что lib/stats.js plank
  wizJournal = j; plankNow = bar; renderWizard();
  $("journalPill").replaceChildren(`Журнал: ${unique} попыт${unique % 10 === 1 && unique % 100 !== 11 ? "ка" : [2, 3, 4].includes(unique % 10) && ![12, 13, 14].includes(unique % 100) ? "ки" : "ок"} · планка `, h("b", null, bar.toFixed(2).replace(".", ",")));
  $("journalPill").title = "Число уникальных проверок в журнале и требование к t-статистике. Подробнее — в справке.";
  $("journalPill").onclick = () => { showTab("ref"); refMode("plank"); };
  $("journalSummary").textContent = `Записей ${j.length}, уникальных попыток ${unique}. Планка считается по уникальным: повтор той же настройки (та же биржа, монета, свеча, идея, параметры, плечо, издержки, эталон и длина истории) — не новая гипотеза, даже если за это время добавились свечи и цифры сдвинулись.`;
  $("journal").replaceChildren(h("tr", null, ["#", "Дата", "Биржа", "Монета", "Идея", "t", "Идея / удержание", "Попытка"].map((x) => h("th", null, x))),
    ...journalRows(j).slice(0, 15).map(({ e, i, scan }) => scan ? h("tr", { class: "tag" }, [String(i + 1) + (scan.n > 1 ? "–" + (i + scan.n) : ""), e.time.slice(0, 16).replace("T", " "), e.exchange, `${scan.symbols} монет`, `Скан: ${scan.n} комбинаций (${scan.ideas} идей × свечи ${scan.tfs})`, "лучшее " + scan.bestT.toFixed(2), "—", `новых ${scan.fresh}`].map((x) => h("td", null, x)))
      : h("tr", { class: e.repeatOf ? "tag" : null }, [String(i + 1), e.time.slice(0, 16).replace("T", " "), e.exchange, e.symbol + " " + e.tf, title(e) + (e.side === "short" ? ", шорт" : "") + (e.leverage > 1 ? ", " + e.leverage + "x" : "") + (e.reportCcy === "BTC" ? ", в BTC" : "") + (e.positionPct < 100 ? `, доля ${e.positionPct} %` : "") + (e.fundingHistory ? ", фандинг по истории" : ""), e.tExcess.toFixed(2), pct(e.strategyTotal) + " / " + pct(e.holdTotal), e.repeatOf ? "повтор №" + e.repeatOf : "новая"].map((x) => h("td", null, String(x))))));
}
// Строки журнала от новых к старым; записи одного скана (поле scan) схлопываются в одну строку.
function journalRows(j) {
  const out = [];
  for (let i = j.length - 1; i >= 0; i--) {
    const e = j[i];
    if (!e.scan) { out.push({ e, i }); continue; }
    let k = i; while (k > 0 && j[k - 1].scan === e.scan) k--;
    const g = j.slice(k, i + 1);
    out.push({ e: j[k], i: k, scan: { n: g.length, symbols: new Set(g.map((x) => x.symbol)).size, ideas: new Set(g.map((x) => x.strategy)).size, tfs: [...new Set(g.map((x) => x.tf))].join(", "), bestT: Math.max(...g.map((x) => x.tExcess)), fresh: g.filter((x) => x.repeatOf == null).length } });
    i = k;
  }
  return out;
}

/* ---------- бумажная торговля ---------- */
function stratTitle() { return isCustom() ? "Своя стратегия" : isGrid() ? "Сетка" : isCarry() ? "Carry" : S().title; }
function updateNewSummary() {
  dInfoUpdate();
  if (isCarry()) { const c = carryReq(); $("newSummary").textContent = `Сейчас выбрано: carry (спот + шорт фьючерса), ${$("symbol").value}, свеча ${$("tf").selectedOptions[0].textContent}, биржа ${EXN[$("exchange").value]}. Вход при среднем фандинге за ${c.payments} выплат выше ${c.entryApr} % годовых, выход ниже ${c.exitApr} % или при выплате ниже ${c.emergencyApr} %. Комиссия спота ${$("fee").value} %, фьючерса ${c.perpFeePct} %, проскальзывание ${$("slip").value} %.`; return; }
  if (isGrid() && perpGrid()) { const g = gridReq(); $("newSummary").textContent = `Сейчас выбрано: фьючерсная сетка (${{ long: "лонг", short: "шорт", neutral: "нейтральная" }[g.direction]}, плечо ${g.leverage}x), ${$("symbol").value}, свеча ${$("tf").selectedOptions[0].textContent}, биржа ${EXN[$("exchange").value]}, ${g.levels} уровней${g.trailing ? ", трейлинг" : ""}. Комиссия фьючерса ${g.perpFeePct} %, проскальзывание ${$("slip").value} %, фандинг — по выплатам биржи.`; return; }
  $("newSummary").textContent = `Сейчас выбрано: ${stratTitle()}, ${$("symbol").value}, валюта отчёта ${$("reportCcy").value}, свеча ${$("tf").selectedOptions[0].textContent}, биржа ${$("exchange").value}. Направление: ${isGrid() ? "сетка на споте" : isCustom() ? (custom.side === "short" ? "шорт" : "покупка") : (S().side === "short" ? "шорт" : "покупка")}, ${isGrid() ? `${$("gLevels").value} уровней, круги внутри свечи ${$("gIntrabar").value === "one" ? "не больше одного (мягко)" : "не засчитываются (строго)"}. Комиссия ${$("fee").value} % с каждой сделки, проскальзывание ${$("slip").value} % у рыночных сделок.` : `плечо ${$("lev").value}x, доля капитала в позиции ${$("positionPct").disabled ? "по идее" : $("positionPct").value + " %"}. Комиссия ${$("fee").value} %, проскальзывание ${$("slip").value} %, плата за удержание ${$("carry").value} % годовых.`}`;
}
function dInfoUpdate() {
  const a = Number($("dAmount").value) || 0, n = Number($("dEvery").value) || 1, b = Number($("dBudget").value) || 0;
  const k = a > 0 ? Math.ceil(b / a) : 0;
  $("dInfo").textContent = a > 0 && b >= a ? `Монета и свеча — с этапа «Проверка», биржа и издержки — из общих настроек: ${$("symbol").value}, ${$("tf").selectedOptions[0].textContent}, ${EXN[$("exchange").value]}. Покупок: ${k}, бюджет будет вложен целиком через ${(k - 1) * n} свеч. после первой. Каждая покупка — рыночная, комиссия ${$("fee").value} % и проскальзывание ${$("slip").value} %.` : "Бюджет должен быть не меньше одной покупки.";
}
["dAmount", "dEvery", "dBudget"].forEach((id) => $(id).addEventListener("input", dInfoUpdate));
$("dCreate").onclick = async () => {
  $("dError").textContent = ""; $("dCreate").disabled = true;
  try {
    const r = currentReq();
    await api("api/paper/create", { exchange: r.exchange, symbol: r.symbol, tf: r.tf, feePct: r.feePct, slipPct: r.slipPct, reportCcy: r.reportCcy, cashYieldPct: r.cashYieldPct, cashFlat: r.cashFlat,
      strategy: "dca", dca: { amount: Number($("dAmount").value), every: Number($("dEvery").value) }, capital: Number($("dBudget").value), name: $("pName").value || `DCA · ${r.symbol}` });
    $("pName").value = ""; await loadSessions();
  } catch (e) { $("dError").textContent = e.message; }
  $("dCreate").disabled = false;
};
$("pfRun").onclick = async () => {
  const out = $("pfOut"); $("pfRun").disabled = true; out.replaceChildren(h("div", { class: "help" }, "Считаю все сессии (скачиваются свежие свечи)…"));
  try {
    const p = await api("api/paper/portfolio", { report: $("pfCcy").value });
    const m = (v) => money(v, p.report), pc = (v) => h("td", { class: v > 0 ? "good" : v < 0 ? "bad" : "" }, (v >= 0 ? "+" : "") + v.toFixed(2) + " %");
    const rel = (x, base) => (base > 0 ? (x / base - 1) * 100 : 0);
    out.replaceChildren(
      p.sessions.length ? h("table", null, h("tr", null, ["Сессия", "Монета", "Капитал на старте", "Сейчас", "Результат", "Те же деньги в BTC", "В кэше"].map((x) => h("th", null, x))),
        ...p.sessions.map((r) => h("tr", null, h("td", null, r.name + (r.waiting ? " (ждёт первой свечи)" : "") + (r.ruined ? " (ликвидация)" : "")), h("td", null, `${r.symbol} · ${r.tf} · ${EXN[r.exchange] || r.exchange}`), h("td", null, m(r.capitalR)), h("td", null, m(r.equityR)), pc(rel(r.equityR, r.capitalR)), pc(rel(r.btcR, r.capitalR)), pc(rel(r.cashR, r.capitalR)))),
        h("tr", null, h("td", null, h("b", null, "Всего")), h("td", null, ""), h("td", null, h("b", null, m(p.capital))), h("td", null, h("b", null, m(p.equity))), pc(p.returnPct), pc(p.btcReturnPct), pc(p.cashReturnPct))) : h("div", { class: "help" }, "Сессий нет."),
      ...p.skipped.map((r) => h("div", { class: "err" }, `${r.name}: ${r.error || "нет цены BTC"} — в сводку не вошла.`)),
      h("div", { class: "small-note" }, (p.lastAuto ? `Последнее автообновление: ${p.lastAuto.slice(0, 16).replace("T", " ")} UTC. ` : "Автообновление ещё не запускалось. ") + "Учебная торговля без денег, не инвестиционный совет."));
  } catch (e) { out.replaceChildren(h("div", { class: "err" }, e.message)); }
  $("pfRun").disabled = false;
};
function levInfo() {
  const L = Number($("lev").value) || 1, m = Number($("maint").value) || 0, d = 100 / L - m;
  $("levInfo").textContent = L > 1 ? `При плече ${L}x ликвидация наступит, если цена пойдёт против позиции примерно на ${d.toFixed(1)} % от цены входа. ${Number($("positionPct").value) < 100 ? `В позиции лежит ${$("positionPct").value} % счёта: ликвидация теряет эту часть, остальное остаётся в кэше и торговля продолжается.` : "Все деньги счёта лежат в одной позиции, поэтому ликвидация означает потерю всего учебного счёта."}` : "Без плеча ликвидация возможна только у шорта и только если цена вырастет почти вдвое.";
}
["lev", "maint", "positionPct"].forEach((id) => $(id).addEventListener("input", levInfo));
$("toPaper").onclick = () => { showTab("paper"); $("pName").focus(); };
$("pCreate").onclick = async () => {
  $("pError").textContent = "";
  const c = W?.paperCheck({ strategy: $("strategy").value, symbol: $("symbol").value, journal: wizJournal, plank: plankNow, last: lastCheck });
  if (c && !c.ok && !confirm([c.message, "Бумажная сессия не превратит идею в проверенную: она только покажет, как правило ведёт себя вживую.", "Нажмите «ОК», если понимаете, что идея не прошла проверку, и всё равно хотите наблюдать."].map(T).join("\n\n"))) return;
  $("pCreate").disabled = true;
  try {
    await api("api/paper/create", { ...currentReq(), name: $("pName").value || stratTitle() + " · " + $("symbol").value, capital: Number($("pCap").value) });
    $("pName").value = ""; await loadSessions();
  } catch (e) { $("pError").textContent = e.message; }
  $("pCreate").disabled = false;
};
let sessionBox = {};
async function loadSessions() {
  const list_ = await api("api/paper");
  wizSessions = list_; renderWizard();
  const root = $("sessions"); root.replaceChildren(); sessionBox = {};
  if (!list_.length) root.append(h("div", { class: "card help" }, "Сессий пока нет. Создайте первую выше."));
  for (const s of list_) {
    const body = h("div", { class: "help" }, "Нажмите «Обновить», чтобы скачать свежие свечи и пересчитать состояние.");
    sessionBox[s.id] = body;
    root.append(h("div", { class: "card" },
      h("div", { class: "inline" }, h("b", null, s.name), h("span", { class: "tag" }, `${s.symbol} · ${s.tf} · ${EXN[s.exchange] || s.exchange} · ${s.strategy === "custom" ? "своя стратегия" : s.type === "grid" ? (s.params.market === "perp" ? `фьючерсная сетка ${s.params.levels} ур., ${{ long: "лонг", short: "шорт", neutral: "нейтральная" }[s.params.direction]} ${s.params.leverage}x` : `сетка ${s.params.levels} ур.`) : s.type === "carry" ? "carry" : s.type === "dca" ? `DCA $${s.params.amount} раз в ${s.params.every} свеч.` : meta.strategies.find((x) => x.key === s.strategy)?.title} · капитал $${s.capital}${s.reportCcy === "BTC" ? " (отчёт в BTC)" : ""}${(s.leverage ?? 1) > 1 ? " · плечо " + s.leverage + "x" : ""} · старт ${dt(s.startT)} UTC`),
        h("button", { class: "small", onclick: () => refreshSession(s.id) }, "Обновить"), device ? h("button", { class: "small sec", onclick: async () => { const r = await api("api/paper/csv", { id: s.id }); saveFile(r.file, r.csv, "text/csv;charset=utf-8"); } }, "Сделки в CSV") : h("a", { class: "small", href: "api/paper/csv?id=" + encodeURIComponent(s.id), download: "" }, "Сделки в CSV"), h("button", { class: "danger small", onclick: async () => { if (confirm(T("Удалить сессию?"))) { await api("api/paper/delete", { id: s.id }); loadSessions(); } } }, "Удалить")),
      body));
    refreshSession(s.id);
  }
}
const money = (v, ccy) => (ccy === "BTC" ? `₿${v.toFixed(6)}` : `$${v.toFixed(2)}`);
async function refreshSession(id) {
  const box = sessionBox[id]; if (!box) return;
  const add = (...xs) => box.append(...xs.filter((x) => x != null)); // null в append() печатается как текст «null»
  try {
    const st = await api("api/paper/status", { id });
    box.className = ""; box.replaceChildren();
    const cls = (v) => (v > 0 ? "good" : v < 0 ? "bad" : "");
    if (st.waiting) { add(h("div", { class: "plain" }, "Новых закрытых свечей после старта пока нет. ", h("b", null, st.actionText + ".")), h("div", { class: "help" }, "Последняя закрытая свеча: " + dt(st.lastBarT) + " UTC.")); return; }
    const canvas = h("canvas", { width: 900, height: 200 });
    if (st.grid) {
      const P = (v) => v.toPrecision(6), q = st.quote, amt = (v) => money(v, q);
      add(
        h("div", { class: "row" },
          h("div", null, h("div", { class: "tag" }, "Капитал сейчас"), h("div", { class: cls(st.returnPct) }, `${money(st.equity, st.reportCcy)} (${st.returnPct >= 0 ? "+" : ""}${st.returnPct.toFixed(2)} %)`)),
          h("div", null, h("div", { class: "tag" }, "Просто держать монету"), h("div", { class: cls(st.holdReturnPct) }, `${st.holdReturnPct >= 0 ? "+" : ""}${st.holdReturnPct.toFixed(2)} %`)),
          h("div", null, h("div", { class: "tag" }, `Прибыль кругов / переоценка (${q})`), h("div", null, `${amt(st.gridProfitQuote)} / ${amt(st.revaluationQuote)}`)),
          h("div", null, h("div", { class: "tag" }, "Кругов / новых свечей"), h("div", null, `${st.rounds} / ${st.newBars}`)),
          h("div", null, h("div", { class: "tag" }, "Сейчас в сетке"), h("div", null, st.perp ? `позиция ${st.coinQty > 0 ? "лонг" : st.coinQty < 0 ? "шорт" : "нет"} ${Math.abs(st.coinQty).toPrecision(6)} монеты, маржа ${amt(st.cashQuote)}` : `${st.coinQty.toPrecision(6)} монеты и ${amt(st.cashQuote)}`)),
          st.perp ? h("div", null, h("div", { class: "tag" }, "Фандинг / комиссии"), h("div", null, `${amt(st.fundingQuote)} / ${amt(-st.feesQuote)}`)) : null),
        st.ruined ? h("div", { class: "err" }, `Ликвидация ${dt(st.liquidatedAt)} UTC по цене около ${P(st.liquidationPx)}: вложение потеряно, сетка остановлена.`) : st.perp && !st.stopped ? h("div", { class: "help" }, `Ликвидация, если цена пойдёт в одну сторону и исполнит все заявки на пути: вниз — ${st.liqDown ? P(st.liqDown) : "не наступит"}, вверх — ${st.liqUp ? P(st.liqUp) : "не наступит"}.`) : null,
        h("div", { class: "help" }, `Диапазон ${P(st.lower)} — ${P(st.upper)} ${q}, ${st.levels} уровней, шаг ${st.stepPct.toFixed(2)} %. Последняя цена ${P(st.price)}. ${st.actionText}.` + (st.trailShifts ? ` Сдвигов вверх: ${st.trailShifts}.` : "")),
        st.orders.length ? table(["Ближайшие заявки", "Цена", "Количество"], st.orders.map((o) => [o.side === "buy" ? "покупка" : "продажа", P(o.px), o.qty.toPrecision(6)])) : null,
        canvas,
        st.trades.length ? table(["Время (UTC)", "Сделка", "Цена", "Количество", "Прибыль круга"], st.trades.map((t) => [dt(t.t), (t.side === "liq" ? "ликвидация" : t.side === "buy" ? "покупка" : "продажа") + (t.why && t.side !== "liq" ? ` (${t.why})` : ""), P(t.px), t.qty.toPrecision(6), t.profit == null ? "—" : amt(t.profit)])) : h("div", { class: "help" }, "Сделок пока не было."),
        h("div", { class: "small-note" }, "Последняя закрытая свеча: " + dt(st.lastBarT) + " UTC. Модель на свечах: круги внутри свечи " + (st.params.intrabar === "one" ? "засчитываются не больше одного (мягко)" : "не засчитываются (строго") + (st.params.intrabar === "one" ? "" : ")") + ". Учебная торговля без денег, не инвестиционный совет."));
      draw(canvas, st.series, [{ key: "hold", color: "#8b95a3", label: "Удержание" }, { key: "equity", color: "#2f7de1", label: "Бумажная сетка" }]);
      return;
    }
    const head = (items) => h("div", { class: "row" }, ...items.map(([a, b, c]) => h("div", null, h("div", { class: "tag" }, a), h("div", { class: c || "" }, b))));
    const sg = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)} %`;
    if (st.dca) {
      const q = st.quote, amt = (v) => money(v, q), P = (v) => v.toPrecision(6);
      add(
        head([["Капитал сейчас", `${money(st.equity, st.reportCcy)} (${sg(st.returnPct)})`, cls(st.returnPct)], ["Разовая покупка всего бюджета в начале", sg(st.holdReturnPct), cls(st.holdReturnPct)],
          ["Вложено / в кэше", `${amt(st.spentQuote)} / ${amt(st.cashQuote)}`], ["Монеты / средняя цена", `${st.coinQty.toPrecision(6)} / ${st.avgPrice ? P(st.avgPrice) : "—"}`], ["Покупок / новых свечей", `${st.buys} / ${st.newBars}`],
          ["Следующее действие", st.actionText, "warn"]]),
        canvas,
        st.trades.length ? table(["Время (UTC)", `Сумма (${q})`, "Цена", "Монеты"], st.trades.map((t) => [dt(t.t), amt(t.amount), P(t.px), t.qty.toPrecision(6)])) : null,
        h("div", { class: "small-note" }, "Последняя закрытая свеча: " + dt(st.lastBarT) + " UTC. Покупка — по цене открытия свечи с комиссией и проскальзыванием. Учебная торговля без денег, не инвестиционный совет."));
      draw(canvas, st.series, [{ key: "hold", color: "#8b95a3", label: "Разовая покупка" }, { key: "equity", color: "#2f7de1", label: "DCA" }]);
      return;
    }
    if (st.carry) {
      add(
        head([["Капитал сейчас", `${money(st.equity, st.reportCcy)} (${sg(st.returnPct)})`, cls(st.returnPct)], ["Просто держать монету", sg(st.holdReturnPct), cls(st.holdReturnPct)],
          ["Фандинг / комиссии", `$${st.fundingUsd.toFixed(2)} / $${(-st.feesUsd).toFixed(2)}`], ["Позиция", st.held ? "спот + шорт фьючерса" : "в деньгах"], ["Новых свечей / сделок закрыто", `${st.newBars} / ${st.closedTrades}`],
          ["Следующее действие", st.actionText, "warn"]]),
        st.ruined ? h("div", { class: "err" }, "Фьючерс ликвидирован: торговля в этой сессии остановлена.") : null,
        canvas,
        st.trades.length ? table(["Вход", "Выход", "Результат", "Примечание"], st.trades.map((t) => [dt(t.entryT), t.open ? "открыта" : dt(t.exitT), (t.ret >= 0 ? "+" : "") + (t.ret * 100).toFixed(2) + " %", t.open ? "" : t.note])) : h("div", { class: "help" }, "Сделок пока не было."),
        h("div", { class: "small-note" }, "Последняя закрытая свеча: " + dt(st.lastBarT) + " UTC. Модель единого счёта, обе ноги — по открытию свечи после сигнала. Учебная торговля без денег, не инвестиционный совет."));
      draw(canvas, st.series, [{ key: "hold", color: "#8b95a3", label: "Удержание" }, { key: "equity", color: "#2f7de1", label: "Бумажный carry" }]);
      return;
    }
    add(
      h("div", { class: "row" },
        h("div", null, h("div", { class: "tag" }, "Капитал сейчас"), h("div", { class: cls(st.returnPct) }, `${money(st.equity, st.reportCcy)} (${st.returnPct >= 0 ? "+" : ""}${st.returnPct.toFixed(2)} %)`)),
        h("div", null, h("div", { class: "tag" }, "Просто держать за то же время"), h("div", { class: cls(st.holdReturnPct) }, `${st.holdReturnPct >= 0 ? "+" : ""}${st.holdReturnPct.toFixed(2)} %`)),
        h("div", null, h("div", { class: "tag" }, "Позиция"), h("div", null, st.weights ? `доля монеты ${(100 * (st.share ?? 0)).toFixed(1)} % (цель ${(100 * st.target).toFixed(0)} %)` : (st.held ? "в рынке" : "в деньгах") + (st.positionPct < 100 ? `, доля сделки ${st.positionPct} %` : ""))),
        h("div", null, h("div", { class: "tag" }, "Следующее действие"), h("div", { class: "warn" }, st.actionText)),
        h("div", null, h("div", { class: "tag" }, "Новых свечей / сделок закрыто"), h("div", null, `${st.newBars} / ${st.closedTrades} (прибыльных ${st.wins})`))),
      st.ruined ? h("div", { class: "err" }, "Позиция ликвидирована: залог потерян, учебный счёт обнулён. Торговля в этой сессии остановлена.") : null,
      st.openTrade ? h("div", { class: "help" }, `Открытая сделка (${st.side === "short" ? "шорт" : "покупка"}${st.leverage > 1 ? ", плечо " + st.leverage + "x" : ""}): вход ${dt(st.openTrade.entryT)} по ${st.openTrade.entryPrice.toFixed(4)}, пока ${st.openTrade.unrealizedPct >= 0 ? "+" : ""}${st.openTrade.unrealizedPct.toFixed(2)} %.${st.openTrade.liqPrice ? " Цена ликвидации: " + st.openTrade.liqPrice.toFixed(4) + "." : ""}`) : null,
      canvas,
      st.trades.length ? table(["Вход", "Выход", "Цена входа", "Результат"], st.trades.map((t) => [dt(t.entryT), t.open ? "открыта" : dt(t.exitT), t.entryPrice.toFixed(4), (t.ret >= 0 ? "+" : "") + (t.ret * 100).toFixed(2) + " %" + (t.liquidated ? " (ликвидация)" : "")])) : h("div", { class: "help" }, "Сделок пока не было."),
      h("div", { class: "small-note" }, "Последняя закрытая свеча: " + dt(st.lastBarT) + " UTC. Учебная торговля без денег, не инвестиционный совет."));
    draw(canvas, st.series, [{ key: "hold", color: "#8b95a3", label: "Удержание" }, { key: "equity", color: "#2f7de1", label: "Бумажный счёт" }]);
  } catch (e) { box.className = "err"; box.textContent = e.message; }
}
$("refreshAll").onclick = () => Object.keys(sessionBox).forEach(refreshSession);
let timer = null;
$("auto").onchange = (e) => { clearInterval(timer); if (e.target.checked) timer = setInterval(() => !$("tab-paper").hidden && Object.keys(sessionBox).forEach(refreshSession), 60000); };

/* ---------- индикаторы ---------- */
function renderIndicators() {
  const q = $("indFilter").value.toLowerCase();
  const root = $("indList"); root.replaceChildren();
  for (const i of meta.indicators.filter((x) => !q || (x.title + x.plain + x.group).toLowerCase().includes(q))) {
    root.append(h("div", { class: "card" },
      h("div", null, h("b", null, i.title), " ", h("span", { class: "badge" }, i.group)),
      h("div", { class: "plain" }, i.plain), h("div", { class: "help" }, i.use),
      i.params.length ? table(["Параметр", "По умолчанию", "Допустимо"], i.params.map((p) => [p.label, p.def, `${p.min} … ${p.max}`])) : h("div", { class: "small-note" }, "Параметров нет."),
      table(["Выход индикатора (его можно использовать в условиях)", "Как обращаться"], i.outputs.map((o) => [o.label, i.outputs.length === 1 ? "по имени индикатора" : `имя.${o.key}`]))));
  }
}
$("indFilter").oninput = renderIndicators;

/* ---------- скан ---------- */
let scanData = null, scanPlanSeq = 0;
const scChecked = (id) => [...$(id).querySelectorAll("input:checked")].map((x) => x.value);
function scanFill() {
  const box = (id, items) => $(id).replaceChildren(...items.map(([v, t, on]) => h("label", null, h("input", { type: "checkbox", value: v, checked: on, onchange: scanPlanUpdate }), t)));
  box("scIdeas", meta.strategies.filter((s) => !s.needsBtcPair).map((s) => [s.key, `${s.verdict.status} ${s.title}`, true]));
  box("scSyms", meta.symbols.map((s) => [s, s, true]));
  box("scTfs", [["1h", "1 час", true], ["4h", "4 часа", true], ["1D", "1 день", true]]);
  document.querySelectorAll("[data-all]").forEach((b) => (b.onclick = () => { const xs = $(b.dataset.all).querySelectorAll("input"); const on = [...xs].some((x) => !x.checked); xs.forEach((x) => (x.checked = on)); scanPlanUpdate(); }));
}
function scanReq() {
  const r = currentReq();
  return { ideas: scChecked("scIdeas"), symbols: scChecked("scSyms"), tfs: scChecked("scTfs"), exchange: r.exchange, feePct: r.feePct, slipPct: r.slipPct, reportCcy: r.reportCcy, maxBars: r.maxBars, benchmark: r.benchmark, cashYieldPct: r.cashYieldPct, cashFlat: r.cashFlat };
}
async function scanPlanUpdate() {
  const seq = ++scanPlanSeq, req = scanReq();
  if (!req.ideas.length || !req.symbols.length || !req.tfs.length) { $("scPlan").textContent = "Выберите хотя бы одну идею, монету и свечу."; $("scRun").disabled = true; return; }
  try {
    const p = await api("api/scan/plan", req); if (seq !== scanPlanSeq) return;
    $("scPlan").textContent = `Комбинаций: ${p.combos}. Биржа ${EXN[req.exchange]}, комиссия ${req.feePct} %, проскальзывание ${req.slipPct} %, до ${req.maxBars} свечей истории, валюта отчёта ${req.reportCcy}. Сейчас в журнале ${p.attemptsNow} уникальных попыток, планка значимости ${p.plankNow.toFixed(2)}; после скана — до ${p.attemptsNow + p.combos} попыток и планка до ${p.plankAfterMax.toFixed(2)} (повторы уже проверенных настроек не считаются). Первый скан скачивает свечи и может идти несколько минут.`;
    const sw = W?.scanWarning(p.plankNow, p.plankAfterMax); if (sw) $("scPlan").append(h("div", { class: "warn" }, "⚠ " + sw));
    $("scRun").disabled = false;
  } catch (e) {
    if (seq !== scanPlanSeq) return;
    // старый сервер не знает адреса скана: страница новая, а процесс запущен до обновления
    $("scPlan").textContent = e.message === "Не найдено" ? "Сервер запущен со старым кодом и не умеет сканировать. Закройте окно сервера, запустите start.bat снова и обновите страницу." : e.message;
    $("scRun").disabled = true;
  }
}
$("scRun").onclick = async () => {
  $("scError").textContent = ""; $("scRun").disabled = true; $("scRun").textContent = "Сканирую… (не закрывайте страницу)";
  try { scanData = await api("api/scan", scanReq()); renderScan(); $("scResult").hidden = false; loadJournal(); }
  catch (e) { $("scError").textContent = e.message; }
  $("scRun").textContent = "Запустить скан"; scanPlanUpdate();
};
function renderScan() {
  const d = scanData, y = d.year, ccy = d.report;
  const sig = d.rows.filter((r) => r.significant).length, plus = d.rows.filter((r) => r.total > 0).length, beatAll = d.rows.filter((r) => r.btcTotal != null && r.total > r.btcTotal).length;
  $("scSummary").replaceChildren(...[
    h("div", null, h("b", null, `Проверено комбинаций: ${d.combos}. `), `Новых попыток в журнале: ${d.newAttempts}, всего ${d.attempts}. Планка значимости: было ${d.plankBefore.toFixed(2)} → стало ${d.plank.toFixed(2)}.`),
    h("div", null, `Выше планки (t-статистика превышения над выбранным эталоном): `, h("b", { class: sig ? "good" : null }, String(sig)), `. В плюсе за всю историю: ${plus}. Обогнали удержание BTC за всю историю: ${beatAll}. Результаты в ${ccy}.`),
    y.rows ? h("div", { class: "warn", style: "margin-top:6px" }, `За последний год удержание BTC обогнали ${y.beat} из ${y.rows} строк (у остальных истории меньше года). Эти «победители» в среднем были в рынке ${pct0(y.beatExposure ?? 0)} времени, остальные — ${pct0(y.restExposure ?? 0)}; ${y.beatMostlyCash} из ${y.beat} провели в рынке меньше половины года. В падающем году обгон BTC чаще всего означает не умение угадывать, а сидение в кэше.`) : null,
    d.skipped.length ? h("details", null, h("summary", null, `Пропущено: ${d.skipped.length}`), list(d.skipped)) : null,
    h("div", { class: "help" }, "t-статистика показывает, насколько устойчиво идея обгоняла выбранный эталон (по умолчанию — удержание той же монеты) свеча за свечой. Строка выше планки — это кандидат на отдельную проверку с полным разбором, а не найденный край: среди сотен комбинаций несколько высоких t появляются и случайно.")].filter(Boolean));
  scanFilter();
}
function scanFilter() {
  if (!scanData) return;
  const yr = $("sfPeriod").value === "year", beat = $("sfBeat").value, minT = Number($("sfTrades").value) || 0, dd = $("sfDd").value === "" ? null : Number($("sfDd").value) / 100;
  const ret = (r) => (yr ? r.year : r.total), ref = (r) => (yr ? { btc: r.yearBtc, coin: r.yearCoin, cash: r.yearCash } : { btc: r.btcTotal, coin: r.coinTotal, cash: r.cashTotal })[beat];
  let rows = scanData.rows.filter((r) => (!yr || r.year != null) && r.trades >= minT && (dd == null || -r.maxDrawdown <= dd) && (!$("sfPlus").checked || ret(r) > 0) && (!beat || (ref(r) != null && ret(r) > ref(r))));
  const key = $("sfSort").value; rows.sort((a, b) => (key === "t" ? b.tExcess - a.tExcess : key === "year" ? (b.year ?? -9) - (a.year ?? -9) : b.total - a.total));
  $("sfCount").textContent = `Показано строк: ${rows.length} из ${scanData.rows.length}.` + (yr ? " Для фильтров по году — только строки, у которых есть полный год истории (часовых свечей при коротком лимите истории может не хватить)." : "");
  const p = (x) => (x == null ? "—" : pct(x)), cls = (a, b) => (a == null || b == null ? null : a > b ? "good" : "bad");
  const TFN = { "1h": "1 ч", "4h": "4 ч", "1D": "1 д" };
  $("scTable").replaceChildren(h("tr", null, ["Идея", "Монета", "Свеча", "За год", "BTC за год", "В рынке за год", "За всё время", "BTC за всё время", "Просадка", "Сделок", "t", "Планка " + scanData.plank.toFixed(2)].map((x) => h("th", null, x))),
    ...rows.slice(0, 500).map((r) => h("tr", null,
      h("td", null, r.title + (r.side === "short" ? ", шорт" : "")), h("td", null, r.symbol), h("td", null, TFN[r.tf] || r.tf),
      h("td", { class: cls(r.year, r.yearBtc) }, p(r.year)), h("td", null, p(r.yearBtc)), h("td", null, r.yearExposure == null ? "—" : pct0(r.yearExposure)),
      h("td", { class: cls(r.total, r.btcTotal) }, p(r.total) + (r.ruined ? " (разорение)" : "")), h("td", null, p(r.btcTotal)), h("td", null, pct(r.maxDrawdown)), h("td", null, String(r.trades)),
      h("td", null, r.tExcess.toFixed(2)), h("td", { class: r.significant ? "good" : null }, r.significant ? "выше" : "ниже"))));
  if (rows.length > 500) $("sfCount").textContent += " В таблице первые 500.";
}
["sfPeriod", "sfBeat", "sfTrades", "sfDd", "sfSort", "sfPlus"].forEach((id) => $(id).addEventListener("input", scanFilter));
["exchange", "fee", "slip", "reportCcy", "maxBars", "benchmark"].forEach((id) => $(id).addEventListener("change", () => { if (!$("tab-test").hidden && !$("scanPane").hidden) scanPlanUpdate(); }));

/* ---------- каталог ---------- */
function renderCatalog() {
  const f = $("catFilter").value;
  const root1 = $("catPresets"), root2 = $("catOnly"); root1.replaceChildren(); root2.replaceChildren();
  root1.append(h("div", { class: "card" }, h("b", null, "Можно проверить в программе")));
  for (const s of meta.strategies.filter((x) => !f || x.verdict.status === f)) {
    root1.append(h("div", { class: "card" },
      h("div", null, h("b", null, s.title), " ", badge(s.verdict.status), s.side === "short" ? h("span", { class: "badge b-no" }, "шорт") : null, h("span", { class: "tag" }, s.group === "project" ? "из исследований проекта" : "классический пример")),
      h("div", { class: "plain" }, s.plain), h("div", { class: "box" }, h("b", null, "Итог: "), s.verdict.text, h("div", { class: "small-note" }, "Источник: " + s.source)),
      h("button", { class: "small", onclick: () => { $("strategy").value = s.key; onStrategy(); chooseIdea(); showTab("test"); testMode("one"); window.scrollTo(0, 0); } }, "Проверить в полигоне")));
  }
  for (const c of meta.catalog.filter((x) => !f || x.status === f)) {
    root2.append(h("div", { class: "card" },
      h("div", null, h("b", null, c.title), " ", badge(c.status), h("span", { class: "tag" }, c.area)),
      h("div", { class: "plain" }, c.plain), h("div", { class: "box" }, h("b", null, "Итог: "), c.result), h("div", { class: "small-note" }, "Почему не запускается здесь: " + c.why)));
  }
  $("glossary").replaceChildren(...meta.glossary.map(([a, b]) => h("tr", null, h("td", null, h("b", null, a)), h("td", null, b))));
}
$("catFilter").onchange = renderCatalog;

/* ---------- запуск ---------- */
// Без сервера (сайт или нет связи с компьютером) работает только учебный режим.
function serverless() {
  $("noServer").hidden = false; $("journalPill").hidden = true;
  for (const el of $("workArea").children) if (el.id !== "noServer") el.hidden = true;
  $("workArea").prepend($("noServer"));
  let mode = "learn"; try { mode = localStorage.getItem(MODE_KEY) || "learn"; } catch { /* учебный */ }
  const go = () => setMode(mode); window.initCourse ? go() : addEventListener("load", go);
}
if ("serviceWorker" in navigator && isSecureContext) navigator.serviceWorker.register("sw.js").catch(() => {});

(async function init() {
  try { meta = await api("api/meta"); }
  catch {
    // сервера нет — считаем на самом устройстве; если браузер не умеет фоновые потоки модулей — только учебный режим
    try { startWorker(); meta = await Promise.race([api("api/meta"), new Promise((_, f) => setTimeout(() => f(new Error("нет ответа")), 8000))]); device = true; meta.codeChanged = false; }
    catch { worker = null; try { window.polygonMeta = await (await fetch("meta.json")).json(); } catch { /* словарь будет без определений */ } return serverless(); }
  }
  window.polygonMeta = meta;
  if (device) deviceMode();
  // старый сервер (до этой проверки) не присылает codeChanged; новый присылает true, если код изменился после его запуска
  if (meta.codeChanged !== false) {
    $("staleServer").hidden = false;
    $("staleServer").textContent = "Программа обновилась, а сервер запущен со старым кодом: часть возможностей не видна или работает неверно (например, нет OKX в списке бирж). Закройте окно сервера и запустите его снова (start.bat), затем обновите страницу.";
  }
  for (const e of meta.exchanges) { const o = new Option(EXN[e] + (device && e === "binance" ? " (только с компьютера)" : ""), e); o.disabled = device && e === "binance"; $("exchange").add(o); }
  SYMBOL_BASE.push(...meta.symbols);
  for (const s of coinStore.extra || []) if (!meta.symbols.includes(s)) meta.symbols.push(s); // монеты, добавленные на этапе 1
  fillSymbols();
  api("api/pairs").then((p) => { btcPairs = p; fillSymbols(); }).catch(() => {});
  for (const [k, v] of Object.entries(meta.benchmarks)) $("benchmark").add(new Option(v[0].toUpperCase() + v.slice(1), k));
  $("maxBars").value = meta.defaultBars; $("maxBars").max = meta.maxBars;
  const g1 = h("optgroup", { label: "Стратегии из исследований проекта" }), g2 = h("optgroup", { label: "Классические примеры" }), g3 = h("optgroup", { label: "Своя" });
  for (const s of meta.strategies) (s.group === "project" ? g1 : g2).append(new Option(`${s.verdict.status}  ${T(s.title)}`, s.key));
  g3.append(new Option("Своя стратегия (конструктор из нескольких индикаторов)", "custom"), new Option("Сетка (грид-бот: спот или фьючерс с плечом)", "grid"), new Option("Carry: спот + шорт бессрочного фьючерса (Bybit)", "carry"));
  $("strategy").append(g1, g2, g3);
  $("strategy").onchange = () => { onStrategy(); chooseIdea(); }; onStrategy();
  renderIndicators(); renderCatalog(); scanFill(); syncScanCoins(); loadJournal(); levInfo(); settingsSummary();
  api("api/paper").then((l) => { wizSessions = l; renderWizard(); }).catch(() => {});
  let mode = "work"; try { mode = localStorage.getItem(MODE_KEY) || "work"; } catch { /* по умолчанию рабочий */ }
  if (mode === "learn") { const go = () => setMode("learn"); window.initCourse ? go() : addEventListener("load", go); }
})();

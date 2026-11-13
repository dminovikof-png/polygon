// Учебный режим: рисует уроки из данных (public/course/*.js). Расчётов здесь нет — только показ, рисунки и вопросы.
import { MODULES } from "./course/index.js";
import { FIGURES } from "./course/figures.js";
import { SIMS } from "./course/sims.js";
import { COURSE_TERMS } from "./course/glossary.js";
import { VIDEOS } from "./course/videos.js";
import { applyTranslation } from "./course/tr.js";
import { fitText } from "./course/draw.js";

// Рисунки и симуляторы перерисовываются вставкой SVG; после перевода (он идёт сразу при вставке) подписи вписываются в край.
// Если словарь пришёл позже первого рисунка, вписываются заново всё, что уже на странице.
{
  let queued = new Set();
  const flush = () => { const roots = [...queued]; queued = new Set(); for (const r of roots) if (r.isConnected) fitText(r); };
  new MutationObserver((recs) => {
    for (const r of recs) for (const n of r.addedNodes) if (n.nodeType === 1 && (n.matches("svg[role=img]") || n.querySelector("svg[role=img]"))) { if (!queued.size) setTimeout(flush, 0); queued.add(n.matches("svg") ? n.parentNode : n); }
  }).observe(document.body, { childList: true, subtree: true });
  globalThis.PolygonI18n?.ready?.then(() => setTimeout(() => fitText(document.body), 0));
}

const $ = (id) => document.getElementById(id);
// Язык: кнопки и подписи курса переводит общий словарь (i18n.js), текст уроков — перевод модуля course/<язык>/.
// Текст из данных урока помечен классом notr, чтобы словарь интерфейса его не трогал.
const I18N = globalThis.PolygonI18n, LANG = I18N?.lang || "ru";
const T = (s) => (I18N ? I18N.tr(s) : s);
let TR = { MODULES: {}, TERMS: {}, VIDEOS: {}, EN: {} }; // перевод на текущий язык: модули, словарь курса, ролики (и английские ролики)
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) { if (v == null || v === false) continue; if (k === "class") e.className = v; else if (k.startsWith("on")) e[k] = v; else e.setAttribute(k, v === true ? "" : v); }
  for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}

let glossary = new Map(COURSE_TERMS), progress = { lessons: {} }, view = null;
let mods = MODULES, lessons = [];
const index = () => { mods = MODULES.map((m) => applyTranslation(m, TR.MODULES[m.id])); lessons = mods.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m }))); };
index();
// копия массива в случайном порядке (Фишер — Йетс)
const shuffled = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const P = (id) => (progress.lessons[id] ||= { done: false, doneAt: null, quiz: {} });

// Прогресс — на компьютере (data/progress.json); если сервера нет (статический сайт) — в браузере.
const LOCAL = "polygon.progress";
async function loadProgress() {
  try { progress = window.polygonApi ? await window.polygonApi("api/progress") : await (await fetch("api/progress")).json(); if (!progress.lessons) throw 0; }
  catch { try { progress = JSON.parse(localStorage.getItem(LOCAL)) || { lessons: {} }; } catch { progress = { lessons: {} }; } }
}
async function saveLesson(id) {
  const part = { lessons: { [id]: P(id) } };
  try { localStorage.setItem(LOCAL, JSON.stringify(progress)); } catch { /* без хранилища */ }
  try { window.polygonApi ? await window.polygonApi("api/progress", part) : await fetch("api/progress", { method: "POST", body: JSON.stringify(part) }); } catch { /* без сервера и потока — только в браузере */ }
}

// Текст: абзацы через пустую строку, **жирный**, [[термин]] и [[термин|как показать]] — ссылка в словарь.
// Строки абзаца, начинающиеся с «- », становятся списком (строка до них — заголовком абзаца).
function richText(s) {
  const mark = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, shown) => `<button class="term" data-term="${t}">${shown || t}</button>`);
  return s.split(/\n\n+/).flatMap((par) => {
    const lines = par.split("\n"), items = lines.filter((l) => l.startsWith("- ")), head = lines.filter((l) => !l.startsWith("- ")).join(" ");
    const out = [];
    if (head) { const p = el("p", { class: "plain notr" }); p.innerHTML = mark(head); out.push(p); }
    if (items.length) { const ul = el("ul", { class: "plain notr" }); ul.innerHTML = items.map((l) => `<li>${mark(l.slice(2))}</li>`).join(""); out.push(ul); }
    return out;
  });
}
document.addEventListener("click", (e) => {
  const b = e.target.closest?.(".term");
  document.querySelectorAll(".termpop").forEach((x) => x.remove());
  if (!b) return;
  // термин курса — из перевода словаря курса, термин программы — из словаря интерфейса
  const key = b.dataset.term, own = TR.TERMS[key];
  const name = own ? own[0] : T(key), def = own ? own[1] : glossary.has(key) ? T(glossary.get(key)) : T("Определение пока не добавлено в словарь.");
  const pop = el("div", { class: "termpop notr", role: "note" }, el("b", null, name), el("div", null, def));
  b.after(pop);
});

const BLOCKS = {
  text: (b) => richText(b.text),
  figure: (b) => { const f = el("figure", { class: "fig" }); f.innerHTML = FIGURES[b.fig](b.args); if (b.caption) f.append(el("figcaption", { class: "help notr" }, b.caption)); return f; },
  anim: (b) => {
    let i = 0, timer = null;
    const pic = el("div"), cap = el("div", { class: "plain notr" }), count = el("span", { class: "help" });
    const show = () => { pic.innerHTML = FIGURES[b.fig](b.steps[i].args); cap.textContent = b.steps[i].caption; count.textContent = `Шаг ${i + 1} из ${b.steps.length}`; prev.disabled = i === 0; next.disabled = i === b.steps.length - 1; };
    const stop = () => { clearInterval(timer); timer = null; play.textContent = "▶ Показать по шагам"; };
    const prev = el("button", { class: "sec small", onclick: () => { stop(); i--; show(); } }, "← Назад");
    const next = el("button", { class: "sec small", onclick: () => { stop(); i++; show(); } }, "Дальше →");
    const play = el("button", { class: "small", onclick: () => {
      if (timer) return stop();
      i = 0; show(); play.textContent = "■ Стоп";
      timer = setInterval(() => { if (i >= b.steps.length - 1) return stop(); i++; show(); }, 3500);
    } }, "▶ Показать по шагам");
    const box = el("figure", { class: "fig anim" }, pic, cap, el("div", { class: "inline" }, play, prev, next, count));
    show(); return box;
  },
  quiz: (b, lesson, k) => {
    const saved = P(lesson.id).quiz[k], box = el("div", { class: "box quiz notr" }, el("b", null, T("Проверьте себя:") + " " + b.q));
    const res = el("div", { class: "plain" });
    const btns = [];
    const pick = (j) => {
      btns.forEach((o, n) => { o.classList.toggle("ok", n === b.answer); o.classList.toggle("no", n === j && j !== b.answer); });
      res.replaceChildren(el("b", { class: j === b.answer ? "good" : "bad" }, T(j === b.answer ? "Верно." : "Не совсем.") + " "), b.explain);
    };
    // btns[j] — вариант j из урока (в прогрессе хранится этот номер); на экране варианты в случайном порядке
    b.options.forEach((o, j) => btns.push(el("button", { class: "opt", onclick: () => { pick(j); P(lesson.id).quiz[k] = { pick: j, ok: j === b.answer, at: Date.now() }; saveLesson(lesson.id); } }, o)));
    box.append(...shuffled(btns));
    box.append(res);
    if (saved) pick(saved.pick);
    return box;
  },
  measured: (b) => el("div", { class: "box measured" }, el("b", null, "Что показало исследование проекта"), ...richText(b.text), b.source ? el("div", { class: "small-note notr" }, T("Источник:") + " " + b.source) : null),
  try: (b) => el("button", { class: "sec notr", onclick: () => window.goWork?.(b.stage, b.sub, { strategy: b.strategy, symbol: b.symbol }) }, b.label + " →"),
  sim: (b) => SIMS[b.sim](b.args || {}),
  checked: (b) => el("div", { class: "small-note" }, `Факты проверены ${b.date.split("-").reverse().join(".")}.`, ...(b.sources || []).map(([t, u]) => [" ", el("a", { class: "notr", href: u, target: "_blank", rel: "noopener" }, t)])),
  // Ролик: файлы лежат в media/ (их собирает scripts/video/build.mjs и в git они не входят) — если файла нет, вместо плеера пояснение.
  video: (b) => {
    const later = () => el("div", { class: "help" }, "Ролик появится позже.");
    // субтитры: русские и, если модуль переведён, на языке интерфейса (они включены по умолчанию); название языка — на нём самом
    const tracks = (b.tracks || []).map((t, i) => el("track", { kind: "subtitles", src: t.src, srclang: t.lang, label: I18N?.LANGS?.[t.lang] || t.lang, default: i === b.tracks.length - 1, class: "notr" }));
    const v = b.src ? el("video", { src: b.src, poster: b.poster, controls: true, preload: "none", playsinline: true, style: "width:100%;margin-top:8px;border-radius:8px" }, ...tracks) : null;
    if (v) v.onerror = () => v.replaceWith(later());
    return el("div", { class: "box" }, el("b", null, b.title || "Видео"), v || later(), b.transcript ? el("details", { class: "sub" }, el("summary", null, "Текст ролика"), ...richText(b.transcript)) : null);
  },
};

// Строка в боковой панели под «Учёбой»: «07 Название модуля» и «7.2 Название урока»; без открытого урока скрыта.
export const lessonLabel = (l) => { const n = Number(l.module.id.slice(1)); return [`${String(n).padStart(2, "0")} ${l.module.title}`, `${n}.${l.module.lessons.findIndex((x) => x.id === l.id) + 1} ${l.title}`]; };
function sideLesson(l) {
  const box = document.getElementById("sideLesson"); if (!box) return;
  box.hidden = !l;
  box.replaceChildren(...(l ? lessonLabel(l).map((t) => el("span", null, t)) : []));
}
function renderHome() {
  view = null; sideLesson(null);
  const done = lessons.filter((l) => P(l.id).done).length;
  $("learnArea").replaceChildren(
    el("div", { class: "card" }, el("b", null, "Курс"), el("div", { class: "help" }, `Пройдено уроков: ${done} из ${lessons.length}. Модули можно открывать в любом порядке. Курс объясняет и показывает, но не советует, что покупать.`)),
    ...mods.map((m, mi) => el("div", { class: "card" },
      el("b", { class: "notr" }, `${mi}. ${m.title}`),
      el("ol", { class: "lessons" }, m.lessons.map((l) => el("li", null, el("button", { class: "linkbtn notr", onclick: () => openLesson(l.id) }, l.title), ` · ${l.minutes} мин`, P(l.id).done ? el("span", { class: "good" }, " ✓ пройден") : null))),
      el("details", { class: "sub" }, el("summary", null, "Главное в трёх строках"), el("ul", { class: "notr" }, m.summary.map((s) => el("li", null, s)))))),
    el("div", { class: "card help" }, "Все модули курса на месте. Налоги и правила меняются часто: перед решением сверяйтесь с датой проверки и первоисточником в уроке."));
}

// Блок ролика урока: ролик модуля (course/videos.js) разрезан по урокам — сцены урока n те, у которых lessons[i] === n;
// файлы media/mNN-K.*. Урок без сцен — без ролика (null).
// По-русски — русский ролик с русскими субтитрами. На другом языке — английский ролик (media/en/), если он переведён:
// субтитры на языке интерфейса (если ролик переведён и на него) и английские; иначе русский ролик.
const lessonVideo = (l) => {
  const mid = l.module.id, v = VIDEOS[mid], n = l.module.lessons.findIndex((x) => x.id === l.id) + 1, id = l.id;
  if (!v?.lessons?.includes(n)) return null;
  const text = (scenes) => scenes.filter((_, i) => v.lessons[i] === n).map((s) => s.t).join("\n\n");
  const en = TR.EN[mid], own = TR.VIDEOS[mid];
  if (LANG === "ru" || !en) return { src: `media/${id}.mp4`, poster: `media/${id}.jpg`, tracks: [{ src: `media/${id}.ru.vtt`, lang: "ru" }], transcript: text(v.scenes) };
  return { src: `media/en/${id}.mp4`, poster: `media/en/${id}.jpg`,
    tracks: [{ src: `media/en/${id}.en.vtt`, lang: "en" }, ...(LANG !== "en" && own ? [{ src: `media/en/${id}.${LANG}.vtt`, lang: LANG }] : [])],
    transcript: text((own || en).scenes) };
};

function openLesson(id) {
  const i = lessons.findIndex((l) => l.id === id), l = lessons[i];
  if (!l) return renderHome();
  view = id;
  const p = P(id);
  const doneBtn = el("button", { onclick: () => { p.done = true; p.doneAt ||= Date.now(); saveLesson(id); next ? openLesson(next.id) : renderHome(); } }, p.done ? "Дальше" : "Урок пройден");
  const prev = lessons[i - 1], next = lessons[i + 1];
  $("learnArea").replaceChildren(el("div", { class: "card lesson" },
    el("div", { class: "inline" }, el("button", { class: "sec small", onclick: renderHome }, "← К списку уроков"), el("span", { class: "kicker" }, `Модуль ${l.module.id.replace(/[^0-9]/g, "").padStart(2, "0")} · урок ${l.module.lessons.findIndex((x) => x.id === id) + 1} из ${l.module.lessons.length} · ${l.minutes} мин`)),
    el("h2", { class: "notr" }, l.title),
    LANG !== "ru" && !l.module.translated ? el("div", { class: "box help" }, "Этот модуль пока не переведён: текст урока — на русском.") : null,
    ((vid) => vid ? BLOCKS.video(vid) : null)(lessonVideo(l)), // ролик урока — его часть ролика модуля
    ...l.blocks.map((b, k) => BLOCKS[b.type](b, l, k)),
    el("hr"),
    el("div", { class: "inline" }, prev ? el("button", { class: "sec notr", onclick: () => openLesson(prev.id) }, "← " + prev.title) : null, doneBtn, next ? el("span", { class: "help" }, "Следующий:", " ", el("span", { class: "notr" }, next.title)) : null)));
  sideLesson(l);
  window.scrollTo(0, 0);
}

export async function initCourse() {
  await loadProgress();
  // перевод курса на язык интерфейса (course/<язык>/index.js); если его нет — курс по-русски
  if (LANG !== "ru" && !TR.loaded) {
    TR.loaded = true;
    try { const x = await import(`./course/${LANG}/index.js`); TR.MODULES = x.MODULES || {}; TR.TERMS = x.TERMS || {}; index(); } catch { /* перевода нет — курс по-русски */ }
    try { TR.VIDEOS = (await import(`./course/${LANG}/videos.js`)).default; TR.EN = LANG === "en" ? TR.VIDEOS : (await import("./course/en/videos.js")).default; } catch { /* ролики по-русски */ }
  }
  try { const m = window.polygonMeta || (await (await fetch("api/meta")).json()); glossary = new Map([...m.glossary, ...COURSE_TERMS]); } catch { /* без словаря термины покажут заглушку */ }
  view ? openLesson(view) : renderHome();
}
window.initCourse = initCourse;
window.polygonLesson = (id) => { view = id; }; // мастер рабочего режима: следующий показ курса откроет этот урок

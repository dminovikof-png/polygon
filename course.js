// Учебный режим: рисует уроки из данных (public/course/*.js). Расчётов здесь нет — только показ, рисунки и вопросы.
import { MODULES } from "./course/index.js";
import { FIGURES } from "./course/figures.js";
import { SIMS } from "./course/sims.js";
import { COURSE_TERMS } from "./course/glossary.js";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) { if (v == null || v === false) continue; if (k === "class") e.className = v; else if (k.startsWith("on")) e[k] = v; else e.setAttribute(k, v === true ? "" : v); }
  for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}

let glossary = new Map(COURSE_TERMS), progress = { lessons: {} }, view = null;
const lessons = MODULES.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m })));
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
function richText(s) {
  return s.split(/\n\n+/).map((par) => {
    const p = el("p", { class: "plain" });
    p.innerHTML = esc(par).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, shown) => `<button class="term" data-term="${t}">${shown || t}</button>`);
    return p;
  });
}
document.addEventListener("click", (e) => {
  const b = e.target.closest?.(".term");
  document.querySelectorAll(".termpop").forEach((x) => x.remove());
  if (!b) return;
  const def = glossary.get(b.dataset.term) || "Определение пока не добавлено в словарь.";
  const pop = el("div", { class: "termpop", role: "note" }, el("b", null, b.dataset.term), el("div", null, def));
  b.after(pop);
});

const BLOCKS = {
  text: (b) => richText(b.text),
  figure: (b) => { const f = el("figure", { class: "fig" }); f.innerHTML = FIGURES[b.fig](b.args); if (b.caption) f.append(el("figcaption", { class: "help" }, b.caption)); return f; },
  anim: (b) => {
    let i = 0, timer = null;
    const pic = el("div"), cap = el("div", { class: "plain" }), count = el("span", { class: "help" });
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
    const saved = P(lesson.id).quiz[k], box = el("div", { class: "box quiz" }, el("b", null, "Проверьте себя: " + b.q));
    const res = el("div", { class: "plain" });
    const pick = (j) => {
      box.querySelectorAll(".opt").forEach((o, n) => { o.classList.toggle("ok", n === b.answer); o.classList.toggle("no", n === j && j !== b.answer); });
      res.replaceChildren(el("b", { class: j === b.answer ? "good" : "bad" }, j === b.answer ? "Верно. " : "Не совсем. "), b.explain);
    };
    b.options.forEach((o, j) => box.append(el("button", { class: "opt", onclick: () => { pick(j); P(lesson.id).quiz[k] = { pick: j, ok: j === b.answer, at: Date.now() }; saveLesson(lesson.id); } }, o)));
    box.append(res);
    if (saved) pick(saved.pick);
    return box;
  },
  measured: (b) => el("div", { class: "box measured" }, el("b", null, "Что показало исследование проекта"), ...richText(b.text), b.source ? el("div", { class: "small-note" }, "Источник: " + b.source) : null),
  try: (b) => el("button", { class: "sec", onclick: () => window.goWork?.(b.stage, b.sub) }, b.label + " →"),
  sim: (b) => SIMS[b.sim](b.args || {}),
  checked: (b) => el("div", { class: "small-note" }, `Факты проверены ${b.date.split("-").reverse().join(".")}.`, ...(b.sources || []).map(([t, u]) => [" ", el("a", { href: u, target: "_blank", rel: "noopener" }, t)])),
  video: (b) => el("div", { class: "box" }, el("b", null, b.title || "Видео"), b.src ? el("video", { src: b.src, controls: true, preload: "none", style: "width:100%;margin-top:8px" }) : el("div", { class: "help" }, "Ролик появится позже."), b.transcript ? el("details", { class: "sub" }, el("summary", null, "Текст ролика"), ...richText(b.transcript)) : null),
};

function renderHome() {
  view = null;
  const done = lessons.filter((l) => P(l.id).done).length;
  $("learnArea").replaceChildren(
    el("div", { class: "card" }, el("b", null, "Курс"), el("div", { class: "help" }, `Пройдено уроков: ${done} из ${lessons.length}. Модули можно открывать в любом порядке. Курс объясняет и показывает, но не советует, что покупать.`)),
    ...MODULES.map((m, mi) => el("div", { class: "card" },
      el("b", null, `${mi}. ${m.title}`),
      el("ol", { class: "lessons" }, m.lessons.map((l) => el("li", null, el("button", { class: "linkbtn", onclick: () => openLesson(l.id) }, l.title), ` · ${l.minutes} мин`, P(l.id).done ? el("span", { class: "good" }, " ✓ пройден") : null))),
      el("details", { class: "sub" }, el("summary", null, "Главное в трёх строках"), el("ul", null, m.summary.map((s) => el("li", null, s)))))),
    el("div", { class: "card help" }, "Дальше появятся модули: типы активов, анализ, стратегии, риск, честная проверка, алго- и ИИ-трейдинг, экономика ИИ-агентов, налоги и правила по странам."));
}

function openLesson(id) {
  const i = lessons.findIndex((l) => l.id === id), l = lessons[i];
  if (!l) return renderHome();
  view = id;
  const p = P(id);
  const doneBtn = el("button", { onclick: () => { p.done = true; p.doneAt ||= Date.now(); saveLesson(id); next ? openLesson(next.id) : renderHome(); } }, p.done ? "Дальше" : "Урок пройден");
  const prev = lessons[i - 1], next = lessons[i + 1];
  $("learnArea").replaceChildren(el("div", { class: "card lesson" },
    el("div", { class: "inline" }, el("button", { class: "sec small", onclick: renderHome }, "← К списку уроков"), el("span", { class: "help" }, `${l.module.title} · урок ${l.module.lessons.findIndex((x) => x.id === id) + 1} из ${l.module.lessons.length} · ${l.minutes} мин`)),
    el("h2", null, l.title),
    ...l.blocks.map((b, k) => BLOCKS[b.type](b, l, k)),
    el("hr"),
    el("div", { class: "inline" }, prev ? el("button", { class: "sec", onclick: () => openLesson(prev.id) }, "← " + prev.title) : null, doneBtn, next ? el("span", { class: "help" }, "Следующий: " + next.title) : null)));
  window.scrollTo(0, 0);
}

export async function initCourse() {
  await loadProgress();
  try { const m = window.polygonMeta || (await (await fetch("api/meta")).json()); glossary = new Map([...m.glossary, ...COURSE_TERMS]); } catch { /* без словаря термины покажут заглушку */ }
  view ? openLesson(view) : renderHome();
}
window.initCourse = initCourse;
window.polygonLesson = (id) => { view = id; }; // мастер рабочего режима: следующий показ курса откроет этот урок

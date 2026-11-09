// Прогресс учебного режима: пройденные уроки и ответы на вопросы. Хранится в data/progress.json на компьютере,
// чтобы планшет и телефон видели тот же прогресс. Слияние не теряет данных: так же сливаются записи с устройств.
import { store } from "./store.js";

const KEY = "progress.json";

// p = { lessons: { [id]: { done, doneAt, quiz: { [номер вопроса]: { pick, ok, at } } } } }
// Урок пройден, если пройден хотя бы в одной копии; у ответа на вопрос побеждает более поздний.
export function mergeProgress(a = {}, b = {}) {
  const out = { lessons: {} };
  for (const src of [a.lessons || {}, b.lessons || {}]) {
    for (const [id, l] of Object.entries(src)) {
      const cur = (out.lessons[id] ||= { done: false, doneAt: null, quiz: {} });
      if (l.done) { cur.done = true; cur.doneAt = cur.doneAt && l.doneAt ? Math.min(cur.doneAt, l.doneAt) : cur.doneAt || l.doneAt || null; }
      for (const [k, q] of Object.entries(l.quiz || {})) if (!cur.quiz[k] || (q.at || 0) > (cur.quiz[k].at || 0)) cur.quiz[k] = q;
    }
  }
  return out;
}

export function readProgress() {
  return mergeProgress(store().get(KEY) || {});
}

// Принимает часть прогресса (например, один урок) и сливает с записанным.
export function saveProgress(part) {
  if (!part || typeof part !== "object" || typeof part.lessons !== "object") throw new Error("Неверный формат прогресса");
  const ids = Object.keys(part.lessons);
  if (ids.length > 500 || ids.some((id) => !/^[a-z0-9-]{1,40}$/.test(id))) throw new Error("Неверный номер урока");
  const p = mergeProgress(readProgress(), part);
  store().set(KEY, p);
  return p;
}

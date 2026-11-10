// Перевод курса. Уроки пишутся по-русски (course/mNN.js); перевод модуля — файл course/<язык>/mNN.js
// с теми же уроками и блоками по порядку, но только с текстом: { id, src, title, summary, lessons: { id: { title, blocks } } }.
// Блок перевода повторяет переводимые поля русского блока (null — у блока нечего переводить):
//   text → { text }, measured → { text, source }, figure → { caption }, anim → { steps: [подписи] },
//   quiz → { q, options, explain }, try → { label }, checked → { sources: [названия] }.
// Ссылки на словарь в переводе остаются с русским ключом: [[Хеш|hash]] — так находится определение.
// src — отпечаток русского текста: если русский урок поменяли, отпечаток не совпадёт и тест напомнит обновить перевод.
// Надписи рисунков и симуляторов переводятся не здесь, а общим словарём интерфейса (public/i18n/<язык>.json).

const FIELDS = { text: ["text"], measured: ["text", "source"], figure: ["caption"], quiz: ["q", "options", "explain"], try: ["label"] };

// Переводимые поля одного блока (null, если переводить нечего).
export function blockTexts(b) {
  const out = {};
  for (const k of FIELDS[b.type] || []) if (b[k] != null) out[k] = b[k];
  if (b.type === "anim") out.steps = b.steps.map((s) => s.caption);
  if (b.type === "checked" && b.sources?.length) out.sources = b.sources.map(([t]) => t);
  return Object.keys(out).length ? out : null;
}

// Весь переводимый текст модуля в форме файла перевода (русский — как образец для переводчика).
export function moduleTexts(m) {
  return {
    title: m.title, summary: m.summary,
    lessons: Object.fromEntries(m.lessons.map((l) => [l.id, { title: l.title, blocks: l.blocks.map(blockTexts) }])),
  };
}

// Ролики переводятся отдельно от уроков (course/<язык>/videos.js): { mNN: { src, title, summary, scenes } }.
// Сцена перевода — те же поля, что у русской: t (реплика и субтитры), head, kicker, points; say не переводится.
const SCENE_FIELDS = ["t", "head", "kicker", "points"];
export function videoTexts(m, v) {
  return { title: m.title, summary: m.summary, scenes: v.scenes.map((s) => Object.fromEntries(SCENE_FIELDS.filter((k) => s[k] != null).map((k) => [k, s[k]]))) };
}
// Сценарий ролика на языке перевода: русские сцены (кадры) с переведённым текстом.
export function applyVideo(v, t) {
  return { ...v, scenes: v.scenes.map((s, i) => ({ ...s, ...t.scenes[i], say: undefined })) };
}

// Отпечаток текста (FNV-1a, 32 бита): короткий, считается и в браузере, и в Node.
function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
}
export const fingerprint = (m) => hash(JSON.stringify(moduleTexts(m)));
export const videoFingerprint = (m, v) => hash(JSON.stringify(videoTexts(m, v)));

// Наложить перевод на русский модуль: структура, рисунки, ответы и ссылки берутся из русского, текст — из перевода.
export function applyTranslation(m, t) {
  if (!t) return m;
  return {
    ...m, title: t.title, summary: t.summary, translated: true,
    lessons: m.lessons.map((l) => {
      const tl = t.lessons[l.id];
      return { ...l, title: tl.title, blocks: l.blocks.map((b, k) => {
        const tb = tl.blocks[k];
        if (!tb) return b;
        const out = { ...b };
        for (const f of FIELDS[b.type] || []) if (tb[f] != null) out[f] = tb[f];
        if (b.type === "anim") out.steps = b.steps.map((s, i) => ({ ...s, caption: tb.steps[i] }));
        if (b.type === "checked" && tb.sources) out.sources = b.sources.map(([, u], i) => [tb.sources[i], u]);
        return out;
      }) };
    }),
  };
}

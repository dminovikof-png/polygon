// Выбор языка. Программа пишется по-русски; на другом языке каждая надпись на странице переводится по словарю
// public/i18n/<язык>.json. Ключ словаря — русский текст; у текста с числами — шаблон: «Отмечено: {0} из {1}».
// Подставленные части ({0}, {1}) переводятся отдельно, поэтому «выше на 12 %» собирается из «выше» и шаблона.
// Не найденные в словаре тексты остаются русскими и собираются в PolygonI18n.missing (для проверки полноты).
// Уроки курса не переводятся по строкам (у них разметка терминов): курс переводится целиком по модулям.
(function () {
  const LANGS = { ru: "Русский", en: "English", es: "Español", zh: "中文", pt: "Português" };
  const KEY = "polygon.lang", CYR = /[А-Яа-яЁё]/;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Словарь → точные совпадения и шаблоны (длинные шаблоны проверяются первыми: они точнее).
  // Подстановки подряд ({0}{1}) — одна группа: где её разрезать, решается при разборе.
  function compile(dict) {
    const exact = new Map(), pats = [];
    for (const [k, v] of Object.entries(dict || {})) {
      if (typeof v !== "string") continue;
      if (!/\{\d+\}/.test(k)) { exact.set(k, v); continue; }
      const runs = []; let re = "^", open = false;
      for (const p of k.split(/(\{\d+\})/)) {
        const m = /^\{(\d+)\}$/.exec(p);
        if (m) { if (open) runs[runs.length - 1].push(+m[1]); else { runs.push([+m[1]]); re += "([\\s\\S]*?)"; open = true; } }
        else if (p) { re += esc(p); open = false; }
      }
      pats.push({ re: new RegExp(re + "$"), runs, out: v, fixed: k.replace(/\{\d+\}/g, "").length });
    }
    pats.sort((a, b) => b.fixed - a.fixed);
    return { exact, pats };
  }

  function make(dict) {
    const { exact, pats } = compile(dict), missing = new Set(), memo = new Map();
    const up = (s) => s.charAt(0).toUpperCase() + s.slice(1), low = (s) => s.charAt(0).toLowerCase() + s.slice(1);
    // перевод одного куска; null — не найден. Память делает разбор склеек быстрым: куски повторяются постоянно.
    function find(core) {
      if (!memo.has(core)) memo.set(core, find1(core));
      return memo.get(core);
    }
    // разрезать текст на n частей так, чтобы каждая переводилась
    function split(text, n) {
      if (n === 1) { const x = find(text); return x == null ? null : [x]; }
      for (let i = 0; i <= text.length; i++) {
        const a = find(text.slice(0, i)); if (a == null) continue;
        const rest = split(text.slice(i), n - 1); if (rest) return [a, ...rest];
      }
      return null;
    }
    function find1(core) {
      if (!CYR.test(core)) return core;
      const ws = /^(\s*)([\s\S]*?)(\s*)$/.exec(core);
      if (ws[1] || ws[3]) { const x = find(ws[2]); return x == null ? null : ws[1] + x + ws[3]; }
      let r = exact.get(core);
      if (r != null) return r;
      for (const p of pats) {
        const g = p.re.exec(core);
        if (!g) continue;
        const parts = {}; let ok = true;
        p.runs.forEach((nums, i) => { const xs = ok && split(g[i + 1], nums.length); if (!xs) ok = false; else nums.forEach((n, j) => (parts[n] = xs[j])); });
        if (ok) return p.out.replace(/\{(\d+)\}/g, (_, n) => parts[n] ?? "");
      }
      // «Удержание той же монеты» из «удержание той же монеты» — заглавная буква добавлена в коде
      if (core !== low(core) && (r = exact.get(low(core))) != null) return up(r);
      // значок вердикта или статус перед названием: «❌ Тренд…», «учебная Пересечение…»
      const pre = /^([^\p{L}\p{N}«(]+|учебная )(.+)$/u.exec(core);
      if (pre) { const a = find(pre[1].trim()), b = find(pre[2]); if (a != null && b != null) return (pre[1].trim() ? a + " " : "") + b; }
      // склейка из готовых частей: «Источник: …», «биржа · свеча», «итог — пояснение», предложения подряд
      for (const sep of [": ", " · ", " — ", "; ", ", ", ". "]) {
        const k = core.indexOf(sep);
        if (k <= 0) continue;
        const left = core.slice(0, k), b = find(core.slice(k + sep.length));
        if (b == null) continue;
        if (sep === ". ") { const a = find(left + "."); if (a != null) return a + " " + b; continue; }
        if (sep === ": ") { const a = find(left + ":"); if (a != null) return a + " " + b; }
        const a = find(left); if (a != null) return a + sep + b;
      }
      return cover(core);
    }
    // Последний ход: текст склеен в коде плюсами («Планка значимости при » + n + « уникальных попытках»).
    // Ищем разбиение на известные фразы и куски без русских букв (числа, знаки), длинные фразы — первыми.
    const EDGE = /[\s,.;:!?()«»"—–\-/·%]/;
    function cover(core) {
      const n = core.length, out = new Array(n + 1); out[n] = "";
      for (let i = n - 1; i >= 0; i--) {
        out[i] = null;
        if (i === 0 || EDGE.test(core[i - 1]) || !CYR.test(core[i])) {
          for (let j = n; j > i; j--) {
            if (out[j] == null || (j < n && !EDGE.test(core[j]) && CYR.test(core[j - 1]))) continue;
            const piece = core.slice(i, j); let x = exact.get(piece);
            if (x == null && piece !== low(piece) && (x = exact.get(low(piece))) != null) x = up(x);
            if (x != null) { out[i] = x + out[j]; break; }
          }
        }
        if (out[i] == null && !CYR.test(core[i]) && out[i + 1] != null) out[i] = core[i] + out[i + 1];
      }
      return out[0];
    }
    function tr(s) {
      if (typeof s !== "string" || !CYR.test(s)) return s;
      const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), core = m[2].replace(/\s+/g, " ");
      const r = find(core);
      if (r == null) { missing.add(core); return s; }
      return m[1] + r + m[3];
    }
    return { tr, missing };
  }

  const ATTRS = ["title", "placeholder", "aria-label", "label"];
  function translateTree(root, tr) {
    if (root.nodeType === 3) { if (root.parentElement?.closest(".notr,script,style")) return; const t = tr(root.data); if (t !== root.data) root.data = t; return; }
    if (root.nodeType !== 1 || root.closest(".notr,script,style")) return;
    for (const a of ATTRS) if (root.hasAttribute(a)) { const v = root.getAttribute(a), t = tr(v); if (t !== v) root.setAttribute(a, t); }
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeType === 1 && n.matches(".notr,script,style") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (n.nodeType === 3) { const t = tr(n.data); if (t !== n.data) n.data = t; }
      else for (const a of ATTRS) if (n.hasAttribute(a)) { const v = n.getAttribute(a), t = tr(v); if (t !== v) n.setAttribute(a, t); }
    }
  }

  function detect() {
    try { const s = localStorage.getItem(KEY); if (LANGS[s]) return s; } catch { /* нет хранилища */ }
    for (const l of navigator.languages || [navigator.language || "ru"]) { const k = String(l).slice(0, 2).toLowerCase(); if (LANGS[k]) return k; }
    return "ru";
  }

  const api = { LANGS, make, compile, lang: "ru", tr: (s) => s, missing: new Set() };
  globalThis.PolygonI18n = api;
  if (typeof document === "undefined") return; // проверки в Node: только чистые функции

  api.lang = detect();
  document.documentElement.lang = api.lang;
  api.set = (l) => { try { localStorage.setItem(KEY, l); } catch { /* выбор не запомнится */ } location.reload(); };
  if (api.lang !== "ru") { document.documentElement.classList.add("i18n-wait"); setTimeout(() => document.documentElement.classList.remove("i18n-wait"), 3000); }
  // номер версии сайта (i18n.js?v=…) передаётся словарю: после публикации браузер не возьмёт старый словарь из своего кэша
  const ver = (document.currentScript && document.currentScript.src.split("?")[1]) || "";
  api.ready = api.lang === "ru" ? Promise.resolve() : fetch(`i18n/${api.lang}.json${ver ? "?" + ver : ""}`).then((r) => r.json()).then((dict) => {
    const t = make(dict); api.tr = t.tr; api.missing = t.missing;
    const run = () => {
      translateTree(document.body, t.tr); document.title = t.tr(document.title);
      const mo = new MutationObserver((recs) => {
        for (const r of recs) {
          if (r.type === "childList") r.addedNodes.forEach((n) => translateTree(n, t.tr));
          else translateTree(r.target, t.tr);
        }
        mo.takeRecords(); // изменения, сделанные самим переводом, повторно не разбираются
      });
      mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    };
    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", run) : run();
  }).catch(() => { /* словаря нет — остаётся русский */ }).finally(() => document.documentElement.classList.remove("i18n-wait"));
})();

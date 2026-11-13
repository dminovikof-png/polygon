// Общие кирпичики рисунков курса: цвета, холст SVG, подписи, прямоугольники, стрелки, оси графика.
// Рисунки — функции, возвращающие SVG-строку; цифры считаются в коде, поэтому работают без сети.
// Цвета — переменные темы (public/theme.css): в уроке (.paper) рисунок светлый, в рабочем режиме и роликах — тёмный.
export const C = { bg: "var(--fig-bg)", card: "var(--fig-card)", line: "var(--fig-line)", text: "var(--fig-text)", dim: "var(--fig-dim)", blue: "var(--fig-blue)", green: "var(--fig-green)", red: "var(--fig-red)", gold: "var(--fig-gold)", violet: "var(--fig-violet)" };

const ARROW = `<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${C.text}"/></marker></defs>`;
export const svg = (w, h, body, label) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${escAttr(label)}" style="width:100%;max-width:${w}px;height:auto;background:${C.bg};border-radius:8px">${ARROW}${body}</svg>`;
export const escAttr = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export const txt = (x, y, s, { size = 13, color = C.text, anchor = "start", weight = 400 } = {}) => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-weight="${weight}" style="font-family:var(--sans)">${escAttr(s)}</text>`;
// прямоугольник с заголовком и строками по центру
export function box(x, y, w, h, title, lines = [], { color = C.line, fill = C.card, size = 14 } = {}) {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${color}" stroke-width="2"/>`;
  const top = lines.length ? y + 24 : y + h / 2 + 5;
  if (title) s += txt(x + w / 2, top, title, { size, anchor: "middle", weight: 600 });
  lines.forEach((l, i) => { s += txt(x + w / 2, top + 20 + i * 17, l, { size: 12, anchor: "middle", color: C.dim }); });
  return s;
}
export const arrow = (x1, y1, x2, y2, { color = C.text, dash = false, width = 2 } = {}) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${color}" stroke-width="${width}" fill="none" marker-end="url(#ar)"${dash ? ' stroke-dasharray="5 4"' : ""}/>`;
export const line = (x1, y1, x2, y2, { color = C.line, dash = false, width = 1 } = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"${dash ? ' stroke-dasharray="4 3"' : ""}/>`;
// Подписи, вылезающие за край рисунка (длинный перевод, число у края), вписываются по месту в браузере:
// короткая сдвигается внутрь, длинная сжимается по ширине (textLength). Вызывать после перевода — нужны настоящие размеры.
export function fitText(root) {
  for (const s of root.querySelectorAll("svg[role=img]")) {
    const vb = s.viewBox?.baseVal;
    if (!vb || !vb.width) continue;
    const lo = vb.x + 4, hi = vb.x + vb.width - 4;
    for (const t of s.querySelectorAll("text")) {
      if (t.dataset.x0 == null) t.dataset.x0 = t.getAttribute("x") ?? "0";
      t.setAttribute("x", t.dataset.x0); t.removeAttribute("textLength"); t.removeAttribute("lengthAdjust");
      let b; try { b = t.getBBox(); } catch { continue; }
      const over = b.x + b.width - hi, under = lo - b.x;
      if (!b.width || (over <= 0 && under <= 0)) continue;
      if (b.width <= (hi - lo) * 0.4) { t.setAttribute("x", (+t.dataset.x0 + (over > 0 ? -over : under)).toFixed(1)); continue; }
      const a = t.getAttribute("text-anchor") || "start", x = +t.dataset.x0;
      const room = a === "end" ? x - lo : a === "middle" ? 2 * Math.min(x - lo, hi - x) : hi - x;
      if (room > 20 && room < b.width) { t.setAttribute("textLength", room.toFixed(1)); t.setAttribute("lengthAdjust", "spacingAndGlyphs"); }
    }
  }
}
export const fmt = (v, d = 0) => Number(v).toLocaleString("ru-RU", { minimumFractionDigits: d, maximumFractionDigits: d });

// Повторяемые случайные числа: одно и то же зерно — одна и та же картинка.
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Линейный график: series — [{ pts: [[x, y]...], color, label, width, dash }], рамка с подписями осей. Возвращает тело SVG.
// log — логарифмическая шкала по вертикали; xticks — [[x, подпись]]; bands — закрашенные отрезки [{ x1, x2, color }];
// точки с NaN разрывают линию (скользящая средняя в начале истории).
export function plot(series, { x0 = 50, y0 = 30, w = 520, h = 170, xlab = "", ylab = "", ymin, ymax, xmin, xmax, yfmt = (v) => fmt(v), marks = [], hlines = [], log = false, xticks = [], bands = [], yticks } = {}) {
  const T = log ? (v) => Math.log10(v) : (v) => v;
  const all = series.flatMap((s) => s.pts).filter((p) => isFinite(p[1]) && (!log || p[1] > 0));
  const xs = all.map((p) => p[0]), ys = all.map((p) => T(p[1]));
  const xa = xmin ?? Math.min(...xs), xb = xmax ?? Math.max(...xs);
  let ya = ymin != null ? T(ymin) : Math.min(...ys, ...hlines.map((l) => T(l.y))), yb = ymax != null ? T(ymax) : Math.max(...ys, ...hlines.map((l) => T(l.y)));
  if (ya === yb) { ya -= 1; yb += 1; }
  const X = (v) => x0 + ((v - xa) / (xb - xa || 1)) * w, Y = (v) => y0 + h - ((T(v) - ya) / (yb - ya)) * h;
  let s = "";
  for (const bd of bands) s += `<rect x="${X(bd.x1).toFixed(1)}" y="${y0}" width="${Math.max(0.5, X(bd.x2) - X(bd.x1)).toFixed(1)}" height="${h}" fill="${bd.color || C.green}" opacity="${bd.opacity ?? 0.13}"/>`;
  s += line(x0, y0 + h, x0 + w, y0 + h) + line(x0, y0, x0, y0 + h);
  // деления по вертикали: заданные, степени 10 и их тройки (лог) или верх и низ
  const inv = (v) => (log ? 10 ** v : v);
  let ticks = yticks;
  if (!ticks && log) { ticks = []; for (let k = Math.floor(ya) - 1; k <= Math.ceil(yb); k++) for (const m of [1, 3]) { const v = m * 10 ** k; if (T(v) >= ya - 1e-9 && T(v) <= yb + 1e-9) ticks.push(v); } if (ticks.length < 2) ticks = [inv(ya), inv(yb)]; }
  if (!ticks) ticks = [inv(ya), inv(yb)];
  for (const v of ticks) s += line(x0 - 3, Y(v), x0 + w, Y(v), { color: C.line, dash: true }) + txt(x0 - 6, Y(v) + 4, yfmt(v), { size: 11, color: C.dim, anchor: "end" });
  for (const [x, label] of xticks) s += line(X(x), y0 + h, X(x), y0 + h + 4, { color: C.dim }) + txt(X(x), y0 + h + 16, label, { size: 10, color: C.dim, anchor: "middle" });
  for (const l of hlines) s += line(x0, Y(l.y), x0 + w, Y(l.y), { color: l.color || C.dim, dash: true }) + (l.label ? txt(x0 + w - 4, Y(l.y) - 4, l.label, { size: 11, color: l.color || C.dim, anchor: "end" }) : "");
  for (const sr of series) {
    let d = "", pen = false;
    for (const p of sr.pts) {
      if (!isFinite(p[1]) || (log && p[1] <= 0)) { pen = false; continue; }
      d += `${pen ? "L" : "M"}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`; pen = true;
    }
    s += `<path d="${d}" fill="none" stroke="${sr.color || C.blue}" stroke-width="${sr.width || 2}"${sr.dash ? ' stroke-dasharray="5 4"' : ""}${sr.opacity != null ? ` opacity="${sr.opacity}"` : ""}/>`;
  }
  for (const m of marks) s += `<circle cx="${X(m.x)}" cy="${Y(m.y)}" r="${m.r || 5}" fill="${m.color || C.gold}"/>` + (m.label ? txt(X(m.x) + (m.dx ?? 8), Y(m.y) + (m.dy ?? -8), m.label, { size: 12, color: m.color || C.gold, anchor: m.anchor || "start" }) : "");
  if (xlab) s += txt(x0 + w / 2, y0 + h + 30, xlab, { size: 11, color: C.dim, anchor: "middle" });
  if (ylab) s += txt(x0, y0 - 10, ylab, { size: 11, color: C.dim });
  // легенда — над рамкой, чтобы не закрывать линии
  let lx = x0 + 10;
  for (const sr of series.filter((s) => s.label)) { s += `<rect x="${lx}" y="${y0 - 10}" width="14" height="3" fill="${sr.color || C.blue}"/>` + txt(lx + 20, y0 - 5, sr.label, { size: 11 }); lx += 30 + sr.label.length * 6.5; }
  return s;
}

// Годы для оси дат: t0 — первый день (секунды UTC), n — сколько дней; деления на 1 января (не чаще, чем нужно).
export function yearTicks(t0, n, maxTicks = 9) {
  const out = [], y0 = new Date(t0 * 1000).getUTCFullYear(), y1 = new Date((t0 + (n - 1) * 86400) * 1000).getUTCFullYear();
  const step = Math.max(1, Math.ceil((y1 - y0 + 1) / maxTicks));
  for (let y = y0 + 1; y <= y1; y += step) out.push([(Date.UTC(y, 0, 1) / 1000 - t0) / 86400, String(y)]);
  return out;
}
// Номер дня в ряду по дате "YYYY-MM-DD".
export const dayIndex = (t0, date) => Math.round((Date.parse(date + "T00:00:00Z") / 1000 - t0) / 86400);

// Текст в несколько строк: перенос по словам, max — сколько знаков в строке.
// Фраза переводится целиком до переноса: словарь интерфейса знает всю фразу, а не её куски по строкам.
// В китайском нет пробелов, поэтому длинное «слово» режется по знакам (иероглиф шире буквы — вдвое меньше знаков).
export function para(x, y, s, { max = 90, size = 12, color = C.text, lh = 17 } = {}) {
  return wrapLines(s, max).map((l, i) => txt(x, y + i * lh, l, { size, color })).join("");
}

// Те же переведённые и перенесённые строки — для подписей в рамках (box) и других рисунков.
export function wrapLines(s, max) {
  const tr = globalThis.PolygonI18n?.tr, text = tr ? tr(String(s)) : String(s), lines = [];
  const words = text.split(" ").flatMap((w) => {
    const n = /[　-鿿＀-￯]/.test(w) ? Math.floor(max / 2) : max;
    if (w.length <= n) return [w];
    const parts = []; for (let i = 0; i < w.length; i += n) parts.push(w.slice(i, i + n)); return parts;
  });
  let cur = "";
  const width = (t) => t.length * (/[　-鿿＀-￯]/.test(t) ? 2 : 1);
  for (const w of words) { if (width((cur + " " + w).trim()) > max && cur) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }
  if (cur) lines.push(cur);
  return lines;
}

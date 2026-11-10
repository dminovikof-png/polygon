// Общие кирпичики рисунков курса: цвета, холст SVG, подписи, прямоугольники, стрелки, оси графика.
// Рисунки — функции, возвращающие SVG-строку; цифры считаются в коде, поэтому работают без сети.
export const C = { bg: "#0e1318", card: "#171d24", line: "#263040", text: "#c9d1dc", dim: "#8b95a3", blue: "#2f7de1", green: "#4cc38a", red: "#ef6a6a", gold: "#e0b341", violet: "#a07be0" };

const ARROW = `<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${C.text}"/></marker></defs>`;
export const svg = (w, h, body, label) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${escAttr(label)}" style="width:100%;max-width:${w}px;height:auto;background:${C.bg};border-radius:8px">${ARROW}${body}</svg>`;
export const escAttr = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export const txt = (x, y, s, { size = 13, color = C.text, anchor = "start", weight = 400 } = {}) => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-weight="${weight}" font-family="system-ui,sans-serif">${escAttr(s)}</text>`;
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
export function para(x, y, s, { max = 90, size = 12, color = C.text, lh = 17 } = {}) {
  const lines = [];
  let cur = "";
  for (const w of String(s).split(" ")) { if ((cur + " " + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }
  if (cur) lines.push(cur);
  return lines.map((l, i) => txt(x, y + i * lh, l, { size, color })).join("");
}

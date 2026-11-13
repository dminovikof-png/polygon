// Свечной график со сделками: canvas, масштаб колесом и щипком, сдвиг перетаскиванием, подсказка у метки.
// Цвета и шрифт — из темы (public/theme.css). Рисуется только видимое окно свечей.
const tr = (s) => globalThis.PolygonI18n?.tr?.(s) ?? s;

export function clampView(n, start, count) {
  const c = Math.max(Math.min(20, n), Math.min(n, Math.round(count)));
  return { start: Math.max(0, Math.min(n - c, Math.round(start))), count: c };
}
// factor < 1 — крупнее; anchor (0…1) — доля ширины под курсором, эта свеча остаётся на месте.
export const zoomView = (n, v, factor, anchor) => clampView(n, v.start + v.count * (1 - factor) * anchor, v.count * factor);
// Первая свеча со временем не меньше t (двоичный поиск).
export function indexAt(times, t) {
  let lo = 0, hi = times.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (times[m] < t) lo = m + 1; else hi = m; }
  return lo;
}

// Подпись цены: до 5 значащих цифр, мелкие цены не обнуляются.
export const fmtPrice = (v) => Number(v).toLocaleString("en-US", { maximumSignificantDigits: 5, useGrouping: false });

export function mountCandles(el, { candles: k, markers = [] }) {
  el._candles?.destroy(); el._candles = null; // повторное монтирование: старый наблюдатель не копится
  const n = k.t.length, H = 320, AX = 64, BOT = 20;
  if (!n) { // нет свечей — короткий текст вместо графика
    const p = document.createElement("div"); p.className = "candlehelp"; p.textContent = tr("нет данных");
    el.replaceChildren(p);
    const empty = { destroy() {} }; el._candles = empty; return empty;
  }
  const cv = document.createElement("canvas"), tip = document.createElement("div");
  cv.className = "candles"; tip.className = "candletip"; tip.hidden = true;
  el.replaceChildren(cv, tip);
  let view = clampView(n, n - 200, 200), W = 0, lastW = 0, lastDpr = 0;
  const mIdx = markers.map((m) => Math.min(n - 1, indexAt(k.t, m.t)));
  const css = (v) => getComputedStyle(el).getPropertyValue(v).trim();
  const geom = () => {
    const w = (W - AX) / view.count, a = view.start, b = a + view.count;
    let lo = Infinity, hi = -Infinity;
    for (let i = a; i < b; i++) { lo = Math.min(lo, k.l[i]); hi = Math.max(hi, k.h[i]); }
    markers.forEach((m, j) => { if (mIdx[j] >= a && mIdx[j] < b) { lo = Math.min(lo, m.px); hi = Math.max(hi, m.px); } });
    const pad = (hi - lo) * 0.06 || 1;
    lo -= pad; hi += pad;
    return { w, a, b, X: (i) => (i - a + 0.5) * w, Y: (v) => 8 + (1 - (v - lo) / (hi - lo)) * (H - BOT - 16), lo, hi };
  };
  function draw() {
    W = el.clientWidth || 600;
    const dpr = devicePixelRatio || 1;
    if (W !== lastW || dpr !== lastDpr) { lastW = W; lastDpr = dpr; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; }
    const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const C = { up: css("--good"), dn: css("--bad"), acc: css("--acc"), mut: css("--mut"), line: css("--line"), tx: css("--tx") };
    const { w, a, b, X, Y, lo, hi } = geom();
    g.font = "11px " + css("--mono"); g.fillStyle = C.mut; g.strokeStyle = C.line; g.lineWidth = 1;
    for (let q = 0; q <= 4; q++) { // цена справа
      const v = lo + ((hi - lo) * q) / 4, y = Y(v);
      g.beginPath(); g.moveTo(0, y); g.lineTo(W - AX, y); g.stroke();
      g.fillText(fmtPrice(v), W - AX + 6, y + 4);
    }
    for (let q = 0; q < 4; q++) { // даты снизу
      const i = a + Math.floor(((b - a) * (q + 0.5)) / 4);
      g.fillText(new Date(k.t[i] * 1000).toISOString().slice(0, 10), X(i) - 30, H - 4);
    }
    const body = Math.max(1, w * 0.7);
    for (let i = a; i < b; i++) {
      const up = k.c[i] >= k.o[i], x = X(i);
      g.strokeStyle = g.fillStyle = up ? C.up : C.dn;
      g.beginPath(); g.moveTo(x, Y(k.h[i])); g.lineTo(x, Y(k.l[i])); g.stroke();
      const y1 = Y(Math.max(k.o[i], k.c[i])), y2 = Y(Math.min(k.o[i], k.c[i]));
      g.fillRect(x - body / 2, y1, body, Math.max(1, y2 - y1));
    }
    markers.forEach((m, j) => {
      const i = mIdx[j]; if (i < a || i >= b) return;
      const x = X(i), y = Y(m.px), s = 6, upTri = m.dir === "buy";
      g.lineWidth = 2;
      if (m.liquidated) { g.strokeStyle = C.dn; g.beginPath(); g.moveTo(x - s, y - s); g.lineTo(x + s, y + s); g.moveTo(x + s, y - s); g.lineTo(x - s, y + s); g.stroke(); g.lineWidth = 1; return; }
      g.beginPath(); g.moveTo(x, upTri ? y - s : y + s); g.lineTo(x - s, upTri ? y + s : y - s); g.lineTo(x + s, upTri ? y + s : y - s); g.closePath();
      g.fillStyle = C.tx; g.fill();
      if (m.kind === "exit") { g.strokeStyle = m.ret > 0 ? C.acc : C.dn; g.stroke(); }
      g.lineWidth = 1;
    });
  }
  const hit = (px, py) => {
    const { a, b, X, Y } = geom();
    let best = null, bd = 10;
    markers.forEach((m, j) => { const i = mIdx[j]; if (i < a || i >= b) return; const d = Math.hypot(X(i) - px, Y(m.px) - py); if (d < bd) { bd = d; best = m; } });
    return best;
  };
  const showTip = (m, px, py) => {
    if (!m) { tip.hidden = true; return; }
    const what = m.kind === "order" ? (m.dir === "buy" ? tr("покупка") : tr("продажа")) : m.kind === "entry" ? tr("вход") : tr("выход");
    tip.textContent = `${new Date(m.t * 1000).toISOString().slice(0, 16).replace("T", " ")} · ${what} · ${m.px}` + (m.ret != null ? ` · ${(m.ret * 100).toFixed(1)} %` : "") + (m.liquidated ? " · " + tr("ликвидация") : "") + (m.open ? " · " + tr("открыта") : "") + (m.why ? ` · ${tr(m.why)}` : "");
    tip.hidden = false; tip.style.left = Math.min(px + 12, W - 220) + "px"; tip.style.top = py + 12 + "px";
  };
  cv.addEventListener("wheel", (e) => { e.preventDefault(); view = zoomView(n, view, e.deltaY > 0 ? 1.15 : 1 / 1.15, Math.min(1, e.offsetX / (W - AX))); draw(); }, { passive: false });
  const pts = new Map(); let pinch = 0;
  cv.addEventListener("pointerdown", (e) => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, e); });
  cv.addEventListener("pointermove", (e) => {
    const prev = pts.get(e.pointerId);
    if (!prev) return showTip(hit(e.offsetX, e.offsetY), e.offsetX, e.offsetY);
    if (pts.size === 2) { // щипок: расстояние между пальцами
      pts.set(e.pointerId, e);
      const [p, q] = [...pts.values()], d = Math.hypot(p.clientX - q.clientX, p.clientY - q.clientY);
      if (pinch) { view = zoomView(n, view, pinch / d, 0.5); draw(); }
      pinch = d; return;
    }
    const w = (W - AX) / view.count;
    view = clampView(n, view.start - (e.clientX - prev.clientX) / w, view.count); pts.set(e.pointerId, e); draw();
  });
  const up = (e) => { if (pts.size === 1 && e.type === "pointerup") showTip(hit(e.offsetX, e.offsetY), e.offsetX, e.offsetY); pts.delete(e.pointerId); pinch = 0; };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.addEventListener("pointerleave", () => { if (!pts.size) tip.hidden = true; });
  const ro = new ResizeObserver(draw); ro.observe(el);
  draw();
  const handle = { destroy: () => ro.disconnect() };
  el._candles = handle;
  return handle;
}

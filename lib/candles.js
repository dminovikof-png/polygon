// Свечи и сделки для свечного графика (public/candles.js): компактно, без лишних знаков.
const r6 = (v) => (v == null ? v : Number(v.toPrecision(6)));

export function packCandles(bars) {
  const out = { t: [], o: [], h: [], l: [], c: [] };
  for (const b of bars) { out.t.push(b.t); out.o.push(r6(b.o)); out.h.push(r6(b.h)); out.l.push(r6(b.l)); out.c.push(r6(b.c)); }
  return out;
}

// Сделки бэктеста (номера свечей) — во времени.
export const timedTrades = (tradeList, bars) => tradeList.map((t) => ({
  entryT: bars[t.entry].t, entryPx: t.entryPx, exitT: t.open ? null : bars[t.exit].t, exitPx: t.open ? null : t.exitPx,
  ret: t.ret, liquidated: !!t.liquidated, open: !!t.open,
}));

// Вход и выход каждой сделки: лонг входит покупкой, шорт — продажей. У открытой сделки только вход.
export function tradeMarkers(timed, side = "long") {
  const inDir = side === "short" ? "sell" : "buy", outDir = side === "short" ? "buy" : "sell", out = [];
  for (const x of timed) {
    out.push({ t: x.entryT, px: r6(x.entryPx), kind: "entry", dir: inDir, ...(x.open ? { open: true } : {}) });
    if (!x.open && x.exitT != null) out.push({ t: x.exitT, px: r6(x.exitPx), kind: "exit", dir: outDir, ret: x.ret, liquidated: !!x.liquidated });
  }
  return out;
}

// Ордера сетки и DCA: { t, side, px, why? }.
// Событие сетки side:"liq" — ликвидация: продажа с крестом.
export const orderMarkers = (events) => events.map((e) => ({ t: e.t, px: r6(e.px), kind: "order", ...(e.side === "liq" ? { dir: "sell", liquidated: true } : { dir: e.side }), ...(e.why && e.side !== "liq" ? { why: e.why } : {}) }));

// График бумажной сессии: свечи с начала сессии (и 50 до неё — для контекста) и её сделки; у сетки и DCA — ордера.
// У carry и у ждущей сессии (новых свечей ещё нет) графика нет.
export function sessionChart(s, st, bars) {
  if (s.type === "carry" || st.waiting) return undefined;
  const from = Math.max(0, bars.length - (st.newBars || 0) - 50), all = st.allTrades || [];
  const markers = s.type === "grid" || s.type === "dca"
    ? orderMarkers(all.map((x) => ({ t: x.t, px: x.px, side: x.side || "buy", why: x.why })))
    : tradeMarkers(all.map((x) => ({ entryT: x.entryT, entryPx: x.entryPx, exitT: x.exitT, exitPx: x.exitPx, ret: x.ret, liquidated: /ликвид/.test(x.note || ""), open: x.exitT == null })), st.side || s.side || "long");
  return { candles: packCandles(bars.slice(from)), markers };
}

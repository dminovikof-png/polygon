// Иллюстрации уроков: функции, которые возвращают SVG-строку. Цифры считаются здесь же, без внешних данных,
// поэтому иллюстрации работают и без сети. Один и тот же рисунок служит кадром анимации — с другими параметрами.
import { C, svg, txt, rng } from "./draw.js";
import M01 from "./fig-m01.js";
import M02 from "./fig-m02.js";
import M03 from "./fig-m03.js";
import M04 from "./fig-m04.js";
import M05 from "./fig-m05.js";
export { rng };

// Сколько орлов выпало у каждого из n людей, бросивших монету flips раз.
export function coinFlipCounts(n, flips = 10, seed = 7) {
  const r = rng(seed), out = [];
  for (let i = 0; i < n; i++) { let k = 0; for (let j = 0; j < flips; j++) if (r() < 0.5) k++; out.push(k); }
  return out;
}

export function courseMap() {
  const box = (x, title, lines, color) => `<rect x="${x}" y="20" width="250" height="150" rx="10" fill="#171d24" stroke="${color}" stroke-width="2"/>` +
    txt(x + 125, 50, title, { size: 16, anchor: "middle", weight: 600 }) + lines.map((l, i) => txt(x + 125, 80 + i * 22, l, { anchor: "middle", color: C.dim })).join("");
  return svg(600, 230,
    box(20, "Учебный режим", ["модули 0–14", "уроки, схемы, анимации", "симуляторы без денег"], C.blue) +
    box(330, "Рабочий режим", ["этапы 1–5", "монеты → идея → проверка", "бумажная торговля"], C.green) +
    `<path d="M275 75 H325" stroke="${C.text}" stroke-width="2" marker-end="url(#ar)"/><path d="M325 125 H275" stroke="${C.text}" stroke-width="2" marker-end="url(#ar)"/>` +
    txt(300, 68, "попробовать", { size: 11, anchor: "middle", color: C.dim }) + txt(300, 145, "что это?", { size: 11, anchor: "middle", color: C.dim }) +
    txt(300, 210, "Из урока — в программу на настоящих данных, из программы — в нужный урок.", { size: 12, anchor: "middle", color: C.dim }),
    "Схема: учебный и рабочий режимы связаны ссылками в обе стороны");
}

// Гистограмма: у скольких людей сколько орлов из 10. Лучший результат подсвечен.
export function coinFlips({ n = 10, seed = 7 } = {}) {
  const counts = coinFlipCounts(n, 10, seed), bins = Array(11).fill(0);
  counts.forEach((k) => bins[k]++);
  const best = Math.max(...counts), top = Math.max(...bins), W = 600, H = 260, x0 = 40, y0 = 210, bw = 46;
  let body = `<line x1="${x0}" y1="${y0}" x2="${x0 + 11 * bw}" y2="${y0}" stroke="${C.line}"/>`;
  bins.forEach((v, k) => {
    const h = top ? (v / top) * 160 : 0, x = x0 + k * bw;
    body += `<rect x="${x + 4}" y="${y0 - h}" width="${bw - 8}" height="${h}" fill="${k === best ? C.gold : C.blue}" rx="3"/>`;
    body += txt(x + bw / 2, y0 + 16, k, { size: 12, anchor: "middle", color: C.dim });
    if (v) body += txt(x + bw / 2, y0 - h - 5, v, { size: 11, anchor: "middle" });
  });
  body += txt(x0, 22, `${n} человек бросили монету по 10 раз. Лучший: ${best} орлов из 10 (жёлтый столбец).`, { size: 13 });
  body += txt(x0 + 5.5 * bw, y0 + 36, "сколько орлов выпало", { size: 11, anchor: "middle", color: C.dim });
  return svg(W, H, body, `Гистограмма бросков монеты у ${n} человек, лучший результат ${best} из 10`);
}

// Кривая капитала со случайными колебаниями: максимум, худшая просадка, текущее отставание от максимума.
export function equityDrawdown({ seed = 3, days = 300 } = {}) {
  const r = rng(seed), eq = [1];
  for (let i = 1; i < days; i++) eq.push(eq[i - 1] * (1 + (r() - 0.48) * 0.06));
  let peak = 0, dd = 0, ddFrom = 0, ddTo = 0;
  eq.forEach((v, i) => { if (v > eq[peak]) peak = i; const d = v / eq[peak] - 1; if (d < dd) { dd = d; ddFrom = peak; ddTo = i; } });
  const W = 600, H = 250, x = (i) => 40 + (i / (days - 1)) * 540, lo = Math.min(...eq), hi = Math.max(...eq), y = (v) => 210 - ((v - lo) / (hi - lo)) * 170;
  const path = eq.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const body = `<rect x="${x(ddFrom)}" y="30" width="${x(ddTo) - x(ddFrom)}" height="180" fill="${C.red}" opacity="0.12"/>` +
    `<path d="${path}" fill="none" stroke="${C.blue}" stroke-width="2"/>` +
    `<line x1="${x(ddFrom)}" y1="${y(eq[ddFrom])}" x2="${x(ddTo)}" y2="${y(eq[ddFrom])}" stroke="${C.red}" stroke-dasharray="4 3"/>` +
    `<line x1="${x(ddTo)}" y1="${y(eq[ddFrom])}" x2="${x(ddTo)}" y2="${y(eq[ddTo])}" stroke="${C.red}" stroke-width="2"/>` +
    txt(x(ddTo) + 6, (y(eq[ddFrom]) + y(eq[ddTo])) / 2, `худшая просадка ${Math.round(dd * 100)} %`, { size: 12, color: C.red }) +
    txt(40, 20, `Итог: ${eq.at(-1) >= 1 ? "+" : ""}${Math.round((eq.at(-1) - 1) * 100)} % за ${days} дней. Красным — путь от максимума до дна.`, { size: 13 }) +
    txt(40, 240, "время →", { size: 11, color: C.dim });
  return svg(W, H, body, `Кривая капитала с худшей просадкой ${Math.round(dd * 100)} процентов`);
}

export const FIGURES = { courseMap, coinFlips, equityDrawdown, ...M01, ...M02, ...M03, ...M04, ...M05 };

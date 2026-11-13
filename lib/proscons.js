// Плюсы и минусы одной проверки — по её цифрам. Тексты переводятся словарём интерфейса (шаблоны с числами).
// Отрицательные — со знаком «−» (U+2212) и точка как десятичный разделитель — так же, как в остальном интерфейсе (карточка попытки).
const signed = (x, d) => { const v = Math.abs(x).toFixed(d); return (x < 0 && /[1-9]/.test(v) ? "−" : "") + v; };
const pct = (x) => signed(x * 100, 1) + " %";
const num = (x) => signed(x, 2);

export function judge(r, { zeroCostTotal = null } = {}) {
  const pros = [], cons = [], s = r.strategy, ref = r.benchmarks?.find((b) => b.chosen);
  if (ref) {
    if (s.total > ref.total) pros.push(`Обогнала эталон «${ref.label}»: ${pct(s.total)} против ${pct(ref.total)}`);
    else cons.push(`Не обогнала эталон «${ref.label}»: ${pct(s.total)} против ${pct(ref.total)}`);
  }
  if (r.tExcess > r.plank) pros.push(`t = ${num(r.tExcess)} выше планки ${num(r.plank)}: превышение вряд ли случайно`);
  else cons.push(`t = ${num(r.tExcess)} ниже планки ${num(r.plank)}: результат не отличим от случайного`);
  const dd = Math.abs(s.maxDrawdown), hd = Math.abs(r.hold.maxDrawdown);
  if (dd < hd) pros.push(`Просадка меньше, чем у удержания: ${pct(dd)} против ${pct(hd)}`);
  else cons.push(`Просадка больше, чем у удержания: ${pct(dd)} против ${pct(hd)}`);
  if (s.trades < 30) cons.push(`Сделок ${s.trades}: мало, чтобы делать вывод`);
  if (r.liquidations > 0) cons.push("Была ликвидация: позиция закрыта принудительно");
  if (s.exposure < 0.5) pros.push(`В рынке ${pct(s.exposure)} времени: меньше времени под риском`);
  const eaten = zeroCostTotal == null ? 0 : zeroCostTotal - s.total;
  if (eaten >= 0.01) cons.push(`Комиссии и проскальзывание съели ${signed(eaten * 100, 1)} п. п. итога`);
  return { pros, cons };
}

// Библиотека индикаторов. Каждый индикатор считается только по прошлым и текущей закрытой свече
// (заглядывания в будущее нет). Описания написаны простыми словами: они показываются в программе.
// Источник набора: индикаторы, реально использованные в исследованиях проекта (ATR, RSI, EMA, SMA, Дончиан,
// ADX, VWAP, коэффициент эффективности Кауфмана, MACD, Боллинджер, реализованная волатильность, ROC,
// отношение дисперсий, свечные паттерны, серии, зигзаг-развороты) плюс несколько общеизвестных.

const NaNs = (n) => new Array(n).fill(NaN);

export function sma(x, n) {
  const out = NaNs(x.length);
  let s = 0, bad = 0;
  for (let i = 0; i < x.length; i++) {
    if (Number.isNaN(x[i])) bad++; else s += x[i];
    if (i >= n) { if (Number.isNaN(x[i - n])) bad--; else s -= x[i - n]; }
    if (i >= n - 1 && bad === 0) out[i] = s / n;
  }
  return out;
}

export function ema(x, n) {
  const out = NaNs(x.length);
  const k = 2 / (n + 1);
  let prev = NaN, count = 0, s = 0;
  for (let i = 0; i < x.length; i++) {
    if (Number.isNaN(x[i])) continue;
    if (Number.isNaN(prev)) { s += x[i]; count++; if (count === n) { prev = s / n; out[i] = prev; } }
    else { prev = x[i] * k + prev * (1 - k); out[i] = prev; }
  }
  return out;
}

// Скользящее среднее Уайлдера (используется в RSI, ATR, ADX).
function rma(x, n) {
  const out = NaNs(x.length);
  let prev = NaN, count = 0, s = 0;
  for (let i = 0; i < x.length; i++) {
    if (Number.isNaN(x[i])) continue;
    if (Number.isNaN(prev)) { s += x[i]; count++; if (count === n) { prev = s / n; out[i] = prev; } }
    else { prev = (prev * (n - 1) + x[i]) / n; out[i] = prev; }
  }
  return out;
}

const col = (bars, k) => bars.map((b) => b[k]);

function trueRange(bars) {
  return bars.map((b, i) => (i === 0 ? b.h - b.l : Math.max(b.h - b.l, Math.abs(b.h - bars[i - 1].c), Math.abs(b.l - bars[i - 1].c))));
}

export function atr(bars, n) { return rma(trueRange(bars), n); }

function rollingStd(x, n) {
  const out = NaNs(x.length);
  for (let i = n - 1; i < x.length; i++) {
    let m = 0, ok = true;
    for (let k = i - n + 1; k <= i; k++) { if (Number.isNaN(x[k])) { ok = false; break; } m += x[k]; }
    if (!ok) continue;
    m /= n;
    let v = 0;
    for (let k = i - n + 1; k <= i; k++) v += (x[k] - m) ** 2;
    out[i] = Math.sqrt(v / n);
  }
  return out;
}

function rollingMax(x, n, from = 0) {
  const out = NaNs(x.length);
  for (let i = n - 1 + from; i < x.length; i++) {
    let m = -Infinity;
    for (let k = i - n + 1 - from; k <= i - from; k++) m = Math.max(m, x[k]);
    out[i] = m;
  }
  return out;
}
function rollingMin(x, n, from = 0) {
  const out = NaNs(x.length);
  for (let i = n - 1 + from; i < x.length; i++) {
    let m = Infinity;
    for (let k = i - n + 1 - from; k <= i - from; k++) m = Math.min(m, x[k]);
    out[i] = m;
  }
  return out;
}

const P = (key, label, def, min, max, extra = {}) => ({ key, label, def, min, max, ...extra });

export const INDICATORS = {
  sma: {
    title: "SMA — простая скользящая средняя", group: "Тренд",
    plain: "Средняя цена закрытия за последние N свечей. Сглаживает колебания и показывает, куда в среднем движется цена. Цена выше средней — рынок «в плюсе» за этот период, ниже — «в минусе». Чем больше N, тем медленнее и спокойнее линия, но тем позже она замечает разворот.",
    use: "В проекте: фильтр тренда SMA200 (держать только когда цена выше 200-дневной средней), ансамбль из пяти средних.",
    params: [P("period", "Период, свечей", 50, 2, 1000)],
    outputs: [{ key: "value", label: "значение средней" }],
    calc: (bars, p) => ({ value: sma(col(bars, "c"), p.period) }),
  },
  ema: {
    title: "EMA — экспоненциальная скользящая средняя", group: "Тренд",
    plain: "Тоже средняя цена, но недавние свечи весят больше старых, поэтому линия быстрее реагирует на движение. Используется так же, как SMA: цена выше линии — восходящий уклон, ниже — нисходящий. Две EMA разной длины часто сравнивают: быстрая выше медленной — тренд вверх.",
    use: "В проекте: EMA50 и EMA200 в правилах бота (тренд вверх, когда EMA50 выше EMA200), EMA200 как фильтр у Bull Rider.",
    params: [P("period", "Период, свечей", 50, 2, 1000)],
    outputs: [{ key: "value", label: "значение средней" }],
    calc: (bars, p) => ({ value: ema(col(bars, "c"), p.period) }),
  },
  rsi: {
    title: "RSI — индекс относительной силы", group: "Импульс",
    plain: "Число от 0 до 100: показывает, какую долю последних изменений цены составляли рост и падение. Выше 70 принято считать, что цена «перегрета» (долго росла), ниже 30 — «переохлаждена» (долго падала). Это не сигнал разворота: на сильном тренде RSI может неделями держаться за границей. Короткий RSI (период 2–3) очень нервный, длинный (14) спокойнее.",
    use: "В проекте: RSI(14) в зоне 40–50 как откат в тренде (правила бота), RSI(2) < 10 в стратегии Range Fader, RSI(3) в старых правилах бота.",
    params: [P("period", "Период, свечей", 14, 2, 200)],
    outputs: [{ key: "value", label: "значение от 0 до 100" }],
    calc(bars, p) {
      const c = col(bars, "c"), n = p.period;
      const gain = c.map((v, i) => (i === 0 ? NaN : Math.max(v - c[i - 1], 0)));
      const loss = c.map((v, i) => (i === 0 ? NaN : Math.max(c[i - 1] - v, 0)));
      const ag = rma(gain, n), al = rma(loss, n);
      return { value: ag.map((g, i) => (Number.isNaN(g) ? NaN : al[i] === 0 ? 100 : 100 - 100 / (1 + g / al[i]))) };
    },
  },
  atr: {
    title: "ATR — средний истинный размах", group: "Волатильность",
    plain: "Средний размах одной свечи в единицах цены (с учётом гэпов между свечами). Показывает, насколько цена «качается»: большой ATR — рынок нервный, маленький — спокойный. Именно им измеряют расстояние для стоп-приказов: «стоп в двух ATR от входа» подстраивается под текущую нервность рынка.",
    use: "В проекте: основной инструмент для стопов и целей (стоп 1–2 ATR, цель 2 ATR) почти во всех ботах.",
    params: [P("period", "Период, свечей", 14, 2, 200)],
    outputs: [{ key: "value", label: "размах в единицах цены" }],
    calc: (bars, p) => ({ value: atr(bars, p.period) }),
  },
  atr_pct: {
    title: "ATR% — размах в процентах цены", group: "Волатильность",
    plain: "Тот же средний размах свечи, но в процентах от цены. Удобно сравнивать «нервность» разных монет и разных лет. Например, ATR% = 1 значит, что свеча в среднем качается на 1% цены.",
    use: "В проекте: фильтр «не торговать возврат к среднему, когда ATR% > 1» (урок из провала стратегии на акциях TSLA).",
    params: [P("period", "Период, свечей", 14, 2, 200)],
    outputs: [{ key: "value", label: "размах, % от цены" }],
    calc(bars, p) { const a = atr(bars, p.period); return { value: a.map((v, i) => (v / bars[i].c) * 100) }; },
  },
  adx: {
    title: "ADX — сила тренда", group: "Тренд",
    plain: "Показывает, есть ли вообще тренд, но не его направление. ADX ниже 20–25 — рынок в «болтанке» (боковике), выше 25 — идёт заметное движение вверх или вниз. Вместе с ним считаются два направления: +DI (сила покупателей) и −DI (сила продавцов). Если +DI выше −DI, движение вверх.",
    use: "В проекте: ADX > 25 как подтверждение пробоя, ADX < 25 как условие для стратегии возврата к среднему.",
    params: [P("period", "Период, свечей", 14, 2, 100)],
    outputs: [{ key: "adx", label: "сила тренда" }, { key: "plus", label: "+DI, сила покупателей" }, { key: "minus", label: "−DI, сила продавцов" }],
    calc(bars, p) {
      const n = p.period;
      const up = bars.map((b, i) => (i === 0 ? 0 : b.h - bars[i - 1].h));
      const dn = bars.map((b, i) => (i === 0 ? 0 : bars[i - 1].l - b.l));
      const pdm = up.map((u, i) => (u > dn[i] && u > 0 ? u : 0));
      const mdm = dn.map((d, i) => (d > up[i] && d > 0 ? d : 0));
      const tr = rma(trueRange(bars), n);
      const pdi = rma(pdm, n).map((v, i) => (100 * v) / tr[i]);
      const mdi = rma(mdm, n).map((v, i) => (100 * v) / tr[i]);
      const dx = pdi.map((v, i) => (v + mdi[i] === 0 ? 0 : (100 * Math.abs(v - mdi[i])) / (v + mdi[i])));
      return { adx: rma(dx, n), plus: pdi, minus: mdi };
    },
  },
  donchian: {
    title: "Канал Дончиана", group: "Тренд",
    plain: "Верхняя граница — самый высокий максимум за последние N свечей (не считая текущую), нижняя — самый низкий минимум. Цена закрылась выше верхней границы — это «пробой»: рынок вышел из диапазона вверх. Классическая трендовая идея: купить на пробое, выйти, когда цена пробьёт нижнюю границу более короткого канала.",
    use: "В проекте: пробой 55/20 (стратегия B), канал 24 с ADX, Bull Rider на 4-часовых свечах.",
    params: [P("period", "Период, свечей", 55, 2, 500)],
    outputs: [{ key: "upper", label: "верхняя граница (максимум за N свечей до текущей)" }, { key: "lower", label: "нижняя граница (минимум за N свечей до текущей)" }, { key: "mid", label: "середина канала" }],
    calc(bars, p) {
      const u = rollingMax(col(bars, "h"), p.period, 1), l = rollingMin(col(bars, "l"), p.period, 1);
      return { upper: u, lower: l, mid: u.map((v, i) => (v + l[i]) / 2) };
    },
  },
  bollinger: {
    title: "Полосы Боллинджера", group: "Волатильность",
    plain: "Средняя линия (SMA) и две полосы вокруг неё на расстоянии K стандартных отклонений. Когда цена вылетает за нижнюю полосу, она необычно далеко ниже своей средней — на этом строят стратегии «возврата к среднему». Ширина полос показывает нервность: сужение — затишье, расширение — рост колебаний. %B показывает, где цена внутри коридора: 0 — на нижней полосе, 1 — на верхней.",
    use: "В проекте: возврат к среднему по Боллинджеру (MRBB на 15 минутах, Range Fader), оба закрыты как убыточные.",
    params: [P("period", "Период, свечей", 20, 2, 300), P("k", "Ширина, стандартных отклонений", 2, 0.5, 5, { float: true })],
    outputs: [{ key: "mid", label: "средняя линия" }, { key: "upper", label: "верхняя полоса" }, { key: "lower", label: "нижняя полоса" }, { key: "pctb", label: "%B: положение в коридоре (0 — низ, 1 — верх)" }, { key: "width", label: "ширина коридора, % от цены" }],
    calc(bars, p) {
      const c = col(bars, "c"), m = sma(c, p.period), s = rollingStd(c, p.period);
      const upper = m.map((v, i) => v + p.k * s[i]), lower = m.map((v, i) => v - p.k * s[i]);
      return { mid: m, upper, lower, pctb: c.map((v, i) => (v - lower[i]) / (upper[i] - lower[i])), width: m.map((v, i) => ((upper[i] - lower[i]) / v) * 100) };
    },
  },
  macd: {
    title: "MACD — схождение/расхождение средних", group: "Импульс",
    plain: "Разность двух EMA (быстрой и медленной) называется линией MACD; её собственная сглаженная версия — сигнальная линия. Когда линия MACD пересекает сигнальную снизу вверх, импульс растёт; сверху вниз — слабеет. Гистограмма — расстояние между ними. Индикатор запаздывает, зато хорошо виден на плавных трендах.",
    use: "В проекте: проверялась стратегия «MACD-дивергенция + поддержка» (чужая, не прошла: t −3,06).",
    params: [P("fast", "Быстрая EMA", 12, 2, 100), P("slow", "Медленная EMA", 26, 3, 300), P("signal", "Сигнальная линия", 9, 2, 100)],
    outputs: [{ key: "line", label: "линия MACD" }, { key: "signal", label: "сигнальная линия" }, { key: "hist", label: "гистограмма (линия − сигнал)" }],
    calc(bars, p) {
      const c = col(bars, "c"), fast = ema(c, p.fast), slow = ema(c, p.slow);
      const line = fast.map((v, i) => v - slow[i]);
      const sig = ema(line, p.signal);
      return { line, signal: sig, hist: line.map((v, i) => v - sig[i]) };
    },
  },
  vwap: {
    title: "VWAP — средняя цена, взвешенная по объёму", group: "Объём",
    plain: "Средняя цена за последние N свечей, где свечи с большим объёмом торгов весят больше. Показывает «справедливую» цену, по которой реально прошла основная масса сделок. Цена выше VWAP — покупатели в среднем в плюсе, ниже — в минусе. Здесь считается скользящий VWAP за N свечей (не сбрасывается на начало дня).",
    use: "В проекте: VWAP + RSI(3) + EMA(8) в первых правилах бота (условия оказались взаимоисключающими: за 5,6 года всего 18 сигналов).",
    params: [P("period", "Период, свечей", 24, 2, 500)],
    outputs: [{ key: "value", label: "VWAP" }, { key: "dist", label: "отклонение цены от VWAP, %" }],
    calc(bars, p) {
      const n = p.period, out = NaNs(bars.length), dist = NaNs(bars.length);
      for (let i = n - 1; i < bars.length; i++) {
        let pv = 0, v = 0;
        for (let k = i - n + 1; k <= i; k++) { const tp = (bars[k].h + bars[k].l + bars[k].c) / 3; pv += tp * bars[k].v; v += bars[k].v; }
        if (v > 0) { out[i] = pv / v; dist[i] = (bars[i].c / out[i] - 1) * 100; }
      }
      return { value: out, dist };
    },
  },
  er: {
    title: "ER Кауфмана — коэффициент эффективности", group: "Тренд",
    plain: "Отношение: на сколько цена продвинулась по прямой за N свечей, к тому, сколько она суммарно «набегала» вверх-вниз. Около 1 — цена идёт почти прямо (чистый тренд), около 0 — топчется на месте (болтанка). Ранг показывает, насколько текущее значение высоко по сравнению со всей предыдущей историей этой монеты (0 — самое низкое за всё время, 1 — самое высокое); он считается только по прошлому.",
    use: "В проекте: боевой режим Stage 3 — если ранг ER выше 0,90, держать BTC, иначе торговать сеткой.",
    params: [P("period", "Окно, свечей", 720, 5, 3000), P("warmup", "Разминка для ранга, свечей", 300, 20, 5000)],
    outputs: [{ key: "value", label: "ER от 0 до 1" }, { key: "rank", label: "ранг среди прошлых значений, 0–1" }],
    calc(bars, p) {
      const c = col(bars, "c"), n = p.period, er = NaNs(c.length), rank = NaNs(c.length);
      const absd = c.map((v, i) => (i === 0 ? 0 : Math.abs(v - c[i - 1])));
      let run = 0;
      const hist = [];
      for (let i = 0; i < c.length; i++) {
        run += absd[i]; if (i >= n) run -= absd[i - n];
        if (i >= n) {
          er[i] = run > 0 ? Math.abs(c[i] - c[i - n]) / run : 0;
          hist.push(er[i]);
          if (hist.length >= p.warmup) { let less = 0; for (const h of hist) if (h < er[i]) less++; rank[i] = less / hist.length; }
        }
      }
      return { value: er, rank };
    },
  },
  rvol: {
    title: "Реализованная волатильность", group: "Волатильность",
    plain: "Насколько сильно в среднем менялась цена от свечи к свече за последние N свечей (стандартное отклонение процентных изменений), в процентах за одну свечу. Чем выше, тем беспокойнее рынок. Волатильность предсказуема лучше, чем направление цены, поэтому её используют для управления риском: в нервном рынке позицию уменьшают.",
    use: "В проекте: основа стратегий «таргетирование волатильности» и отбора самых спокойных монет (принят по риску, но не по доходности).",
    params: [P("period", "Окно, свечей", 30, 3, 500)],
    outputs: [{ key: "value", label: "разброс изменений за свечу, %" }],
    calc(bars, p) {
      const r = bars.map((b, i) => (i === 0 ? NaN : Math.log(b.c / bars[i - 1].c) * 100));
      return { value: rollingStd(r, p.period) };
    },
  },
  roc: {
    title: "ROC — изменение цены за N свечей", group: "Импульс",
    plain: "Просто на сколько процентов цена выросла или упала за последние N свечей. Положительное значение — моментум (инерция) вверх. На этом строят «покупай растущее»: берут то, что выросло. В проекте такие идеи почти всегда не прошли проверку.",
    use: "В проекте: моментум (в том числе кросс-секционный) и ETH/BTC-моментум для ротации; не прошли.",
    params: [P("period", "Период, свечей", 30, 1, 1000)],
    outputs: [{ key: "value", label: "изменение, %" }],
    calc(bars, p) { return { value: bars.map((b, i) => (i < p.period ? NaN : (b.c / bars[i - p.period].c - 1) * 100)) }; },
  },
  var_ratio: {
    title: "Отношение дисперсий (variance ratio)", group: "Режим рынка",
    plain: "Проверка, «помнит» ли цена свои движения. Сравнивается разброс движений за q свечей подряд с разбросом одной свечи, умноженным на q. Около 1 — цена блуждает случайно; выше 1 — движения продолжаются (инерция); ниже 1 — движения откатываются (возврат). Значение шумное и требует длинного окна.",
    use: "В проекте: измерение механизма (есть ли у цены инерция или возврат) перед построением правил.",
    params: [P("window", "Окно, свечей", 120, 30, 1000), P("q", "Шаг q, свечей", 4, 2, 50)],
    outputs: [{ key: "value", label: "отношение дисперсий" }],
    calc(bars, p) {
      const c = bars.map((b) => Math.log(b.c)), out = NaNs(c.length), q = p.q, w = p.window;
      for (let i = w + q; i < c.length; i++) {
        const r1 = [], rq = [];
        for (let k = i - w + 1; k <= i; k++) { r1.push(c[k] - c[k - 1]); rq.push(c[k] - c[k - q]); }
        const v = (a) => { const m = a.reduce((x, y) => x + y, 0) / a.length; return a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1); };
        const v1 = v(r1);
        if (v1 > 0) out[i] = v(rq) / (q * v1);
      }
      return { value: out };
    },
  },
  stoch: {
    title: "Стохастик", group: "Импульс",
    plain: "Показывает, где цена закрытия находится внутри диапазона последних N свечей: 0 — на самом низком минимуме, 100 — на самом высоком максимуме. Выше 80 — цена у верхней границы диапазона, ниже 20 — у нижней. Вторая линия (D) — сглаженная первая.",
    use: "Общеизвестный индикатор; в исследованиях проекта отдельно не применялся.",
    params: [P("period", "Период, свечей", 14, 2, 200), P("smooth", "Сглаживание D", 3, 1, 20)],
    outputs: [{ key: "k", label: "%K" }, { key: "d", label: "%D (сглаженная)" }],
    calc(bars, p) {
      const hh = rollingMax(col(bars, "h"), p.period), ll = rollingMin(col(bars, "l"), p.period);
      const k = bars.map((b, i) => (hh[i] === ll[i] ? 50 : ((b.c - ll[i]) / (hh[i] - ll[i])) * 100));
      return { k: k.map((v, i) => (Number.isNaN(hh[i]) ? NaN : v)), d: sma(k.map((v, i) => (Number.isNaN(hh[i]) ? NaN : v)), p.smooth) };
    },
  },
  vol_ratio: {
    title: "Относительный объём", group: "Объём",
    plain: "Объём торгов текущей свечи, делённый на средний объём за N свечей. Значение 2 означает, что сейчас торгуют вдвое активнее обычного. Всплески объёма часто сопровождают пробои и паники.",
    use: "Общеизвестный индикатор; в исследованиях проекта объём использовался в составе VWAP и каскадов ликвидаций.",
    params: [P("period", "Период, свечей", 20, 2, 500)],
    outputs: [{ key: "value", label: "объём / средний объём" }],
    calc(bars, p) { const m = sma(col(bars, "v"), p.period); return { value: bars.map((b, i) => (m[i] > 0 ? b.v / m[i] : NaN)) }; },
  },
  streak: {
    title: "Серия подряд идущих свечей", group: "Паттерны",
    plain: "Считает, сколько свечей подряд закрылось ниже предыдущей (серия падений) или выше (серия роста). Идея: после длинной серии падений цена часто немного отскакивает. Проверка в проекте показала, что на дневных свечах крипты это не даёт стабильной прибыли.",
    use: "В проекте: «отскок после K падений подряд» (стратегия C) и серии из 2–3 свечей (№42).",
    params: [],
    outputs: [{ key: "down", label: "число падений подряд" }, { key: "up", label: "число ростов подряд" }],
    calc(bars) {
      const down = [], up = [];
      let d = 0, u = 0;
      bars.forEach((b, i) => { if (i === 0) { down.push(0); up.push(0); return; } if (b.c < bars[i - 1].c) { d++; u = 0; } else if (b.c > bars[i - 1].c) { u++; d = 0; } else { d = 0; u = 0; } down.push(d); up.push(u); });
      return { down, up };
    },
  },
  hammer: {
    title: "Свечной паттерн «молот»", group: "Паттерны",
    plain: "Свеча с длинной нижней тенью и почти без верхней: цена сначала резко упала, но покупатели вернули её к верхней части диапазона. Классическая японская трактовка — возможный разворот вверх. Здесь: нижняя тень не меньше 60% размаха свечи, верхняя не больше 15%. Значение 1 — паттерн есть, 0 — нет.",
    use: "В проекте: свечи Нисона проверены на всех периодах, медиана сделки отрицательна, стратегия закрыта.",
    params: [],
    outputs: [{ key: "value", label: "1 — молот, 0 — нет" }],
    calc(bars) {
      return { value: bars.map((b) => { const r = b.h - b.l; if (r <= 0) return 0; const low = Math.min(b.o, b.c) - b.l, up = b.h - Math.max(b.o, b.c); return low >= 0.6 * r && up <= 0.15 * r ? 1 : 0; }) };
    },
  },
  engulfing: {
    title: "Свечной паттерн «поглощение»", group: "Паттерны",
    plain: "Бычье поглощение: после падающей свечи идёт растущая, чьё тело полностью «накрывает» тело предыдущей. Трактуется как смена настроения с продавцов на покупателей. Медвежье — наоборот. Значение 1 — паттерн есть, 0 — нет.",
    use: "В проекте: входит в проверенное семейство свечей Нисона (закрыто).",
    params: [],
    outputs: [{ key: "bull", label: "1 — бычье поглощение" }, { key: "bear", label: "1 — медвежье поглощение" }],
    calc(bars) {
      const bull = bars.map((b, i) => (i > 0 && bars[i - 1].c < bars[i - 1].o && b.c > b.o && b.o <= bars[i - 1].c && b.c >= bars[i - 1].o ? 1 : 0));
      const bear = bars.map((b, i) => (i > 0 && bars[i - 1].c > bars[i - 1].o && b.c < b.o && b.o >= bars[i - 1].c && b.c <= bars[i - 1].o ? 1 : 0));
      return { bull, bear };
    },
  },
  trend_votes: {
    title: "Голосование трендовых средних", group: "Тренд",
    plain: "Пять простых скользящих средних разной длины «голосуют»: каждая отдаёт голос, если цена закрытия выше неё. Итог — число голосов от 0 до 5. Много голосов — тренд вверх на всех горизонтах сразу, мало — вниз. Это сглаженная версия одного фильтра SMA200.",
    use: "В проекте: гипотеза H051 (ансамбль горизонтов 10/20/50/100/200, вход при трёх голосах из пяти).",
    params: [P("h1", "Горизонт 1", 10, 2, 1000), P("h2", "Горизонт 2", 20, 2, 1000), P("h3", "Горизонт 3", 50, 2, 1000), P("h4", "Горизонт 4", 100, 2, 1000), P("h5", "Горизонт 5", 200, 2, 1000)],
    outputs: [{ key: "votes", label: "число голосов 0–5" }],
    calc(bars, p) {
      const c = col(bars, "c"), ms = [p.h1, p.h2, p.h3, p.h4, p.h5].map((h) => sma(c, h));
      return { votes: c.map((v, i) => (ms.some((m) => Number.isNaN(m[i])) ? NaN : ms.filter((m) => v > m[i]).length)) };
    },
  },
  drawdown: {
    title: "Просадка от максимума", group: "Риск",
    plain: "На сколько процентов цена сейчас ниже своего самого высокого значения за последние N свечей (0 — окно в 0 означает «за всю историю»). Всегда ноль или отрицательное число. Помогает видеть глубину падения и строить правила вроде «не покупать, пока просадка глубже −20%».",
    use: "В проекте: просадка — главная мера боли (индекс язвы, максимальная просадка) в исследовании «как сделать владение BTC менее болезненным».",
    params: [P("period", "Окно, свечей (0 — вся история)", 365, 0, 5000)],
    outputs: [{ key: "value", label: "просадка, %" }],
    calc(bars, p) {
      const c = col(bars, "c"), out = NaNs(c.length);
      let peak = -Infinity;
      for (let i = 0; i < c.length; i++) {
        let m;
        if (p.period === 0) { peak = Math.max(peak, c[i]); m = peak; }
        else { m = -Infinity; for (let k = Math.max(0, i - p.period + 1); k <= i; k++) m = Math.max(m, c[k]); }
        out[i] = (c[i] / m - 1) * 100;
      }
      return { value: out };
    },
  },
  pivot: {
    title: "Развороты (зигзаг-пивоты)", group: "Структура",
    plain: "Находит локальные вершины и впадины: свеча считается вершиной, если её максимум выше максимумов L свечей слева и R свечей справа. Подтверждение приходит только через R свечей, поэтому программа узнаёт о вершине с задержкой и не заглядывает в будущее. Выводит цену последней подтверждённой вершины и последней впадины — «уровни», от которых строят пробои и откаты.",
    use: "В проекте: построение структуры для паттерна Гартли и входа на первом откате (оба закрыты).",
    params: [P("left", "Свечей слева", 5, 1, 50), P("right", "Свечей справа (задержка подтверждения)", 5, 1, 50)],
    outputs: [{ key: "high", label: "цена последней подтверждённой вершины" }, { key: "low", label: "цена последней подтверждённой впадины" }],
    calc(bars, p) {
      const n = bars.length, high = NaNs(n), low = NaNs(n);
      let lastH = NaN, lastL = NaN;
      for (let i = 0; i < n; i++) {
        const c = i - p.right; // кандидат подтверждается только сейчас
        if (c >= p.left) {
          let isH = true, isL = true;
          for (let k = c - p.left; k <= c + p.right; k++) {
            if (k === c) continue;
            if (bars[k].h >= bars[c].h) isH = false;
            if (bars[k].l <= bars[c].l) isL = false;
          }
          if (isH) lastH = bars[c].h;
          if (isL) lastL = bars[c].l;
        }
        high[i] = lastH; low[i] = lastL;
      }
      return { high, low };
    },
  },
};

export const PRICE_FIELDS = {
  close: "цена закрытия", open: "цена открытия", high: "максимум свечи", low: "минимум свечи", volume: "объём",
};

// Значения параметров: подставляет умолчания, проверяет границы.
export function resolveParams(def, given = {}) {
  const out = {};
  for (const p of def.params) {
    let v = given[p.key] ?? p.def;
    v = Number(v);
    if (!Number.isFinite(v)) throw new Error(`${p.label}: нужно число`);
    if (!p.float) v = Math.round(v);
    if (v < p.min || v > p.max) throw new Error(`${p.label}: допустимо от ${p.min} до ${p.max}`);
    out[p.key] = v;
  }
  return out;
}

export function computeIndicator(id, bars, params) {
  const def = INDICATORS[id];
  if (!def) throw new Error("Неизвестный индикатор: " + id);
  return def.calc(bars, resolveParams(def, params));
}

// Данные для интерфейса (без функций).
export function indicatorCatalog() {
  return Object.entries(INDICATORS).map(([id, d]) => ({ id, title: d.title, group: d.group, plain: d.plain, use: d.use, params: d.params, outputs: d.outputs }));
}

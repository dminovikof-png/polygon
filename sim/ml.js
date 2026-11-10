// Простое машинное обучение на ценах: логистическая регрессия и k ближайших соседей,
// признаки — прошлые дневные доходности, цель — вырастет ли цена завтра.
// Проверка вперёд: модель для дня t учится только на днях, исход которых уже известен к закрытию t.
import { correlation } from "./ruin.js";

// Признаки дня i (известны к его закрытию): доходности за lags последних дней; цель — рост к закрытию i+1.
export function dataset(c, lags = 5) {
  const rows = [];
  for (let i = lags; i < c.length - 1; i++) {
    const x = [];
    for (let k = 0; k < lags; k++) x.push(c[i - k] / c[i - k - 1] - 1);
    rows.push({ i, x, y: c[i + 1] > c[i] ? 1 : 0, ret: c[i + 1] / c[i] - 1 });
  }
  return rows;
}

function scaler(X) {
  const d = X[0].length, m = new Array(d).fill(0), s = new Array(d).fill(0);
  X.forEach((x) => x.forEach((v, j) => (m[j] += v / X.length)));
  X.forEach((x) => x.forEach((v, j) => (s[j] += (v - m[j]) ** 2 / X.length)));
  const sd = s.map((v) => Math.sqrt(v) || 1);
  return (x) => x.map((v, j) => (v - m[j]) / sd[j]);
}

const sigmoid = (z) => 1 / (1 + Math.exp(-z));

// Логистическая регрессия: градиентный спуск с L2-штрафом, детерминированно (веса с нуля).
export function fitLogit(X, y, { l2 = 0.01, iters = 120, lr = 1 } = {}) {
  const d = X[0].length, w = new Array(d).fill(0);
  let b = 0;
  for (let it = 0; it < iters; it++) {
    const gw = new Array(d).fill(0);
    let gb = 0;
    for (let n = 0; n < X.length; n++) {
      const xn = X[n];
      let z = b;
      for (let j = 0; j < d; j++) z += xn[j] * w[j];
      const e = sigmoid(z) - y[n];
      gb += e; for (let j = 0; j < d; j++) gw[j] += e * xn[j];
    }
    b -= (lr * gb) / X.length;
    for (let j = 0; j < d; j++) w[j] -= lr * (gw[j] / X.length + l2 * w[j]);
  }
  return (x) => sigmoid(b + x.reduce((a, v, j) => a + v * w[j], 0));
}

// k ближайших соседей: доля дней роста среди k самых похожих дней обучения.
export function fitKnn(X, y, { k = 15 } = {}) {
  return (x) => {
    // держим k лучших вставкой: без сортировки всего обучения на каждый прогноз
    const kk = Math.min(k, X.length), bd = [], by = [];
    for (let n = 0; n < X.length; n++) {
      const p = X[n]; let dist = 0;
      for (let j = 0; j < p.length; j++) dist += (p[j] - x[j]) ** 2;
      if (bd.length === kk && dist >= bd[kk - 1]) continue;
      let q = bd.length < kk ? bd.length : kk - 1;
      while (q > 0 && bd[q - 1] > dist) { bd[q] = bd[q - 1]; by[q] = by[q - 1]; q--; }
      bd[q] = dist; by[q] = y[n];
    }
    let s = 0; for (let n = 0; n < kk; n++) s += by[n];
    return s / kk;
  };
}

function fit(model, rows, opts) {
  const sc = scaler(rows.map((r) => r.x)), X = rows.map((r) => sc(r.x)), y = rows.map((r) => r.y);
  const f = model === "knn" ? fitKnn(X, y, opts) : fitLogit(X, y, opts);
  return (x) => f(sc(x));
}

// Итоги прогнозов: доля угаданных направлений, связь с будущим (IC), капитал «в рынке, если p > 0,5».
export function score(preds, fee = 0.001) {
  const acc = preds.filter((p) => (p.p > 0.5 ? 1 : 0) === p.y).length / preds.length;
  const ic = correlation(preds.map((p) => p.p), preds.map((p) => p.ret));
  const eq = [1], hold = [1];
  let prev = 0;
  preds.forEach((p) => {
    const pos = p.p > 0.5 ? 1 : 0;
    let v = eq.at(-1) * (1 + pos * p.ret);
    if (pos !== prev) v *= 1 - fee;
    prev = pos; eq.push(v); hold.push(hold.at(-1) * (1 + p.ret));
  });
  const upShare = preds.filter((p) => p.y === 1).length / preds.length;
  return { acc, ic: Number.isFinite(ic) ? ic : 0, eq, hold, upShare, n: preds.length };
}

// Проверка вперёд. train — сколько последних известных дней в обучении, step — как часто переобучать.
export function walkForward(c, { model = "logit", lags = 5, train = 730, step = 30, k = 15, fee = 0.001 } = {}) {
  const rows = dataset(c, lags), preds = [];
  let f = null;
  for (let t = train + 1; t < rows.length; t++) {
    // строка t-1 — последняя, чей исход (закрытие дня rows[t].i) уже известен в момент прогноза
    if (!f || (t - train - 1) % step === 0) f = fit(model, rows.slice(t - train, t), { k });
    preds.push({ i: rows[t].i, p: f(rows[t].x), y: rows[t].y, ret: rows[t].ret });
  }
  return { preds, ...score(preds, fee) };
}

// Проверка на тех же данных, на которых модель училась (так делать нельзя — для сравнения).
export function inSample(c, { model = "logit", lags = 5, k = 15, fee = 0.001, last = null } = {}) {
  let rows = dataset(c, lags);
  if (last) rows = rows.slice(-last);
  const f = fit(model, rows, { k });
  return score(rows.map((r) => ({ i: r.i, p: f(r.x), y: r.y, ret: r.ret })), fee);
}

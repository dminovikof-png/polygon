// Опционы для уроков: выплата при экспирации, точка безубыточности, цена по формуле Блэка — Шоулза.
// Формула — учебное приближение (постоянная волатильность, нулевая ставка); настоящие опционы на криптобиржах
// стоят иначе, но порядок величины и форма выплаты те же.

// Выплата одного опциона при цене S в день экспирации, с учётом уплаченной (или полученной) премии.
// type: "call" (право купить по strike) или "put" (право продать); side: "long" — купили, "short" — продали.
export function payoff({ type = "call", side = "long", strike, premium = 0 }, S) {
  const intrinsic = type === "call" ? Math.max(S - strike, 0) : Math.max(strike - S, 0);
  const long = intrinsic - premium;
  return side === "long" ? long : -long;
}

// Цена, при которой купленный опцион возвращает премию.
export const breakeven = ({ type = "call", strike, premium = 0 }) => (type === "call" ? strike + premium : strike - premium);

// Функция нормального распределения (приближение Абрамовица — Стиган, ошибка < 1e-7).
export function normCdf(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp((-x * x) / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1 - p : p;
}

// Цена опциона: S — цена сейчас, K — страйк, days — дней до экспирации, vol — годовая волатильность (0,6 = 60 %).
export function blackScholes({ type = "call", S, K, days, vol, rate = 0 }) {
  const T = days / 365;
  if (T <= 0 || vol <= 0) return Math.max(type === "call" ? S - K : K - S, 0);
  const d1 = (Math.log(S / K) + (rate + (vol * vol) / 2) * T) / (vol * Math.sqrt(T)), d2 = d1 - vol * Math.sqrt(T);
  return type === "call" ? S * normCdf(d1) - K * Math.exp(-rate * T) * normCdf(d2) : K * Math.exp(-rate * T) * normCdf(-d2) - S * normCdf(-d1);
}

// Вероятность (по той же модели), что купленный опцион окажется в плюсе к экспирации.
export function probProfit({ type = "call", S, K, days, vol, premium }) {
  const T = days / 365, be = breakeven({ type, strike: K, premium });
  if (be <= 0) return 1;
  const z = (Math.log(be / S) + ((vol * vol) / 2) * T) / (vol * Math.sqrt(T));
  return type === "call" ? 1 - normCdf(z) : normCdf(z);
}

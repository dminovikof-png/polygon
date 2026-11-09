// Кредитование под залог (как в Aave и Compound) для уроков о DeFi: здоровье займа, цена ликвидации,
// ставка от загрузки пула. Цифры по умолчанию — примерные, у каждого протокола и монеты свои.

// Здоровье займа: залог × порог ликвидации / долг. Ниже 1 — заём можно ликвидировать.
export function healthFactor(collateralValue, debt, lt = 0.8) {
  return debt > 0 ? (collateralValue * lt) / debt : Infinity;
}

// Сколько можно занять под залог при допустимой доле займа ltv (например 0,75).
export const maxBorrow = (collateralValue, ltv = 0.75) => collateralValue * ltv;

// Цена монеты залога, при которой здоровье займа станет ровно 1.
export const liquidationPrice = (amount, debt, lt = 0.8) => (amount > 0 ? debt / (amount * lt) : Infinity);

// Ликвидация: если здоровье ниже 1, ликвидатор гасит часть долга (closeFactor) и забирает залог на эту сумму
// плюс премию bonus. Премия — это потеря заёмщика сверх обычного падения цены.
export function liquidate({ amount, price, debt, lt = 0.8, bonus = 0.05, closeFactor = 0.5 }) {
  const hf = healthFactor(amount * price, debt, lt);
  if (hf >= 1) return { liquidated: false, amount, debt, hf, seized: 0, penalty: 0 };
  const repaid = debt * closeFactor;
  const seized = Math.min(amount, (repaid * (1 + bonus)) / price);
  const left = amount - seized, newDebt = debt - repaid;
  return { liquidated: true, amount: left, debt: newDebt, hf: healthFactor(left * price, newDebt, lt), repaid, seized, penalty: seized * price - repaid };
}

// Ставки от загрузки пула u = занято / внесено. До точки optimal ставка растёт медленно, после — резко,
// чтобы заёмщики возвращали деньги и вкладчики могли их забрать. Вкладчик получает долю того, что платят заёмщики.
export function rates(u, { base = 0, slope1 = 0.04, slope2 = 0.6, optimal = 0.8, reserve = 0.1 } = {}) {
  const uu = Math.max(0, Math.min(1, u));
  const borrow = uu <= optimal ? base + slope1 * (uu / optimal) : base + slope1 + slope2 * ((uu - optimal) / (1 - optimal));
  return { borrow, supply: borrow * uu * (1 - reserve), u: uu };
}

// Путь цены залога: на каком дне (если вообще) заём был бы ликвидирован. prices — цены по дням.
export function firstLiquidation(prices, amount, debt, lt = 0.8) {
  const lp = liquidationPrice(amount, debt, lt);
  const i = prices.findIndex((p) => p <= lp);
  return { liqPrice: lp, day: i < 0 ? null : i };
}

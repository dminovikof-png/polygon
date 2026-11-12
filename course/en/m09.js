// Перевод модуля m09 (en). Формат — public/course/tr.js.
export default {
  id: "m09",
  src: "6f14547d",
  title: "Strategies",
  summary: [
    "Every strategy has a hidden assumption about how the price will behave; if it is wrong, the mechanics will not save it.",
    "In a rising market almost any strategy that steps out of the market more often loses to simple holding on return, but may win on drawdown.",
    "Grids, market making and statistical arbitrage look “neutral”, but in practice they lose to fees and to those who know more.",
  ],
  lessons: {
    "m09-1": {
      title: "The hidden assumption",
      blocks: [
        { text: "A strategy is easy to describe in rules: “buy when…, sell when…”. It is more useful to ask: **what must happen to the price for this to make money?** That is the [[Скрытое предположение|hidden assumption]]. Every strategy has one, even one that calls itself “market neutral”." },
        null,
        { text: "From here on, each lesson has three parts: the mechanics, the hidden assumption and what the project's test showed. At the end of the lesson there is a button that opens the work mode with the strategy already chosen: there you can test it honestly, with fees and holdout data." },
        { q: "A grid bot is called “neutral”. What is its hidden assumption?", options: ["None","The price will move within a range and return to it after leaving","The price will rise"], explain: "A grid makes money on the price coming back. If the price leaves the range and does not return, the grid holds a losing position." },
        null,
      ],
    },
    "m09-2": {
      title: "Holding and buying in parts",
      blocks: [
        { text: "**Mechanics.** Buy and hold. Or [[DCA (покупка частями)|DCA]]: buy the same amount once a month without looking at the price.\n\n**Hidden assumption.** In years the price will be higher than now. Nothing more — but that is no small thing: many coins from past cycles never returned to their peaks.\n\nDCA is often sold as “a way to buy cheaper”. It is not: it only spreads out the entry date. If the market mostly rises, buying at once wins, because the money works longer. If it falls, DCA wins. Compare on BTC's real history." },
        null,
        { text: "Investing $2,500 in parts over 24 months starting in 2019, 2020 or 2023, buying at once gave twice as much as DCA. Starting in 2018 or 2022, the opposite. Nobody knows in advance, so DCA is a way to reduce regret over an unlucky date, not a way to earn more." },
        { text: "The project tested souped-up variants: DCA with leverage, martingale (doubling after a loss), grid buying on the way down. Their expectation is negative by design. A martingale needs winning streaks to happen more often than its own bet arithmetic allows, and no settings provide that. The only thing that survived was a volatility filter: +6.5 percentage points on the 40% holdout data.", source: "The project's idea catalog: lev “Fast growth: 100x leverage, martingale, DCA and grid bots”" },
        { q: "BTC's price mostly rose for two years in a row. Which won: DCA or buying the whole amount on day one?", options: ["DCA — it always buys cheaper","Buying at once: all the money was in the rising asset earlier","The same"], explain: "DCA wins only if the price fell during the buying period. In a rising market, later purchases cost more than the first ones." },
        { label: "Test a constant share in the polygon" },
        { sources: ["Binance: public daily candles"] },
      ],
    },
    "m09-3": {
      title: "Trend following and the turtles",
      blocks: [
        { text: "**Mechanics.** [[Следование тренду|Trend following]]: be in the market while the price rises and get out when it falls. The simplest version is to hold while the price is above the SMA 200. The [[Черепахи|turtles]] buy on a breakout of the 20-day high and sell at the 10-day low.\n\n**Hidden assumption.** Strong moves last longer than they seem to. Then many small losses on false breakouts are paid for by rare large trends.\n\nSwitch the rules and the fee below. Green bars are days in the market." },
        null,
        { text: "On BTC since 2017 with a 0.1% fee, the SMA 200 rule gave ×7, and holding ×17.7; but the worst drawdown was −64% against −83%. The “turtles” gave ×22.9 with a −55% drawdown. This is pretty, but it is one coin, one set of parameters and hindsight. How to test it honestly is the subject of the next module." },
        { text: "**Turtles** in the project's test: the best variant gave ×21 in the sandbox — and ×0.84 on the 2025–2026 holdout data (t 0.44). Adding to a winning position (pyramiding) bankrupted the account in crypto: sharp pullbacks ate all the additions at once.\n\n**Breakouts** on 4-hour candles failed the pre-registered condition in every variant. **Fast breakouts**: a control group with no selection gave almost as much (+2.791R against +2.919R) — the result was explained by the market's rise, not by the rule.", source: "The project's idea catalog: “Turtles”, S1-4, fast “Fast breakout”" },
        { q: "A trend rule made ×7 against ×17.7 for holding, but with a −64% drawdown instead of −83%. How do you describe this honestly?", options: ["The rule is better than holding","The rule is worse than holding","It is a trade-off: less return for less drawdown; one coin and one set of parameters prove nothing"], explain: "You need to compare return, risk and robustness across other coins and periods. One history is an example, not proof." },
        { label: "Test the turtles in the polygon" },
        null,
      ],
    },
    "m09-4": {
      title: "Mean reversion",
      blocks: [
        { text: "**Mechanics.** [[Возврат к среднему|Mean reversion]]: buy after a sharp fall (RSI below 30, the price at the lower Bollinger band, several red days in a row) and sell after the bounce.\n\n**Hidden assumption.** Sharp moves are overdone and revert. Then come many small profits and rare large losses — when a fall turns out to be the start of a crash rather than a bounce.\n\nBelow is the same rule on BTC: since 2017, ×2.1 against ×17.7 for holding, in the market only 21% of the time. Crypto trends for long periods, and exiting after a bounce often misses the main move." },
        null,
        { text: "**Losing streaks.** Statistically there is a bounce after a series of red days, and a strong one: t −9.8. But it is 5 times smaller than the fee per trade.\n\n**Bounce after a liquidation cascade:** t 3.02 on 4 coins, t 0.98 on 10 others. The effect weakened as the number of coins grew — a sign of fitting to the first data.\n\n**Betting against false breakouts on 15-minute candles:** −210.7 percentage points in the sandbox, t −3.79.", source: "The project's idea catalog: “Losing streaks”, N “Bounce after a liquidation cascade”, fb “Fake-breakout fade”" },
        { q: "The bounce effect is statistically strong (t −9.8), but 5 times smaller than the fee. What does that mean for trading?", options: ["You need to trade more often","Trading on it does not pay: the edge does not cover the costs","You need to use leverage"], explain: "Neither frequency nor leverage turns a negative per-trade result into a positive one. Leverage will only enlarge the loss." },
        { label: "Test RSI reversion in the polygon" },
        null,
      ],
    },
    "m09-5": {
      title: "Grid",
      blocks: [
        { text: "**Mechanics.** A [[Сетка (грид-бот)|grid bot]] places buy orders at equal steps below the price and sell orders above. Each pass of the price down and back is a [[Круг сетки|round]] and a small profit.\n\n**Hidden assumption.** The price will move within a range and return to it. If the price goes down and does not return, the grid buys up the falling coin and holds its whole loss." },
        { steps: ["A range: buys below, sells above, the rounds bring profit.","The price went down: all the buys filled, no sells. The grid has become a large long in a falling coin."] },
        { text: "The grid step decides a lot. With a 0.25% step, the fee eats about 80% of a round's profit. With a 2–4% step there are fewer rounds, but each noticeably pays for its fee." },
        { text: "9 out of 9 grid configurations lost on one-minute data. A brilliant result on hourly candles (+275.7 percentage points) turned out to be a model error: on one-minute data the same bot gave −931%. A neutral ATR grid did not save it either: it is neutral by design, but not in its results.", source: "The project's idea catalog: grid “Grid bots and a neutral ATR grid”" },
        { q: "A coin fell 40% and did not come back. What about the grid?", options: ["It made money at every level","It bought at every level and holds a large loss","It closed automatically without a loss"], explain: "A grid sells only on moves back up. Without a return it turns into averaging down into a falling coin." },
        { label: "Test a grid in the polygon" },
        null,
      ],
    },
    "m09-6": {
      title: "Carry, market making, statistical arbitrage",
      blocks: [
        { text: "These strategies do not guess the direction of the price. That is why they are called neutral — and why their hidden assumptions are harder to spot." },
        null,
        { text: "**Carry.** Buy a coin and sell the same perpetual futures; the price hardly matters, and the funding remains. The assumption: funding will stay positive, and the exchange holding both legs will stay reliable.\n\n**Market making.** Stand with buy and sell orders and earn the spread. The assumption: the spread will be bigger than the losses from trading with those who know more than you ([[Неблагоприятный отбор|adverse selection]]).\n\n**[[Стат-арбитраж|Statistical arbitrage]].** Buy a coin that has lagged behind similar ones and sell the one that has run ahead. The assumption: the diverged coins will converge again, and faster than the fees eat the gain." },
        { text: "**Carry** on 19 coins: +121% over 2021–2026, a 1.4% drawdown — the strategy was accepted. But the excess over the benchmark by year: +18.5, +5.0, +0.1, 0.0 percentage points; in a cold market it does not trade at all.\n\n**Passive market making** per trade: half the spread +0.33 bp, adverse selection −0.60, the fee −2.00. Total −2.27 bp.\n\n**Statistical arbitrage:** there is predictability, but its size is 0.31 bp against costs of at least 8 bp.", source: "The project's idea catalog: S1-5 “Funding carry”, mm “Passive market making”, stat “Statistical arbitrage of residuals”" },
        { q: "Why does passive market making lose, even though every trade “earns the spread”?", options: ["The spread is too large","Orders tend to fill when the price moves against them, and the fee is more than half the spread","The exchange forbids market making"], explain: "Your order is taken mostly by those who see the move earlier. The losses on such trades plus the fee exceed the spread earned." },
        { label: "Test carry in the polygon" },
        null,
      ],
    },
  },
};

// Перевод модуля m11 (en). Формат — public/course/tr.js.
export default {
  id: "m11",
  src: "2b7cb093",
  title: "Honest testing",
  summary: [
    "A backtest shows what would have happened had a rule worked in the past; it easily lies through look-ahead, overfitting and wrong costs.",
    "Among hundreds of random strategies there is always a brilliant one; the significance bar rises with the number of attempts, and the sandbox's best is usually ordinary on new data.",
    "The order of testing: write the rule down in advance, count every attempt, open the holdout data once, then paper.",
  ],
  lessons: {
    "m11-1": {
      title: "A backtest and its promises",
      blocks: [
        { text: "A [[Бэктест|backtest]] is a calculation of what a rule would have earned had it been traded in the past. It is the only cheap way to test an idea: no money is needed, and years of history are computed in seconds.\n\nBut a backtest is a model, not the past. It assumes trades would have filled at the right price, that fees were as stated, that the rule was known in advance and did not change. Each of these assumptions can be broken without you noticing — and you get a beautiful curve that will never happen in real life." },
        null,
        { text: "A grid bot on hourly candles showed +275.7 percentage points. On one-minute data the same bot gave −931%. The hourly execution model counted rounds that would not have happened within the hour. The backtest was arithmetically correct — the assumption about execution was wrong.\n\nA bot built on rules from TradingView (VWAP, RSI(3), EMA(8) on one-minute candles) gave 18 signals over 5.6 years: the conditions almost excluded each other. After the conditions were fixed — a loss of −1.9 percentage points.", source: "The project's idea catalog: grid “Grid bots”, vwap “VWAP + RSI(3) + EMA(8)”" },
        { q: "A backtest showed +300% over three years. What should you check first?", options: ["Nothing, a computer did the calculation","Execution, costs, the number of attempts and whether the rule looks into the future","Only the fee"], explain: "A computer correctly calculates what it is told. The errors lie in the assumptions: at what price a trade fills, what was known at the moment of decision, how many variants were tried." },
        null,
      ],
    },
    "m11-2": {
      title: "Looking into the future",
      blocks: [
        { text: "[[Заглядывание в будущее|Look-ahead bias]] is when the calculation uses something that did not yet exist at the moment of decision. The most common case is one candle: the rule looks at the day's close and “buys” at the start of that same day.\n\nThe error looks innocent: in code it is a shift of one line. But the result changes many times over." },
        null,
        { text: "The blue line is the honest calculation: a decision made at the day's close takes effect from the next day. The red one gets the rise of the very day on which the decision was made. The difference is ×7 against ×176.\n\nOther kinds of look-ahead: the coin list “as of today” (dead coins have dropped out — [[Выжившая вселенная|survivorship bias]]); an indicator recomputed over the whole history; parameters picked on the same data on which the result is then shown." },
        { text: "The Markov 2.0 regime classifier promised 82% regime persistence. The project checked: the calculation windows overlapped, and neighboring days almost duplicated each other. With an honest step and no overlap — 30% against 33% for random guessing.", source: "The project's idea catalog: markov “Markov 2.0: a market regime classifier”" },
        { q: "A rule decides at the day's close, and the backtest credits it with that same day's rise. What is wrong?", options: ["Everything is correct","This is look-ahead: at the moment of decision the day's rise had already happened","You just need to account for the fee"], explain: "Honestly, the return should be received only from the day after the decision." },
        null,
      ],
    },
    "m11-3": {
      title: "500 monkeys and the bar",
      blocks: [
        { text: "Take 500 “monkeys”. Every day each one changes its decision with a 5% probability: to be in the coin or not. No analysis — pure chance. Let's run them on BTC's real history with a 0.1% fee." },
        { steps: ["Most monkeys lag behind simple holding: they are out of the market part of the time, and the market rose.","But the best of the 500 beat holding several times over. If this were a “strategy” with a nice name, it could be sold."] },
        { text: "Hence the main lesson: **if many variants have been tested, the best of them proves nothing**. To tell skill from luck, the best variant's [[t-статистика|t-statistic]] is compared with the [[Планка значимости|bar]] — what the best of N variants of pure noise gives. One attempt: 1.96. Twenty: 2.45. Five hundred: 3.53." },
        null,
        null,
        { text: "Every attempt counts: each parameter, each coin, each variant of the rule, even a discarded one. That is why the polygon keeps a log of attempts and raises the bar itself. The honest number of attempts is almost always larger than one would like to admit." },
        { text: "**Market breadth:** t 1.67 against a bar of 2.39. **Macro data:** the best result t 2.71 against a bar of 2.87 — close, but no. Without the bar both ideas would have looked like they work: for a single attempt, 1.96 would have been enough.", source: "The project's idea catalog: K7-H5 “Market breadth”, macro “Macro”" },
        { q: "You tested 200 variants of a rule, and the best gave t = 2.5. What does that mean?", options: ["The rule works: 2.5 is more than 1.96","Nothing definite: for 200 attempts the bar is about 3.3, and 2.5 is an ordinary result for the best of noise","The rule definitely does not work"], explain: "√(2·ln 200) ≈ 3.26. The best of 200 random variants gives about the same t on average." },
        { label: "See the bar and the log in the polygon" },
        null,
      ],
    },
    "m11-4": {
      title: "Overfitting and holdout data",
      blocks: [
        { text: "[[Переподгонка|Overfitting]] is when a rule is tuned so precisely to the past that it has memorized its noise. In the sandbox it shines; on new data it is like everyone else.\n\nThere is one defense: [[Песочница и холдаут|holdout data]]. History is split into two parts. In the first (the sandbox) you may try and tune anything. The second is left untouched until the very end and opened **once**, when the rule has been finally written down." },
        null,
        { text: "The monkeys show this vividly: the sandbox's best behaves like a random one on the holdout data — its skill was luck. The link between rank in the sandbox and rank afterwards is almost zero.\n\nWith real rules it is the same, only milder. Below is the rule “hold above the n-day average” with 30 variants of n." },
        null,
        { text: "On BTC the best n in the sandbox gave ×36 against a median of ×7.6 across variants. On the holdout data the same n gave ×2.2 — a little better than the median (×1.7) and holding (×1.8). The sandbox's promise is exaggerated many times over, although the rule itself is not meaningless. Switch the coin: on other coins the sandbox's best variant comes 4th, 6th, 9th out of 30." },
        { text: "**Turtles:** the best variant ×21 in the sandbox and ×0.84 on the 2025–2026 holdout data (t 0.44).\n\n**Bounce after a liquidation cascade:** t 3.02 on 4 coins, 0.98 on 10 others.\n\n**Stablecoin inflow:** the link is real (t 3.02), but the rule's [[PBO (вероятность подгонки)|probability of overfitting]] is 62.9%.\n\n**A pre-registered condition:** carry with basis expansion showed a profit factor of 7.6–9.3, but it broke the condition written before the calculation, “not a single losing year” — and was rejected, however tempting it was to keep it.", source: "The project's idea catalog: “Turtles”, N, chain, S1-6" },
        { q: "You opened the holdout data, and the result was bad. You adjusted the rule and tested again — now it is good. Can you trust it?", options: ["Yes, the rule has been improved","No: the holdout data has become one more sandbox; you need new, untouched data or paper trading","Yes, if the improvement is large"], explain: "Holdout data works once. After tuning to it, it stops being an independent test." },
        null,
      ],
    },
    "m11-5": {
      title: "Costs decide",
      blocks: [
        { text: "Fees, [[Проскальзывание|slippage]], [[Фандинг|funding]], the spread — small percentages per trade. But they are paid on every trade, and a rule's edge is usually even smaller. The more often a rule trades, the more the costs matter." },
        null,
        { text: "The “turtles” on BTC made 136 trades and, as the fee rose from 0 to 0.5%, lost half the result: ×26 → ×13. A rule with 40 trades barely noticed the difference. On hourly and one-minute candles there are dozens of times more trades — there, costs usually eat everything." },
        { text: "**Passive market making:** +0.33 bp of spread, −0.60 on adverse selection, −2.00 in fees — a total of −2.27 bp per trade.\n\n**Intraday seasonality:** an effect of 3–10 bp against a bar of 10.\n\n**Buying the hour's leader:** the leader changes 21 times a day — that is 1532% a year in fees alone.", source: "The project's idea catalog: mm, seas, pump" },
        { q: "A rule earns 0.08% per trade before costs, and the fee with slippage is 0.15% per round trip. What should you do?", options: ["Trade more often to earn more","Not trade: after costs every trade is a loss","Use leverage"], explain: "Neither frequency nor leverage changes the sign of a trade's result. You need either a bigger edge or lower costs." },
        { label: "Test with your fees" },
        null,
      ],
    },
  },
};

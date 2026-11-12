// Перевод модуля m10 (en). Формат — public/course/tr.js.
export default {
  id: "m10",
  src: "9c8f1616",
  title: "Risk and position size",
  summary: [
    "Losses and recovery are asymmetric: after −50% you need +100%, after −90% — +900%.",
    "The size of the bet matters as much as the edge: even a favorable game ruins you with too large a share at risk.",
    "Coins within crypto fall together, and constant leverage on a volatile asset eats capital even when the price rises.",
  ],
  lessons: {
    "m10-1": {
      title: "Drawdown and recovery",
      blocks: [
        { text: "A [[Просадка|drawdown]] is how far capital is below its previous peak. Its main nastiness is asymmetry: to get back, you have to grow by more than you fell." },
        null,
        { text: "So a drawdown is more dangerous than it looks. After −83% (BTC's worst fall) you need almost a 6-fold rise. After −96% (SOL), a 25-fold one. And not only the depth matters but also the duration: how many days in a row capital stays below its former peak." },
        { steps: ["BTC: worst drawdown −83%, more than 1,000 days in a row below the previous peak.","ETH: −94% and almost 4 years below the peak.","SOL: −96%. Those who bought at the 2021 top waited years for a recovery.","DOGE: −92% and more than 2,000 days in a row below the peak."] },
        { q: "Capital fell 50%. How much do you need to earn to get back?", options: ["50%","100%","75%"], explain: "To go from half to whole you need to double: 0.5 × 2 = 1." },
        { sources: ["Binance: public daily candles"] },
      ],
    },
    "m10-2": {
      title: "Risk per trade and the stop",
      blocks: [
        { text: "The professional approach starts not with the question “how much to buy” but with “how much am I willing to lose if I turn out to be wrong”. This is the [[Риск на сделку|risk per trade]] — usually 0.5–2% of capital.\n\nNext you need a [[Стоп-лосс|stop]] — the price at which the idea is admitted to be wrong. The position size comes from a division: the risk in dollars / the distance to the stop. The closer the stop, the bigger the position for the same risk." },
        null,
        { text: "With 1% risk an account survives 20 losing trades in a row and loses about 18%. With 10% risk the same 20 losses leave 12% of the account. Long losing streaks happen even to strategies with an edge: with a 40% win rate, a streak of 10 losses in a row within 1,000 trades happens in about 9 cases out of 10.\n\nThe stop is not perfect: in a sharp move it fills worse ([[Проскальзывание|slippage]]), and at weekends and during crashes, much worse." },
        { q: "Capital is $10,000, risk 1%, entry $100, stop $95. What is the position size?", options: ["$100","$2,000","$10,000"], explain: "The risk is $100, and the stop is 5% below the entry. $100 / 0.05 = a $2,000 position: if the stop is hit, the loss is exactly $100." },
        null,
      ],
    },
    "m10-3": {
      title: "Kelly and ruin",
      blocks: [
        { text: "Imagine a game with an edge: half the trades bring 1.2R, half lose 1R. On average every trade is profitable. What share of capital should you risk?\n\nThe answer is given by the [[Критерий Келли|Kelly criterion]]: for this game, 8.3%. At that share, capital grows fastest on average. Above it growth slows, and at around two Kelly and above, capital typically shrinks, even though every trade is still profitable." },
        null,
        { text: "The simulator plays out 1,000 versions of the future (by the [[Метод Монте-Карло|Monte Carlo method]]) of 200 trades each. For the 50% / 1.2R game:\n\n**2% risk:** no [[Разорение|ruins]], median ×1.42.\n**4% risk:** no ruins, median ×1.83.\n**8.3% risk (Kelly):** 2% ruined, median ×2.29, but the path is very bumpy.\n**15% risk:** 28% ruined, median ×1.35.\n**25% risk:** 74% ruined, median ×0.09.\n\nAnd that is with an edge known in advance. In real life the edge is estimated with error and often turns out smaller, so practitioners bet half or a quarter of Kelly." },
        { text: "The project tested fast deposit growth: 100x leverage, martingale, DCA and grid bots with doubling. All of them have a negative expectation by design: a martingale needs winning streaks to happen more often than its own bet arithmetic allows, and no settings provide that. The faster a scheme promises to double the account, the faster it zeroes it.", source: "The project's idea catalog: lev “Fast growth: 100x leverage, martingale”" },
        { q: "The game is favorable, but you risk 25% of capital on each trade, while Kelly is 8%. What is most likely?", options: ["The fastest growth","Capital will typically melt away, even though every trade is profitable","The same result as at 8%"], explain: "With a risk share above two Kelly, a losing streak destroys capital faster than wins restore it." },
        { sources: ["Kelly, 1956: A New Interpretation of Information Rate"] },
      ],
    },
    "m10-4": {
      title: "Correlation and diversification",
      blocks: [
        { text: "[[Диверсификация|Diversification]] works when assets do not move together. How much they move together is shown by [[Корреляция|correlation]]: 1 means always together, 0 means independently, −1 means always opposite." },
        null,
        { text: "The daily correlation of BTC and ETH over two years is 0.83. The picture is similar with most other coins, and in crashes correlation is even higher: on a bad day almost everything falls. Ten coins instead of one reduce the risk of one particular coin going to zero but barely protect against a market fall." },
        { text: "**A 19-coin portfolio against BTC:** it beats the average coin but loses to BTC on return per unit of drawdown.\n\n**Rotating BTC / ETH / alts by indicators:** the maximum correlation of signal with result is 0.171, and the sign flips in 6 cases out of 15.\n\n**Picking the 5 calmest coins from the top 40** was accepted on risk: drawdown −94% → −44…−68%. But the excess return falls short of the significance bar.", source: "The project's idea catalog: H6 “A 19-coin portfolio”, #3 “Rotation”, #32 “Picking calm coins”" },
        { q: "The correlation of two coins is 0.9. How much does holding both instead of one help?", options: ["A lot, the risk halves","Little: they almost always fall and rise together","The risk disappears"], explain: "At a correlation of 0.9 the second coin almost repeats the first. Diversification works with low correlation." },
        null,
      ],
    },
    "m10-5": {
      title: "Leverage over the long run",
      blocks: [
        { text: "It seems that 2x leverage on a rising coin gives twice as much. Over the long run this is not so. If you maintain constant leverage, every swing takes away part of the capital: −50% and then +50% give not zero but −25%. This is [[Снос волатильности|volatility drag]]; with leverage it grows as the square of the leverage." },
        null,
        { text: "BTC since 2020: without leverage ×10.6 with a −77% drawdown. With 2x leverage, ×6.4 and a −97% drawdown: more risk and less money. 3x and 5x leverage went to zero as early as March 2020 and took no further part in the rise. And this is without fees and funding, which in real life reduce the result further.\n\nFor BTC, with an average daily rise of 0.147% and swings of 3.48%, the best constant leverage over its history is about 1.2x. A small error in estimating the future — and the best leverage turns out to be below 1." },
        { text: "1.6x leverage on a basket of coins: 31.1% a year against 32.4% without leverage. No variant of leverage, pyramiding or volatility weighting gave a lasting edge.", source: "The project's idea catalog: #20-38 “Leverage on a basket, pyramiding”" },
        { q: "Over two days a coin fell 50% and then rose 50%. Capital without leverage?", options: ["Unchanged","−25%","+25%"], explain: "100 → 50 → 75. The rise is counted from the reduced sum. With leverage the loss from such swings is even larger." },
        null,
      ],
    },
  },
};

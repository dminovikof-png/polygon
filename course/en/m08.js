// Перевод модуля m08 (en). Формат — public/course/tr.js.
export default {
  id: "m08",
  src: "acb0ab60",
  title: "Technical analysis",
  summary: [
    "Candles and indicators are ways to compress a past chart; they describe what was, not what will be.",
    "The eye finds trends and patterns even in coin tosses, so any pattern must be tested on thousands of cases with fees.",
    "The project tested SMA200, breakouts, Gartley and the Bollinger squeeze: SMA200 reduces drawdown at the cost of return; the rest does not make money.",
  ],
  lessons: {
    "m08-1": {
      title: "Candles and timeframes",
      blocks: [
        { text: "[[Технический анализ|Technical analysis]] studies the price chart itself. Its main language is [[Японская свеча|candlesticks]]: each one shows the open, close, high and low for its stretch of time." },
        null,
        null,
        { text: "The length of the stretch is the [[Таймфрейм|timeframe]]. The same month is 30 daily candles, 720 hourly or 43,200 one-minute ones. The shorter the candle, the more random noise it holds and the more often a strategy trades. The fee per trade, meanwhile, does not shrink.\n\nSo on one-minute charts even ideas that look profitable on hourly ones lose: the project has seen this many times." },
        { text: "A grid bot on hourly candles showed +275.7 percentage points. The same bot on one-minute data: −931%. The hourly model did not see how the price within an hour crosses the grid levels back and forth, and it counted trades that would not actually have happened. 9 out of 9 configurations on one-minute data ended in a loss.", source: "The project's idea catalog: grid “Grid bots and a neutral ATR grid”" },
        { q: "A strategy earns 0.05% per trade before fees and trades 20 times a day. The fee for entry and exit is 0.2%. What happens?", options: ["A 1% profit a day","A loss of about 3% a day: the fee is 4 times the edge","Zero"], explain: "(0.05 − 0.2) × 20 = −3% a day. Short timeframes require an edge bigger than the fee, and that is rare." },
        null,
      ],
    },
    "m08-2": {
      title: "Indicators: averages, RSI, bands",
      blocks: [
        { text: "An indicator is a formula of past prices. The best known:\n\nThe [[Скользящая средняя (SMA)|moving average]] — the average price over N days. The SMA 200 is often called the border between a “bull” and a “bear” market. The [[EMA|EMA]] is the same, but recent days weigh more.\n\n[[RSI|RSI]] — from 0 to 100: what share of recent changes were rises. Above 70 is “overheated”, below 30 “oversold”.\n\n[[Полосы Боллинджера|Bollinger Bands]] — the average ± two standard deviations: they show how far the price has now strayed from the usual. The [[Канал Дончиана|Donchian channel]] — the high and low over N days: leaving it is called a breakout.\n\nSwitch them on one at a time on the real chart below. The scale is [[Логарифмическая шкала|logarithmic]]: an equal distance is an equal percentage." },
        null,
        { text: "Notice two things. Averages always lag: the SMA 200 turns months after the top. And RSI can be “overheated” for weeks on end while the price keeps rising. An indicator does not know the future — it retells the past in another form." },
        { text: "**SMA200.** The rule “hold BTC and ETH while the price is above its 200-day average” cut the drawdown in the project's test from −77% to −36% — in 6 years out of 6. But it is insurance with a premium: the return excluding 2022 fell from 47.8% to 16.3% a year. Sizing the position by volatility worsened the result (Sharpe 0.16 against 0.24). The median “life” of a signal above the average is about 4 days: the price often crosses the line back and forth.\n\n**Bollinger and ATR squeeze.** The idea “after a lull comes a strong move” was not confirmed: −18.1 percentage points in the sandbox, the sign matched in 2 subperiods out of 4, t −1.19. Before large moves, narrowing bands occurred no more often than usual.", source: "The project's idea catalog: #1 “SMA200 regime long”, H4 “Volatility expansion after an ATR squeeze”" },
        { q: "BTC's RSI has stayed above 70 for two weeks. What does that mean?", options: ["A reversal down is bound to come soon","The price has mostly been rising in recent weeks; the indicator on its own says nothing about the future","You must sell urgently"], explain: "RSI describes the ratio of recent rises to falls. In a strong trend it can stay “overheated” for weeks." },
        { label: "Test SMA200 on BTC in the polygon" },
        { sources: ["Binance: public daily candles"] },
      ],
    },
    "m08-3": {
      title: "Patterns and chance",
      blocks: [
        { text: "[[Фигура (паттерн)|Patterns]] — “head and shoulders”, “double bottom”, “flag”, Gartley harmonic patterns — are taught to be recognized by the shape of the chart. [[Уровень поддержки и сопротивления|Support and resistance levels]] are drawn through past reversals. The problem is that the human eye finds shapes everywhere, even in noise." },
        { steps: ["Try to guess which of the four charts is real BTC. All of them have “trends”, “levels” and “patterns”.","The real one is the second. The other three are coin tosses with the same strength of swings. Similar patterns appear on all four."] },
        { text: "If a pattern also turns up in a random chart, then on its own it means nothing. It can only mean something if after the pattern the price behaves differently than after a random moment. This is tested like so: find every case of the pattern over years, calculate the result with fees and compare it with random entries of the same shape." },
        { text: "**Gartley** on hourly candles: 49 trades, 33% wins, −0.348R on average (t −2.13) — worse than random entries with the same geometry. On a grid of 36 settings, all the results were negative.\n\n**Breakouts.** A stop entry on the Donchian channel on 4-hour candles failed its pre-registered condition: a [[Фактор прибыли (PF)|profit factor]] of 1.17 / 1.03 / 1.07 / 1.09 by year against the 1.25 needed. The breakout class is closed.\n\n**Entry on the first pullback after a change in structure:** 8,045 trades, −0.094R after costs (t −6.36), a loss in all 4 years.", source: "The project's idea catalog: gart “Gartley pattern”, S1-4 “Stop-entry bracket Donchian”, P1 “Entry on the first pullback”" },
        { q: "How do you test whether a pattern works?", options: ["Find a few nice examples on the chart","Find all cases over years, calculate the result with fees and compare with random entries","Ask an experienced trader"], explain: "A few examples can always be picked in hindsight. A test means all cases, costs and a comparison with chance." },
        null,
      ],
    },
    "m08-4": {
      title: "Volume and signal strength",
      blocks: [
        { text: "[[Объём торгов|Trading volume]] is often recommended as confirmation: a breakout on high volume is “real”, on low volume “false”. Two caveats. Part of the volume on exchanges is trades with oneself, which paint activity. And volume from different exchanges is aggregated differently, so the same candle may look different on two websites." },
        { text: "How do you measure whether a signal is useful at all? The project uses [[IC (связь сигнала с будущим)|IC]] — the correlation of a signal with future returns. 0 means no link. Good signals in stock markets give 0.02–0.05. But even a real link may not pay for the fees. In the project, 1 unit of IC gave about 56 basis points of difference in return. So a signal with an IC of 0.03 gives about 1.7 bp, while a trade costs at least 8–20 bp." },
        { text: "**High funding → future return:** IC −0.046, and the difference between the best and worst group in money +0.0004 (t +0.29). Statistically there is a link; it cannot be turned into money.\n\n**Seven weak signals together:** the link grew from 0.023 to 0.036, but after costs 0 out of 31 sets were in profit. For such a combination to pay off, about 43 independent signals are needed — there are not that many.", source: "The project's idea catalog: D “High funding”, #33 “A combination of seven weak signals”" },
        { q: "A signal is statistically significantly linked to the future price. Does that mean money can be made on it?", options: ["Yes, since the link is significant","Not necessarily: the link may be smaller than the fees per trade","No, significant signals do not work"], explain: "Significance says the link is not random. Paying off is a separate question: the size of the edge against the costs." },
        null,
      ],
    },
  },
};

// Перевод модуля m12 (en). Формат — public/course/tr.js.
export default {
  id: "m12",
  src: "20ec1cae",
  title: "Algorithmic and AI trading",
  summary: [
    "A bot executes a rule without emotions but does not make the rule better; most failures lie in data, orders and accounting, not in the idea itself.",
    "Machine learning on prices alone almost always finds noise: high accuracy in training, about 50% in a walk-forward test.",
    "Language models are useful as helpers: explain, write code, find a bug. They cannot be trusted to predict prices or decide for you.",
  ],
  lessons: {
    "m12-1": {
      title: "Algorithm and bot",
      blocks: [
        { text: "An algorithm is a rule written down so precisely that a machine can carry it out. A [[Торговый бот|trading bot]] is a program that, following this rule, gets data, decides and sends orders to an exchange on its own.\n\nA bot removes two human problems: emotions and fatigue. It is not afraid to sell after a fall and does not forget to set a stop at night. But a bot does not make a rule profitable: if the rule has no edge, the bot will simply execute it more neatly." },
        null,
        { text: "The rule is one link of five. The others: where the data comes from and whether it arrives late, whether the exchange accepts the order, at what price it fills, how fees and funding are accounted for. In practice most of a bot's troubles are exactly there: a missed candle, an exchange refusal, a partial fill, an order repeated after a connection failure.\n\nSo a bot's path to money is the same as any idea's: an honest backtest, then [[Бумажная торговля|paper trading]], then a small amount." },
        { text: "The project had AI agents that proposed bot rules themselves. Their ideas were tested like any others:\n\n**BearShort:** shorting in a bear regime, a profit factor of 1.17 over 81 trades (t 0.62), −57.6 percentage points on re-testing. **Funding Contrarian:** −16.6 percentage points, [[Суррогатный тест|surrogate test]] p = 0.517. **Fast breakouts:** a control group with no selection gave almost as much.\n\nNone passed. A rule's author — human or AI — does not exempt it from testing.", source: "The project's idea catalog: bear, FC, fast" },
        { q: "A bot trades a rule that has no edge. What will the bot change?", options: ["Make the rule profitable through speed","Nothing in expectation: it will neatly execute an unprofitable rule","Remove the fees"], explain: "A bot is an executor. It removes execution errors but does not create an edge that is not in the rule." },
        { label: "Open paper trading in the polygon" },
        null,
      ],
    },
    "m12-2": {
      title: "Execution and latency",
      blocks: [
        { text: "Time passes between a decision and a trade — [[Задержка (латентность)|latency]]. While the order travels to the exchange, the price has time to move. The shorter the rule's horizon, the more these milliseconds matter." },
        null,
        { text: "Large players place servers next to the exchange ([[Колокация|colocation]]) and react within fractions of a millisecond. There is no point competing with them on speed from home. A private bot is left with rules for which it makes no difference whether it enters now or in a minute: daily and hourly ones.\n\nBesides speed, execution has its own traps. The exchange limits the number of requests (a [[Лимит запросов|rate limit]]) and may temporarily refuse. A large order fills in parts and at a worse average price. During crashes, stops trigger worse than where they were set. A good backtest assumes **pessimistic** execution: if an idea survives bad execution, it will survive the real one." },
        { text: "**Shorting pumps:** 53–55% wins. But after a 20% rise, in 69% of cases the price manages to rise another 5% within the hour — before the short fills at the desired price. The account result ranged from ×0.000 to ×0.041, with a worst trade of −142%.\n\n**Entering in the middle of a pump:** 0 out of 24 variants in profit with pessimistic execution.", source: "The project's idea catalog: short-pump, bounce-pump" },
        { q: "A rule trades on one-minute candles and earns 0.05% per trade in a backtest. The bot runs on a home computer. What should you expect?", options: ["The same 0.05%","Most likely worse: latency and slippage on one-minute data are comparable to such an edge","Better, because a bot is faster than a human"], explain: "On short horizons, execution takes away most of a small edge. Without accounting for latency, a backtest is too optimistic." },
        { sources: ["Bybit: API rate limits"] },
      ],
    },
    "m12-3": {
      title: "Machine learning on prices",
      blocks: [
        { text: "[[Машинное обучение|Machine learning]] is when a rule is not written by hand but fitted from data. The model is shown [[Признак (в машинном обучении)|features]] (for example, the returns of the last 5 days) and the correct answers (whether the price rose the next day), and it looks for a link.\n\nTwo simple models. [[Логистическая регрессия|Logistic regression]] looks for the weighted sum of features that best separates rising days from falling ones. [[k ближайших соседей|k nearest neighbors]] finds the k past days most similar to today and looks at what came after them.\n\nThe main thing in testing is the [[Проверка вперёд|walk-forward test]]: for each day the model learns only from the days before it." },
        null,
        null,
        { text: "kNN with k = 1, on the same data it learned from, guesses 100% of days: it simply recalls the answer. In a walk-forward test, 49% — worse than a coin. The more flexible the model, the bigger the gap between training and testing — that is overfitting.\n\nChange the model, k and the number of features below. With honest testing, all variants stay around 50%, and the [[IC (связь сигнала с будущим)|link with the future]] around zero." },
        null,
        { text: "**Volatility forecasting** (the HAR model): it works — quality +29%, better on 11 coins out of 14. But the trading version lost: Sharpe 0.18 against 0.35. Volatility is predictable; money is not made on it.\n\n**Seven weak signals together:** the link with the future grew from 0.023 to 0.036, but after costs 0 out of 31 sets were in profit.\n\nComplex models (neural networks, boosting) on the same prices look for the same weak link, only with more room for overfitting.", source: "The project's idea catalog: HAR, #33" },
        { q: "In training a model guesses 85% of days; in a walk-forward test, 51%. What does that mean?", options: ["The model is excellent: 85%","The model memorized the past: 51% when almost 50% of days are rises is coin-toss level","You need to add more features"], explain: "Only the result on days the model has not seen matters. Adding features usually widens the gap, not the result." },
        null,
      ],
    },
    "m12-4": {
      title: "Language models as helpers",
      blocks: [
        { text: "A [[Языковая модель|language model]] (ChatGPT, Claude, Gemini and others) can explain, write code and reason. That makes it useful in trading — but not in the way the “AI bot that earns by itself” ads promise." },
        null,
        { text: "**Where it helps.** Explaining an unfamiliar term or someone else's code. Writing a calculation and its tests. Finding look-ahead or a forgotten fee. Listing what might go wrong. Turning a trade log into a report.\n\n**Where it does not help.** The model does not know tomorrow's price — it has no such knowledge, just like everyone else. It can confidently make up a fact, a number or a link, so any numbers are checked against the original source. Its knowledge ends at its training date: it may not know about yesterday's news.\n\n**Security.** Do not give a bot or agent keys with the right to withdraw funds. Text from a web page, email or document may contain hidden instructions for the model — [[Внедрение указаний|prompt injection]]. An agent that reads the internet and can also trade is an easy target." },
        { text: "This polygon was built with the help of an AI assistant: code, tests, checking calculations. At the same time, all trading ideas, including those proposed by AI agents, went through the same bar, holdout data and log of attempts — and most did not pass. AI speeds up testing but does not replace it.", source: "The project's idea catalog and log of attempts" },
        { q: "An AI assistant confidently writes that a strategy gives 40% a year and cites a link. What should you do?", options: ["Believe it: the model knows a lot","Open the link, check the number against the original source and test the strategy itself in the polygon","Ask the model to confirm once more"], explain: "Models sometimes make up numbers and links, and when asked again they confirm their own mistake. Checking is done against the original source and on data." },
        { sources: ["OWASP: risks of language model applications"] },
      ],
    },
  },
};

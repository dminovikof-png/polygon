// Перевод модуля m00 (en). Формат — public/course/tr.js.
export default {
  id: "m00",
  src: "fabae8b7",
  title: "How the course works and what to expect",
  summary: [
    "The course explains crypto and trading in plain words; the program lets you check everything on real history.",
    "Almost all trading ideas, tested honestly, do not beat simple holding.",
    "The main numbers in the program: return, drawdown, comparison with the benchmark and the significance bar.",
  ],
  lessons: {
    "m00-1": {
      title: "What the course gives and what it does not",
      blocks: [
        { text: "The program has two modes. **Learning** is the course: what coins, exchanges, wallets and protocols are, how trading works and how to test ideas honestly. **Work** is the testing itself: pick coins, look at their state, choose an idea, test it on history and watch it on paper, without money." },
        { caption: "The modes are linked: from a lesson you can jump straight to a test on real data, and from the work mode you can open the lesson you need." },
        { text: "The course **gives** understanding: what happens when you press “buy”, where the interest in DeFi comes from, why the same strategy looks brilliant on one stretch of history and fails on another.\n\nThe course **does not give** a ready way to make money and does not tell you what to buy. This is not investment advice. When a lesson shows a strategy, it always shows what an honest test of it found — including when the result is bad." },
        { q: "What will you get in the work mode?", options: ["Signals about what to buy today", "A test of your idea on history, with costs and a comparison against the benchmark", "Automatic trading on an exchange"], explain: "The program tests ideas on past data and runs paper trading. It has no “buy now” signals and makes no real trades." },
      ],
    },
    "m00-2": {
      title: "Why most strategies do not work",
      blocks: [
        { text: "Imagine 500 people, each tossing a coin 10 times. Someone will surely get 8 or 9 heads. They are not better at tossing coins — there are just many people. Trading ideas are the same: test many ideas, and a few will look excellent by chance." },
        { steps: ["10 people: the best result is usually 6–8 heads.", "100 people: someone already has 8–9 heads, although the coin is fair.", "500 people: the best one looks like a master, but it is chance. The more attempts, the higher the bar must be."] },
        { text: "That is why the program computes the [[t-статистика|t-statistic]] — how steadily the idea beat the benchmark, candle after candle — and compares it with the [[Планка значимости|significance bar]]. The bar rises with the number of tests in the journal: it is the same correction for “500 people with a coin”." },
        { text: "The research the program is built on: 29 hypotheses and 563 variants on crypto. With that many attempts the bar is t above 3.09. Not one idea that predicts the direction of price passed it: the link between signal and future move (IC) is about 0.04 and changes sign from period to period. Only the size of moves turned out to be predictable (IC about 0.51), but sizing positions by it did not pay.", source: "Summary of the project's research program" },
        { label: "See how many attempts are already in your journal" },
        { q: "You tested 200 variants of one idea, and the best one beat holding. What does this mean?", options: ["The idea works, time to trade", "Nothing yet: among 200 variants the best almost always looks good by chance — you need a high bar and a test on new data", "You need to test 200 more variants"], explain: "The best of many is like the best of 500 coin tossers. Without a correction for the number of attempts and without a test on data you have not seen, it is not proof." },
      ],
    },
    "m00-3": {
      title: "How to read the numbers in the program",
      blocks: [
        { text: "Every test has four main numbers.\n\n**Return** — how much the capital grew over the whole period, after fees and slippage.\n\n**[[Просадка|Drawdown]]** — the deepest fall of capital from a peak to a trough. It is what you will have to sit through without abandoning the idea." },
        { caption: "The end result can be positive while capital fell by a third along the way. Two ideas with the same return and different drawdowns are different ideas." },
        { text: "**Comparison with the benchmark.** “+80%” on its own means nothing: if the coin rose 120% over the same time, the idea lost to simple [[Удержание (buy&hold)|holding]]. That is why the program always shows the benchmark next to it.\n\n**Above the bar or not.** Even if the idea beat the benchmark, it may be luck — see the previous lesson. The summary line in the program answers both questions at once: did it beat the benchmark and did it pass the bar." },
        { q: "An idea made +150%, holding the same coin made +200%, and the idea's drawdown is half as deep. How do you describe this honestly?", options: ["The idea is worse: it lost to the benchmark", "The idea is better: it made a lot", "The idea earned less than holding but with a smaller drawdown; which matters more is your call, and whether it is chance is shown by the bar"], explain: "Return and drawdown are different properties. Losing on return but winning on drawdown is a fair choice if it is made consciously and survives the test for chance." },
        { label: "Open the idea test" },
        null,
      ],
    },
  },
};

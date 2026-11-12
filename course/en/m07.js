// Перевод модуля m07 (en). Формат — public/course/tr.js.
export default {
  id: "m07",
  src: "58c0c122",
  title: "Fundamental analysis",
  summary: [
    "A protocol and its token have different money: what matters is whether there is a path from revenue to the holder — buyback, burning, distribution.",
    "Issuance of new coins and unlocks are constant sellers; for the price to stand still, demand must grow by the same amount.",
    "The network's activity and the coin's price are linked weakly and with a long lag; many on-chain metrics are easy to fake.",
  ],
  lessons: {
    "m07-1": {
      title: "Revenue and the path to the token",
      blocks: [
        { text: "[[Фундаментальный анализ|Fundamental analysis]] asks: what stands behind the price? A share has the company's profit and a right to part of it. A token has no such right by default.\n\nAn exchange protocol may collect hundreds of millions of dollars in fees a year, but if all the fees go to liquidity providers, the token holder gets nothing. So people look not at [[Выручка протокола|protocol revenue]] in general but at the path from revenue to the token." },
        null,
        { text: "There are three paths. **Distribution** — part of the fees is paid to those who have staked the token. **[[Выкуп и сжигание|Buyback and burn]]** — the protocol buys tokens on the market and destroys them. **Voting rights** — holders may someday vote for a distribution; that is a promise, not money.\n\nWhen there is a path, a [[Мультипликатор|multiple]] can be calculated, as with stocks: the value of all tokens / annual revenue to holders. For mature companies 10–30 is typical. For many tokens it is hundreds or infinity, because nothing reaches the holders." },
        { q: "A protocol earned $100 million in fees, but all of it goes to liquidity providers. What does the token holder get?", options: ["Their share of the $100 million","Nothing, as long as there is no distribution, buyback or burning","Interest on a deposit"], explain: "Protocol revenue and token income are different things. Without a mechanism for passing on money, the holder owns only a vote and a hope." },
        { sources: ["DefiLlama: protocol fees and revenue"] },
      ],
    },
    "m07-2": {
      title: "Supply: emission and unlocks",
      blocks: [
        { text: "The price is where supply meets demand. People talk a lot about demand and less about supply, although supply is easier to count.\n\nNew coins appear in two ways. [[Эмиссия|Emission]] is the reward to validators or miners, and it happens every day. [[Разблокировка|Unlocks]] are batches of team and investor tokens that become available for sale on a schedule. Recipients often sell: they need to pay salaries, and funds need to return money to their own investors." },
        null,
        { text: "If a coin issues 8% a year and the price stands still, demand in dollars has actually grown by 8%: the new coins ate it. The holder, meanwhile, is [[Размывание|diluted]] — their share of the network shrinks.\n\nBTC's issuance is now below 1% a year and halves every four years. Young tokens with an [[FDV|FDV]] 5–10 times their market cap have several years of large unlocks ahead." },
        { text: "The project tried to test whether large unlocks pressure the price in the days around the event. Only 21 suitable events with exact dates and volumes were found, against the 150 needed for an honest test. The idea was frozen on 12.10.2026 without opening the holdout data: there is no “works” or “does not work” answer yet.\n\nThat is a result too: pretty “price after an unlock” charts on social media are usually built on a few events picked in hindsight.", source: "The project's idea catalog: U1 “Token unlocks”" },
        { q: "A coin issues 10% new coins a year. Its market cap grew 10% over the year. What happened to the price?", options: ["It rose 10%","It barely changed: all the market cap growth went into the new coins","It fell 10%"], explain: "Market cap = price × coins. There are 10% more coins, and the market cap grew by the same 10% — the price stayed the same." },
        { sources: ["Token Unlocks: unlock schedules"] },
      ],
    },
    "m07-3": {
      title: "The network works, the price falls",
      blocks: [
        { text: "A tempting idea: if a network is used more and more, the coin should get more expensive. Over long stretches there really is a link. But on a horizon of months and even a year it drowns in market sentiment." },
        null,
        { text: "In 2022 the Bitcoin network worked flawlessly and the hashrate grew — yet the price fell by more than three quarters. The network did not change; interest rates, liquidity and people's appetite for risk did.\n\nSo fundamental data answer the question “what is this and what might it be worth in years”, but are poorly suited to deciding “buy this week”." },
        { text: "The project tested whether macro data (the dollar, interest rates, credit spreads, VIX, the 10-year bond yield) predict crypto returns. The best result was t 2.71 against a bar of 2.87: close, but it does not pass. The bond yield effect on BTC with t 3.60 from someone else's study did not replicate.", source: "The project's idea catalog: macro “Macro: the dollar, rates, credit, VIX”" },
        { q: "The number of active addresses on a network doubled over a year. What can be said about the price in a month?", options: ["It will double","Almost nothing: on a short horizon the price depends mostly on market sentiment","It will fall"], explain: "Network usage affects the price slowly and imprecisely. In a month, rates, liquidity and mood decide." },
        { sources: ["Blockchain.com: Bitcoin hashrate"] },
      ],
    },
    "m07-4": {
      title: "On-chain metrics and their traps",
      blocks: [
        { text: "A blockchain is open, so a lot can be counted: transfers, addresses, fees, coin inflows to exchanges, stablecoin supply. These are [[Ончейн-метрики|on-chain metrics]]. But openness does not equal honesty: many numbers cost almost nothing to fake." },
        null,
        { text: "The number of addresses is inflated by creating millions of empty wallets. Transfer volume, by sending the same coins around in a circle. [[TVL|TVL]] grows when the same money is deposited into several protocols in a chain. What is harder to fake is what costs real money: network fees, protocol revenue, burned coins." },
        { text: "Two popular on-chain ideas in the project's tests:\n\n**Stablecoin inflow** as a signal of a rise: the link is real (t 3.02), but the specific trading rule turned out to be overfitted — a 62.9% probability of overfitting.\n\n**Coin flows to exchanges** (“whales bring coins to sell”): t 1.24, and in 5 years out of 7 the sign was the opposite of what was expected.", source: "The project's idea catalog: chain “Stablecoin supply, exchange flows”" },
        { q: "Which metric is the hardest to fake?", options: ["The number of new addresses","Transfer volume within the network","The fees users paid to the network"], explain: "Fees are real expenses. They can be inflated only by burning your own money, and that is expensive." },
        { sources: ["DefiLlama: stablecoins"] },
      ],
    },
  },
};

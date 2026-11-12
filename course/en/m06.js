// Перевод модуля m06 (en). Формат — public/course/tr.js.
export default {
  id: "m06",
  src: "b149fbbe",
  title: "Types of assets",
  summary: [
    "An option is a right with a price: the buyer's loss is limited to the premium; the seller's profit is limited to the premium, and the loss can be large.",
    "With a coin, not only the price matters but also the tokenomics: how many coins are still to come, who owns them and when they can be sold.",
    "Major coins have fallen 80–96% from their peak and taken years to return to it; memecoins and tokenized assets add risks of their own.",
  ],
  lessons: {
    "m06-1": {
      title: "Coins, tokens, memecoins",
      blocks: [
        { text: "The word “crypto” lumps together very different things.\n\n**Network coins** (BTC, ETH, SOL) pay for the work of the network itself: fees and validator rewards are paid in them. **Protocol tokens** are issued on top of a network and give rights in an application: a vote, a share of fees, a discount. [[Стейблкоин|Stablecoins]] hold the dollar's price. [[Мемкоин|Memecoins]] give nothing but the coin itself: their price rests only on attention.\n\nFor any of them it pays to know the [[Токеномика|tokenomics]]: how many coins there are in total, how many are already trading and what will reach the market next." },
        null,
        { text: "Two valuations are often confused. [[Рыночная капитализация|Market capitalization]] is price × coins in circulation. [[FDV|FDV]] is price × all the coins that will ever be issued. If 15% is in circulation, the other 85% belongs to the team, funds and treasury and comes out on a [[Вестинг|vesting]] schedule. Each [[Разблокировка|unlock]] adds sellers: for the price to hold, demand must grow faster than supply." },
        null,
        { text: "Even the largest coins have gone through falls after which most people give up. And these are the survivors: thousands of coins from past cycles have disappeared entirely, so the chart of “all of crypto” looks better than a typical buyer's result ([[Выжившая вселенная|survivorship bias]])." },
        { q: "A token's price is $1, 100 million are in circulation, and 1 billion will be issued in total. What is the FDV?", options: ["$100 million","$1 billion","$10 billion"], explain: "FDV = price × all future tokens = $1 × 1 billion. The market cap is $100 million: the other 900 million tokens are still to reach the market." },
        { sources: ["Binance: public daily candles"] },
      ],
    },
    "m06-2": {
      title: "Options: a right with a price",
      blocks: [
        { text: "An [[Опцион|option]] is a contract under which the buyer gets the right, but not the obligation, to buy or sell a coin at the [[Страйк|strike]] price on the expiry date. For the right, they pay the seller a [[Премия|premium]] up front.\n\nA [[Колл|call]] is the right to buy: profitable in a rise. A [[Пут|put]] is the right to sell: profitable in a fall, and it resembles insurance. It is important to remember that every option has two sides. The buyer risks the premium, while the seller receives the premium and takes on an obligation." },
        { steps: ["A bought call with a strike of 100 for a premium of 6. Below 100 the option is worthless, and you lose the premium. Above 106 — a profit.","The same trade through the seller's eyes: they got 6 and are happy while the price is below 106. In a strong rise their loss is unlimited.","A bought put: the right to sell at 100. If the coin falls to 60, the put brings 40 minus the premium — like insurance.","A sold put: a premium of 5 up front, but the obligation to buy at 100 even after a crash. Many “deposits with a higher rate” work this way."] },
        { text: "What is the right worth? The main thing is [[Волатильность|volatility]]: the more a coin swings, the likelier the option is to end up profitable, and the more it costs. The market builds expected swings into the price — this is [[Подразумеваемая волатильность|implied volatility]]. The classic Black–Scholes model converts it into a premium. Play with it below." },
        null,
        { text: "The project tested buying cheap options as a lottery: rare wins many times over against frequent losses of the premium. Such a lottery lost to simply holding BTC.\n\nSelling volatility looks better: implied volatility on average exceeds what actually followed by 5.6–8.7 points. But the project could not predict when this premium pays off (t 1.27 — below the [[Планка значимости|bar]]). And selling options through a Dual Asset “deposit” is a sold call: a premium of about 0.19% against unlimited missed profit in a rise.", source: "The project's idea catalog: opt “Option lottery, selling volatility”, dual “Dual Asset Sell High”" },
        { q: "You bought a BTC put with a $60,000 strike for $2,000. At expiry BTC is at $70,000. What is the result?", options: ["A $10,000 profit","A $2,000 loss — the put is not needed; the right to sell at 60,000, below the market, is useless","A $10,000 loss"], explain: "A put pays only if the price is below the strike. Otherwise it is not exercised, and the loss equals the premium — like unused insurance." },
        null,
      ],
    },
    "m06-3": {
      title: "Futures and the basis",
      blocks: [
        { text: "Module 3 covered perpetual futures with [[Фандинг|funding]]. There are also ordinary ones, with a term: a contract to buy or sell a coin on a set date at a price agreed today. The price of such a futures contract usually differs from the coin's price. The difference is called the [[Базис|basis]].\n\nWhen the market is rising and many want to buy with leverage, the futures contract costs more than the coin. By the settlement date the basis must disappear: on that day the futures contract and the coin are one and the same." },
        null,
        { text: "Hence a trade: “buy the coin and sell the futures contract at the same time”. The coin's price hardly matters in it: what is lost on one leg is gained on the other. What remains is the basis minus fees. It resembles a deposit — with similar risks for the exchange holding both legs, plus the risk of a sharp rise, when you are asked to add collateral on the short leg." },
        { text: "Quarterly basis on BTC and ETH: 13 trades out of 13 in profit, 14.6% per trade on average, a 3.6% drawdown. Right now the idea is “asleep”: the annual basis has fallen to 1–3%, and after fees there is nothing to take.\n\nThe same idea with funding instead of the basis ([[Carry|carry]] on 19 coins): +121% over 2021–2026, a 1.4% drawdown. But the excess over the benchmark melts away year by year: +18.5, +5.0, +0.1, 0.0 percentage points, and in 2026 there was not a single trade. Carry earns when the market is overheated and goes quiet when it is cold.", source: "The project's idea catalog: H1 “Quarterly basis carry”, S1-5 “Funding carry”" },
        { q: "BTC is at $100,000, and the 90-day futures contract at $102,500. What happens to the difference by the settlement date?", options: ["It stays","It disappears: on settlement day the prices coincide","It doubles"], explain: "On settlement day the futures contract turns into the coin itself. So the basis converges to zero, and whoever sold it collects that basis." },
        { label: "Test carry in the polygon" },
        { sources: ["Binance: quarterly futures settlement"] },
      ],
    },
    "m06-4": {
      title: "Tokenized assets",
      blocks: [
        { text: "[[Токенизированный актив|Tokenized assets]] promise to bring bonds, gold, real estate and shares onto the blockchain. Technically it is a token that the issuer undertakes to exchange for the real asset. The blockchain itself knows nothing about the asset: it only stores the record of who holds how many tokens." },
        null,
        { text: "So what needs checking is a chain of people, not code. Who is the issuer and who supervises them? Where is the asset held and who confirms it? Can an ordinary holder exchange the token for the asset, or is redemption open only to large clients? What happens to the token if the issuer goes bankrupt?\n\nTokenized US Treasury bonds pay interest close to the Fed rate — because inside are ordinary bonds. There are no yield miracles here. There is settlement convenience and one more link of risk." },
        { q: "A gold token trades $50 below gold. What is the most likely explanation?", options: ["A bargain, the market is wrong","The market doubts the possibility of redemption or the issuer","Gold on a blockchain is cheaper by nature"], explain: "If the token could be freely exchanged for gold, arbitrageurs would buy up the discount. The discount is payment for the risk of some link in the chain." },
        null,
      ],
    },
  },
};

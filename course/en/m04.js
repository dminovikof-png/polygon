// Перевод модуля m04 (en). Формат — public/course/tr.js.
export default {
  id: "m04",
  src: "dbfb429c",
  title: "Decentralized exchanges (DEX)",
  summary: [
    "A DEX has no order book: you swap with a pool, and the price is set by the formula x·y = k — the bigger the swap relative to the pool, the worse the price.",
    "Pool providers earn fees but pay with impermanent loss: the pool gives away what gets dearer and accumulates what gets cheaper.",
    "The transaction queue is visible to everyone, so a large swap with a high slippage tolerance is a gift to sandwich bots.",
  ],
  lessons: {
    "m04-1": {
      title: "A liquidity pool instead of an order book",
      blocks: [
        { text: "A [[DEX (децентрализованная биржа)|decentralized exchange]] is a set of smart contracts. There is no company that holds the money and checks identity: you connect your wallet and swap tokens straight from it.\n\nKeeping an order book on a blockchain is expensive — every order would cost gas. So most DEXs work differently: there is a [[Пул ликвидности|pool]] — a contract with a reserve of two tokens. [[Поставщик ликвидности|Liquidity providers]] deposit both tokens into it, traders swap with the pool, and a formula computes the price. This setup is called an [[AMM (автоматический маркетмейкер)|automated market maker]]." },
        null,
        { text: "The pluses: swap at any moment, no registration, any token can get its own pool. The minuses are the flip side of the pluses. Anyone can create a pool even for a worthless token, and nobody is responsible for bugs in the contract. Instead of an exchange fee you pay the network's gas, the pool's fee and your swap's impact on the price." },
        { q: "Who sells you a token on a DEX with a liquidity pool?", options: ["Another trader whose order was sitting in the order book","The pool itself: you give one token and take another at the price the formula computes","The exchange company"], explain: "There is no opposing order. Your counterparty is a contract with reserves deposited by liquidity providers." },
        { sources: ["Uniswap: how the protocol works"] },
      ],
    },
    "m04-2": {
      title: "The x·y = k formula",
      blocks: [
        { text: "The best-known pool formula is the [[Постоянное произведение (x·y=k)|constant product]]. Let the pool hold x ETH and y USDT. The price of ETH is y / x. During a swap the product x × y must stay the same (the fee is added on top and stays in the pool).\n\nExample: the pool holds 100 ETH and 200,000 USDT, the price is 2000. You want to take 10 ETH. 90 ETH will remain, and the product 20,000,000 requires USDT to become 20,000,000 / 90 ≈ 222,222. So you pay about 22,222 USDT — 2222 per ETH, not 2000. The more you take, the more expensive each next unit: all 100 ETH cannot be taken at any price." },
        { steps: ["The pool is always on the curve x·y = k. The green dot is now: 100 ETH and 200,000 USDT.","A purchase for 10,000 USDT: the dot moved along the curve, and the price rose by about 10%.","A purchase for 50,000 USDT — a quarter of the pool: the average price is about 25% worse than the starting one.","The further along the curve, the steeper it gets: each next ETH costs more and more."] },
        null,
        { text: "Hence [[Влияние на цену|price impact]]: it depends on the size of the swap relative to the size of the pool. In a pool of hundreds of millions of dollars, a thousand-dollar swap barely moves anything; in a $50,000 pool the same swap moves the price by several percent.\n\nAfter a large swap, the pool's price differs from the price on other exchanges. [[Арбитраж|Arbitrageurs]] immediately pull it back: they buy where it is cheaper and sell where it is dearer. This keeps pool prices close to the market — and, as we will see in the next lesson, it is done at the providers' expense." },
        { q: "The pool holds 10 ETH and 20,000 USDT. You buy ETH for 20,000 USDT. How much ETH do you get (without the fee)?", options: ["10 ETH","5 ETH: USDT becomes 40,000, and the product 200,000 requires 5 ETH in the pool","Almost 10 ETH, but a little less because of the fee"], explain: "x·y = 10 × 20,000 = 200,000. After the swap y = 40,000, so x = 5. You took 5 ETH at 4000 on average — twice the starting price." },
        { sources: ["Uniswap v2: the constant product formula"] },
      ],
    },
    "m04-3": {
      title: "Impermanent loss",
      blocks: [
        { text: "A provider deposited 1 ETH and 2000 USDT into a pool at a price of 2000. The price of ETH doubled. Arbitrageurs bought cheap ETH from the pool until the pool's price reached 4000. Now the provider's share of the pool is about 0.71 ETH and 2828 USDT — $5,657 in total. Had they simply held 1 ETH and 2000 USDT, they would have $6,000.\n\nThis difference is [[Непостоянные потери|impermanent loss]]: −5.7% when the price doubles. The pool constantly sells what gets dearer and buys what gets cheaper. “Impermanent” because if the price returns to the starting one, the loss disappears. If it does not return, the loss is quite permanent." },
        { caption: "The loss is the same for a rise and a fall by the same factor: ×4 and ÷4 each give −20%." },
        null,
        { text: "A provider earns fees from every swap. The result is fees minus impermanent loss. For pairs that move together (two dollar stablecoins), the losses are small. For pairs where one coin can crash relative to the other, the losses can eat all the fees and more.\n\n[[Концентрированная ликвидность|Concentrated liquidity]] is especially risky: the provider keeps coins only within a narrow price range. There are more fees, but when the price leaves the range, the provider is left holding only the coin that got cheaper." },
        { text: "A two-coin pool essentially rebalances, like a grid on the ratio of their prices. The project tested this directly: harvesting the swings is real and captures 83–87% of the theoretical ceiling. But for 76 altcoin/bitcoin pairs the median was −3.46 percentage points a year against holding, and 45% of altcoins fell more than 90% against bitcoin. The swings bring a little; one coin's long drift away takes a lot.", source: "The project's idea catalog: “Rebalancing premium and ratio grid”" },
        { q: "An ETH/USDT pool: the price of ETH fell fourfold. How far did the pool share lag behind simple holding (without fees)?", options: ["It did not lag: the pool is in dollars","By 20%","By 75%"], explain: "The impermanent loss formula is symmetric: both ×4 and ÷4 give −20% relative to holding. Holding itself fell too — the pool simply lost more." },
        { sources: ["Uniswap: liquidity providers"] },
      ],
    },
    "m04-4": {
      title: "MEV and sandwich attacks",
      blocks: [
        { text: "A transaction you send first lands in the [[Мемпул|public queue]] and is visible to everyone until it gets into a block. Whoever assembles the block decides in what order to place the transactions. The income from a profitable reordering is called [[MEV|MEV]].\n\nThe best-known kind is the [[Сэндвич-атака|sandwich]]. A bot sees your large swap, places its own purchase before it and a sale right after." },
        { steps: ["Your swap is waiting in the queue.","The bot buys first and pushes the price up.","You buy at a worse price — within your slippage tolerance.","The bot sells right after you and takes the difference."] },
        { text: "The bot can move the price exactly as far as you allowed with your [[Допуск проскальзывания|slippage tolerance]]: if you agree to receive 5% less, the bot will try to take almost all of the 5%.\n\nHow to protect yourself:\n\n**A small tolerance** — 0.1–0.5% for liquid pairs. If the swap fails, it is better to retry than to overpay.\n\n**A large swap — in parts** or through an [[Агрегатор|aggregator]] (next lesson).\n\n**[[Частная отправка транзакций|Private transaction sending]]** — many wallets can send a transaction straight to block builders, bypassing the public queue." },
        { q: "You set a 10% slippage tolerance “so that the swap surely goes through”. What is wrong with that?", options: ["Nothing, it is just insurance","A bot can move the price by almost 10% and take the difference: the tolerance is how much you agree to lose","The swap will cost more gas"], explain: "The tolerance is the upper bound of the loss, not insurance. Bots profit from pushing your price right up to that bound." },
        { sources: ["ethereum.org: MEV"] },
      ],
    },
    "m04-5": {
      title: "Aggregators and the full cost of a swap",
      blocks: [
        { text: "One pair of tokens often has several pools in different protocols and networks. An [[Агрегатор|aggregator]] looks for a way to split the swap among them so that each part moves the price less." },
        null,
        { text: "The full cost of a swap on a DEX has four parts: **network gas** (for each pool in the route), **the pool fee** (often 0.05–1%), **price impact** and **MEV**, if the transaction went into the public queue. On a centralized exchange, instead, there is the exchange fee, the spread and slippage through the order book.\n\nFor small amounts on Ethereum's main network, gas can exceed everything else; on layer two gas is small, but pools are usually smaller too. What you should compare is the result: how many tokens you receive in hand." },
        { q: "What should you compare when choosing where to swap $500?", options: ["Only the pool fee","How many tokens you receive in hand after gas, fees, price impact and slippage","The price on the chart"], explain: "Each part on its own may be small, but you pay their sum. An aggregator shows the result; on an exchange the result is the fill price minus the fee." },
        { sources: ["ethereum.org: decentralized exchanges"] },
      ],
    },
  },
};

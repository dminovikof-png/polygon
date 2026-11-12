// Перевод модуля m03 (en). Формат — public/course/tr.js.
export default {
  id: "m03",
  src: "dba8634e",
  title: "Centralized exchanges (CEX)",
  summary: [
    "The price is an order book: a market order pays the spread and slippage; a limit order waits and pays less.",
    "The fee for a “buy — sell” round trip seems tiny, but with frequent trading it eats capital faster than any forecasting error.",
    "Futures and leverage give a position without the coin; 10x leverage liquidates on a move of about 10% against you — even if the price comes back later.",
  ],
  lessons: {
    "m03-1": {
      title: "Order book and orders",
      blocks: [
        { text: "On a [[CEX (централизованная биржа)|centralized exchange]] nobody sets the price. There is an [[Стакан|order book]] — a list of everyone who wants to buy and sell, with prices and volumes. Sellers are at the top, buyers at the bottom. The best buyer's price is the [[Бид и аск|bid]], the best seller's price is the ask, and the difference between them is the [[Спред|spread]].\n\nThere are two main kinds of orders. A [[Лимитная заявка|limit order]] says “I'll buy at no more than 99.99” and, if there is no seller at that price, sits in the book and waits. A [[Рыночная заявка|market order]] says “I'll buy now” and takes the sellers' best orders one after another until the required volume is filled." },
        { steps: ["A teaching order book: red are sell orders, green are buy orders. The bar width is the volume at the level.","A market buy of 0.5 coins fits into the best level: the price is the best ask, no slippage.","Buying 3 coins eats several levels: each next part costs more.","A large buy goes deep into the book. The average price is noticeably worse than the best one — that is slippage."] },
        null,
        { q: "You place a limit buy order below the current price. What happens?", options: ["It fills at once at the market price","It sits in the book and fills only if the price drops to it","The exchange rejects it"], explain: "A limit order guarantees the price but not the fill. A market order is the opposite: it guarantees the fill but not the price." },
        null,
      ],
    },
    "m03-2": {
      title: "Maker, taker and fees",
      blocks: [
        { text: "Someone whose order sat in the book and waited is a [[Мейкер|maker]]: they added liquidity to the exchange. Someone who took an order from the book is a [[Тейкер|taker]]. The taker pays the higher [[Комиссия|fee]].\n\nAt Bybit's base tier in November 2026: on spot, 0.1% for both maker and taker; on perpetual futures, 0.02% for the maker and 0.055% for the taker. The numbers seem tiny, but the fee is paid on each side: a “buy — sell” round trip as a taker on spot costs 0.2%, and the spread and slippage are added on top." },
        { caption: "An idea with no edge that simply trades often: each round trip loses only the fee. 500 taker round trips on spot turn $100 into about $37." },
        { text: "Hence a rule that honest testing confirms again and again: **the more often an idea trades, the bigger the edge it needs just to pay for the fees.** An idea that buys and sells every day with market orders on spot loses about half its capital a year on fees alone.\n\nIn the program, the fee and slippage are subtracted from every trade in a test. If you see results without costs somewhere, consider them inflated." },
        { text: "The project measured passive market making — standing in the book on both sides and earning the spread. Per filled order: half the spread +0.33 bp, the loss from the fact that it is precisely the unfavorable orders that get filled −0.60 bp, the fee −2.00 bp. The total is −2.27 bp per trade: even with a zero fee the result is negative.", source: "The project's idea catalog: “Passive market making”" },
        { q: "An idea makes 300 round trips a year with market orders on spot (0.1% per side). Roughly how much does it lose on fees alone?", options: ["0.3%","About 45% of capital","Nothing, if the trades are profitable"], explain: "300 round trips × 0.2% is a multiplier of 0.998³⁰⁰ ≈ 0.55, that is, minus 45%. The fee is paid on every trade — winning and losing." },
        { label: "Test an idea with your fees" },
        { sources: ["Bybit: spot fees","Bybit: futures fees"] },
      ],
    },
    "m03-3": {
      title: "Slippage and liquidity",
      blocks: [
        { text: "[[Проскальзывание|Slippage]] is how much worse the fill price is than the best price in the book. It depends on how large your order is compared with the [[Глубина стакана|order book depth]]. For BTC and ETH on large exchanges the book is deep: a purchase of tens of thousands of dollars barely moves the price. For obscure coins even a few thousand dollars can move the price by several percent.\n\n[[Ликвидность|Liquidity]] changes over time: at night, at weekends and in moments of panic the book is thinner and the spread wider. That is exactly when slippage hurts most — and exactly when you most want to sell in a hurry." },
        null,
        { text: "Load the order book for BTC and, say, DOGE, and compare what the same purchase costs. The program only reads the exchange's public data — no login, keys or orders.\n\nAnother trap is [[Стоп-заявка|stop orders]]. A stop “sell if the price falls to 95” turns into a market order in a sharp drop and fills at whatever price is in the book at that moment — sometimes noticeably below 95." },
        { q: "When is slippage usually the largest?", options: ["On a calm weekday for BTC","During a sharp move in an illiquid coin","Slippage is always the same"], explain: "A thin book and everyone hurrying at once is the worst combination. So a test of an idea that trades “in a panic” should assume larger slippage." },
        { sources: ["Bybit API: order book (public data)"] },
      ],
    },
    "m03-4": {
      title: "Spot, futures and funding",
      blocks: [
        { text: "On [[Спот|spot]] you buy the coin itself. A [[Фьючерс|futures contract]] is a contract on its price: you have no coin, only an obligation to settle the price difference.\n\n[[Срочный фьючерс|Dated futures]] have an [[Экспирация|expiry]] date. Until then their price may differ from the coin's price — this difference is called the [[Базис|basis]], and by the expiry date it disappears.\n\n[[Бессрочный фьючерс (перп)|Perpetual futures]] have no date. To keep their price from drifting away from the coin's price, there is [[Фандинг|funding]]: regular payments between holders of long and short positions." },
        null,
        null,
        { text: "When the crowd wants to buy with leverage, the futures contract gets more expensive than the coin, the [[Ставка фандинга|funding rate]] turns positive, and [[Лонг|longs]] pay shorts. That costs money: 0.01% per 8 hours is about 11% a year, and in hot periods the rate can be several times higher.\n\nA well-known idea, **carry**, is built on this: buy the coin on spot and at the same time sell the same amount of futures. The coin's price almost stops mattering, and the funding, while positive, comes to you." },
        { text: "Carry “spot + short perpetual” is one of the few ideas that survived the project's tests: on 19 coins over 2021–2026, about 22% a year on average with a 1.4% drawdown. But the excess over the benchmark by year was +18.5, +5.0, +0.1 and 0.0 percentage points, and in 2026 there was not a single trade — funding in a cold market is almost zero. The return depended on a hot market, which may not come.", source: "The project's idea catalog: S1-5 “Funding carry”" },
        { label: "Test carry on one coin" },
        { q: "The funding rate is +0.03% per 8 hours, and you hold a $10,000 long position. What happens?", options: ["You receive $3 every 8 hours","You pay $3 every 8 hours — about 33% a year","Nothing, funding only concerns shorts"], explain: "With a positive rate the longs pay: $10,000 × 0.03% = $3 per payment, three payments a day — more than $3,000 a year." },
        { sources: ["Bybit: perpetual contract funding"] },
      ],
    },
    "m03-5": {
      title: "Leverage, margin and liquidation",
      blocks: [
        { text: "[[Плечо|Leverage]] lets you open a position bigger than your money. With 10x leverage, $100 of [[Маржа (залог)|margin]] opens a $1,000 position. A 1% price move is 10% of your margin, in either direction.\n\nWhen the loss nearly eats the margin, the exchange closes the position by force — this is [[Ликвидация|liquidation]]. The margin is lost. The exchange keeps a small buffer — the [[Поддерживающая маржа|maintenance margin]] — so liquidation comes a little before the loss equals the margin." },
        null,
        { text: "The main trap of leverage is the price's path, not its end point. If the price first fell 12% and then rose 20%, a position without leverage is in profit. A position with 10x leverage did not live to see the rise: it was liquidated on the fall, and the price's return can no longer help it." },
        { steps: ["2x leverage: the drawdown is unpleasant, but the position survives to the rise and ends about twice as well as the price.","5x leverage: on the fall the margin loses two thirds, and the end result is well in profit — if your nerves held and the position was not closed.","10x leverage: the price fell 13%, but the position was liquidated already at −9.5%. The price rose later, but the margin is gone.","20x leverage: liquidation even earlier, on the first noticeable pullback."] },
        { text: "Two more concepts. With [[Изолированная маржа|isolated margin]], liquidation takes only that position's margin. With [[Кросс-маржа|cross margin]], the whole account is collateral: liquidation is pushed further away, but a bad position can take everything. Liquidation is calculated from the [[Маркировочная цена|mark price]] — an average across several exchanges — so that one random spike does not liquidate everyone." },
        { text: "Leverage does not create an edge; it multiplies it — along with the absence of an edge. In the project's tests, 1.6x leverage on a basket of coins gave 31.1% a year against 32.4% without leverage: drawdowns and rebalancing ate more than the leverage added. And the story of “+15% in 4 days” on one account turned out, on analysis, to be simply the market's move multiplied by 3.5x leverage.", source: "The project's idea catalog: “Leverage on a basket…”; analysis “Take-profit and stop do not create an edge”" },
        { q: "A position with 10x leverage: the price fell 11%, then rose 30%. What is the result?", options: ["About +190%","The margin is lost: the position was liquidated on the fall","About +19%"], explain: "With 10x leverage, liquidation comes on a move of a little under 10% against the position. The later rise no longer affects it." },
        { sources: ["Bybit: liquidation rules"] },
      ],
    },
  },
};

// Перевод модуля m05 (en). Формат — public/course/tr.js.
export default {
  id: "m05",
  src: "e5450a09",
  title: "DeFi protocols",
  summary: [
    "DeFi loans rest on collateral larger than the debt; when the collateral falls, the contract itself sells it to a liquidator at a bonus.",
    "Every interest rate has a payer: borrowers, traders, the issuance of new coins — or you yourself, if the source is not visible.",
    "Money in DeFi sits on several layers at once (network, bridge, contract, oracle, keys), and their risks add up.",
  ],
  lessons: {
    "m05-1": {
      title: "Collateralized loans",
      blocks: [
        { text: "A bank grants a loan after checking your history. [[DeFi|DeFi]] does not know who you are, so trust is replaced by collateral. A [[Кредитование под залог|collateralized loan]] works like this: you deposit coins into a [[Протокол|protocol]] (for example, Aave) worth more than you want to borrow, and borrow other coins, usually stablecoins.\n\nThree numbers decide everything. [[LTV|LTV]] — how much you can borrow: at 75%, up to $1,500 against $2,000 of collateral. The [[Порог ликвидации|liquidation threshold]] — higher than LTV, for example 80%. The [[Здоровье займа|health factor]] — collateral × threshold / debt: while it is above 1, all is well." },
        null,
        null,
        { text: "When the health factor drops below 1, anyone — a liquidator — can repay part of your debt and take your collateral at a [[Премия ликвидатора|bonus]], usually 5–10%. Bots do this within seconds, without calls or warnings.\n\nWhy borrow like this at all? To avoid selling the coin: to get dollars while keeping the position. Or to buy more of the same coin with the borrowed dollars — that is already leverage, with all its traps from module 3. A price crash at such moments starts a chain: liquidations sell collateral, the price falls further, and the next loans get liquidated." },
        { q: "Collateral is 1 ETH, the debt is $1,000, the liquidation threshold is 80%. At what ETH price does liquidation start?", options: ["$1,000","$1,250","$800"], explain: "Health factor = price × 1 × 0.8 / 1000. It equals 1 at a price of 1000 / 0.8 = $1,250." },
        { sources: ["Aave: documentation"] },
      ],
    },
    "m05-2": {
      title: "Where the interest comes from",
      blocks: [
        { text: "DeFi protocols show yields in big numbers: 5%, 20%, 200% a year. There is one useful question to ask about any such number: **who pays it?**" },
        null,
        { text: "**Borrowers.** In a deposit to a lending protocol, the interest is paid by borrowers. The rate depends on [[Загрузка пула|pool utilization]]: the more money is borrowed, the more expensive the loan. The depositor gets less than the borrower pays: interest comes only from the borrowed part, and the protocol takes a share." },
        null,
        { text: "**Swaps.** Pool providers get traders' fees — and pay with impermanent loss (module 4).\n\n**Coin issuance.** The staking reward is partly paid in new network coins ([[Эмиссия|emission]]). If issuance is 3% a year and you receive 3%, you are simply keeping up with [[Размывание|dilution]].\n\n**Token rewards.** [[Фарминг|Yield farming]] at 200% a year is usually paid in the protocol's own token, which is printed and sold by its recipients. Its price often falls faster than the “income” accrues.\n\n**Selling risk.** A “deposit with a higher rate” sometimes turns out to be a [[Структурный продукт|structured product]]: you get a small premium, and in return you commit to selling the coin at a fixed price if it rises a lot.\n\n**Nobody.** If the source is not visible at all, the income is paid from the next depositors' money." },
        { text: "The project tested an exchange's Dual Asset Sell High product: sell BTC above the market a day later and receive a premium. In essence it is a sold option: a premium of about 0.19% each time against unlimited missed profit in a rise. None of the 170 combinations (BTC, SOL, BNB, gold; different prices and terms) cleared its bar: all these assets rose over the period, and the product sold off their rise.", source: "The project's idea catalog: “Dual Asset Sell High”" },
        { q: "A protocol pays 150% a year in its new token. What is important to check?", options: ["Nothing: the rate is high, so it pays off","How many tokens are printed and who buys them: if recipients sell, the token's price falls, and the income in dollars may be negative","Whether the protocol has a nice website"], explain: "Income in a new token is a share of the emission. If there is no demand for the token, emission simply lowers its price." },
        { sources: ["Aave: interest rate model"] },
      ],
    },
    "m05-3": {
      title: "Staking and liquid staking",
      blocks: [
        { text: "In proof-of-stake networks, [[Валидатор|validators]] put up a deposit and receive a reward. [[Стейкинг|Staking]] is taking part in such a deposit: on your own (Ethereum requires 32 ETH and your own server) or through a staking pool, where any amount can be deposited.\n\nThe risks of staking: [[Слэшинг|slashing]] for a validator's mistakes, the withdrawal queue (the money cannot be taken out instantly) and the reliability of whoever you trusted with the deposit." },
        null,
        { text: "[[Ликвидный стейкинг|Liquid staking]] solves the problem of locked money: the protocol stakes your ETH and issues a [[Токен-расписка|receipt token]] (for example, stETH), which can be sold or pledged in another protocol.\n\nBut the receipt is worth what the market is willing to pay right now. In June 2022, when the market was falling and many urgently needed money, stETH traded a few percent below ETH for several weeks. Those who borrowed against stETH to buy more stETH were liquidated precisely because of this gap." },
        { q: "You hold a receipt token for staked ETH. It trades 4% below ETH. Why is that possible?", options: ["An exchange error","The receipt cannot be instantly exchanged for ETH 1:1, and sellers in a hurry accept a discount","The staked ETH has vanished"], explain: "Exchanging through a staking withdrawal takes time. The receipt's market price is the price of immediacy; in a panic the discount grows." },
        { sources: ["ethereum.org: staking"] },
      ],
    },
    "m05-4": {
      title: "Bridges and oracles",
      blocks: [
        { text: "Networks cannot see each other. To move a coin from one network to another, a [[Мост|bridge]] is used: it takes the coin into a vault on the first network and issues a [[Обёрнутый токен|wrapped token]] on the second. The wrapped token is a receipt; it is valuable as long as the vault is intact." },
        { steps: ["You have 10 ETH on network A.","The bridge takes them into its vault.","On network B you receive 10 wrapped ETH.","The vault is hacked: the wrapped tokens remain, but they are no longer backed."] },
        { text: "Bridge vaults hold huge sums, so bridges are the most frequent targets of the largest hacks. In February 2022 about $320 million was stolen from the Wormhole bridge, and in March 2022 more than $600 million from the Ronin network's bridge; there the attackers obtained the keys of most of the signers.\n\n[[Оракул|Oracles]] solve the opposite problem: they pass outside data to contracts, above all prices. A lending protocol learns the collateral's price from an oracle. If the price is easy to move, it will be moved." },
        null,
        { text: "That is how more than $100 million was drained from Mango Markets in October 2022: the price of an illiquid token was pumped up, the protocol believed the inflated collateral price, and almost everything was borrowed against that collateral. The protection is several price sources, a time-averaged price and limits on illiquid collateral.\n\nAttacks often use [[Флеш-кредит|flash loans]]: a huge loan without collateral, taken and repaid within one transaction. This makes it possible to move a pool's price for a second without your own money." },
        { q: "Why can a wrapped token get cheaper even though the coin itself has not?", options: ["It always costs the same","It is worth as much as the backing in the bridge's vault; if the vault is hacked, the receipt loses its backing","Because of gas"], explain: "A wrapped token is the bridge's promise. Its reliability is the bridge's reliability, not the coin's." },
        { sources: ["ethereum.org: bridges","ethereum.org: oracles","DefiLlama: list of hacks"] },
      ],
    },
    "m05-5": {
      title: "Hacks and assessing a protocol's risk",
      blocks: [
        { text: "[[Взлом протокола|Hacks]] in DeFi happen all the time, and stolen funds are almost never returned. The main causes repeat: a bug in a contract's code, price manipulation through an oracle, stolen [[Ключ администратора|admin keys]], a bridge vulnerability, an economic attack through a flash loan.\n\nAn [[Аудит|audit]] reduces the risk of a bug but does not rule it out: many hacked protocols had passed audits, sometimes more than one. An [[Обновляемый контракт|upgradable contract]] can be fixed — but whoever can fix it can also swap it." },
        null,
        { text: "Money in a DeFi deposit often sits on several layers at once: a stablecoin issued by an issuer, moved by a bridge to layer two, deposited in a protocol that takes prices from an oracle and is managed by a multisig. Each layer is its own [[Контрагентский риск|counterparty risk]], and they add up.\n\nQuestions worth asking before depositing:\n\n**How many years has the protocol run** with a large sum and no hacks?\n\n**Who can change the code** and parameters, and how many keys does that take?\n\n**Where do the prices come from** — how many sources does the oracle have?\n\n**Through how many layers** does the money pass: a bridge, layer two, receipt tokens?\n\n**Who pays the interest** (lesson 2 of this module)?\n\nA protocol's [[TVL|TVL]] speaks of size, not reliability: large sums are exactly what attracts attackers." },
        { q: "A deposit promises 8% a year. The money passes through a bridge, layer two and a lending protocol. How should you think about the return honestly?", options: ["8% is a guaranteed income","8% is payment for several layers of risk; if the chance of losses across all layers together is a few percent a year, the real expectation is noticeably below 8%","The risks of the layers do not add up"], explain: "The expected return is the promised rate minus the expected losses. With a few percent risk of total loss per year, little is left of the 8%." },
        { sources: ["DefiLlama: list of hacks","ethereum.org: smart contract security"] },
      ],
    },
  },
};

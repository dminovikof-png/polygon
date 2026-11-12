// Перевод модуля m01 (en). Формат — public/course/tr.js.
export default {
  id: "m01",
  src: "7a526d73",
  title: "Blockchain and coins",
  summary: [
    "A blockchain is a shared record of transfers kept by thousands of computers; blocks are linked by hashes, so the past cannot be rewritten unnoticed.",
    "Who adds the next block is decided by consensus: work (Bitcoin) or stake (Ethereum). An attack needs a majority of the power or of the stake.",
    "Network coins, tokens, stablecoins and layer two are different things with different risks: each has its own “whom do you trust”.",
  ],
  lessons: {
    "m01-1": {
      title: "Block, hash and chain",
      blocks: [
        { text: "A bank keeps the record of “who has how much money” to itself. A [[Блокчейн|blockchain]] does the same, but the record is kept by thousands of computers around the world, and none of them is in charge. So that such a record does not turn into chaos, transfers are gathered into batches — [[Блок|blocks]] — and lined up in a chain.\n\nThe link between blocks rests on a [[Хеш|hash]]. A hash is a fingerprint of data: any text turns into a string of the same length, and changing even one letter changes it completely. The data cannot be recovered from the hash." },
        null,
        { text: "Try changing one digit of the amount in the field above — the hash becomes completely different. For a block to be accepted, its hash must start with several zeros. The only way to achieve that is brute force: change the [[Nonce|nonce]] number and recompute the hash until you get lucky. That is [[Майнинг|mining]].\n\nEvery block stores the hash of the previous one. So forging an old record means recomputing not one block but every block after it, and doing it faster than the rest of the network adds new ones." },
        { steps: ["The chain is in order: every block's hash checks out and starts with two zeros, and every block refers to the previous block's hash.","Someone changed the amount in the second block to 200. The block's hash changed and no longer starts with zeros — the forgery is visible at once.","The attacker found a new nonce for the second block. But the third block refers to the old hash — now the link is broken.","For the forgery to pass, every following block must be re-mined, outpacing the network that keeps adding new ones all the while. In Bitcoin that takes more than half of the whole network's power."] },
        { q: "Why can't you quietly change the amount of a transfer in an old block?", options: ["Blocks are encrypted with a password","That block's hash changes, and the following blocks refer to the old hash — the whole chain would have to be recomputed faster than the rest of the network","The exchange's rules forbid it"], explain: "The protection is not secrecy (blockchain data is open to everyone) but the hash links and the cost of brute force: rewriting the past costs more than taking part honestly." },
        { sources: ["Satoshi Nakamoto's Bitcoin paper (2008)"] },
      ],
    },
    "m01-2": {
      title: "Consensus: work or stake",
      blocks: [
        { text: "Thousands of [[Узел (нода)|nodes]] must agree on which block comes next. The rule for that agreement is called [[Консенсус|consensus]]. There are two main ways.\n\n**[[PoW (доказательство работы)|Proof of work]].** The right to a block goes to whoever first finds the nonce. The chance is proportional to computing power, and power costs money: hardware and electricity. Cheating does not pay — you spend the same resources, and the network rejects an invalid block.\n\n**[[PoS (доказательство доли)|Proof of stake]].** Blocks are proposed by [[Валидатор|validators]] who have put up a deposit in the network's coins. Whoever signs two different blocks for the same slot or breaks the rules loses part of the deposit ([[Слэшинг|slashing]]). Almost no electricity is needed; instead, security rests on the value of the deposit." },
        null,
        { text: "Both ways share one weak spot — the [[Атака 51 %|majority attack]]. Whoever controls more than half of the power (or a large part of the stake) can rewrite recent blocks and carry out a [[Двойная трата|double spend]]. In large networks this costs billions of dollars; in small networks with cheap power such attacks have actually happened.\n\nHence the practical conclusion: an exchange counts a transfer as arrived not at once, but after several confirmations — blocks on top of it. The smaller the network, the more confirmations the exchange requires." },
        { q: "What makes cheating unprofitable in a proof-of-stake network?", options: ["The network administrator's password","The validator's deposit: for breaking the rules the network takes away part of their coins","Electricity costs"], explain: "In PoS the “stake” is the deposit. Electricity is the protection of proof of work, and an open network has no administrator." },
        { sources: ["ethereum.org: proof of stake"] },
      ],
    },
    "m01-3": {
      title: "Bitcoin: issuance rules",
      blocks: [
        { text: "Bitcoin is the first and largest network. New coins appear only as a [[Награда за блок|block reward]]. At first the reward was 50 BTC, and every 210,000 blocks (roughly every four years) it is cut in half — this is the [[Халвинг|halving]]. The last halving was in April 2024: the reward became 3.125 BTC. The next is expected around April 2028, at block 1,050,000.\n\nThese rules imply a limit: in total, just under 21 million BTC will ever be issued. More than 95% has already been issued." },
        { caption: "The curve is computed from the issuance rules, not taken from a website: 210,000 blocks per reward level, and the reward is halved each time." },
        { text: "Limited issuance is often presented as the reason why bitcoin “must” rise. It is not so: the supply is known to everyone in advance and is already in the price. The price is driven by demand, and demand changes. Over its history bitcoin has fallen more than 70% from its peak several times.\n\nThe block reward is miners' main income. As it shrinks, their income depends more and more on transfer fees. How long this will last and how it will end, nobody knows for sure." },
        { text: "The project tested the hypothesis that large issuance events (halvings, token unlocks) produce predictable price moves. The result for unlocks: “undetermined” — only 21 suitable events against the 150 needed, and the holdout period was not opened. Drawing conclusions from 3–4 halvings is even riskier: that is not a sample, just a few cases.", source: "Hypothesis U1 (token unlocks), the project's research log" },
        { q: "Bitcoin's block reward in November 2026:", options: ["50 BTC","6.25 BTC","3.125 BTC","It depends on the price"], explain: "Since the April 2024 halving, 3.125 BTC. The reward depends on the block number, not the price; it will drop to 1.5625 BTC at block 1,050,000." },
        { sources: ["bitcoin.org"] },
      ],
    },
    "m01-4": {
      title: "Ethereum and smart contracts",
      blocks: [
        { text: "Bitcoin mostly stores transfers. Ethereum also stores programs — [[Смарт-контракт|smart contracts]]. A contract is like a vending machine: the rules are written in code, and they are carried out not by a company but by the whole network. Put in a coin, get the item; the rules are the same for everyone and visible to everyone.\n\nContracts run on the [[EVM|EVM]], the network's shared “computer”. Exchanges without a company, loans, stablecoins and tokens are built on it. Every action is a [[Транзакция|transaction]] signed with your key." },
        null,
        { text: "A contract's strength is that it cannot be secretly changed or stopped. Its weakness is the same: a bug in the code cannot be fixed quickly either, and the network will execute it with the same precision. Most losses in DeFi are not “hacking the blockchain” but a bug in a particular contract or a stolen administrator key (more on this in module 5).\n\nSince September 2022 Ethereum has run on proof of stake: the switch was called The Merge. The network's electricity use fell by more than 99%." },
        { q: "An exchange contract executed a trade because of a bug in its code — not the way its authors intended. What will the network do?", options: ["Cancel the trade","Execute it: the network checks that the code ran correctly, not that the code is correct","Return the money through support"], explain: "Nodes only check that a program ran according to its own code. Whether the code itself is good is a question for its authors and auditors. The network has no support desk that will return money." },
        { sources: ["ethereum.org: smart contracts","ethereum.org: The Merge"] },
      ],
    },
    "m01-5": {
      title: "Tokens and stablecoins",
      blocks: [
        { text: "Every network has [[Нативная монета|its own coin]]: it pays for the network's work. Everything else is [[Токен|tokens]]: records in a smart contract of “which address has how much”. So that wallets and exchanges understand any token, there are common standards, such as [[ERC-20|ERC-20]]. An [[NFT|NFT]] is also a token, except that each copy is unique.\n\nAnyone can issue a token in a few minutes for a few dollars. So the mere fact that a token exists and trades says nothing about its value." },
        { text: "A special kind is [[Стейблкоин|stablecoins]]: tokens that try to be worth exactly $1. Most trading runs on them, and they come in three kinds — with different risks." },
        null,
        { text: "**Backed by money** (USDT, USDC) rest on the [[Эмитент|issuer]]: a company holds dollars and bonds and promises a 1:1 exchange. The risk lies in the company, its bank, and the fact that it can freeze tokens at any address at the authorities' request.\n\n**Backed by crypto** (DAI) rest on over-collateral in a smart contract. The risk is a sharp crash of the collateral or a bug in the code.\n\n**Algorithmic** ones rest on a promise of exchange for “their own” token. In May 2022, Terra's UST lost its peg: selling UST printed new LUNA tokens, LUNA got cheaper, and that triggered more selling. Within a few days UST fell almost to zero, and tens of billions of dollars vanished with it. Such a break from the price is called a [[Депег|depeg]]." },
        { q: "What is the main thing to find out about a stablecoin before holding money in it?", options: ["What its logo looks like","What backs it and who is obliged to exchange it for $1","What it costs today — if $1, it is reliable"], explain: "Today's $1 price guarantees nothing: UST was worth $1 right up to the crash. What matters is what stands behind the token and who is responsible for the exchange." },
        { sources: ["ethereum.org: stablecoins","ethereum.org: the ERC-20 standard"] },
      ],
    },
    "m01-6": {
      title: "Gas, layer one and layer two",
      blocks: [
        { text: "The network's work is not free. In Ethereum it is measured in units of [[Газ|gas]]: a simple transfer is 21,000 gas, a swap on an exchange several times more. The fee is gas multiplied by the [[Цена газа|gas price]]. The price consists of a base part, which is [[Сжигание|burned]], and a tip to the validator." },
        null,
        { text: "When everyone wants to get into a block, the gas price rises — there have been days when a simple swap cost tens of dollars. Hence the idea of layer two. [[L1 (первый уровень)|Layer one]] is the network itself with its own consensus. [[L2 (второй уровень)|Layer two]] gathers many transfers into one batch and writes the whole batch to layer one at once. The fee is shared by everyone." },
        { steps: ["Eight transfers on the main network — eight records and eight gas payments.","The same transfers are sent to layer two.","Layer two combines them into one batch and writes it to the main network.","Each pays roughly one eighth of the gas plus the layer-two fee. In real life a batch holds thousands of transfers."] },
        { text: "Such second layers are called [[Роллап|rollups]]. [[Оптимистичный роллап|Optimistic]] ones treat a batch as valid until someone proves otherwise — so withdrawing money to the main network can take about a week. [[ZK-роллап|ZK rollups]] attach a mathematical proof to the batch.\n\nThe price of cheapness is new risks: layer two has an operator that assembles the batches, and a [[Мост|bridge]] for moving money between layers. More on this in module 5." },
        { q: "You transfer $10 and $10,000,000 the same way on the same network. The gas fee is:", options: ["A million times larger in the second case","About the same — you pay for computation, not for the amount","Free in the second case"], explain: "Gas is payment for the network's work. Transferring any amount is the same work. That is why small transfers on a busy main network are uneconomical, while large ones cost almost nothing in percentage terms." },
        { sources: ["ethereum.org: gas and fees","ethereum.org: layer 2"] },
      ],
    },
  },
};

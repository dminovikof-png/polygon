// Перевод модуля m02 (en). Формат — public/course/tr.js.
export default {
  id: "m02",
  src: "33bb3de1",
  title: "Wallets and security",
  summary: [
    "The coins sit on the blockchain; the wallet keeps the key. Whoever knows the key or the seed phrase is the owner, and there is nobody to reverse a transfer.",
    "On an exchange you trust the exchange; in your own wallet, yourself. Both options have their own ways of losing money.",
    "Money is most often lost not because a network is hacked but because of a signature the person gave themselves: phishing, approvals, “support”, promised income.",
  ],
  lessons: {
    "m02-1": {
      title: "Who holds the keys: the exchange or you",
      blocks: [
        { text: "A [[Кошелёк|wallet]] does not store coins — they are always recorded on the blockchain. A wallet stores the [[Закрытый ключ|private key]]: a secret number that gives the right to sign a transfer. Hence two ways of holding.\n\n**[[Хранение у биржи|Exchange custody]].** The exchange has the keys; you have a record in its database saying “1 BTC belongs to you”. Convenient: there is a password, recovery, support. But if the exchange goes bankrupt, gets hacked or freezes the account, the record may turn out to be backed by nothing.\n\n**[[Самостоятельное хранение|Self-custody]].** Only you have the key. Nobody will freeze or spend your coins. But nobody will help you restore access either, and a mistaken transfer cannot be reversed." },
        null,
        { text: "An example of exchange risk is FTX: in November 2022 one of the largest exchanges in the world halted withdrawals and went bankrupt; it turned out that clients' money had been used by the company. Clients waited years for repayment through the courts.\n\nAn example of self-custody risk is the thousands of people who lost their seed phrase or sent coins to the wrong address. There is no way to get that money back.\n\nThe honest conclusion: the choice is not “safe or unsafe” but **whom you trust**. For trading, money has to be kept on an exchange. Money not needed for trading, many people keep in their own wallet." },
        { q: "You keep coins in an exchange account. What do you actually own?", options: ["Coins on the blockchain at your own address","The exchange's obligation to give you the coins on request","The key to the exchange's address"], explain: "On an exchange you have a record in its database. As long as the exchange is solvent and allows withdrawals, the difference is invisible; in a bankruptcy you become one of the creditors." },
        { sources: ["ethereum.org: wallets"] },
      ],
    },
    "m02-2": {
      title: "Seed phrase and keys",
      blocks: [
        { text: "When you create a wallet, it shows a [[Seed-фраза|seed phrase]] — 12 or 24 words. From this phrase the wallet computes all its keys; from the [[Закрытый ключ|private keys]], the [[Открытый ключ|public ones]]; and from those, the [[Адрес|addresses]]. The arrows go only one way: knowing an address you cannot find the key; knowing a key you cannot find the phrase." },
        null,
        { text: "Hence three rules.\n\n**1. The phrase is everything.** Whoever knows it can restore the wallet on any device and take everything from every address. The phrase of the same wallet cannot be changed — you can only create a new wallet and move the coins there.\n\n**2. The phrase is never entered anywhere except to restore your own wallet.** No website, “support”, “wallet check” or token giveaway needs your phrase. A request to enter the phrase is a sign of fraud in 100% of cases.\n\n**3. The phrase is kept offline.** On paper or a metal plate, in a safe place, preferably two. Do not photograph it, and do not keep it in the cloud or in your phone's notes.\n\nGuessing a phrase by brute force is impossible: 12 words have about 2¹²⁸ combinations; even at the speed of the whole Bitcoin network, the search would take about 10 billion years. So phrases are not cracked — they are coaxed out of people." },
        { q: "A wallet's website says: “A sync error was detected, enter your seed phrase to verify.” What should you do?", options: ["Enter it, since it is the wallet's website","Close the site: no check needs the phrase, it is a scam","Enter only the first 6 words"], explain: "Honest services never need the phrase. Part of the phrase is dangerous too: the remaining words can sometimes be guessed." },
        { sources: ["ethereum.org: security"] },
      ],
    },
    "m02-3": {
      title: "Hardware wallets and good habits",
      blocks: [
        { text: "A [[Горячий кошелёк|hot wallet]] — an app or a browser extension — keeps the key on an internet-connected device. If the device is infected, the key can be stolen. A [[Аппаратный кошелёк|hardware wallet]] is a separate device the key never leaves: the computer sends it a transaction, and the device shows it on its own screen and signs inside itself.\n\nThe key thing with a hardware wallet is to **look at its screen**, not the computer's. If malware has swapped the recipient's address, it is visible only there." },
        { caption: "Address poisoning: the scammer counts on you copying a look-alike address from your transfer history." },
        { text: "The habits that save the most money:\n\n**A test transfer.** Before a large transfer to a new address, send a small amount and make sure it arrived.\n\n**The address from a reliable source.** Not from your transfer history and not from a chat message; check the whole of it, not just the start and the end.\n\n**Separation.** A small amount for everyday actions in a hot wallet, the bulk in [[Холодное хранение|cold storage]].\n\n**[[Мультиподпись|Multisig]]** for large amounts: a transfer requires signatures from several keys, for example two of three.\n\n**No hurry.** Almost every scam pushes urgency." },
        { q: "The hardware wallet shows a recipient address that differs from the one you see on the computer screen. Which do you trust?", options: ["The computer screen — it is bigger","The hardware wallet's screen: address swapping happens in the computer, not in the device","Send it and see where it arrives"], explain: "The point of a hardware wallet is that its screen is not controlled by an infected computer. If the addresses do not match, cancel the transfer." },
        { sources: ["ethereum.org: security"] },
      ],
    },
    "m02-4": {
      title: "Approvals for smart contracts",
      blocks: [
        { text: "To swap a token on a decentralized exchange, you first have to give its contract an [[Разрешение (approve)|approval]] to spend that token. Wallets often suggest an unlimited approval by default: that way you do not pay for a new approval on every swap.\n\nThe problem is that the approval stays after the swap. If the contract is later hacked, or if the site was fake from the start, your tokens can be taken without a new signature." },
        { steps: ["You want to swap 100 USDT.","The wallet asks you to sign an approval. Watch the amount: it is often “unlimited”.","The swap went through, but the approval has not gone anywhere.","A hacked or fake contract takes everything approved. Approvals you no longer need should be revoked."] },
        { text: "Fraudulent [[Дрейнер|drainer]] sites are built on exactly this: under the guise of “claim a reward” or “verify your wallet” you are asked to sign an approval or a special signed message (no gas fee, so it seems harmless). After the signature, the tokens are gone.\n\nWhat to do:\n\n**Read what you are signing.** If the wallet shows “allow spending” or “sign message” where you are not buying anything, stop.\n\n**Set a limit** — exactly the amount of the swap.\n\n**[[Отзыв разрешения|Revoke]] old approvals.** The network's [[Обозреватель блоков|block explorer]] or the wallet itself shows a list of your approvals; revoking is an ordinary transaction with a gas fee." },
        { q: "A token giveaway site asks you to “sign a message, it's free”. Why can this be dangerous?", options: ["It is not dangerous: with no gas fee, nothing will happen","The signed message may be an approval to spend your tokens — it will be used later","It is dangerous only for bitcoin"], explain: "Some standards allow an approval to be given by a signature without a transaction. No fee does not mean no consequences." },
        { sources: ["ethereum.org: security and approvals"] },
      ],
    },
    "m02-5": {
      title: "Scam schemes",
      blocks: [
        { text: "In crypto, almost all losses by private individuals are not network hacks but [[Социальная инженерия|social engineering]]: the person hands over the phrase, a signature or a transfer themselves. The schemes repeat, and it pays to know them by sight." },
        null,
        { text: "**Support that writes first.** Real exchange and wallet support does not write to you in private messages and never asks for the phrase, a password or a code from an email.\n\n**[[Фишинг|Phishing]].** A look-alike site from an ad, an email or a search. Open sites from saved bookmarks.\n\n**A new acquaintance with a “platform”.** You meet on social media or an app, become friends for weeks, then get advice to invest through “their” platform. The numbers on it grow, but withdrawing money fails: you are asked for a “tax” or a “withdrawal fee”. The platform was fake from the start.\n\n**Guaranteed income.** “2% a day with no risk” is a [[Финансовая пирамида|Ponzi scheme]]: the income is paid with newcomers' money for as long as they keep coming.\n\n**[[Памп и дамп|Pump and dump]].** A group: “we all buy together at 8 pm”. The organizers bought in advance and sell to you at the peak.\n\n**[[Раг-пул|Rug pull]].** A new token with a nice website; the creators withdraw the money from the pool and disappear." },
        { text: "The project tested dozens of trading ideas, including “growing” a small deposit fast: 100x leverage, doubling the bet after a loss, averaging down. None gave a steady income, and the bet-doubling schemes have a negative expectation by their very design. If someone promises a steady percentage a day, an honest test finds no such results; so the money does not come from the market.", source: "The project's idea catalog: “Fast growth: 100x leverage, martingale, DCA and grid bots”" },
        { q: "What do almost all scam schemes have in common?", options: ["A sophisticated hack of the blockchain","Urgency and a request to hand over the phrase, a signature or money yourself","They only happen with obscure coins"], explain: "Hacking a network is expensive; talking a person into something is cheap. So the main protection is not to hurry and not to hand over anything that gives access to money." },
        { q: "A platform shows your profit at +300%, but to withdraw it asks you to pay a “20% tax” by transfer. What is this most likely?", options: ["A normal exchange rule","A scam: the numbers on a fake platform are worth nothing, and the “tax” is one more way to take money","You need to pay so as not to lose the profit"], explain: "Real exchanges do not require a transfer to withdraw; taxes are paid to the state through a tax return, not to a platform. Money sent “for the tax” will be lost too." },
        { sources: ["FSCA (South Africa's regulator): fraud warnings","FBI: Internet Crime Complaint Center"] },
      ],
    },
  },
};

// Перевод модуля m13 (en). Формат — public/course/tr.js.
export default {
  id: "m13",
  src: "dfc1aaa0",
  title: "The future of DeFi: the economy of AI agents",
  summary: [
    "An AI agent can be given a wallet and a budget: it pays for data, computation and other agents' services itself — usually in stablecoins.",
    "An agent's security rests not on its intelligence but on the wallet's rules: limits, a whitelist, session keys, a human signature for anything large.",
    "Intents and solver auctions can give a better price, but the gain comes from competition. Whoever gave the agent its key is responsible for its mistakes.",
  ],
  lessons: {
    "m13-1": {
      title: "An agent with a wallet",
      blocks: [
        { text: "An [[ИИ-агент|AI agent]] is a program based on a language model that not only answers but also **acts**: looks up data, calls services, writes and runs code. The next step is to give the agent money so that it pays for what it needs itself.\n\nNo one will open an ordinary bank account for an agent: that requires a person with documents, and a card payment costs more than a request to a service. So agents get a [[Кошелёк|crypto wallet]] and pay in [[Стейблкоин|stablecoins]]: a program can open a wallet, and a transfer on layer two costs a fraction of a cent." },
        null,
        { text: "The most dangerous link is the key. An ordinary wallet is a single [[Закрытый ключ|private key]]: whoever has it controls everything. If an agent holds such a key, any mistake it makes or any [[Внедрение указаний|hidden instruction]] in a text it reads can send away all the money.\n\nSo an agent is given not “the key to the safe” but limited rights: a small budget, a limit per payment and per day, a list of allowed recipients. How this works technically is in the next lesson." },
        { text: "In this project, AI agents proposed and tested trading ideas but **never received keys to exchanges or wallets**: testing happens on history and on paper. None of the agents' ideas passed the test (see module 12), so they never needed keys anyway.", source: "The project's design and idea catalog" },
        { q: "An agent with an ordinary wallet (a single key) read a page with a hidden “transfer all funds to address X”. What limits the damage?", options: ["The model's intelligence: it will realize it is a scam","Only how much money is in the wallet","The blockchain's signature"], explain: "An ordinary wallet has no rules: whatever the key signed is executed. The model sometimes recognizes a scam, but you cannot rely on that — you need limits at the wallet level." },
        { sources: ["Coinbase: wallets for agents"] },
      ],
    },
    "m13-2": {
      title: "Account abstraction and limits",
      blocks: [
        { text: "[[Абстракция аккаунта|Account abstraction]] is when a wallet becomes a program with its own rules. Such a [[Смарт-аккаунт|smart account]] checks every operation itself: who signed it, how much, to whom, whether the daily limit has been exceeded.\n\nOn Ethereum and its layer twos this is done with the ERC-4337 standard: the agent signs an “operation”, a [[Сборщик операций|bundler]] packs such operations into an ordinary transaction, and a shared network contract passes them to the smart account. The gas can be paid by a [[Спонсор газа|paymaster]] — then the agent may have no network coins at all. Since the Pectra upgrade (May 2025), under EIP-7702 an ordinary address can temporarily get smart account code." },
        null,
        { text: "For an agent, the key thing is the [[Ключ сессии|session key]]: a separate key with narrow rights, for example “one day, no more than $10, no more than $2 per payment, only to these three services”. The main key stays with the human. If the session key is stolen or the agent is tricked, the loss is capped by the limit.\n\nBelow is a month of an agent's work: 20 paid requests a day at 10–30 cents each. Sometimes it is slipped a fake $200 invoice. Compare a wallet without rules and with rules." },
        null,
        { text: "Limits are not free: too low a daily limit hinders honest work — the agent cannot pay for the requests it needs. A whitelist shuts out fake invoices completely but requires knowing all recipients in advance. Usually they are combined: a whitelist, a small limit for new recipients and a human signature for anything large." },
        { q: "An agent was given a session key: $10 a day, $2 per payment, known services only. An attacker stole this key. How much can they withdraw in a day?", options: ["Everything in the wallet","No more than $10, and only to known services — that is, almost nothing","Exactly $2"], explain: "The rules are checked by the smart account itself, not by the agent. A stolen session key gives exactly the rights that were written down: a narrow budget and a list of recipients." },
        { sources: ["ERC-4337: account abstraction","EIP-7702: code for ordinary addresses"] },
      ],
    },
    "m13-3": {
      title: "Payments between agents",
      blocks: [
        { text: "When an agent buys from an agent — a coin's price, a text translation, an hour of computation — the payment must be instant, cheap and without registration. The internet has long had the [[HTTP 402|HTTP 402]] “payment required” response code, but until recently it was hardly used.\n\nThe [[x402|x402]] protocol was created by Coinbase in 2025; since July 2026 it has been developed by the x402 foundation under the Linux Foundation. The protocol uses this code like so: the service replies “402 and a price”, the agent repeats the request with a signed stablecoin payment, and the service checks the payment and returns the data." },
        { steps: ["The agent requests data, like an ordinary browser.","The service does not ask for registration: it replies with code 402 and states the price, currency, network and address.","The agent checks the price against its limits and repeats the request with a signed payment.","The service (or an intermediary) checks the signature and carries out the transfer on the network.","The data and a receipt reach the agent. It all took seconds and cost a fraction of a cent."] },
        null,
        { text: "There are other protocols alongside it. Google's AP2 describes a **mandate**: a document signed by a human saying “the agent may buy this, for this amount”. ERC-8004 is a draft standard for an on-chain registry of agents and their reputation. These are different layers of one task: who the agent is, what it is allowed to do, how it pays.\n\nKeep in mind the numbers in this field: figures for “agent payments” are often quoted by the developer companies themselves. A noticeable share of such payments are checks and tests, not purchases." },
        { q: "Why do agents pay for requests in stablecoins rather than by card?", options: ["Stablecoins yield more","A card's fixed fee is larger than a purchase of a fraction of a cent, and a card has to be issued to a person","Cards are forbidden for programs"], explain: "A 1-cent card payment costs tens of cents. A stablecoin transfer on layer two costs a fraction of a cent, and a program can open a wallet. The price is irreversibility: a mistaken transfer cannot be undone." },
        { sources: ["x402: protocol description","AP2: the agent payments protocol","ERC-8004: agent registry (draft)"] },
      ],
    },
    "m13-4": {
      title: "Intents and solvers",
      blocks: [
        { text: "Usually a user (or an agent) builds a trade themselves: picks the pool, the route, the slippage. An [[Намерение (intent)|intent]] works differently: only **what** is needed is signed — “sell 1 ETH at no less than X by such-and-such time”. **How** to do it is decided by [[Решатель (solver)|solvers]]: they compete for the right to fill the order and pay the gas themselves.\n\nThis is how UniswapX, CoW Protocol and cross-chain swaps under the ERC-7683 standard work. For an agent it is convenient: it does not need to understand routes; it is enough to describe the result and the lower price bound." },
        { steps: ["One solver: there is no one to compete with, so it waits until the end and takes the trade at your lower bound.","Five solvers: the strongest takes the trade as soon as the offer reaches the level of the second strongest — otherwise that one will take it.","Twenty solvers: there is almost always a very cheap one among them, and you get a price near the top."] },
        { text: "This is a [[Голландский аукцион|Dutch auction]]: the offer to the user starts at a good price and gradually worsens down to their lower bound. The strongest solver has no reason to hurry while the trade is profitable only for it — it takes it when the second strongest is about to step in. So the price is set by competition: the more solvers and the lower their costs, the closer the price is to the market. And without rivals, the trade goes at your lower bound." },
        null,
        { text: "Limitations. In practice there are few solvers, and large trades often go to the same ones. The lower bound is your protection: if you set it too low, the trade may go at a bad price that you yourself allowed. And an intent with a long deadline gives the solver a “free option”: it can wait until the market moves in its favor." },
        { q: "An agent signed the intent “sell 1 ETH at no less than 95% of the market price”, and there is only one solver. What is most likely?", options: ["The agent will get the best price on the market","The trade will go closer to 95% than under strong competition","The trade will never go through"], explain: "Without competition, the solver has no reason to give more than needed to beat the end of the auction. The lower bound is what you allowed, not what you will get." },
        { sources: ["ERC-7683: cross-chain intents","CoW Protocol: documentation"] },
      ],
    },
    "m13-5": {
      title: "Risks and responsibility",
      blocks: [
        { text: "An agent that pays by itself joins two fragile worlds: a language model that can make mistakes or be tricked, and a blockchain where a transfer cannot be reversed.\n\n**The main risks:**\n- **Prompt injection.** The agent reads other people's texts — pages, emails, other agents' replies. Commands may be hidden in them.\n- **Model errors.** A mixed-up address, an extra zero in the amount, a misunderstood task.\n- **Fake services.** The agent pays and gets garbage in return. Agent reputation is only just emerging.\n- **Key leaks.** A key in logs, in code, in someone else's service's memory.\n- **Collusion and spam.** Thousands of agents can cheaply create the appearance of demand or inflate reviews." },
        null,
        { text: "**Who is responsible.** An agent has no rights or property — it cannot be a party to a contract or a defendant. Almost everywhere its owner is responsible for its actions, sometimes the service's developer. The laws on this are still being written. Exchanges and custodial wallets usually forbid handing access to programs without permission.\n\n**Practical rules:**\n- A separate wallet for the agent, holding a budget you would not mind losing.\n- No rights to withdraw funds from an exchange.\n- Limits and a whitelist at the wallet level, not in the model's prompt.\n- A human signature for anything large or unusual.\n- A log of every payment: what, to whom, at whose request." },
        { q: "Where is the most reliable place to write the rule “never pay more than $5 at a time”?", options: ["In the model's prompt: “never pay more than $5”","In the rules of the smart account or session key","In the contract with the service"], explain: "The model may break a prompt by mistake or because of an injected instruction. A wallet rule is checked by code on every payment, and it cannot be talked around." },
        { sources: ["OWASP: risks of language model applications"] },
      ],
    },
  },
};

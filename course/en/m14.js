// Перевод модуля m14 (en). Формат — public/course/tr.js.
export default {
  id: "m14",
  src: "8379b23f",
  title: "Taxes and rules: an overview by country",
  summary: [
    "Tax is paid in the country of tax residence, not in the exchange's country; almost everywhere gains are taxed, swapping one coin for another is taxed too.",
    "You need a record of every trade: date, amount, price, fee; how the purchase price is calculated (FIFO, average) is set by the country's law.",
    "From 2026, under CARF, exchanges pass client data to tax authorities: the EU, the UK, South Africa and Japan already, the UAE and Singapore from 2027.",
  ],
  lessons: {
    "m14-1": {
      title: "How crypto is taxed: the basics",
      blocks: [
        { text: "This is an overview, not tax advice. The rules change every year, and there are more exceptions than fit into a lesson. Before filing a return, check with your country's tax authority or a tax adviser.\n\nIn most countries a coin is property, not money. So tax arises not when you buy but on [[Отчуждение (налоговое событие)|disposal]] — when the coin leaves you: sold, swapped, spent." },
        null,
        { text: "The second question is how the tax authority sees your profit. If you hold coins and sell now and then, it is usually a [[Прирост капитала|capital gain]] with its own, often lower, rate. If trading looks like a job — frequent trades, a bot, aiming to earn a living — the profit may be treated as ordinary income at the full rate." },
        null,
        { text: "The third question is which purchase price to deduct if you bought several times at different prices. The law decides: [[FIFO|FIFO]], the [[Средняя цена покупки|average price]] or another method. The method determines how much profit falls into this year. Switch the method below." },
        null,
        { text: "**What to keep for every trade:** the date and time, the coin, the amount, the price in local currency, the fee, the exchange or address. Exchanges close and delete history, so it is better to export it every year. The paper trading log in the polygon is a good habit, but the tax authority needs an export from a real exchange." },
        null,
        { q: "You swapped 1 ETH, bought for 1,000, for USDC when ETH was worth 3,000. No money reached your account. Is there a taxable event in a country that taxes gains?", options: ["No: there was no money","Usually yes: the ETH was disposed of at market price, a profit of 2,000","Only if you later cash the USDC out"], explain: "In most such countries, swapping one coin for another is a sale of the first coin. There are exceptions: in France, for example, a coin-to-coin swap without cashing out is not taxed." },
        { sources: ["OECD: tax transparency standards, including CARF"] },
      ],
    },
    "m14-2": {
      title: "Comparing countries and data exchange",
      blocks: [
        { text: "Below are ten countries and regions on five questions. Each row is cut down to a few words; details are in the lessons that follow. The color shows whether a rule is softer for a private person (green), ordinary (yellow) or strict (red)." },
        { steps: ["Tax on profit. The spread is huge: from zero in the UAE, Singapore, Hong Kong and Switzerland (for a private investor) to 55% in Japan.","Coin-to-coin swaps. Where gains are taxed, swaps are almost always taxed too.","Exchange licenses. Almost everywhere there is already a dedicated regime; the US still has no single market law.","Leverage for private persons. The UK and Singapore forbid it, Hong Kong and Russia keep it for experienced and wealthy investors, Japan caps it at 2x.","Tax data exchange. From 2026, exchanges in many countries report on their clients, and tax authorities exchange this data."] },
        { text: "[[CARF|CARF]] is the OECD rules under which exchanges and other intermediaries collect client data (country of residence, tax number, trades for the year) and pass it to their own country's tax authority. That authority forwards it to the client's country of residence. In the European Union the same is done under the [[DAC8|DAC8]] directive.\n\nThe practical meaning: “an exchange abroad” no longer means “the tax authority won't find out”. Tax authorities will see 2026 trades on exchanges in the EU, the UK, South Africa and Japan in 2027, and 2027 trades in the UAE and Singapore in 2028." },
        null,
        { q: "A South African resident trades on an exchange registered in the UAE. Where do they pay tax on the profit?", options: ["In the UAE, where there is no tax","In South Africa — by country of residence; from 2028 the UAE exchange will report them through CARF","Nowhere, as long as the money is not withdrawn"], explain: "Tax depends on residence, not on the exchange's country. CARF only makes trades visible; the obligation to declare existed before." },
        { sources: ["European Commission: the DAC directives, including DAC8","UAE Ministry of Finance: preparing for CARF","IRAS: CARF in Singapore"] },
      ],
    },
    "m14-3": {
      title: "South Africa",
      blocks: [
        { text: "This is an overview, not tax advice. The rules change every year, and there are more exceptions than fit into a lesson. Before filing a return, check with your country's tax authority or a tax adviser.\n\n**Tax.** The South African Revenue Service (SARS) does not introduce a separate tax for crypto: the ordinary rules apply. Profit is taxed either as **income** (on the income tax scale, up to 45%) or as a **capital gain** — this is decided on the facts: intention, frequency of trades, holding period.\n\nFor an individual's capital gain, 40% of the gain is included in taxable income, so the highest rate is 18% (45% × 40%). The first gain of the year is not taxed: from the tax year starting 1 March 2026 it is 50,000 rand (previously 40,000). An active trader or a bot with hundreds of trades risks SARS treating the profit as income." },
        null,
        { text: "**A coin-to-coin swap** is treated by SARS as an exchange (barter): the coin given away is considered sold at market value. Income from mining and staking is usually taxed as income. The tax year runs from 1 March to the end of February; a South African resident pays tax on worldwide income, including trades on foreign exchanges.\n\n**Records.** You need the history of every trade in rand; documents are usually kept for five years. Trading losses are accounted for under the general rules, and a capital loss is carried forward to future years." },
        { text: "**Exchanges.** Since October 2022, crypto assets have been a financial product under the FAIS Act, and intermediaries must obtain an FSCA license (CASP). By 31 March 2026 the FSCA had approved 310 applications out of 533. Crypto asset derivatives are treated as securities: they are offered by companies licensed under FAIS or under the Financial Markets Act. Check the exchange in the FSCA register.\n\n**Data exchange.** CARF has applied in South Africa since 1 March 2026: exchanges collect data for the period up to 28 February 2027 and file a report by 31 May 2027. An individual does not report under CARF themselves, but SARS will match the exchanges' data against your return.\n\n**Exchange control.** In the 2026 budget the government announced that crypto asset transactions will be brought under the capital flow rules. Details are still being published — watch for announcements from the Treasury and SARB." },
        { q: "A South African resident who holds BTC and sells now and then made a gain of 150,000 rand for the tax year. What part goes into taxable income if this is a capital gain?", options: ["150,000","40,000 — 40% of the amount above 50,000","Nothing: crypto is not taxed"], explain: "First the 50,000 annual exclusion is deducted, then 40% of the remainder goes into the base: 0.4 × 100,000 = 40,000. It is taxed on the scale together with the rest of the income." },
        { sources: ["SARS: crypto asset tax","SARS: CARF","FSCA: the financial markets regulator"] },
      ],
    },
    "m14-4": {
      title: "United States",
      blocks: [
        { text: "This is an overview, not tax advice. The rules change every year, and there are more exceptions than fit into a lesson. Before filing a return, check with your country's tax authority or a tax adviser.\n\n**Tax.** The US Internal Revenue Service (IRS) treats digital assets as property. Profit on holdings of up to a year is taxed as ordinary income (federal rates up to 37%); on holdings longer than a year, at 0, 15 or 20%. At high income, 3.8% on investment income is added. States add their own tax. Coin-to-coin swaps are taxed. Staking income is taxed when received.\n\nThe wash sale rule does not yet apply to ordinary crypto: you may sell at a loss and buy straight back, although bills to change this have been proposed more than once." },
        null,
        { text: "**Reporting.** From 2025, brokers send Form 1099-DA with sale proceeds; for coins bought from 1 January 2026 that never left the exchange, the purchase price as well. An empty purchase price field does not mean it is zero: the taxpayer states it. From 2025 the purchase price is tracked separately for each wallet or account.\n\n**Regulation.** The GENIUS Act on stablecoins has been in force since July 2025. The CLARITY Act on market structure passed the House of Representatives in July 2025, but on 15 September 2026 it fell short of votes in the Senate (49 to 50). So there is no single law on exchanges: state licenses and FinCEN registration apply. Futures, including perpetual-like ones, are available to private persons on exchanges supervised by the CFTC; foreign perpetual futures exchanges do not accept US clients.\n\n**CARF.** The US has not joined it yet: Treasury rules are under consideration. Instead, there is its own Form 1099-DA." },
        { q: "An American bought ETH in 2024, moved it to an exchange and sold it in 2026. The exchange sent a 1099-DA with an empty purchase price field. What does that mean?", options: ["The purchase price is zero, tax on the whole amount","The exchange need not know the price for coins bought before 2026; the taxpayer states it","The sale is not taxed"], explain: "The broker must report the purchase price only for coins bought from it from 2026 onward. For the rest, it has to be backed up by your own records." },
        { sources: ["IRS: digital assets"] },
      ],
    },
    "m14-5": {
      title: "European Union",
      blocks: [
        { text: "This is an overview, not tax advice. The rules change every year, and there are more exceptions than fit into a lesson. Before filing a return, check with your country's tax authority or a tax adviser.\n\n**Regulation is shared.** [[MiCA|MiCA]] is a single set of rules for exchanges and stablecoin issuers in all EU countries. A company licensed in one country can operate in all of them. The transition period ended on 1 July 2026: it is now forbidden to serve EU clients without a MiCA license. Regulators advise clients of such exchanges to move their coins to a licensed intermediary or to their own wallet.\n\nLeverage: for retail clients, CFDs on cryptocurrencies are capped at 2:1 leverage." },
        null,
        { text: "**Taxes — each country has its own.** A few examples:\n- **Germany:** coins sold more than a year after purchase are not taxed for a private person; when sold earlier, the profit is taxed on the scale if it exceeds 1,000 euros for the year. Abolishing the exemption from 2027 is under discussion, but as of November 2026 no law has been passed.\n- **France:** a flat rate of about 30% when cashing out; coin-to-coin swaps are not taxed.\n- **Portugal:** 28% on holdings of less than 365 days, tax-free after that.\n\nSo the “tax” column for the EU is a spread, not a single figure.\n\n**Data exchange.** Under the [[DAC8|DAC8]] directive, exchanges collect data from 1 January 2026 and pass it on in 2027. The data flows both between EU countries and to CARF partner countries." },
        { q: "A German resident bought BTC in March 2025 and sold it at a profit in May 2026. What applies under the rules in force as of November 2026?", options: ["The profit is taxed on the scale","Not taxed: more than a year has passed","Taxed at the MiCA rate"], explain: "In Germany, private sales a year after purchase are not taxed. MiCA regulates exchanges, not taxes: taxes in the EU are national." },
        { sources: ["ESMA: the MiCA regulation","European Commission: DAC8"] },
      ],
    },
    "m14-6": {
      title: "United Kingdom",
      blocks: [
        { text: "This is an overview, not tax advice. The rules change every year, and there are more exceptions than fit into a lesson. Before filing a return, check with your country's tax authority or a tax adviser.\n\n**Tax.** For a private person, profit is a capital gain: 18% within the basic income tax rate band and 24% above it. The first 3,000 pounds of gains in a tax year (6 April to 5 April) are not taxed. Coin-to-coin swaps and paying with coins are taxed.\n\n**Accounting is special.** Identical coins are pooled with an average purchase price. But if you bought on the same day or within 30 days after a sale, those purchases are matched first. This way you cannot “sell at a loss and buy straight back” for a tax loss." },
        null,
        { text: "**Exchanges.** For now, crypto firms register with the FCA under anti-money-laundering rules, and since 2023 crypto advertising has required warnings, an appropriateness test and a 24-hour cooling-off period for new clients. A full licensing regime will take effect on 25 October 2027: the rules were published in June 2026, and applications are accepted from 30 September 2026.\n\n**Leverage.** Since January 2021, selling crypto asset derivatives to private persons has been forbidden. Crypto exchange-traded notes (cETNs) have been available to retail investors again since October 2025; derivatives are not.\n\n**Data exchange.** CARF has applied since 1 January 2026, including for UK residents on UK exchanges. The exchanges' first reports are due by 31 May 2027." },
        { q: "A UK resident sold BTC at a loss on 1 June and bought it back on 10 June. What happens to the loss?", options: ["It counts in full","The purchase within 30 days is matched with the sale, and the loss largely disappears","Crypto losses never count"], explain: "The 30-day rule matches a sale with a purchase in the following 30 days rather than with the pool. This closes off the “sell and buy straight back” trick." },
        { sources: ["GOV.UK: Capital Gains Tax rates and allowances","GOV.UK: tax on cryptoassets","FCA: cryptoassets"] },
      ],
    },
    "m14-7": {
      title: "Russia",
      blocks: [
        { text: "This is an overview, not tax advice. The rules change every year, and there are more exceptions than fit into a lesson. Before filing a return, check with your country's tax authority or a tax adviser.\n\n**Tax.** Since 2025 (Federal Law No. 418-FZ), digital currency has been recognized as property. Mining is allowed; income from mining and sales is subject to personal income tax: 13% on the part up to 2.4 million rubles a year and 15% above it. The Ministry of Finance is preparing a separate article of the Tax Code on cryptocurrency: costs by FIFO, coin-to-coin swaps as a taxable event, no carrying losses forward to future years. As of November 2026 this is still a draft." },
        null,
        { text: "**Trading.** The law on digital currencies was signed on 4 August 2026, and its main provisions have applied since 1 September. Cryptocurrency can be bought and sold through intermediaries on the Bank of Russia's register. A non-qualified investor passes a test and buys no more than 300,000 rubles a year through one intermediary. The Bank of Russia approved the list of coins available to them in November 2026: BTC, ETH and USDT. A [[Квалифицированный инвестор|qualified investor]] can, after a test, buy any coins except anonymous ones, with no limit on the amount. From 1 July 2027, residents must carry out such transactions only through these intermediaries.\n\nPaying with cryptocurrency inside the country is still forbidden. Cryptocurrency futures on Russian exchanges are available to qualified investors. Russia does not take part in CARF, but because of sanctions, foreign exchanges often close accounts of Russian residents." },
        { q: "A non-qualified investor wants to buy 500,000 rubles' worth of BTC in a year through one intermediary. What applies under the new rules?", options: ["Allowed without limits","Through one intermediary, only up to 300,000 rubles a year and after a test","Not allowed at all"], explain: "The 300,000 ruble annual limit is counted per intermediary and only on purchases. The limit does not apply to qualified investors." },
        { sources: ["Bank of Russia: cryptocurrency regulation","Federal Tax Service: taxation of digital currency transactions"] },
      ],
    },
    "m14-8": {
      title: "UAE, Singapore and Hong Kong",
      blocks: [
        { text: "This is an overview, not tax advice. The rules change every year, and there are more exceptions than fit into a lesson. Before filing a return, check with your country's tax authority or a tax adviser.\n\nThree financial centers with a similar idea: a private investor's capital gains are not taxed, and exchanges are strictly licensed. But “no tax” applies only to the tax residents of these countries." },
        null,
        null,
        null,
        { text: "**UAE.** There is no income tax for private persons. Companies pay 9% corporate tax on profit above 375,000 dirhams. Transfers and exchanges of crypto assets have been exempt from VAT since November 2024, retroactively from 2018. Exchanges are licensed by VARA in Dubai, by the federal regulator SCA, and in the free zones by FSRA (ADGM) and DFSA (DIFC). CARF: data collection from 1 January 2027, the first exchange in September 2028. UAE exchanges report on clients who are tax residents of **other** countries.\n\n**Singapore.** Capital gains are not taxed; if trading is a business (frequent trades, aiming for profit), the profit is subject to income tax. Exchanges are licensed by MAS. Retail clients may not be given credit or leverage on cryptocurrency, may not be offered bonuses, and must pass a risk awareness check before trading. Since 30 June 2025, Singapore companies serving only foreign clients must also obtain a license, and many such companies have left. CARF: from 1 January 2027, exchange in September 2028.\n\n**Hong Kong.** Capital gains are not taxed; trading as a business is subject to profits tax. Private persons may trade only on platforms licensed by the SFC. In 2026, perpetual futures and margin lending are allowed only for professional investors. The stablecoin law has been in force since August 2025. CARF: data collection is planned from 2027, the first exchange in 2028." },
        { q: "A South African resident opened an account on an exchange in Dubai and trades there. What tax applies?", options: ["None: the UAE has no tax","South African tax, as on any trade; from 2028 the exchange will report them through CARF","UAE tax of 9%"], explain: "The UAE's zero tax applies to its tax residents. A South African resident pays tax in South Africa, wherever the exchange is." },
        { sources: ["UAE Ministry of Finance: preparing for CARF","VARA (Dubai)","IRAS: CARF in Singapore","MAS: payment services","SFC: licensed virtual asset trading platforms","Hong Kong IRD: CARF"] },
      ],
    },
    "m14-9": {
      title: "Japan and Switzerland",
      blocks: [
        { text: "This is an overview, not tax advice. The rules change every year, and there are more exceptions than fit into a lesson. Before filing a return, check with your country's tax authority or a tax adviser.\n\n**Japan.** For now, cryptocurrency profit is “miscellaneous income” and is added to salary on a progressive scale: together with local tax, up to 55%. Losses cannot be deducted from other income or carried forward to the next year. Coin-to-coin swaps are taxed.\n\nIn 2026 a law was passed bringing crypto assets under the securities law. For coins sold through exchanges registered in Japan, the tax will become separate: 20%, as for shares. It will start on 1 January of the year following the law's entry into force, and the government has not yet set that date — most likely it will be 2028. Leverage for private persons is capped at 2x. CARF has applied since 1 January 2026." },
        null,
        { text: "**Switzerland.** For a private person managing their own savings, capital gains on cryptocurrency are not taxed, and losses are not deductible. Coins form part of one's assets and are subject to the cantonal **wealth tax** on their value as of 31 December; the tax administration publishes rates for this. Income from staking and mining is taxed as income.\n\nIf trading looks professional — short holding periods, large volumes, leverage, profit making up most of one's income — gains are taxed as business income. Exchanges and banks are licensed by FINMA. The CARF law has been passed, but data exchange will begin no earlier than 2027: parliament is still discussing the list of partner countries." },
        null,
        { q: "A Japanese resident sold BTC at a profit of 10 million yen in 2026. At what rate?", options: ["20%, the law has already been passed","For now as miscellaneous income on a progressive scale, up to ~55%: the 20% will take effect later","0%"], explain: "The 20% rate applies from 1 January of the year after the law takes effect, and that date has not been set yet. 2026 sales are taxed under the old rules." },
        { sources: ["Japan NTA: tax on crypto asset gains","Japan FSA","Swiss ESTV: taxation of cryptocurrencies","Swiss SIF: questions on CARF"] },
      ],
    },
  },
};

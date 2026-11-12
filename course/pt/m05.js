// Перевод модуля m05 (pt). Формат — public/course/tr.js.
export default {
  id: "m05",
  src: "e5450a09",
  title: "Protocolos DeFi",
  summary: [
    "Os empréstimos no DeFi se apoiam em uma garantia maior que a dívida; quando a garantia cai, o próprio contrato a vende a um liquidante com bônus.",
    "Toda taxa de juros tem um pagador: tomadores, traders, a emissão de moedas novas — ou você mesmo, se a fonte não for visível.",
    "O dinheiro no DeFi fica em várias camadas ao mesmo tempo (rede, ponte, contrato, oráculo, chaves), e os riscos delas se somam.",
  ],
  lessons: {
    "m05-1": {
      title: "Empréstimos com garantia",
      blocks: [
        { text: "Um banco concede um empréstimo depois de checar o seu histórico. O [[DeFi|DeFi]] não sabe quem você é, por isso a confiança é substituída pela garantia. Um [[Кредитование под залог|empréstimo com garantia]] funciona assim: você deposita moedas em um [[Протокол|protocolo]] (por exemplo, Aave) que valem mais do que você quer tomar, e toma outras moedas, geralmente stablecoins.\n\nTrês números decidem tudo. O [[LTV|LTV]] — quanto você pode tomar: com 75%, até 1 500 dólares com 2 000 dólares de garantia. O [[Порог ликвидации|limite de liquidação]] — maior que o LTV, por exemplo 80%. O [[Здоровье займа|fator de saúde]] — garantia × limite / dívida: enquanto estiver acima de 1, está tudo bem." },
        null,
        null,
        { text: "Quando o fator de saúde cai abaixo de 1, qualquer um — um liquidante — pode pagar parte da sua dívida e ficar com a sua garantia com um [[Премия ликвидатора|bônus]], geralmente de 5–10%. Os bots fazem isso em segundos, sem ligações nem avisos.\n\nPor que tomar emprestado assim? Para não vender a moeda: obter dólares mantendo a posição. Ou para comprar mais da mesma moeda com os dólares emprestados — e isso já é alavancagem, com todas as armadilhas do módulo 3. Uma queda brusca do preço nesses momentos inicia uma cadeia: as liquidações vendem garantias, o preço cai mais, e os empréstimos seguintes são liquidados." },
        { q: "A garantia é 1 ETH, a dívida é de 1 000 dólares, o limite de liquidação é 80%. A partir de que preço do ETH começa a liquidação?", options: ["1 000 dólares","1 250 dólares","800 dólares"], explain: "Fator de saúde = preço × 1 × 0,8 / 1000. Ele é igual a 1 ao preço de 1000 / 0,8 = 1 250 dólares." },
        { sources: ["Aave: documentação"] },
      ],
    },
    "m05-2": {
      title: "De onde vêm os juros",
      blocks: [
        { text: "Os protocolos DeFi mostram rendimentos em números grandes: 5%, 20%, 200% ao ano. Há uma pergunta útil a fazer sobre qualquer número desses: **quem paga?**" },
        null,
        { text: "**Os tomadores.** Num depósito em um protocolo de empréstimos, os juros são pagos pelos tomadores. A taxa depende da [[Загрузка пула|utilização do pool]]: quanto mais dinheiro emprestado, mais caro o empréstimo. O depositante recebe menos do que o tomador paga: os juros vêm só da parte emprestada, e o protocolo fica com uma fatia." },
        null,
        { text: "**As trocas.** Os provedores dos pools recebem as taxas dos traders — e pagam com a perda impermanente (módulo 4).\n\n**A emissão de moedas.** A recompensa de staking é paga em parte com moedas novas da rede ([[Эмиссия|emissão]]). Se a emissão é de 3% ao ano e você recebe 3%, você está só acompanhando a [[Размывание|diluição]].\n\n**Recompensas em tokens.** O [[Фарминг|yield farming]] a 200% ao ano costuma ser pago no próprio token do protocolo, que é impresso e vendido por quem o recebe. O preço dele muitas vezes cai mais rápido do que a «renda» se acumula.\n\n**Venda de risco.** Um «depósito com taxa maior» às vezes se revela um [[Структурный продукт|produto estruturado]]: você recebe um prêmio pequeno e, em troca, se compromete a vender a moeda a um preço fixo se ela subir muito.\n\n**Ninguém.** Se a fonte não é visível de jeito nenhum, a renda é paga com o dinheiro dos próximos depositantes." },
        { text: "O projeto testou o produto Dual Asset Sell High de uma corretora: vender BTC acima do mercado um dia depois e receber um prêmio. Na essência é uma opção vendida: um prêmio de cerca de 0,19% a cada vez contra um lucro perdido ilimitado numa alta. Nenhuma das 170 combinações (BTC, SOL, BNB, ouro; preços e prazos diferentes) superou o seu limiar: todos esses ativos subiram no período, e o produto vendia a alta deles.", source: "Catálogo de ideias do projeto: «Dual Asset Sell High»" },
        { q: "Um protocolo paga 150% ao ano no seu novo token. O que é importante verificar?", options: ["Nada: a taxa é alta, então compensa","Quantos tokens são impressos e quem os compra: se quem recebe vende, o preço do token cai, e a renda em dólares pode ser negativa","Se o protocolo tem um site bonito"], explain: "A renda em um token novo é uma parte da emissão. Se não há demanda pelo token, a emissão simplesmente baixa o preço dele." },
        { sources: ["Aave: modelo de taxas de juros"] },
      ],
    },
    "m05-3": {
      title: "Staking e staking líquido",
      blocks: [
        { text: "Nas redes de prova de participação, os [[Валидатор|validadores]] depositam uma garantia e recebem uma recompensa. O [[Стейкинг|staking]] é participar desse depósito: por conta própria (o Ethereum exige 32 ETH e um servidor próprio) ou por meio de um pool de staking, onde se pode depositar qualquer valor.\n\nOs riscos do staking: o [[Слэшинг|slashing]] por erros do validador, a fila de saque (o dinheiro não pode ser retirado na hora) e a confiabilidade de quem recebeu o depósito." },
        null,
        { text: "O [[Ликвидный стейкинг|staking líquido]] resolve o problema do dinheiro bloqueado: o protocolo faz staking dos seus ETH e emite um [[Токен-расписка|token-recibo]] (por exemplo, stETH), que pode ser vendido ou dado em garantia em outro protocolo.\n\nMas o recibo vale o que o mercado está disposto a pagar agora. Em junho de 2022, quando o mercado caía e muita gente precisava de dinheiro com urgência, o stETH foi negociado alguns por cento abaixo do ETH por várias semanas. Quem tinha tomado emprestado com stETH de garantia para comprar mais stETH foi liquidado justamente por causa dessa diferença." },
        { q: "Você tem um token-recibo de ETH em staking. Ele é negociado 4% abaixo do ETH. Por que isso é possível?", options: ["Um erro da corretora","O recibo não pode ser trocado na hora por ETH 1:1, e quem vende com pressa aceita um desconto","Os ETH em staking sumiram"], explain: "A troca por meio de um saque de staking leva tempo. O preço de mercado do recibo é o preço da imediatez; no pânico, o desconto cresce." },
        { sources: ["ethereum.org: staking"] },
      ],
    },
    "m05-4": {
      title: "Pontes e oráculos",
      blocks: [
        { text: "As redes não se enxergam. Para mover uma moeda de uma rede para outra, usa-se uma [[Мост|ponte]]: ela leva a moeda para um cofre na primeira rede e emite um [[Обёрнутый токен|token embrulhado]] na segunda. O token embrulhado é um recibo; tem valor enquanto o cofre estiver intacto." },
        { steps: ["Você tem 10 ETH na rede A.","A ponte os leva para o seu cofre.","Na rede B você recebe 10 ETH embrulhados.","O cofre é invadido: os tokens embrulhados continuam, mas não têm mais lastro."] },
        { text: "Os cofres das pontes guardam somas enormes, por isso as pontes são os alvos mais frequentes dos maiores ataques. Em fevereiro de 2022 foram roubados cerca de 320 milhões de dólares da ponte Wormhole, e em março de 2022 mais de 600 milhões da ponte da rede Ronin; ali os atacantes obtiveram as chaves da maioria dos signatários.\n\nOs [[Оракул|oráculos]] resolvem o problema oposto: passam dados externos aos contratos, sobretudo preços. Um protocolo de empréstimos fica sabendo o preço da garantia por um oráculo. Se o preço é fácil de mover, ele será movido." },
        null,
        { text: "Foi assim que mais de 100 milhões de dólares foram drenados da Mango Markets em outubro de 2022: o preço de um token pouco líquido foi inflado, o protocolo acreditou no preço inflado da garantia, e quase tudo foi tomado emprestado contra essa garantia. A proteção são várias fontes de preço, um preço médio no tempo e limites para garantias pouco líquidas.\n\nOs ataques muitas vezes usam [[Флеш-кредит|empréstimos-relâmpago]]: um empréstimo enorme sem garantia, tomado e devolvido dentro de uma única transação. Isso permite mover o preço de um pool por um segundo sem dinheiro próprio." },
        { q: "Por que um token embrulhado pode baratear mesmo que a própria moeda não tenha barateado?", options: ["Ele sempre custa o mesmo","Ele vale tanto quanto o lastro no cofre da ponte; se o cofre for invadido, o recibo perde o lastro","Por causa do gas"], explain: "Um token embrulhado é uma promessa da ponte. A confiabilidade dele é a da ponte, não a da moeda." },
        { sources: ["ethereum.org: pontes","ethereum.org: oráculos","DefiLlama: lista de ataques"] },
      ],
    },
    "m05-5": {
      title: "Ataques e avaliação do risco de um protocolo",
      blocks: [
        { text: "[[Взлом протокола|Ataques]] no DeFi acontecem o tempo todo, e o dinheiro roubado quase nunca é devolvido. As causas principais se repetem: um bug no código de um contrato, manipulação de preço por meio de um oráculo, [[Ключ администратора|chaves de administrador]] roubadas, uma vulnerabilidade de ponte, um ataque econômico com empréstimo-relâmpago.\n\nUma [[Аудит|auditoria]] reduz o risco de um bug, mas não o elimina: muitos protocolos atacados tinham passado por auditorias, às vezes mais de uma. Um [[Обновляемый контракт|contrato atualizável]] pode ser corrigido — mas quem pode corrigi-lo também pode trocá-lo." },
        null,
        { text: "O dinheiro de um depósito no DeFi muitas vezes fica em várias camadas ao mesmo tempo: uma stablecoin emitida por um emissor, levada por uma ponte para a camada dois, depositada em um protocolo que pega preços de um oráculo e é gerido por uma multiassinatura. Cada camada é o seu próprio [[Контрагентский риск|risco de contraparte]], e eles se somam.\n\nPerguntas que vale fazer antes de depositar:\n\n**Há quantos anos o protocolo funciona** com uma soma grande e sem ataques?\n\n**Quem pode mudar o código** e os parâmetros, e quantas chaves isso exige?\n\n**De onde vêm os preços** — quantas fontes o oráculo tem?\n\n**Por quantas camadas** o dinheiro passa: uma ponte, a camada dois, tokens-recibo?\n\n**Quem paga os juros** (lição 2 deste módulo)?\n\nO [[TVL|TVL]] de um protocolo fala de tamanho, não de confiabilidade: somas grandes são justamente o que atrai os atacantes." },
        { q: "Um depósito promete 8% ao ano. O dinheiro passa por uma ponte, pela camada dois e por um protocolo de empréstimos. Como pensar no retorno com honestidade?", options: ["8% é uma renda garantida","8% é o pagamento por várias camadas de risco; se a chance de perdas em todas as camadas juntas é de alguns por cento ao ano, a expectativa real fica bem abaixo de 8%","Os riscos das camadas não se somam"], explain: "O retorno esperado é a taxa prometida menos as perdas esperadas. Com alguns por cento de risco de perda total por ano, sobra pouco dos 8%." },
        { sources: ["DefiLlama: lista de ataques","ethereum.org: segurança de contratos inteligentes"] },
      ],
    },
  },
};

// Перевод модуля m06 (pt). Формат — public/course/tr.js.
export default {
  id: "m06",
  src: "b149fbbe",
  title: "Tipos de ativos",
  summary: [
    "Uma opção é um direito com preço: a perda do comprador se limita ao prêmio; o lucro do vendedor se limita ao prêmio, e a perda pode ser grande.",
    "Numa moeda importa não só o preço, mas também a tokenomics: quantas moedas ainda virão, quem as detém e quando podem ser vendidas.",
    "As moedas grandes já caíram 80–96% desde o pico e levaram anos para voltar a ele; memecoins e ativos tokenizados acrescentam riscos próprios.",
  ],
  lessons: {
    "m06-1": {
      title: "Moedas, tokens, memecoins",
      blocks: [
        { text: "A palavra «cripto» junta coisas muito diferentes.\n\n**As moedas de rede** (BTC, ETH, SOL) pagam o trabalho da própria rede: as taxas e as recompensas dos validadores são pagas nelas. **Os tokens de protocolo** são emitidos sobre uma rede e dão direitos em um aplicativo: um voto, uma parte das taxas, um desconto. As [[Стейблкоин|stablecoins]] seguram o preço do dólar. As [[Мемкоин|memecoins]] não dão nada além da própria moeda: o preço delas se apoia só na atenção.\n\nPara qualquer uma delas vale conhecer a [[Токеномика|tokenomics]]: quantas moedas há no total, quantas já são negociadas e o que ainda vai chegar ao mercado." },
        null,
        { text: "Duas avaliações costumam ser confundidas. A [[Рыночная капитализация|capitalização de mercado]] é preço × moedas em circulação. O [[FDV|FDV]] é preço × todas as moedas que um dia serão emitidas. Se 15% está em circulação, os outros 85% pertencem à equipe, aos fundos e à tesouraria e saem segundo um cronograma de [[Вестинг|vesting]]. Cada [[Разблокировка|desbloqueio]] acrescenta vendedores: para o preço se manter, a demanda precisa crescer mais rápido que a oferta." },
        null,
        { text: "Até as maiores moedas passaram por quedas depois das quais a maioria desiste. E essas são as sobreviventes: milhares de moedas de ciclos passados desapareceram por completo, por isso o gráfico de «todo o cripto» parece melhor que o resultado de um comprador típico ([[Выжившая вселенная|viés de sobrevivência]])." },
        { q: "O preço de um token é 1 dólar, há 100 milhões em circulação, e no total serão emitidos 1 bilhão. Qual é o FDV?", options: ["100 milhões de dólares","1 bilhão de dólares","10 bilhões de dólares"], explain: "FDV = preço × todos os tokens futuros = 1 dólar × 1 bilhão. A capitalização é de 100 milhões de dólares: os outros 900 milhões de tokens ainda vão chegar ao mercado." },
        { sources: ["Binance: candles diários públicos"] },
      ],
    },
    "m06-2": {
      title: "Opções: um direito com preço",
      blocks: [
        { text: "Uma [[Опцион|opção]] é um contrato pelo qual o comprador recebe o direito, mas não a obrigação, de comprar ou vender uma moeda ao preço de [[Страйк|strike]] na data de vencimento. Pelo direito, ele paga ao vendedor um [[Премия|prêmio]] adiantado.\n\nUma [[Колл|call]] é o direito de comprar: lucra na alta. Uma [[Пут|put]] é o direito de vender: lucra na queda e parece um seguro. É importante lembrar que toda opção tem dois lados. O comprador arrisca o prêmio, enquanto o vendedor recebe o prêmio e assume uma obrigação." },
        { steps: ["Uma call comprada com strike de 100 por um prêmio de 6. Abaixo de 100 a opção não vale nada, e você perde o prêmio. Acima de 106 — lucro.","A mesma operação pelos olhos do vendedor: ele recebeu 6 e fica feliz enquanto o preço estiver abaixo de 106. Numa alta forte, a perda dele é ilimitada.","Uma put comprada: o direito de vender a 100. Se a moeda cair a 60, a put rende 40 menos o prêmio — como um seguro.","Uma put vendida: um prêmio de 5 adiantado, mas a obrigação de comprar a 100 mesmo depois de um colapso. Muitos «depósitos com taxa maior» funcionam assim."] },
        { text: "Quanto vale o direito? O principal é a [[Волатильность|volatilidade]]: quanto mais uma moeda oscila, mais provável que a opção termine lucrativa, e mais ela custa. O mercado embute as oscilações esperadas no preço — é a [[Подразумеваемая волатильность|volatilidade implícita]]. O modelo clássico de Black–Scholes a converte em prêmio. Experimente com ele abaixo." },
        null,
        { text: "O projeto testou comprar opções baratas como loteria: ganhos raros multiplicados contra perdas frequentes do prêmio. Essa loteria perdeu para simplesmente manter BTC.\n\nVender volatilidade parece melhor: a volatilidade implícita, em média, supera a que de fato veio depois em 5,6–8,7 pontos. Mas o projeto não conseguiu prever quando esse prêmio compensa (t 1,27 — abaixo do [[Планка значимости|limiar]]). E vender opções por meio de um «depósito» Dual Asset é uma call vendida: um prêmio de cerca de 0,19% contra um lucro perdido ilimitado numa alta.", source: "Catálogo de ideias do projeto: opt «Loteria de opções, venda de volatilidade», dual «Dual Asset Sell High»" },
        { q: "Você comprou uma put de BTC com strike de 60 000 dólares por 2 000 dólares. No vencimento o BTC está a 70 000 dólares. Qual é o resultado?", options: ["Um lucro de 10 000 dólares","Uma perda de 2 000 dólares — a put não é necessária; o direito de vender a 60 000, abaixo do mercado, é inútil","Uma perda de 10 000 dólares"], explain: "Uma put só paga se o preço estiver abaixo do strike. Caso contrário não é exercida, e a perda é igual ao prêmio — como um seguro não usado." },
        null,
      ],
    },
    "m06-3": {
      title: "Futuros e a base",
      blocks: [
        { text: "O módulo 3 tratou dos futuros perpétuos com [[Фандинг|funding]]. Há também os comuns, com prazo: um contrato para comprar ou vender uma moeda em uma data definida a um preço combinado hoje. O preço desse contrato futuro costuma diferir do preço da moeda. A diferença se chama [[Базис|base]].\n\nQuando o mercado sobe e muitos querem comprar com alavancagem, o contrato futuro custa mais que a moeda. Até a data de liquidação a base precisa desaparecer: nesse dia o contrato futuro e a moeda são a mesma coisa." },
        null,
        { text: "Daí uma operação: «comprar a moeda e vender o contrato futuro ao mesmo tempo». O preço da moeda quase não importa nela: o que se perde em uma perna se ganha na outra. Sobra a base menos as taxas. Parece um depósito — com riscos parecidos com a corretora que guarda as duas pernas, mais o risco de uma alta brusca, quando pedem que você acrescente garantia na perna short." },
        { text: "Base trimestral em BTC e ETH: 13 operações de 13 no lucro, 14,6% por operação em média, drawdown de 3,6%. Agora a ideia está «dormindo»: a base anual caiu para 1–3%, e depois das taxas não há nada a ganhar.\n\nA mesma ideia com funding no lugar da base ([[Carry|carry]] em 19 moedas): +121% em 2021–2026, drawdown de 1,4%. Mas o excesso sobre a referência derrete ano a ano: +18,5, +5,0, +0,1, 0,0 pontos percentuais, e em 2026 não houve uma única operação. O carry ganha quando o mercado está superaquecido e fica quieto quando está frio.", source: "Catálogo de ideias do projeto: H1 «Carry da base trimestral», S1-5 «Carry de funding»" },
        { q: "O BTC está a 100 000 dólares, e o futuro de 90 dias a 102 500 dólares. O que acontece com a diferença até a data de liquidação?", options: ["Continua","Desaparece: no dia da liquidação os preços coincidem","Dobra"], explain: "No dia da liquidação o contrato futuro vira a própria moeda. Por isso a base converge para zero, e quem a vendeu fica com essa base." },
        { label: "Testar o carry no polígono" },
        { sources: ["Binance: liquidação dos futuros trimestrais"] },
      ],
    },
    "m06-4": {
      title: "Ativos tokenizados",
      blocks: [
        { text: "Os [[Токенизированный актив|ativos tokenizados]] prometem levar títulos, ouro, imóveis e ações para a blockchain. Tecnicamente é um token que o emissor se compromete a trocar pelo ativo real. A própria blockchain não sabe nada do ativo: só guarda o registro de quem tem quantos tokens." },
        null,
        { text: "Por isso o que precisa ser verificado é uma cadeia de pessoas, não código. Quem é o emissor e quem o supervisiona? Onde o ativo está guardado e quem o confirma? Um detentor comum pode trocar o token pelo ativo, ou o resgate só está aberto a grandes clientes? O que acontece com o token se o emissor falir?\n\nOs títulos do Tesouro dos EUA tokenizados pagam juros próximos da taxa do Fed — porque dentro há títulos comuns. Não há milagres de rendimento aqui. Há praticidade na liquidação e mais um elo de risco." },
        { q: "Um token de ouro é negociado 50 dólares abaixo do ouro. Qual é a explicação mais provável?", options: ["Uma pechincha, o mercado está errado","O mercado duvida da possibilidade de resgate ou do emissor","Ouro na blockchain é mais barato por natureza"], explain: "Se o token pudesse ser trocado livremente por ouro, os arbitradores comprariam o desconto. O desconto é o pagamento pelo risco de algum elo da cadeia." },
        null,
      ],
    },
  },
};

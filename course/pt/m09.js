// Перевод модуля m09 (pt). Формат — public/course/tr.js.
export default {
  id: "m09",
  src: "6f14547d",
  title: "Estratégias",
  summary: [
    "Toda estratégia tem uma suposição oculta sobre como o preço vai se comportar; se ela estiver errada, a mecânica não salva.",
    "Num mercado em alta, quase qualquer estratégia que sai do mercado com mais frequência perde para o simples manter no retorno, mas pode ganhar no drawdown.",
    "Grids, market making e arbitragem estatística parecem «neutros», mas na prática perdem para as taxas e para quem sabe mais.",
  ],
  lessons: {
    "m09-1": {
      title: "A suposição oculta",
      blocks: [
        { text: "Uma estratégia é fácil de descrever em regras: «comprar quando…, vender quando…». Mais útil é perguntar: **o que precisa acontecer com o preço para isso ganhar dinheiro?** Essa é a [[Скрытое предположение|suposição oculta]]. Toda estratégia tem uma, mesmo a que se diz «neutra em relação ao mercado»." },
        null,
        { text: "Daqui em diante, cada lição tem três partes: a mecânica, a suposição oculta e o que o teste do projeto mostrou. No fim da lição há um botão que abre o modo de trabalho com a estratégia já escolhida: lá você pode testá-la com honestidade, com taxas e dados reservados." },
        { q: "Um bot de grid é chamado de «neutro». Qual é a suposição oculta dele?", options: ["Nenhuma","O preço vai se mover dentro de uma faixa e voltar a ela depois de sair","O preço vai subir"], explain: "Um grid ganha dinheiro com a volta do preço. Se o preço sai da faixa e não volta, o grid fica com uma posição perdedora." },
        null,
      ],
    },
    "m09-2": {
      title: "Manter e comprar em partes",
      blocks: [
        { text: "**Mecânica.** Comprar e manter. Ou [[DCA (покупка частями)|DCA]]: comprar o mesmo valor uma vez por mês sem olhar o preço.\n\n**Suposição oculta.** Daqui a anos o preço será maior que agora. Nada mais — mas isso não é pouco: muitas moedas de ciclos passados nunca voltaram aos seus picos.\n\nO DCA costuma ser vendido como «um jeito de comprar mais barato». Não é: ele só espalha a data de entrada. Se o mercado sobe na maior parte do tempo, comprar de uma vez ganha, porque o dinheiro trabalha por mais tempo. Se cai, o DCA ganha. Compare na história real do BTC." },
        null,
        { text: "Investindo 2 500 dólares em partes ao longo de 24 meses a partir de 2019, 2020 ou 2023, comprar de uma vez deu o dobro do DCA. A partir de 2018 ou 2022, o contrário. Ninguém sabe de antemão, por isso o DCA é um jeito de reduzir o arrependimento por uma data azarada, não um jeito de ganhar mais." },
        { text: "O projeto testou variantes turbinadas: DCA com alavancagem, martingale (dobrar depois de uma perda), compras em grid na queda. A expectativa delas é negativa pela construção. Um martingale precisa que as sequências vencedoras aconteçam com mais frequência do que a própria aritmética das apostas permite, e nenhuma configuração garante isso. A única coisa que sobreviveu foi um filtro de volatilidade: +6,5 pontos percentuais nos 40% de dados reservados.", source: "Catálogo de ideias do projeto: lev «Crescimento rápido: alavancagem de 100x, martingale, DCA e bots de grid»" },
        { q: "O preço do BTC subiu na maior parte do tempo por dois anos seguidos. Quem ganhou: o DCA ou comprar o valor inteiro no primeiro dia?", options: ["O DCA — ele sempre compra mais barato","Comprar de uma vez: todo o dinheiro esteve antes no ativo que subia","Deu igual"], explain: "O DCA só ganha se o preço caiu durante o período de compras. Num mercado em alta, as compras posteriores custam mais que as primeiras." },
        { label: "Testar uma fração constante no polígono" },
        { sources: ["Binance: candles diários públicos"] },
      ],
    },
    "m09-3": {
      title: "Seguir a tendência e as tartarugas",
      blocks: [
        { text: "**Mecânica.** [[Следование тренду|Seguir a tendência]]: estar no mercado enquanto o preço sobe e sair quando cai. A versão mais simples é manter enquanto o preço estiver acima da SMA 200. As [[Черепахи|tartarugas]] compram no rompimento da máxima de 20 dias e vendem na mínima de 10 dias.\n\n**Suposição oculta.** Os movimentos fortes duram mais do que parece. Então muitas perdas pequenas em rompimentos falsos são pagas por tendências grandes e raras.\n\nTroque as regras e a taxa abaixo. As barras verdes são os dias no mercado." },
        null,
        { text: "No BTC desde 2017, com taxa de 0,1%, a regra da SMA 200 deu ×7, e manter ×17,7; mas o pior drawdown foi de −64% contra −83%. As «tartarugas» deram ×22,9 com drawdown de −55%. É bonito, mas é uma moeda, um conjunto de parâmetros e retrospecto. Como testar isso com honestidade é o assunto do próximo módulo." },
        { text: "**Tartarugas** no teste do projeto: a melhor variante deu ×21 no sandbox — e ×0,84 nos dados reservados de 2025–2026 (t 0,44). Aumentar uma posição vencedora (piramidar) quebrou a conta em cripto: recuos bruscos comeram todos os acréscimos de uma vez.\n\n**Rompimentos** em candles de 4 horas não cumpriram a condição pré-registrada em nenhuma variante. **Rompimentos rápidos**: um grupo de controle sem seleção deu quase o mesmo (+2,791R contra +2,919R) — o resultado se explicava pela alta do mercado, não pela regra.", source: "Catálogo de ideias do projeto: «Tartarugas», S1-4, fast «Rompimento rápido»" },
        { q: "Uma regra de tendência fez ×7 contra ×17,7 de manter, mas com drawdown de −64% em vez de −83%. Como descrever isso com honestidade?", options: ["A regra é melhor que manter","A regra é pior que manter","É uma troca: menos retorno por menos drawdown; uma moeda e um conjunto de parâmetros não provam nada"], explain: "É preciso comparar retorno, risco e robustez em outras moedas e períodos. Uma história é um exemplo, não uma prova." },
        { label: "Testar as tartarugas no polígono" },
        null,
      ],
    },
    "m09-4": {
      title: "Reversão à média",
      blocks: [
        { text: "**Mecânica.** [[Возврат к среднему|Reversão à média]]: comprar depois de uma queda forte (RSI abaixo de 30, o preço na banda inferior de Bollinger, vários dias vermelhos seguidos) e vender depois do repique.\n\n**Suposição oculta.** Os movimentos bruscos são exagerados e se revertem. Então vêm muitos lucros pequenos e perdas grandes raras — quando uma queda se revela o começo de um colapso, e não um repique.\n\nAbaixo está a mesma regra no BTC: desde 2017, ×2,1 contra ×17,7 de manter, no mercado só 21% do tempo. As cripto ficam em tendência por longos períodos, e sair depois de um repique muitas vezes perde o movimento principal." },
        null,
        { text: "**Sequências de quedas.** Estatisticamente há um repique depois de uma série de dias vermelhos, e forte: t −9,8. Mas ele é 5 vezes menor que a taxa por operação.\n\n**Repique depois de uma cascata de liquidações:** t 3,02 em 4 moedas, t 0,98 em outras 10. O efeito enfraqueceu à medida que o número de moedas cresceu — sinal de ajuste aos primeiros dados.\n\n**Apostar contra rompimentos falsos em candles de 15 minutos:** −210,7 pontos percentuais no sandbox, t −3,79.", source: "Catálogo de ideias do projeto: «Sequências de quedas», N «Repique depois de uma cascata de liquidações», fb «Apostar contra rompimentos falsos»" },
        { q: "O efeito de repique é estatisticamente forte (t −9,8), mas 5 vezes menor que a taxa. O que isso significa para o trading?", options: ["É preciso operar com mais frequência","Operar com base nele não compensa: a vantagem não cobre os custos","É preciso usar alavancagem"], explain: "Nem a frequência nem a alavancagem transformam um resultado negativo por operação em positivo. A alavancagem só aumenta a perda." },
        { label: "Testar a reversão por RSI no polígono" },
        null,
      ],
    },
    "m09-5": {
      title: "Grid",
      blocks: [
        { text: "**Mecânica.** Um [[Сетка (грид-бот)|bot de grid]] coloca ordens de compra em passos iguais abaixo do preço e ordens de venda acima. Cada passagem do preço para baixo e de volta é uma [[Круг сетки|rodada]] e um lucro pequeno.\n\n**Suposição oculta.** O preço vai se mover dentro de uma faixa e voltar a ela. Se o preço desce e não volta, o grid compra a moeda em queda e fica com toda a perda dela." },
        { steps: ["Uma faixa: compras embaixo, vendas em cima, as rodadas trazem lucro.","O preço desceu: todas as compras foram executadas, nenhuma venda. O grid virou um long grande em uma moeda em queda."] },
        { text: "O passo do grid decide muito. Com passo de 0,25%, a taxa come cerca de 80% do lucro de uma rodada. Com passo de 2–4% há menos rodadas, mas cada uma paga bem a sua taxa." },
        { text: "9 de 9 configurações de grid perderam em dados de um minuto. Um resultado brilhante em candles de uma hora (+275,7 pontos percentuais) se revelou um erro do modelo: em dados de um minuto, o mesmo bot deu −931%. Um grid neutro por ATR também não o salvou: é neutro pela construção, mas não nos resultados.", source: "Catálogo de ideias do projeto: grid «Bots de grid e um grid neutro por ATR»" },
        { q: "Uma moeda caiu 40% e não voltou. E o grid?", options: ["Ganhou dinheiro em cada nível","Comprou em cada nível e está com uma perda grande","Fechou automaticamente sem perda"], explain: "Um grid só vende nos movimentos de volta para cima. Sem uma volta, ele vira preço médio na queda de uma moeda em queda." },
        { label: "Testar um grid no polígono" },
        null,
      ],
    },
    "m09-6": {
      title: "Carry, market making, arbitragem estatística",
      blocks: [
        { text: "Estas estratégias não adivinham a direção do preço. Por isso são chamadas de neutras — e por isso as suas suposições ocultas são mais difíceis de enxergar." },
        null,
        { text: "**Carry.** Comprar uma moeda e vender o mesmo futuro perpétuo; o preço quase não importa, e o funding fica. A suposição: o funding vai continuar positivo, e a corretora que guarda as duas pernas vai continuar confiável.\n\n**Market making.** Ficar com ordens de compra e venda e ganhar o spread. A suposição: o spread será maior que as perdas de operar com quem sabe mais que você ([[Неблагоприятный отбор|seleção adversa]]).\n\n**[[Стат-арбитраж|Arbitragem estatística]].** Comprar uma moeda que ficou para trás de moedas parecidas e vender a que correu na frente. A suposição: as moedas que divergiram vão convergir de novo, e mais rápido do que as taxas comem o ganho." },
        { text: "**Carry** em 19 moedas: +121% em 2021–2026, drawdown de 1,4% — a estratégia foi aceita. Mas o excesso sobre a referência, ano a ano: +18,5, +5,0, +0,1, 0,0 pontos percentuais; num mercado frio ela simplesmente não opera.\n\n**Market making passivo** por operação: metade do spread +0,33 bp, seleção adversa −0,60, a taxa −2,00. Total −2,27 bp.\n\n**Arbitragem estatística:** há previsibilidade, mas o tamanho dela é 0,31 bp contra custos de pelo menos 8 bp.", source: "Catálogo de ideias do projeto: S1-5 «Carry de funding», mm «Market making passivo», stat «Arbitragem estatística dos resíduos»" },
        { q: "Por que o market making passivo perde, se cada operação «ganha o spread»?", options: ["O spread é grande demais","As ordens tendem a ser executadas quando o preço vai contra elas, e a taxa é mais da metade do spread","A corretora proíbe o market making"], explain: "A sua ordem é pega sobretudo por quem vê o movimento antes. As perdas nessas operações mais a taxa superam o spread ganho." },
        { label: "Testar o carry no polígono" },
        null,
      ],
    },
  },
};

// Перевод модуля m04 (pt). Формат — public/course/tr.js.
export default {
  id: "m04",
  src: "dbfb429c",
  title: "Corretoras descentralizadas (DEX)",
  summary: [
    "Uma DEX não tem livro de ofertas: você troca com um pool, e o preço é dado pela fórmula x·y = k — quanto maior a troca em relação ao pool, pior o preço.",
    "Os provedores do pool ganham taxas, mas pagam com a perda impermanente: o pool entrega o que encarece e acumula o que barateia.",
    "A fila de transações é visível para todos, por isso uma troca grande com tolerância de slippage alta é um presente para os bots de sanduíche.",
  ],
  lessons: {
    "m04-1": {
      title: "Um pool de liquidez em vez de livro de ofertas",
      blocks: [
        { text: "Uma [[DEX (децентрализованная биржа)|corretora descentralizada]] é um conjunto de contratos inteligentes. Não há uma empresa que guarde o dinheiro e verifique a identidade: você conecta a carteira e troca tokens direto dela.\n\nManter um livro de ofertas na blockchain é caro — cada ordem custaria gas. Por isso a maioria das DEX funciona de outro jeito: há um [[Пул ликвидности|pool]] — um contrato com uma reserva de dois tokens. Os [[Поставщик ликвидности|provedores de liquidez]] depositam os dois tokens nele, os traders trocam com o pool, e uma fórmula calcula o preço. Esse arranjo se chama [[AMM (автоматический маркетмейкер)|formador de mercado automático]]." },
        null,
        { text: "As vantagens: trocar a qualquer momento, sem cadastro, qualquer token pode ter o seu pool. As desvantagens são o outro lado das vantagens. Qualquer um pode criar um pool até para um token sem valor, e ninguém responde por bugs no contrato. Em vez da taxa da corretora, você paga o gas da rede, a taxa do pool e o impacto da sua troca no preço." },
        { q: "Quem vende um token para você em uma DEX com pool de liquidez?", options: ["Outro trader cuja ordem estava no livro de ofertas","O próprio pool: você entrega um token e pega outro pelo preço que a fórmula calcula","A empresa da corretora"], explain: "Não há ordem do outro lado. A sua contraparte é um contrato com reservas depositadas pelos provedores de liquidez." },
        { sources: ["Uniswap: como o protocolo funciona"] },
      ],
    },
    "m04-2": {
      title: "A fórmula x·y = k",
      blocks: [
        { text: "A fórmula de pool mais conhecida é o [[Постоянное произведение (x·y=k)|produto constante]]. Digamos que o pool tenha x ETH e y USDT. O preço do ETH é y / x. Numa troca, o produto x × y deve continuar o mesmo (a taxa é somada por cima e fica no pool).\n\nExemplo: o pool tem 100 ETH e 200 000 USDT, o preço é 2000. Você quer tirar 10 ETH. Vão sobrar 90 ETH, e o produto 20 000 000 exige que os USDT passem a 20 000 000 / 90 ≈ 222 222. Então você paga cerca de 22 222 USDT — 2222 por ETH, não 2000. Quanto mais você tira, mais cara cada unidade seguinte: não é possível tirar os 100 ETH a preço nenhum." },
        { steps: ["O pool está sempre na curva x·y = k. O ponto verde é o agora: 100 ETH e 200 000 USDT.","Uma compra de 10 000 USDT: o ponto andou pela curva, e o preço subiu cerca de 10%.","Uma compra de 50 000 USDT — um quarto do pool: o preço médio fica cerca de 25% pior que o inicial.","Quanto mais longe na curva, mais íngreme ela fica: cada ETH seguinte custa mais e mais."] },
        null,
        { text: "Daí o [[Влияние на цену|impacto no preço]]: depende do tamanho da troca em relação ao tamanho do pool. Num pool de centenas de milhões de dólares, uma troca de mil dólares quase não move nada; num pool de 50 000 dólares, a mesma troca move o preço em vários por cento.\n\nDepois de uma troca grande, o preço do pool fica diferente do preço em outras corretoras. Os [[Арбитраж|arbitradores]] o puxam de volta na hora: compram onde está mais barato e vendem onde está mais caro. Isso mantém os preços dos pools perto do mercado — e, como veremos na próxima lição, é feito à custa dos provedores." },
        { q: "O pool tem 10 ETH e 20 000 USDT. Você compra ETH com 20 000 USDT. Quantos ETH você recebe (sem a taxa)?", options: ["10 ETH","5 ETH: os USDT passam a 40 000, e o produto 200 000 exige 5 ETH no pool","Quase 10 ETH, mas um pouco menos por causa da taxa"], explain: "x·y = 10 × 20 000 = 200 000. Depois da troca y = 40 000, então x = 5. Você tirou 5 ETH a 4000 em média — o dobro do preço inicial." },
        { sources: ["Uniswap v2: a fórmula do produto constante"] },
      ],
    },
    "m04-3": {
      title: "Perda impermanente",
      blocks: [
        { text: "Um provedor depositou 1 ETH e 2000 USDT em um pool ao preço de 2000. O preço do ETH dobrou. Os arbitradores compraram ETH barato do pool até o preço do pool chegar a 4000. Agora a cota do provedor no pool é de cerca de 0,71 ETH e 2828 USDT — 5657 dólares no total. Se ele tivesse simplesmente mantido 1 ETH e 2000 USDT, teria 6000 dólares.\n\nEssa diferença é a [[Непостоянные потери|perda impermanente]]: −5,7% quando o preço dobra. O pool vende o tempo todo o que encarece e compra o que barateia. «Impermanente» porque, se o preço voltar ao inicial, a perda desaparece. Se não voltar, a perda é bem permanente." },
        { caption: "A perda é a mesma para uma alta e uma queda pelo mesmo fator: ×4 e ÷4 dão −20% cada." },
        null,
        { text: "Um provedor ganha taxas de cada troca. O resultado é taxas menos perda impermanente. Para pares que se movem juntos (duas stablecoins em dólar), as perdas são pequenas. Para pares em que uma moeda pode desabar em relação à outra, as perdas podem comer todas as taxas e mais.\n\nA [[Концентрированная ликвидность|liquidez concentrada]] é especialmente arriscada: o provedor mantém moedas só dentro de uma faixa estreita de preço. Há mais taxas, mas quando o preço sai da faixa, o provedor fica só com a moeda que barateou." },
        { text: "Um pool de duas moedas, na prática, rebalanceia, como um grid sobre a razão dos preços delas. O projeto testou isso diretamente: a colheita das oscilações é real e captura 83–87% do teto teórico. Mas para 76 pares altcoin/bitcoin a mediana foi de −3,46 pontos percentuais por ano contra manter, e 45% das altcoins caíram mais de 90% contra o bitcoin. As oscilações trazem um pouco; o afastamento longo de uma moeda leva muito.", source: "Catálogo de ideias do projeto: «Prêmio de rebalanceamento e grid sobre a razão»" },
        { q: "Um pool ETH/USDT: o preço do ETH caiu quatro vezes. Quanto a cota do pool ficou atrás do simples manter (sem taxas)?", options: ["Não ficou atrás: o pool é em dólares","20%","75%"], explain: "A fórmula da perda impermanente é simétrica: tanto ×4 quanto ÷4 dão −20% em relação a manter. O próprio manter também caiu — o pool só perdeu mais." },
        { sources: ["Uniswap: provedores de liquidez"] },
      ],
    },
    "m04-4": {
      title: "MEV e ataques sanduíche",
      blocks: [
        { text: "Uma transação que você envia cai primeiro na [[Мемпул|fila pública]] e fica visível para todos até entrar em um bloco. Quem monta o bloco decide em que ordem colocar as transações. A renda de uma reordenação lucrativa se chama [[MEV|MEV]].\n\nO tipo mais conhecido é o [[Сэндвич-атака|sanduíche]]. Um bot vê sua troca grande, coloca a própria compra antes dela e uma venda logo depois." },
        { steps: ["Sua troca está esperando na fila.","O bot compra primeiro e empurra o preço para cima.","Você compra a um preço pior — dentro da sua tolerância de slippage.","O bot vende logo depois de você e fica com a diferença."] },
        { text: "O bot pode mover o preço exatamente até onde você permitiu com a sua [[Допуск проскальзывания|tolerância de slippage]]: se você aceita receber 5% a menos, o bot vai tentar levar quase os 5% inteiros.\n\nComo se proteger:\n\n**Uma tolerância pequena** — 0,1–0,5% para pares líquidos. Se a troca falhar, é melhor tentar de novo do que pagar a mais.\n\n**Uma troca grande — em partes** ou por meio de um [[Агрегатор|agregador]] (próxima lição).\n\n**[[Частная отправка транзакций|Envio privado de transações]]** — muitas carteiras podem enviar uma transação direto aos construtores de blocos, sem passar pela fila pública." },
        { q: "Você define uma tolerância de slippage de 10% «para a troca passar com certeza». O que há de errado nisso?", options: ["Nada, é só um seguro","Um bot pode mover o preço em quase 10% e ficar com a diferença: a tolerância é o quanto você aceita perder","A troca vai custar mais gas"], explain: "A tolerância é o limite superior da perda, não um seguro. Os bots lucram empurrando o seu preço até esse limite." },
        { sources: ["ethereum.org: MEV"] },
      ],
    },
    "m04-5": {
      title: "Agregadores e o custo total de uma troca",
      blocks: [
        { text: "Um mesmo par de tokens muitas vezes tem vários pools em protocolos e redes diferentes. Um [[Агрегатор|agregador]] procura um jeito de dividir a troca entre eles para que cada parte mova menos o preço." },
        null,
        { text: "O custo total de uma troca em uma DEX tem quatro partes: **o gas da rede** (para cada pool da rota), **a taxa do pool** (muitas vezes 0,05–1%), **o impacto no preço** e o **MEV**, se a transação foi para a fila pública. Em uma corretora centralizada, em vez disso, há a taxa da corretora, o spread e o slippage pelo livro de ofertas.\n\nPara valores pequenos na rede principal do Ethereum, o gas pode superar todo o resto; na camada dois o gas é pequeno, mas os pools costumam ser menores também. O que se deve comparar é o resultado: quantos tokens você recebe na mão." },
        { q: "O que comparar ao escolher onde trocar 500 dólares?", options: ["Só a taxa do pool","Quantos tokens você recebe na mão depois de gas, taxas, impacto no preço e slippage","O preço no gráfico"], explain: "Cada parte sozinha pode ser pequena, mas você paga a soma delas. Um agregador mostra o resultado; numa corretora, o resultado é o preço de execução menos a taxa." },
        { sources: ["ethereum.org: corretoras descentralizadas"] },
      ],
    },
  },
};

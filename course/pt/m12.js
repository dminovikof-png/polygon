// Перевод модуля m12 (pt). Формат — public/course/tr.js.
export default {
  id: "m12",
  src: "20ec1cae",
  title: "Trading algorítmico e com IA",
  summary: [
    "Um bot executa uma regra sem emoções, mas não torna a regra melhor; a maioria das falhas está nos dados, nas ordens e na contabilidade, não na ideia em si.",
    "O aprendizado de máquina só com preços quase sempre encontra ruído: acerto alto no treino, cerca de 50% num teste walk-forward.",
    "Os modelos de linguagem são úteis como ajudantes: explicar, escrever código, achar um bug. Não dá para confiar neles para prever preços ou decidir por você.",
  ],
  lessons: {
    "m12-1": {
      title: "Algoritmo e bot",
      blocks: [
        { text: "Um algoritmo é uma regra escrita com tanta precisão que uma máquina consegue executá-la. Um [[Торговый бот|bot de trading]] é um programa que, seguindo essa regra, obtém dados, decide e envia ordens à corretora sozinho.\n\nUm bot elimina dois problemas humanos: as emoções e o cansaço. Ele não tem medo de vender depois de uma queda e não esquece de colocar um stop à noite. Mas um bot não torna uma regra lucrativa: se a regra não tem vantagem, o bot só vai executá-la com mais capricho." },
        null,
        { text: "A regra é um elo de cinco. Os outros: de onde vêm os dados e se chegam atrasados, se a corretora aceita a ordem, a que preço ela é executada, como as taxas e o funding são contabilizados. Na prática, a maioria dos problemas de um bot está justamente aí: um candle perdido, uma recusa da corretora, uma execução parcial, uma ordem repetida depois de uma falha de conexão.\n\nPor isso o caminho de um bot até o dinheiro é o mesmo de qualquer ideia: um backtest honesto, depois [[Бумажная торговля|paper trading]], depois um valor pequeno." },
        { text: "O projeto tinha agentes de IA que propunham regras de bot sozinhos. As ideias deles foram testadas como quaisquer outras:\n\n**BearShort:** short em regime de baixa, fator de lucro de 1,17 em 81 operações (t 0,62), −57,6 pontos percentuais no reteste. **Funding Contrarian:** −16,6 pontos percentuais, [[Суррогатный тест|teste substituto]] p = 0,517. **Rompimentos rápidos:** um grupo de controle sem seleção deu quase o mesmo.\n\nNenhuma passou. O autor de uma regra — humano ou IA — não a dispensa do teste.", source: "Catálogo de ideias do projeto: bear, FC, fast" },
        { q: "Um bot opera uma regra que não tem vantagem. O que o bot vai mudar?", options: ["Tornar a regra lucrativa pela velocidade","Nada na expectativa: vai executar com capricho uma regra não lucrativa","Eliminar as taxas"], explain: "Um bot é um executor. Ele elimina erros de execução, mas não cria uma vantagem que não está na regra." },
        { label: "Abrir o paper trading no polígono" },
        null,
      ],
    },
    "m12-2": {
      title: "Execução e latência",
      blocks: [
        { text: "Entre uma decisão e uma operação passa tempo — a [[Задержка (латентность)|latência]]. Enquanto a ordem viaja até a corretora, o preço tem tempo de se mover. Quanto mais curto o horizonte da regra, mais esses milissegundos importam." },
        null,
        { text: "Os grandes participantes colocam servidores ao lado da corretora ([[Колокация|colocation]]) e reagem em frações de milissegundo. Não faz sentido competir com eles em velocidade de casa. Para um bot particular sobram as regras para as quais tanto faz entrar agora ou daqui a um minuto: as diárias e as de uma hora.\n\nAlém da velocidade, a execução tem armadilhas próprias. A corretora limita o número de requisições (um [[Лимит запросов|limite de requisições]]) e pode recusar temporariamente. Uma ordem grande é executada em partes e a um preço médio pior. Nos colapsos, os stops disparam pior do que onde foram colocados. Um bom backtest supõe uma execução **pessimista**: se uma ideia sobrevive a uma execução ruim, vai sobreviver à real." },
        { text: "**Short em pumps:** 53–55% de acertos. Mas depois de uma alta de 20%, em 69% dos casos o preço consegue subir mais 5% em uma hora — antes de o short ser executado ao preço desejado. O resultado da conta variou de ×0,000 a ×0,041, com a pior operação em −142%.\n\n**Entrar no meio de um pump:** 0 de 24 variantes no lucro com execução pessimista.", source: "Catálogo de ideias do projeto: short-pump, bounce-pump" },
        { q: "Uma regra opera em candles de um minuto e ganha 0,05% por operação num backtest. O bot roda num computador de casa. O que esperar?", options: ["Os mesmos 0,05%","Muito provavelmente pior: a latência e o slippage em dados de um minuto são comparáveis a essa vantagem","Melhor, porque um bot é mais rápido que um humano"], explain: "Em horizontes curtos, a execução leva a maior parte de uma vantagem pequena. Sem considerar a latência, um backtest é otimista demais." },
        { sources: ["Bybit: limites de requisições da API"] },
      ],
    },
    "m12-3": {
      title: "Aprendizado de máquina com preços",
      blocks: [
        { text: "O [[Машинное обучение|aprendizado de máquina]] é quando uma regra não é escrita à mão, mas ajustada a partir dos dados. Mostram-se ao modelo [[Признак (в машинном обучении)|variáveis]] (por exemplo, os retornos dos últimos 5 dias) e as respostas certas (se o preço subiu no dia seguinte), e ele procura uma ligação.\n\nDois modelos simples. A [[Логистическая регрессия|regressão logística]] procura a soma ponderada de variáveis que melhor separa os dias de alta dos de queda. Os [[k ближайших соседей|k vizinhos mais próximos]] encontram os k dias passados mais parecidos com hoje e olham o que veio depois deles.\n\nO principal no teste é o [[Проверка вперёд|teste walk-forward]]: para cada dia, o modelo aprende só com os dias anteriores." },
        null,
        null,
        { text: "O kNN com k = 1, nos mesmos dados com que aprendeu, acerta 100% dos dias: simplesmente lembra a resposta. Num teste walk-forward, 49% — pior que uma moeda. Quanto mais flexível o modelo, maior a distância entre o treino e o teste — isso é sobreajuste.\n\nTroque o modelo, o k e o número de variáveis abaixo. Com um teste honesto, todas as variantes ficam em torno de 50%, e a [[IC (связь сигнала с будущим)|ligação com o futuro]] em torno de zero." },
        null,
        { text: "**Previsão de volatilidade** (o modelo HAR): funciona — qualidade +29%, melhor em 11 moedas de 14. Mas a versão de trading perdeu: Sharpe 0,18 contra 0,35. A volatilidade é previsível; com ela não se ganha dinheiro.\n\n**Sete sinais fracos juntos:** a ligação com o futuro cresceu de 0,023 para 0,036, mas depois dos custos 0 de 31 conjuntos ficaram no lucro.\n\nModelos complexos (redes neurais, boosting) sobre os mesmos preços procuram a mesma ligação fraca, só que com mais espaço para o sobreajuste.", source: "Catálogo de ideias do projeto: HAR, #33" },
        { q: "No treino um modelo acerta 85% dos dias; num teste walk-forward, 51%. O que isso significa?", options: ["O modelo é excelente: 85%","O modelo decorou o passado: 51% quando quase 50% dos dias são de alta é nível de cara ou coroa","É preciso acrescentar mais variáveis"], explain: "Só importa o resultado nos dias que o modelo não viu. Acrescentar variáveis costuma aumentar a distância, não o resultado." },
        null,
      ],
    },
    "m12-4": {
      title: "Modelos de linguagem como ajudantes",
      blocks: [
        { text: "Um [[Языковая модель|modelo de linguagem]] (ChatGPT, Claude, Gemini e outros) consegue explicar, escrever código e raciocinar. Isso o torna útil no trading — mas não do jeito que prometem os anúncios de «bot de IA que ganha sozinho»." },
        null,
        { text: "**Onde ajuda.** Explicar um termo desconhecido ou o código de outra pessoa. Escrever um cálculo e os testes dele. Encontrar uma antecipação ou uma taxa esquecida. Listar o que pode dar errado. Transformar um diário de operações em um relatório.\n\n**Onde não ajuda.** O modelo não conhece o preço de amanhã — não tem esse conhecimento, assim como ninguém. Ele pode inventar com confiança um fato, um número ou um link, por isso qualquer número é verificado na fonte original. O conhecimento dele termina na data do treino: pode não saber da notícia de ontem.\n\n**Segurança.** Não dê a um bot ou agente chaves com direito de saque. O texto de uma página, e-mail ou documento pode conter instruções escondidas para o modelo — [[Внедрение указаний|injeção de instruções]]. Um agente que lê a internet e também pode operar é um alvo fácil." },
        { text: "Este polígono foi construído com a ajuda de um assistente de IA: código, testes, verificação de cálculos. Ao mesmo tempo, todas as ideias de trading, inclusive as propostas por agentes de IA, passaram pelo mesmo limiar, pelos dados reservados e pelo diário de tentativas — e a maioria não passou. A IA acelera o teste, mas não o substitui.", source: "Catálogo de ideias e diário de tentativas do projeto" },
        { q: "Um assistente de IA escreve com confiança que uma estratégia dá 40% ao ano e cita um link. O que fazer?", options: ["Acreditar: o modelo sabe muito","Abrir o link, conferir o número na fonte original e testar a própria estratégia no polígono","Pedir ao modelo que confirme mais uma vez"], explain: "Os modelos às vezes inventam números e links, e quando perguntados de novo confirmam o próprio erro. A verificação é feita na fonte original e nos dados." },
        { sources: ["OWASP: riscos de aplicações com modelos de linguagem"] },
      ],
    },
  },
};

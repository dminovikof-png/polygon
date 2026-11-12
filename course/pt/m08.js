// Перевод модуля m08 (pt). Формат — public/course/tr.js.
export default {
  id: "m08",
  src: "acb0ab60",
  title: "Análise técnica",
  summary: [
    "Candles e indicadores são formas de comprimir um gráfico passado; descrevem o que foi, não o que será.",
    "O olho encontra tendências e padrões até em lançamentos de moeda, por isso qualquer padrão precisa ser testado em milhares de casos, com taxas.",
    "O projeto testou SMA200, rompimentos, Gartley e o aperto de Bollinger: a SMA200 reduz o drawdown à custa do retorno; o resto não ganha dinheiro.",
  ],
  lessons: {
    "m08-1": {
      title: "Candles e timeframes",
      blocks: [
        { text: "A [[Технический анализ|análise técnica]] estuda o próprio gráfico de preço. A sua linguagem principal são os [[Японская свеча|candles]]: cada um mostra a abertura, o fechamento, a máxima e a mínima do seu trecho de tempo." },
        null,
        null,
        { text: "A duração do trecho é o [[Таймфрейм|timeframe]]. O mesmo mês são 30 candles diários, 720 de uma hora ou 43 200 de um minuto. Quanto mais curto o candle, mais ruído aleatório ele contém e mais vezes uma estratégia opera. A taxa por operação, enquanto isso, não encolhe.\n\nPor isso nos gráficos de um minuto perdem até ideias que parecem lucrativas nos de uma hora: o projeto viu isso muitas vezes." },
        { text: "Um bot de grid em candles de uma hora mostrou +275,7 pontos percentuais. O mesmo bot em dados de um minuto: −931%. O modelo de uma hora não via como o preço, dentro de uma hora, cruza os níveis do grid para lá e para cá, e contava operações que de fato não teriam acontecido. 9 de 9 configurações em dados de um minuto terminaram no prejuízo.", source: "Catálogo de ideias do projeto: grid «Bots de grid e um grid neutro por ATR»" },
        { q: "Uma estratégia ganha 0,05% por operação antes das taxas e opera 20 vezes por dia. A taxa de entrada e saída é de 0,2%. O que acontece?", options: ["Um lucro de 1% ao dia","Uma perda de cerca de 3% ao dia: a taxa é 4 vezes a vantagem","Zero"], explain: "(0,05 − 0,2) × 20 = −3% ao dia. Timeframes curtos exigem uma vantagem maior que a taxa, e isso é raro." },
        null,
      ],
    },
    "m08-2": {
      title: "Indicadores: médias, RSI, bandas",
      blocks: [
        { text: "Um indicador é uma fórmula de preços passados. Os mais conhecidos:\n\nA [[Скользящая средняя (SMA)|média móvel]] — o preço médio de N dias. A SMA 200 costuma ser chamada de fronteira entre um mercado de «touro» e de «urso». A [[EMA|EMA]] é a mesma coisa, mas os dias recentes pesam mais.\n\nO [[RSI|RSI]] — de 0 a 100: que fração das variações recentes foram altas. Acima de 70 é «superaquecido», abaixo de 30 «sobrevendido».\n\nAs [[Полосы Боллинджера|Bandas de Bollinger]] — a média ± dois desvios-padrão: mostram o quanto o preço se afastou agora do habitual. O [[Канал Дончиана|canal de Donchian]] — a máxima e a mínima de N dias: sair dele se chama rompimento.\n\nLigue-os um de cada vez no gráfico real abaixo. A escala é [[Логарифмическая шкала|logarítmica]]: distância igual é porcentagem igual." },
        null,
        { text: "Repare em duas coisas. As médias sempre atrasam: a SMA 200 vira meses depois do topo. E o RSI pode ficar «superaquecido» por semanas a fio enquanto o preço continua subindo. Um indicador não conhece o futuro — reconta o passado de outra forma." },
        { text: "**SMA200.** A regra «manter BTC e ETH enquanto o preço estiver acima da sua média de 200 dias» reduziu o drawdown no teste do projeto de −77% para −36% — em 6 anos de 6. Mas é um seguro com prêmio: o retorno sem contar 2022 caiu de 47,8% para 16,3% ao ano. Dimensionar a posição pela volatilidade piorou o resultado (Sharpe 0,16 contra 0,24). A «vida» mediana de um sinal acima da média é de cerca de 4 dias: o preço muitas vezes cruza a linha para lá e para cá.\n\n**Aperto de Bollinger e ATR.** A ideia «depois de uma calmaria vem um movimento forte» não se confirmou: −18,1 pontos percentuais no sandbox, o sinal coincidiu em 2 subperíodos de 4, t −1,19. Antes de grandes movimentos, as bandas estreitando não apareceram com mais frequência que o normal.", source: "Catálogo de ideias do projeto: #1 «Long com regime SMA200», H4 «Expansão da volatilidade depois de um aperto do ATR»" },
        { q: "O RSI do BTC ficou acima de 70 por duas semanas. O que isso significa?", options: ["Uma reversão para baixo virá em breve com certeza","O preço subiu na maior parte das últimas semanas; o indicador sozinho não diz nada sobre o futuro","É preciso vender com urgência"], explain: "O RSI descreve a razão entre as altas e as quedas recentes. Numa tendência forte, ele pode ficar «superaquecido» por semanas." },
        { label: "Testar a SMA200 no BTC no polígono" },
        { sources: ["Binance: candles diários públicos"] },
      ],
    },
    "m08-3": {
      title: "Padrões e acaso",
      blocks: [
        { text: "Os [[Фигура (паттерн)|padrões]] — «ombro-cabeça-ombro», «fundo duplo», «bandeira», os padrões harmônicos de Gartley — são ensinados a ser reconhecidos pela forma do gráfico. Os [[Уровень поддержки и сопротивления|níveis de suporte e resistência]] são traçados pelas reversões passadas. O problema é que o olho humano encontra formas em todo lugar, até no ruído." },
        { steps: ["Tente adivinhar qual dos quatro gráficos é o BTC real. Todos têm «tendências», «níveis» e «padrões».","O real é o segundo. Os outros três são lançamentos de moeda com a mesma força de oscilação. Padrões parecidos aparecem nos quatro."] },
        { text: "Se um padrão também surge em um gráfico aleatório, então sozinho ele não significa nada. Só pode significar algo se depois do padrão o preço se comportar de modo diferente do que depois de um momento aleatório. Isso se testa assim: encontrar todos os casos do padrão ao longo de anos, calcular o resultado com taxas e comparar com entradas aleatórias da mesma forma." },
        { text: "**Gartley** em candles de uma hora: 49 operações, 33% de acertos, −0,348R em média (t −2,13) — pior que entradas aleatórias com a mesma geometria. Numa grade de 36 configurações, todos os resultados foram negativos.\n\n**Rompimentos.** Uma entrada stop no canal de Donchian em candles de 4 horas não cumpriu a sua condição pré-registrada: um [[Фактор прибыли (PF)|fator de lucro]] de 1,17 / 1,03 / 1,07 / 1,09 por ano contra o 1,25 necessário. A classe dos rompimentos está fechada.\n\n**Entrada no primeiro recuo depois de uma mudança de estrutura:** 8 045 operações, −0,094R depois dos custos (t −6,36), prejuízo nos 4 anos.", source: "Catálogo de ideias do projeto: gart «Padrão de Gartley», S1-4 «Entrada stop Donchian», P1 «Entrada no primeiro recuo»" },
        { q: "Como testar se um padrão funciona?", options: ["Encontrar alguns exemplos bonitos no gráfico","Encontrar todos os casos ao longo de anos, calcular o resultado com taxas e comparar com entradas aleatórias","Perguntar a um trader experiente"], explain: "Alguns exemplos sempre podem ser escolhidos em retrospecto. Um teste significa todos os casos, os custos e uma comparação com o acaso." },
        null,
      ],
    },
    "m08-4": {
      title: "Volume e força do sinal",
      blocks: [
        { text: "O [[Объём торгов|volume negociado]] costuma ser recomendado como confirmação: um rompimento com volume alto é «verdadeiro», com volume baixo «falso». Duas ressalvas. Parte do volume nas corretoras são operações consigo mesmo, que pintam atividade. E o volume de corretoras diferentes é agregado de jeitos diferentes, por isso o mesmo candle pode parecer diferente em dois sites." },
        { text: "Como medir se um sinal é útil? O projeto usa o [[IC (связь сигнала с будущим)|IC]] — a correlação de um sinal com os retornos futuros. 0 significa nenhuma ligação. Bons sinais nos mercados de ações dão 0,02–0,05. Mas mesmo uma ligação real pode não pagar as taxas. No projeto, 1 unidade de IC deu cerca de 56 pontos-base de diferença de retorno. Então um sinal com IC de 0,03 dá cerca de 1,7 bp, enquanto uma operação custa pelo menos 8–20 bp." },
        { text: "**Funding alto → retorno futuro:** IC −0,046, e a diferença entre o melhor e o pior grupo em dinheiro +0,0004 (t +0,29). Estatisticamente há uma ligação; não dá para transformá-la em dinheiro.\n\n**Sete sinais fracos juntos:** a ligação cresceu de 0,023 para 0,036, mas depois dos custos 0 de 31 conjuntos ficaram no lucro. Para uma combinação assim compensar, seriam precisos cerca de 43 sinais independentes — não existem tantos.", source: "Catálogo de ideias do projeto: D «Funding alto», #33 «Uma combinação de sete sinais fracos»" },
        { q: "Um sinal está ligado de forma estatisticamente significativa ao preço futuro. Isso quer dizer que dá para ganhar dinheiro com ele?", options: ["Sim, já que a ligação é significativa","Não necessariamente: a ligação pode ser menor que as taxas por operação","Não, sinais significativos não funcionam"], explain: "A significância diz que a ligação não é aleatória. Compensar é outra questão: o tamanho da vantagem diante dos custos." },
        null,
      ],
    },
  },
};

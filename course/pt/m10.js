// Перевод модуля m10 (pt). Формат — public/course/tr.js.
export default {
  id: "m10",
  src: "9c8f1616",
  title: "Risco e tamanho da posição",
  summary: [
    "Perdas e recuperação são assimétricas: depois de −50% você precisa de +100%, depois de −90% — de +900%.",
    "O tamanho da aposta importa tanto quanto a vantagem: até um jogo favorável arruína você com uma fração em risco grande demais.",
    "As moedas dentro das cripto caem juntas, e a alavancagem constante num ativo volátil come o capital mesmo quando o preço sobe.",
  ],
  lessons: {
    "m10-1": {
      title: "Drawdown e recuperação",
      blocks: [
        { text: "O [[Просадка|drawdown]] é o quanto o capital está abaixo do seu pico anterior. A sua principal maldade é a assimetria: para voltar, é preciso crescer mais do que se caiu." },
        null,
        { text: "Por isso um drawdown é mais perigoso do que parece. Depois de −83% (a pior queda do BTC) é preciso uma alta de quase 6 vezes. Depois de −96% (SOL), de 25 vezes. E não importa só a profundidade, mas também a duração: quantos dias seguidos o capital fica abaixo do pico anterior." },
        { steps: ["BTC: pior drawdown −83%, mais de 1 000 dias seguidos abaixo do pico anterior.","ETH: −94% e quase 4 anos abaixo do pico.","SOL: −96%. Quem comprou no topo de 2021 esperou anos por uma recuperação.","DOGE: −92% e mais de 2 000 dias seguidos abaixo do pico."] },
        { q: "O capital caiu 50%. Quanto você precisa ganhar para voltar?", options: ["50%","100%","75%"], explain: "Para ir da metade ao inteiro, é preciso dobrar: 0,5 × 2 = 1." },
        { sources: ["Binance: candles diários públicos"] },
      ],
    },
    "m10-2": {
      title: "Risco por operação e o stop",
      blocks: [
        { text: "A abordagem profissional começa não pela pergunta «quanto comprar», mas por «quanto estou disposto a perder se estiver errado». Esse é o [[Риск на сделку|risco por operação]] — geralmente 0,5–2% do capital.\n\nDepois é preciso um [[Стоп-лосс|stop]] — o preço em que a ideia é considerada errada. O tamanho da posição sai de uma divisão: o risco em dólares / a distância até o stop. Quanto mais perto o stop, maior a posição para o mesmo risco." },
        null,
        { text: "Com risco de 1%, uma conta sobrevive a 20 operações perdedoras seguidas e perde cerca de 18%. Com risco de 10%, as mesmas 20 perdas deixam 12% da conta. Longas sequências de perdas acontecem até com estratégias que têm vantagem: com 40% de acertos, uma sequência de 10 perdas seguidas em 1 000 operações acontece em cerca de 9 casos de 10.\n\nO stop não é perfeito: num movimento brusco é executado pior ([[Проскальзывание|slippage]]), e nos fins de semana e nos colapsos, bem pior." },
        { q: "O capital é de 10 000 dólares, risco de 1%, entrada a 100 dólares, stop a 95 dólares. Qual é o tamanho da posição?", options: ["100 dólares","2 000 dólares","10 000 dólares"], explain: "O risco é de 100 dólares, e o stop está 5% abaixo da entrada. 100 dólares / 0,05 = uma posição de 2 000 dólares: se o stop for atingido, a perda é exatamente de 100 dólares." },
        null,
      ],
    },
    "m10-3": {
      title: "Kelly e ruína",
      blocks: [
        { text: "Imagine um jogo com vantagem: metade das operações rende 1,2R, metade perde 1R. Em média toda operação é lucrativa. Que fração do capital arriscar?\n\nA resposta é dada pelo [[Критерий Келли|critério de Kelly]]: para este jogo, 8,3%. Com essa fração, o capital cresce mais rápido em média. Acima dela o crescimento desacelera, e a partir de cerca de dois Kelly o capital tipicamente encolhe, embora toda operação continue lucrativa." },
        null,
        { text: "O simulador joga 1 000 versões do futuro (pelo [[Метод Монте-Карло|método de Monte Carlo]]) de 200 operações cada. Para o jogo de 50% / 1,2R:\n\n**Risco de 2%:** nenhuma [[Разорение|ruína]], mediana ×1,42.\n**Risco de 4%:** nenhuma ruína, mediana ×1,83.\n**Risco de 8,3% (Kelly):** 2% arruinados, mediana ×2,29, mas o caminho é muito acidentado.\n**Risco de 15%:** 28% arruinados, mediana ×1,35.\n**Risco de 25%:** 74% arruinados, mediana ×0,09.\n\nE isso com uma vantagem conhecida de antemão. Na vida real a vantagem é estimada com erro e muitas vezes se revela menor, por isso os praticantes apostam metade ou um quarto de Kelly." },
        { text: "O projeto testou o crescimento rápido de um depósito: alavancagem de 100x, martingale, DCA e bots de grid com dobra. Todos têm expectativa negativa pela construção: um martingale precisa que as sequências vencedoras aconteçam com mais frequência do que a própria aritmética das apostas permite, e nenhuma configuração garante isso. Quanto mais rápido um esquema promete dobrar a conta, mais rápido a zera.", source: "Catálogo de ideias do projeto: lev «Crescimento rápido: alavancagem de 100x, martingale»" },
        { q: "O jogo é favorável, mas você arrisca 25% do capital em cada operação, enquanto o Kelly é 8%. O que é mais provável?", options: ["O crescimento mais rápido","O capital tipicamente vai derreter, embora toda operação seja lucrativa","O mesmo resultado que com 8%"], explain: "Com uma fração em risco acima de dois Kelly, uma sequência de perdas destrói o capital mais rápido do que os ganhos o recuperam." },
        { sources: ["Kelly, 1956: A New Interpretation of Information Rate"] },
      ],
    },
    "m10-4": {
      title: "Correlação e diversificação",
      blocks: [
        { text: "A [[Диверсификация|diversificação]] funciona quando os ativos não se movem juntos. O quanto eles se movem juntos é mostrado pela [[Корреляция|correlação]]: 1 significa sempre juntos, 0 independentes, −1 sempre ao contrário." },
        null,
        { text: "A correlação diária de BTC e ETH em dois anos é 0,83. O quadro é parecido com a maioria das outras moedas, e nos colapsos a correlação é ainda maior: num dia ruim quase tudo cai. Dez moedas em vez de uma reduzem o risco de uma moeda específica ir a zero, mas quase não protegem contra uma queda do mercado." },
        { text: "**Um portfólio de 19 moedas contra o BTC:** vence a moeda média, mas perde para o BTC em retorno por unidade de drawdown.\n\n**Rotação entre BTC / ETH / altcoins por indicadores:** a correlação máxima do sinal com o resultado é 0,171, e o sinal se inverte em 6 casos de 15.\n\n**Escolher as 5 moedas mais calmas do top 40** foi aceito pelo risco: drawdown −94% → −44…−68%. Mas o excesso de retorno não alcança o limiar de significância.", source: "Catálogo de ideias do projeto: H6 «Um portfólio de 19 moedas», #3 «Rotação», #32 «Escolher moedas calmas»" },
        { q: "A correlação de duas moedas é 0,9. Quanto ajuda manter as duas em vez de uma?", options: ["Muito, o risco cai pela metade","Pouco: elas quase sempre caem e sobem juntas","O risco desaparece"], explain: "Com correlação de 0,9, a segunda moeda quase repete a primeira. A diversificação funciona com correlação baixa." },
        null,
      ],
    },
    "m10-5": {
      title: "Alavancagem no longo prazo",
      blocks: [
        { text: "Parece que uma alavancagem de 2x numa moeda em alta dá o dobro. No longo prazo não é assim. Se você mantém uma alavancagem constante, cada oscilação leva parte do capital: −50% e depois +50% não dão zero, mas −25%. É o [[Снос волатильности|arrasto da volatilidade]]; com alavancagem ele cresce com o quadrado da alavancagem." },
        null,
        { text: "BTC desde 2020: sem alavancagem ×10,6 com drawdown de −77%. Com alavancagem de 2x, ×6,4 e drawdown de −97%: mais risco e menos dinheiro. As alavancagens de 3x e 5x foram a zero já em março de 2020 e não participaram mais da alta. E isso sem taxas nem funding, que na vida real reduzem ainda mais o resultado.\n\nPara o BTC, com alta diária média de 0,147% e oscilações de 3,48%, a melhor alavancagem constante na sua história é de cerca de 1,2x. Um pequeno erro na estimativa do futuro — e a melhor alavancagem fica abaixo de 1." },
        { text: "Alavancagem de 1,6x em uma cesta de moedas: 31,1% ao ano contra 32,4% sem alavancagem. Nenhuma variante de alavancagem, piramidação ou ponderação por volatilidade deu uma vantagem duradoura.", source: "Catálogo de ideias do projeto: #20-38 «Alavancagem em uma cesta, piramidação»" },
        { q: "Em dois dias uma moeda caiu 50% e depois subiu 50%. E o capital sem alavancagem?", options: ["Inalterado","−25%","+25%"], explain: "100 → 50 → 75. A alta é contada a partir da soma reduzida. Com alavancagem, a perda por essas oscilações é ainda maior." },
        null,
      ],
    },
  },
};

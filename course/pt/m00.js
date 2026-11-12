// Перевод модуля m00 (pt). Формат — public/course/tr.js.
export default {
  id: "m00",
  src: "fabae8b7",
  title: "Como o curso funciona e o que esperar",
  summary: [
    "O curso explica cripto e trading em palavras simples; o programa permite verificar tudo na história real.",
    "Quase todas as ideias de trading, testadas com honestidade, não vencem o simples manter.",
    "Os números principais do programa: retorno, drawdown, comparação com a referência e o limiar de significância.",
  ],
  lessons: {
    "m00-1": {
      title: "O que o curso dá e o que não dá",
      blocks: [
        { text: "O programa tem dois modos. **Aprendizado** é o curso: o que são moedas, corretoras, carteiras e protocolos, como funciona o trading e como testar ideias com honestidade. **Trabalho** é o próprio teste: escolher moedas, ver o estado delas, escolher uma ideia, testá-la na história e acompanhá-la no papel, sem dinheiro." },
        { caption: "Os modos estão ligados: de uma lição você vai direto a um teste com dados reais, e do modo de trabalho abre a lição de que precisa." },
        { text: "O curso **dá** entendimento: o que acontece quando você aperta «comprar», de onde vêm os juros no DeFi, por que a mesma estratégia parece brilhante em um trecho da história e fracassa em outro.\n\nO curso **não dá** um jeito pronto de ganhar dinheiro e não diz o que comprar. Isto não é recomendação de investimento. Quando uma lição mostra uma estratégia, sempre mostra o que um teste honesto encontrou — inclusive quando o resultado é ruim." },
        { q: "O que você vai obter no modo de trabalho?", options: ["Sinais do que comprar hoje", "Um teste da sua ideia na história, com custos e comparação com a referência", "Trading automático em uma corretora"], explain: "O programa testa ideias em dados passados e faz paper trading. Não tem sinais de «compre agora» e não faz operações reais." },
      ],
    },
    "m00-2": {
      title: "Por que a maioria das estratégias não funciona",
      blocks: [
        { text: "Imagine 500 pessoas, cada uma jogando uma moeda 10 vezes. Alguém certamente vai tirar 8 ou 9 caras. Não é que jogue moedas melhor — só há muitas pessoas. Com ideias de trading é igual: teste muitas ideias, e algumas vão parecer excelentes por acaso." },
        { steps: ["10 pessoas: o melhor resultado costuma ser 6–8 caras.", "100 pessoas: alguém já tem 8–9 caras, embora a moeda seja honesta.", "500 pessoas: o melhor parece um mestre, mas é acaso. Quanto mais tentativas, mais alto deve ser o limiar."] },
        { text: "Por isso o programa calcula a [[t-статистика|estatística t]] — o quão consistentemente a ideia venceu a referência, candle após candle — e a compara com o [[Планка значимости|limiar de significância]]. O limiar sobe com o número de testes no diário: é a mesma correção para as «500 pessoas com uma moeda»." },
        { text: "A pesquisa sobre a qual o programa foi construído: 29 hipóteses e 563 variantes em cripto. Com tantas tentativas, o limiar é t acima de 3,09. Nenhuma ideia que prevê a direção do preço o superou: a ligação entre o sinal e o movimento futuro (IC) é de cerca de 0,04 e muda de sinal de um período para outro. Só o tamanho dos movimentos se mostrou previsível (IC de cerca de 0,51), mas dimensionar as posições por ele não compensou.", source: "Resumo do programa de pesquisa do projeto" },
        { label: "Veja quantas tentativas já há no seu diário" },
        { q: "Você testou 200 variantes de uma ideia, e a melhor venceu o manter. O que isso significa?", options: ["A ideia funciona, hora de operar", "Ainda nada: entre 200 variantes a melhor quase sempre parece boa por acaso — é preciso um limiar alto e um teste com dados novos", "É preciso testar mais 200 variantes"], explain: "A melhor entre muitas é como o melhor entre 500 jogadores de moeda. Sem correção pelo número de tentativas e sem um teste em dados que você não viu, não é prova." },
      ],
    },
    "m00-3": {
      title: "Como ler os números do programa",
      blocks: [
        { text: "Todo teste tem quatro números principais.\n\n**Retorno** — quanto o capital cresceu no período inteiro, depois de taxas e slippage.\n\n**[[Просадка|Drawdown]]** — a queda mais funda do capital de um pico até um vale. É o que você terá de aguentar sem abandonar a ideia." },
        { caption: "O resultado final pode ser positivo enquanto o capital caiu um terço no caminho. Duas ideias com o mesmo retorno e drawdowns diferentes são ideias diferentes." },
        { text: "**Comparação com a referência.** «+80%» sozinho não significa nada: se a moeda subiu 120% no mesmo tempo, a ideia perdeu para o simples [[Удержание (buy&hold)|manter]]. Por isso o programa sempre mostra a referência ao lado.\n\n**Acima do limiar ou não.** Mesmo que a ideia tenha vencido a referência, pode ser sorte — veja a lição anterior. A linha de resumo do programa responde às duas perguntas de uma vez: venceu a referência e passou do limiar?" },
        { q: "Uma ideia fez +150%, manter a mesma moeda fez +200%, e o drawdown da ideia é metade. Como descrever isso com honestidade?", options: ["A ideia é pior: perdeu para a referência", "A ideia é melhor: ganhou muito", "A ideia ganhou menos que manter, mas com drawdown menor; o que importa mais é decisão sua, e se é acaso o limiar mostra"], explain: "Retorno e drawdown são propriedades diferentes. Perder no retorno e ganhar no drawdown é uma escolha justa se feita conscientemente e se passar no teste contra o acaso." },
        { label: "Abrir o teste de ideias" },
        null,
      ],
    },
  },
};

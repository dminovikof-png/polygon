// Перевод модуля m03 (pt). Формат — public/course/tr.js.
export default {
  id: "m03",
  src: "dba8634e",
  title: "Corretoras centralizadas (CEX)",
  summary: [
    "O preço é um livro de ofertas: uma ordem a mercado paga o spread e o slippage; uma ordem limitada espera e paga menos.",
    "A taxa de uma ida e volta «compra — venda» parece minúscula, mas com operações frequentes ela come o capital mais rápido que qualquer erro de previsão.",
    "Futuros e alavancagem dão uma posição sem a moeda; com alavancagem de 10x, a liquidação vem com um movimento de cerca de 10% contra você — mesmo que o preço volte depois.",
  ],
  lessons: {
    "m03-1": {
      title: "Livro de ofertas e ordens",
      blocks: [
        { text: "Em uma [[CEX (централизованная биржа)|corretora centralizada]] ninguém define o preço. Existe um [[Стакан|livro de ofertas]] — a lista de todos que querem comprar e vender, com preços e volumes. Os vendedores ficam em cima, os compradores embaixo. O preço do melhor comprador é o [[Бид и аск|bid]], o do melhor vendedor é o ask, e a diferença entre eles é o [[Спред|spread]].\n\nHá dois tipos principais de ordem. Uma [[Лимитная заявка|ordem limitada]] diz «compro por no máximo 99,99» e, se não houver vendedor a esse preço, fica no livro esperando. Uma [[Рыночная заявка|ordem a mercado]] diz «compro agora» e pega as melhores ordens dos vendedores, uma depois da outra, até completar o volume." },
        { steps: ["Um livro de ofertas didático: em vermelho as ordens de venda, em verde as de compra. A largura da barra é o volume no nível.","Uma compra a mercado de 0,5 moeda cabe no melhor nível: o preço é o melhor ask, sem slippage.","Comprar 3 moedas come vários níveis: cada parte seguinte custa mais.","Uma compra grande desce fundo no livro. O preço médio fica bem pior que o melhor — isso é o slippage."] },
        null,
        { q: "Você coloca uma ordem limitada de compra abaixo do preço atual. O que acontece?", options: ["É executada na hora pelo preço de mercado","Fica no livro e só é executada se o preço cair até ela","A corretora a rejeita"], explain: "A ordem limitada garante o preço, mas não a execução. A ordem a mercado é o contrário: garante a execução, mas não o preço." },
        null,
      ],
    },
    "m03-2": {
      title: "Maker, taker e taxas",
      blocks: [
        { text: "Quem teve a ordem parada no livro esperando é um [[Мейкер|maker]]: acrescentou liquidez à corretora. Quem pegou uma ordem do livro é um [[Тейкер|taker]]. O taker paga a [[Комиссия|taxa]] mais alta.\n\nNo nível básico da Bybit em novembro de 2026: no spot, 0,1% tanto para o maker quanto para o taker; nos futuros perpétuos, 0,02% para o maker e 0,055% para o taker. Os números parecem minúsculos, mas a taxa é paga em cada lado: uma ida e volta «compra — venda» como taker no spot custa 0,2%, e o spread e o slippage vêm por cima." },
        { caption: "Uma ideia sem vantagem que simplesmente opera com frequência: cada ida e volta perde só a taxa. 500 idas e voltas como taker no spot transformam 100 dólares em cerca de 37." },
        { text: "Daí uma regra que o teste honesto confirma sempre: **quanto mais uma ideia opera, maior a vantagem de que ela precisa só para pagar as taxas.** Uma ideia que compra e vende todo dia com ordens a mercado no spot perde cerca de metade do capital por ano só em taxas.\n\nNo programa, a taxa e o slippage são descontados de cada operação em um teste. Se você vir resultados sem custos em algum lugar, considere-os inflados." },
        { text: "O projeto mediu o market making passivo — ficar no livro dos dois lados e ganhar o spread. Por ordem executada: metade do spread +0,33 bp, a perda pelo fato de serem justamente as ordens desfavoráveis as executadas −0,60 bp, a taxa −2,00 bp. O total é −2,27 bp por operação: mesmo com taxa zero o resultado é negativo.", source: "Catálogo de ideias do projeto: «Market making passivo»" },
        { q: "Uma ideia faz 300 idas e voltas por ano com ordens a mercado no spot (0,1% por lado). Quanto ela perde, mais ou menos, só em taxas?", options: ["0,3%","Cerca de 45% do capital","Nada, se as operações forem lucrativas"], explain: "300 idas e voltas × 0,2% dão um multiplicador de 0,998³⁰⁰ ≈ 0,55, ou seja, menos 45%. A taxa é paga em toda operação — vencedora e perdedora." },
        { label: "Testar uma ideia com as suas taxas" },
        { sources: ["Bybit: taxas do spot","Bybit: taxas dos futuros"] },
      ],
    },
    "m03-3": {
      title: "Slippage e liquidez",
      blocks: [
        { text: "O [[Проскальзывание|slippage]] é o quanto o preço de execução é pior que o melhor preço do livro. Depende do tamanho da sua ordem em relação à [[Глубина стакана|profundidade do livro]]. Para BTC e ETH nas grandes corretoras o livro é profundo: uma compra de dezenas de milhares de dólares quase não move o preço. Em moedas obscuras, até alguns milhares de dólares podem mover o preço em vários por cento.\n\nA [[Ликвидность|liquidez]] muda com o tempo: à noite, nos fins de semana e em momentos de pânico o livro fica mais fino e o spread mais largo. É justamente aí que o slippage mais dói — e justamente aí que você mais quer vender às pressas." },
        null,
        { text: "Carregue o livro de ofertas do BTC e, digamos, do DOGE, e compare quanto custa a mesma compra. O programa só lê os dados públicos da corretora — sem login, chaves ou ordens.\n\nOutra armadilha são as [[Стоп-заявка|ordens stop]]. Um stop «vender se o preço cair a 95» vira uma ordem a mercado numa queda brusca e é executado pelo preço que houver no livro naquele momento — às vezes bem abaixo de 95." },
        { q: "Quando o slippage costuma ser maior?", options: ["Num dia útil calmo para o BTC","Durante um movimento brusco em uma moeda pouco líquida","O slippage é sempre o mesmo"], explain: "Um livro fino e todo mundo com pressa ao mesmo tempo é a pior combinação. Por isso o teste de uma ideia que opera «no pânico» deve supor um slippage maior." },
        { sources: ["API da Bybit: livro de ofertas (dados públicos)"] },
      ],
    },
    "m03-4": {
      title: "Spot, futuros e funding",
      blocks: [
        { text: "No [[Спот|spot]] você compra a própria moeda. Um [[Фьючерс|contrato futuro]] é um contrato sobre o preço dela: você não tem a moeda, só a obrigação de liquidar a diferença de preço.\n\nOs [[Срочный фьючерс|futuros com vencimento]] têm uma data de [[Экспирация|vencimento]]. Até lá, o preço deles pode diferir do preço da moeda — essa diferença se chama [[Базис|base]], e na data de vencimento ela desaparece.\n\nOs [[Бессрочный фьючерс (перп)|futuros perpétuos]] não têm data. Para que o preço deles não se afaste do preço da moeda, existe o [[Фандинг|funding]]: pagamentos regulares entre os detentores de posições long e short." },
        null,
        null,
        { text: "Quando a multidão quer comprar com alavancagem, o contrato futuro fica mais caro que a moeda, a [[Ставка фандинга|taxa de funding]] fica positiva, e os [[Лонг|longs]] pagam aos shorts. Isso custa dinheiro: 0,01% a cada 8 horas dá cerca de 11% ao ano, e em períodos aquecidos a taxa pode ser várias vezes maior.\n\nUma ideia conhecida, o **carry**, é construída sobre isso: comprar a moeda no spot e ao mesmo tempo vender a mesma quantidade em futuros. O preço da moeda quase deixa de importar, e o funding, enquanto for positivo, vem para você." },
        { text: "O carry «spot + short no perpétuo» é uma das poucas ideias que sobreviveram aos testes do projeto: em 19 moedas, em 2021–2026, cerca de 22% ao ano em média, com drawdown de 1,4%. Mas o excesso sobre a referência, ano a ano, foi de +18,5, +5,0, +0,1 e 0,0 pontos percentuais, e em 2026 não houve uma única operação — o funding num mercado frio é quase zero. O retorno dependia de um mercado aquecido, que pode não vir.", source: "Catálogo de ideias do projeto: S1-5 «Carry de funding»" },
        { label: "Testar o carry em uma moeda" },
        { q: "A taxa de funding é +0,03% a cada 8 horas, e você tem uma posição long de 10 000 dólares. O que acontece?", options: ["Você recebe 3 dólares a cada 8 horas","Você paga 3 dólares a cada 8 horas — cerca de 33% ao ano","Nada, o funding só diz respeito aos shorts"], explain: "Com taxa positiva os longs pagam: 10 000 dólares × 0,03% = 3 dólares por pagamento, três pagamentos por dia — mais de 3 000 dólares por ano." },
        { sources: ["Bybit: funding dos contratos perpétuos"] },
      ],
    },
    "m03-5": {
      title: "Alavancagem, margem e liquidação",
      blocks: [
        { text: "A [[Плечо|alavancagem]] permite abrir uma posição maior que o seu dinheiro. Com alavancagem de 10x, 100 dólares de [[Маржа (залог)|margem]] abrem uma posição de 1 000 dólares. Um movimento de 1% no preço é 10% da sua margem, para qualquer lado.\n\nQuando a perda quase consome a margem, a corretora fecha a posição à força — isso é a [[Ликвидация|liquidação]]. A margem é perdida. A corretora mantém uma pequena folga — a [[Поддерживающая маржа|margem de manutenção]] — por isso a liquidação vem um pouco antes de a perda igualar a margem." },
        null,
        { text: "A principal armadilha da alavancagem é o caminho do preço, não o ponto final. Se o preço primeiro caiu 12% e depois subiu 20%, uma posição sem alavancagem está no lucro. Uma posição com alavancagem de 10x não viveu para ver a alta: foi liquidada na queda, e a volta do preço já não pode ajudá-la." },
        { steps: ["Alavancagem de 2x: o drawdown é desagradável, mas a posição sobrevive até a alta e termina cerca de duas vezes melhor que o preço.","Alavancagem de 5x: na queda a margem perde dois terços, e o resultado final fica bem no lucro — se os nervos aguentaram e a posição não foi fechada.","Alavancagem de 10x: o preço caiu 13%, mas a posição foi liquidada já em −9,5%. O preço subiu depois, mas a margem se foi.","Alavancagem de 20x: liquidação ainda mais cedo, no primeiro recuo perceptível."] },
        { text: "Mais dois conceitos. Com [[Изолированная маржа|margem isolada]], a liquidação leva só a margem daquela posição. Com [[Кросс-маржа|margem cruzada]], a conta inteira é garantia: a liquidação fica mais distante, mas uma posição ruim pode levar tudo. A liquidação é calculada pelo [[Маркировочная цена|preço de marcação]] — uma média de várias corretoras — para que um pico aleatório não liquide todo mundo." },
        { text: "A alavancagem não cria vantagem; ela a multiplica — junto com a ausência de vantagem. Nos testes do projeto, alavancagem de 1,6x em uma cesta de moedas deu 31,1% ao ano contra 32,4% sem alavancagem: os drawdowns e os rebalanceamentos comeram mais do que a alavancagem acrescentou. E a história de «+15% em 4 dias» em uma conta se revelou, na análise, simplesmente o movimento do mercado multiplicado por alavancagem de 3,5x.", source: "Catálogo de ideias do projeto: «Alavancagem em uma cesta…»; análise «Take-profit e stop não criam vantagem»" },
        { q: "Uma posição com alavancagem de 10x: o preço caiu 11%, depois subiu 30%. Qual é o resultado?", options: ["Cerca de +190%","A margem foi perdida: a posição foi liquidada na queda","Cerca de +19%"], explain: "Com alavancagem de 10x, a liquidação vem com um movimento de pouco menos de 10% contra a posição. A alta posterior já não a afeta." },
        { sources: ["Bybit: regras de liquidação"] },
      ],
    },
  },
};

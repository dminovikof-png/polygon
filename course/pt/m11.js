// Перевод модуля m11 (pt). Формат — public/course/tr.js.
export default {
  id: "m11",
  src: "2b7cb093",
  title: "Teste honesto",
  summary: [
    "Um backtest mostra o que teria acontecido se uma regra funcionasse no passado; ele mente com facilidade por antecipação, sobreajuste e custos errados.",
    "Entre centenas de estratégias aleatórias sempre há uma brilhante; o limiar de significância sobe com o número de tentativas, e a melhor do sandbox costuma ser comum em dados novos.",
    "A ordem do teste: escrever a regra antes, contar cada tentativa, abrir os dados reservados uma vez, depois o papel.",
  ],
  lessons: {
    "m11-1": {
      title: "Um backtest e suas promessas",
      blocks: [
        { text: "Um [[Бэктест|backtest]] é um cálculo de quanto uma regra teria ganhado se tivesse sido operada no passado. É o único jeito barato de testar uma ideia: não precisa de dinheiro, e anos de história são calculados em segundos.\n\nMas um backtest é um modelo, não o passado. Ele supõe que as operações teriam sido executadas pelo preço certo, que as taxas eram as informadas, que a regra era conhecida de antemão e não mudou. Cada uma dessas suposições pode ser quebrada sem você perceber — e você recebe uma curva bonita que nunca vai acontecer na vida real." },
        null,
        { text: "Um bot de grid em candles de uma hora mostrou +275,7 pontos percentuais. Em dados de um minuto, o mesmo bot deu −931%. O modelo de execução por hora contava rodadas que não teriam acontecido dentro da hora. O backtest estava aritmeticamente correto — a suposição sobre a execução estava errada.\n\nUm bot construído com regras do TradingView (VWAP, RSI(3), EMA(8) em candles de um minuto) deu 18 sinais em 5,6 anos: as condições quase se excluíam. Depois de corrigidas as condições — uma perda de −1,9 ponto percentual.", source: "Catálogo de ideias do projeto: grid «Bots de grid», vwap «VWAP + RSI(3) + EMA(8)»" },
        { q: "Um backtest mostrou +300% em três anos. O que verificar primeiro?", options: ["Nada, foi um computador que calculou","A execução, os custos, o número de tentativas e se a regra olha para o futuro","Só a taxa"], explain: "Um computador calcula corretamente o que mandam. Os erros estão nas suposições: a que preço uma operação é executada, o que se sabia no momento da decisão, quantas variantes foram tentadas." },
        null,
      ],
    },
    "m11-2": {
      title: "Olhar para o futuro",
      blocks: [
        { text: "O [[Заглядывание в будущее|viés de antecipação]] é quando o cálculo usa algo que ainda não existia no momento da decisão. O caso mais comum é um candle: a regra olha o fechamento do dia e «compra» no começo desse mesmo dia.\n\nO erro parece inocente: no código é o deslocamento de uma linha. Mas o resultado muda muitas vezes." },
        null,
        { text: "A linha azul é o cálculo honesto: uma decisão tomada no fechamento do dia vale a partir do dia seguinte. A vermelha ganha a alta do próprio dia em que a decisão foi tomada. A diferença é ×7 contra ×176.\n\nOutros tipos de antecipação: a lista de moedas «de hoje» (as moedas mortas saíram — [[Выжившая вселенная|viés de sobrevivência]]); um indicador recalculado sobre toda a história; parâmetros escolhidos nos mesmos dados em que depois se mostra o resultado." },
        { text: "O classificador de regimes Markov 2.0 prometia 82% de persistência de regime. O projeto verificou: as janelas de cálculo se sobrepunham, e os dias vizinhos quase se duplicavam. Com um passo honesto e sem sobreposição — 30% contra 33% de um palpite aleatório.", source: "Catálogo de ideias do projeto: markov «Markov 2.0: um classificador de regimes de mercado»" },
        { q: "Uma regra decide no fechamento do dia, e o backtest lhe credita a alta desse mesmo dia. O que está errado?", options: ["Está tudo certo","É antecipação: no momento da decisão a alta do dia já tinha acontecido","Só é preciso considerar a taxa"], explain: "Com honestidade, o retorno só deve ser recebido a partir do dia seguinte à decisão." },
        null,
      ],
    },
    "m11-3": {
      title: "500 macacos e o limiar",
      blocks: [
        { text: "Pegue 500 «macacos». Todo dia cada um muda a sua decisão com probabilidade de 5%: estar na moeda ou não. Nenhuma análise — puro acaso. Vamos rodá-los na história real do BTC, com taxa de 0,1%." },
        { steps: ["A maioria dos macacos fica atrás do simples manter: estão fora do mercado parte do tempo, e o mercado subiu.","Mas o melhor dos 500 venceu o manter várias vezes. Se isso fosse uma «estratégia» com um nome bonito, daria para vendê-la."] },
        { text: "Daí a lição principal: **se muitas variantes foram testadas, a melhor delas não prova nada**. Para distinguir habilidade de sorte, a [[t-статистика|estatística t]] da melhor variante é comparada com o [[Планка значимости|limiar]] — o que a melhor de N variantes de puro ruído dá. Uma tentativa: 1,96. Vinte: 2,45. Quinhentas: 3,53." },
        null,
        null,
        { text: "Toda tentativa conta: cada parâmetro, cada moeda, cada variante da regra, mesmo a descartada. Por isso o polígono mantém um diário de tentativas e eleva o limiar sozinho. O número honesto de tentativas é quase sempre maior do que se gostaria de admitir." },
        { text: "**Amplitude do mercado:** t 1,67 contra um limiar de 2,39. **Dados macro:** o melhor resultado t 2,71 contra um limiar de 2,87 — perto, mas não. Sem o limiar, as duas ideias teriam parecido funcionar: para uma única tentativa, 1,96 teria bastado.", source: "Catálogo de ideias do projeto: K7-H5 «Amplitude do mercado», macro «Macro»" },
        { q: "Você testou 200 variantes de uma regra, e a melhor deu t = 2,5. O que isso significa?", options: ["A regra funciona: 2,5 é mais que 1,96","Nada definido: para 200 tentativas o limiar é de cerca de 3,3, e 2,5 é um resultado comum para a melhor do ruído","A regra com certeza não funciona"], explain: "√(2·ln 200) ≈ 3,26. A melhor de 200 variantes aleatórias dá em média mais ou menos o mesmo t." },
        { label: "Ver o limiar e o diário no polígono" },
        null,
      ],
    },
    "m11-4": {
      title: "Sobreajuste e dados reservados",
      blocks: [
        { text: "O [[Переподгонка|sobreajuste]] é quando uma regra é afinada com tanta precisão ao passado que decorou o seu ruído. No sandbox ela brilha; em dados novos é como todas as outras.\n\nHá uma defesa: os [[Песочница и холдаут|dados reservados]]. A história é dividida em duas partes. Na primeira (o sandbox) você pode tentar e ajustar o que quiser. A segunda fica intocada até o fim e é aberta **uma vez**, quando a regra já foi escrita em definitivo." },
        null,
        { text: "Os macacos mostram isso com clareza: o melhor do sandbox se comporta como um aleatório nos dados reservados — a habilidade dele era sorte. A ligação entre a posição no sandbox e a posição depois é quase zero.\n\nCom regras reais é igual, só que mais brando. Abaixo está a regra «manter acima da média de n dias» com 30 variantes de n." },
        null,
        { text: "No BTC, o melhor n no sandbox deu ×36 contra uma mediana de ×7,6 entre as variantes. Nos dados reservados, o mesmo n deu ×2,2 — um pouco melhor que a mediana (×1,7) e que manter (×1,8). A promessa do sandbox é exagerada muitas vezes, embora a regra em si não seja sem sentido. Troque a moeda: em outras moedas a melhor variante do sandbox fica em 4º, 6º, 9º lugar de 30." },
        { text: "**Tartarugas:** a melhor variante ×21 no sandbox e ×0,84 nos dados reservados de 2025–2026 (t 0,44).\n\n**Repique depois de uma cascata de liquidações:** t 3,02 em 4 moedas, 0,98 em outras 10.\n\n**Entrada de stablecoins:** a ligação é real (t 3,02), mas a [[PBO (вероятность подгонки)|probabilidade de sobreajuste]] da regra é de 62,9%.\n\n**Uma condição pré-registrada:** o carry com expansão da base mostrou um fator de lucro de 7,6–9,3, mas quebrou a condição escrita antes do cálculo, «nem um único ano perdedor» — e foi rejeitado, por mais tentador que fosse mantê-lo.", source: "Catálogo de ideias do projeto: «Tartarugas», N, chain, S1-6" },
        { q: "Você abriu os dados reservados, e o resultado foi ruim. Você ajustou a regra e testou de novo — agora está bom. Dá para confiar?", options: ["Sim, a regra foi melhorada","Não: os dados reservados viraram mais um sandbox; é preciso dados novos e intocados ou paper trading","Sim, se a melhora for grande"], explain: "Os dados reservados funcionam uma vez. Depois de ajustar a eles, deixam de ser um teste independente." },
        null,
      ],
    },
    "m11-5": {
      title: "Os custos decidem",
      blocks: [
        { text: "Taxas, [[Проскальзывание|slippage]], [[Фандинг|funding]], o spread — percentuais pequenos por operação. Mas são pagos em toda operação, e a vantagem de uma regra costuma ser ainda menor. Quanto mais uma regra opera, mais os custos importam." },
        null,
        { text: "As «tartarugas» no BTC fizeram 136 operações e, com a taxa subindo de 0 para 0,5%, perderam metade do resultado: ×26 → ×13. Uma regra com 40 operações quase não sentiu a diferença. Em candles de uma hora e de um minuto há dezenas de vezes mais operações — lá, os custos costumam comer tudo." },
        { text: "**Market making passivo:** +0,33 bp de spread, −0,60 de seleção adversa, −2,00 de taxas — um total de −2,27 bp por operação.\n\n**Sazonalidade intradiária:** um efeito de 3–10 bp contra um limiar de 10.\n\n**Comprar o líder da hora:** o líder muda 21 vezes por dia — isso dá 1532% ao ano só em taxas.", source: "Catálogo de ideias do projeto: mm, seas, pump" },
        { q: "Uma regra ganha 0,08% por operação antes dos custos, e a taxa com slippage é de 0,15% por ida e volta. O que fazer?", options: ["Operar com mais frequência para ganhar mais","Não operar: depois dos custos cada operação é uma perda","Usar alavancagem"], explain: "Nem a frequência nem a alavancagem mudam o sinal do resultado de uma operação. É preciso uma vantagem maior ou custos menores." },
        { label: "Testar com as suas taxas" },
        null,
      ],
    },
  },
};

// Перевод модуля m07 (pt). Формат — public/course/tr.js.
export default {
  id: "m07",
  src: "58c0c122",
  title: "Análise fundamentalista",
  summary: [
    "Um protocolo e o seu token têm dinheiros diferentes: o que importa é se há um caminho da receita até o detentor — recompra, queima, distribuição.",
    "A emissão de moedas novas e os desbloqueios são vendedores constantes; para o preço ficar parado, a demanda precisa crescer na mesma medida.",
    "A atividade da rede e o preço da moeda estão ligados fracamente e com um atraso longo; muitas métricas on-chain são fáceis de falsificar.",
  ],
  lessons: {
    "m07-1": {
      title: "Receita e o caminho até o token",
      blocks: [
        { text: "A [[Фундаментальный анализ|análise fundamentalista]] pergunta: o que está por trás do preço? Uma ação tem o lucro da empresa e o direito a uma parte dele. Um token, por padrão, não tem esse direito.\n\nUm protocolo de trocas pode arrecadar centenas de milhões de dólares em taxas por ano, mas se todas as taxas vão para os provedores de liquidez, o detentor do token não recebe nada. Por isso se olha não para a [[Выручка протокола|receita do protocolo]] em geral, mas para o caminho da receita até o token." },
        null,
        { text: "Há três caminhos. **Distribuição** — parte das taxas é paga a quem fez staking do token. **[[Выкуп и сжигание|Recompra e queima]]** — o protocolo compra tokens no mercado e os destrói. **Direito de voto** — os detentores talvez um dia votem por uma distribuição; isso é uma promessa, não dinheiro.\n\nQuando há um caminho, dá para calcular um [[Мультипликатор|múltiplo]], como nas ações: o valor de todos os tokens / a receita anual que chega aos detentores. Para empresas maduras, 10–30 é típico. Para muitos tokens são centenas ou infinito, porque nada chega aos detentores." },
        { q: "Um protocolo ganhou 100 milhões de dólares em taxas, mas tudo vai para os provedores de liquidez. O que o detentor do token recebe?", options: ["A sua parte dos 100 milhões","Nada, enquanto não houver distribuição, recompra ou queima","Juros de um depósito"], explain: "A receita do protocolo e a renda do token são coisas diferentes. Sem um mecanismo que repasse dinheiro, o detentor possui só um voto e uma esperança." },
        { sources: ["DefiLlama: taxas e receita de protocolos"] },
      ],
    },
    "m07-2": {
      title: "Oferta: emissão e desbloqueios",
      blocks: [
        { text: "O preço é onde a oferta encontra a demanda. Fala-se muito da demanda e menos da oferta, embora a oferta seja mais fácil de contar.\n\nMoedas novas surgem de dois jeitos. A [[Эмиссия|emissão]] é a recompensa aos validadores ou mineradores, e acontece todo dia. Os [[Разблокировка|desbloqueios]] são lotes de tokens da equipe e dos investidores que ficam disponíveis para venda segundo um cronograma. Quem recebe muitas vezes vende: é preciso pagar salários, e os fundos precisam devolver dinheiro aos seus próprios investidores." },
        null,
        { text: "Se uma moeda emite 8% ao ano e o preço fica parado, a demanda em dólares na verdade cresceu 8%: as moedas novas a comeram. O detentor, enquanto isso, sofre [[Размывание|diluição]] — a sua fatia da rede encolhe.\n\nA emissão do BTC está agora abaixo de 1% ao ano e cai pela metade a cada quatro anos. Tokens jovens com um [[FDV|FDV]] 5–10 vezes maior que a capitalização têm vários anos de grandes desbloqueios pela frente." },
        { text: "O projeto tentou testar se grandes desbloqueios pressionam o preço nos dias em torno do evento. Só foram encontrados 21 eventos adequados com datas e volumes exatos, contra os 150 necessários para um teste honesto. A ideia foi congelada em 12.10.2026 sem abrir os dados reservados: ainda não há resposta de «funciona» ou «não funciona».\n\nIsso também é um resultado: os gráficos bonitos de «preço depois de um desbloqueio» nas redes sociais costumam ser construídos sobre poucos eventos escolhidos em retrospecto.", source: "Catálogo de ideias do projeto: U1 «Desbloqueios de tokens»" },
        { q: "Uma moeda emite 10% de moedas novas por ano. A capitalização dela cresceu 10% no ano. O que aconteceu com o preço?", options: ["Subiu 10%","Quase não mudou: todo o crescimento da capitalização foi para as moedas novas","Caiu 10%"], explain: "Capitalização = preço × moedas. Há 10% mais moedas, e a capitalização cresceu os mesmos 10% — o preço ficou igual." },
        { sources: ["Token Unlocks: cronogramas de desbloqueio"] },
      ],
    },
    "m07-3": {
      title: "A rede funciona, o preço cai",
      blocks: [
        { text: "Uma ideia tentadora: se uma rede é cada vez mais usada, a moeda deveria encarecer. Em trechos longos, a ligação existe de fato. Mas num horizonte de meses e até de um ano ela se afoga no humor do mercado." },
        null,
        { text: "Em 2022 a rede Bitcoin funcionou sem falhas e o hashrate cresceu — mesmo assim o preço caiu mais de três quartos. A rede não mudou; mudaram as taxas de juros, a liquidez e o apetite das pessoas por risco.\n\nPor isso os dados fundamentalistas respondem à pergunta «o que é isso e quanto pode valer em anos», mas servem mal para decidir «comprar esta semana»." },
        { text: "O projeto testou se dados macro (o dólar, as taxas de juros, os spreads de crédito, o VIX, o rendimento do título de 10 anos) preveem os retornos das cripto. O melhor resultado foi t 2,71 contra um limiar de 2,87: perto, mas não passa. O efeito do rendimento dos títulos sobre o BTC com t 3,60, de um estudo alheio, não se repetiu.", source: "Catálogo de ideias do projeto: macro «Macro: o dólar, juros, crédito, VIX»" },
        { q: "O número de endereços ativos em uma rede dobrou em um ano. O que se pode dizer sobre o preço daqui a um mês?", options: ["Vai dobrar","Quase nada: num horizonte curto o preço depende sobretudo do humor do mercado","Vai cair"], explain: "O uso da rede afeta o preço devagar e sem precisão. Em um mês, decidem os juros, a liquidez e o humor." },
        { sources: ["Blockchain.com: hashrate do Bitcoin"] },
      ],
    },
    "m07-4": {
      title: "Métricas on-chain e suas armadilhas",
      blocks: [
        { text: "Uma blockchain é aberta, por isso muita coisa pode ser contada: transferências, endereços, taxas, entradas de moedas nas corretoras, oferta de stablecoins. São as [[Ончейн-метрики|métricas on-chain]]. Mas abertura não é o mesmo que honestidade: muitos números custam quase nada para falsificar." },
        null,
        { text: "O número de endereços é inflado criando milhões de carteiras vazias. O volume de transferências, mandando as mesmas moedas em círculo. O [[TVL|TVL]] cresce quando o mesmo dinheiro é depositado em vários protocolos em cadeia. O mais difícil de falsificar é o que custa dinheiro de verdade: taxas da rede, receita dos protocolos, moedas queimadas." },
        { text: "Duas ideias on-chain populares nos testes do projeto:\n\n**A entrada de stablecoins** como sinal de alta: a ligação é real (t 3,02), mas a regra de trading concreta se revelou sobreajustada — uma probabilidade de sobreajuste de 62,9%.\n\n**Os fluxos de moedas para as corretoras** («as baleias trazem moedas para vender»): t 1,24, e em 5 anos de 7 o sinal foi o oposto do esperado.", source: "Catálogo de ideias do projeto: chain «Oferta de stablecoins, fluxos para corretoras»" },
        { q: "Qual métrica é a mais difícil de falsificar?", options: ["O número de endereços novos","O volume de transferências dentro da rede","As taxas que os usuários pagaram à rede"], explain: "As taxas são despesas reais. Só podem ser infladas queimando o próprio dinheiro, e isso é caro." },
        { sources: ["DefiLlama: stablecoins"] },
      ],
    },
  },
};

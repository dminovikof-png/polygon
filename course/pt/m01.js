// Перевод модуля m01 (pt). Формат — public/course/tr.js.
export default {
  id: "m01",
  src: "7a526d73",
  title: "Blockchain e moedas",
  summary: [
    "Uma blockchain é um registro comum de transferências mantido por milhares de computadores; os blocos são ligados por hashes, por isso o passado não pode ser reescrito sem que se perceba.",
    "Quem adiciona o próximo bloco é decidido pelo consenso: trabalho (Bitcoin) ou participação (Ethereum). Um ataque exige a maioria do poder ou da participação.",
    "Moedas de rede, tokens, stablecoins e camada dois são coisas diferentes com riscos diferentes: cada uma tem seu próprio «em quem você confia».",
  ],
  lessons: {
    "m01-1": {
      title: "Bloco, hash e cadeia",
      blocks: [
        { text: "Um banco guarda para si o registro de «quem tem quanto dinheiro». Uma [[Блокчейн|blockchain]] faz o mesmo, mas o registro é mantido por milhares de computadores no mundo todo, e nenhum deles manda. Para que esse registro não vire caos, as transferências são reunidas em lotes — [[Блок|blocos]] — e enfileiradas em uma cadeia.\n\nA ligação entre os blocos se apoia em um [[Хеш|hash]]. Um hash é uma impressão digital de um dado: qualquer texto vira uma sequência do mesmo tamanho, e mudar uma única letra a muda por completo. Não é possível recuperar o dado a partir do hash." },
        null,
        { text: "Tente mudar um dígito do valor no campo acima — o hash fica completamente diferente. Para um bloco ser aceito, seu hash precisa começar com vários zeros. O único jeito de conseguir isso é na força bruta: trocar o número [[Nonce|nonce]] e recalcular o hash até dar sorte. Isso é a [[Майнинг|mineração]].\n\nCada bloco guarda o hash do anterior. Por isso falsificar um registro antigo significa recalcular não um bloco, mas todos os que vêm depois dele, e fazer isso mais rápido do que o resto da rede adiciona blocos novos." },
        { steps: ["A cadeia está em ordem: o hash de cada bloco confere e começa com dois zeros, e cada bloco aponta para o hash do bloco anterior.","Alguém mudou o valor no segundo bloco para 200. O hash do bloco mudou e não começa mais com zeros — a falsificação aparece na hora.","O atacante encontrou um novo nonce para o segundo bloco. Mas o terceiro bloco aponta para o hash antigo — agora a ligação está rompida.","Para a falsificação passar, todos os blocos seguintes precisam ser minerados de novo, ultrapassando a rede, que enquanto isso continua adicionando blocos. No Bitcoin, isso exige mais da metade do poder de toda a rede."] },
        { q: "Por que não é possível mudar discretamente o valor de uma transferência em um bloco antigo?", options: ["Os blocos são criptografados com uma senha","O hash desse bloco muda, e os blocos seguintes apontam para o hash antigo — a cadeia inteira teria de ser recalculada mais rápido que o resto da rede","As regras da corretora proíbem"], explain: "A proteção não é o sigilo (os dados da blockchain são abertos a todos), mas as ligações por hash e o custo da força bruta: reescrever o passado custa mais do que participar honestamente." },
        { sources: ["O artigo de Satoshi Nakamoto sobre o Bitcoin (2008)"] },
      ],
    },
    "m01-2": {
      title: "Consenso: trabalho ou participação",
      blocks: [
        { text: "Milhares de [[Узел (нода)|nós]] precisam concordar sobre qual bloco vem a seguir. A regra desse acordo se chama [[Консенсус|consenso]]. Há dois jeitos principais.\n\n**[[PoW (доказательство работы)|Prova de trabalho]].** O direito ao bloco vai para quem encontrar o nonce primeiro. A chance é proporcional ao poder de cálculo, e poder custa dinheiro: equipamento e eletricidade. Trapacear não compensa — você gasta os mesmos recursos, e a rede rejeita um bloco inválido.\n\n**[[PoS (доказательство доли)|Prova de participação]].** Os blocos são propostos por [[Валидатор|validadores]] que depositaram uma garantia nas moedas da rede. Quem assina dois blocos diferentes para o mesmo slot ou quebra as regras perde parte do depósito ([[Слэшинг|slashing]]). Quase não se gasta eletricidade; em vez disso, a segurança se apoia no valor do depósito." },
        null,
        { text: "Os dois jeitos têm um ponto fraco em comum — o [[Атака 51 %|ataque da maioria]]. Quem controla mais da metade do poder (ou uma grande parte da participação) pode reescrever blocos recentes e fazer um [[Двойная трата|gasto duplo]]. Em redes grandes isso custa bilhões de dólares; em redes pequenas, com poder barato, esses ataques já aconteceram de verdade.\n\nDaí a conclusão prática: uma corretora considera uma transferência recebida não na hora, mas depois de várias confirmações — blocos por cima dela. Quanto menor a rede, mais confirmações a corretora exige." },
        { q: "O que torna a trapaça não lucrativa em uma rede de prova de participação?", options: ["A senha do administrador da rede","O depósito do validador: por quebrar as regras, a rede tira parte das moedas dele","O custo da eletricidade"], explain: "Na PoS, a «participação» é o depósito. A eletricidade é a proteção da prova de trabalho, e uma rede aberta não tem administrador." },
        { sources: ["ethereum.org: prova de participação"] },
      ],
    },
    "m01-3": {
      title: "Bitcoin: regras de emissão",
      blocks: [
        { text: "O Bitcoin é a primeira e maior rede. Moedas novas surgem apenas como [[Награда за блок|recompensa por bloco]]. No início a recompensa era de 50 BTC, e a cada 210 000 blocos (mais ou menos a cada quatro anos) ela é cortada pela metade — é o [[Халвинг|halving]]. O último halving foi em abril de 2024: a recompensa passou a 3,125 BTC. O próximo é esperado por volta de abril de 2028, no bloco 1 050 000.\n\nDessas regras decorre um limite: no total, serão emitidos pouco menos de 21 milhões de BTC. Mais de 95% já foi emitido." },
        { caption: "A curva é calculada a partir das regras de emissão, não tirada de um site: 210 000 blocos por nível de recompensa, e a recompensa cai pela metade a cada vez." },
        { text: "A emissão limitada costuma ser apresentada como o motivo pelo qual o bitcoin «tem de» subir. Não é bem assim: a oferta é conhecida por todos com antecedência e já está no preço. O preço é movido pela demanda, e a demanda muda. Na sua história, o bitcoin caiu mais de 70% desde o pico várias vezes.\n\nA recompensa por bloco é a principal renda dos mineradores. À medida que ela encolhe, a renda deles depende cada vez mais das taxas das transferências. Quanto tempo isso vai durar e como vai terminar, ninguém sabe ao certo." },
        { text: "O projeto testou a hipótese de que grandes eventos de emissão (halvings, desbloqueios de tokens) produzem movimentos previsíveis no preço. O resultado para os desbloqueios: «indeterminado» — só 21 eventos adequados contra os 150 necessários, e o período reservado não foi aberto. Tirar conclusões de 3–4 halvings é ainda mais arriscado: isso não é uma amostra, são só alguns casos.", source: "Hipótese U1 (desbloqueios de tokens), diário de pesquisa do projeto" },
        { q: "A recompensa por bloco do Bitcoin em novembro de 2026:", options: ["50 BTC","6,25 BTC","3,125 BTC","Depende do preço"], explain: "Desde o halving de abril de 2024, 3,125 BTC. A recompensa depende do número do bloco, não do preço; vai cair para 1,5625 BTC no bloco 1 050 000." },
        { sources: ["bitcoin.org"] },
      ],
    },
    "m01-4": {
      title: "Ethereum e contratos inteligentes",
      blocks: [
        { text: "O Bitcoin guarda sobretudo transferências. O Ethereum guarda também programas — [[Смарт-контракт|contratos inteligentes]]. Um contrato é como uma máquina de venda automática: as regras estão escritas em código e são cumpridas não por uma empresa, mas pela rede inteira. Coloque uma moeda, receba o produto; as regras são as mesmas para todos e visíveis para todos.\n\nOs contratos rodam na [[EVM|EVM]], o «computador» comum da rede. Sobre ela são construídas corretoras sem empresa, empréstimos, stablecoins e tokens. Cada ação é uma [[Транзакция|transação]] assinada com a sua chave." },
        null,
        { text: "A força de um contrato é que ele não pode ser alterado nem parado em segredo. A fraqueza é a mesma: um bug no código também não pode ser corrigido rapidamente, e a rede vai executá-lo com a mesma precisão. A maioria das perdas no DeFi não é «invasão da blockchain», mas um bug em um contrato específico ou uma chave de administrador roubada (mais sobre isso no módulo 5).\n\nDesde setembro de 2022 o Ethereum funciona com prova de participação: a mudança foi chamada de The Merge. O consumo de eletricidade da rede caiu mais de 99%." },
        { q: "O contrato de uma corretora executou uma troca por causa de um bug no código — não do jeito que os autores pretendiam. O que a rede vai fazer?", options: ["Cancelar a troca","Executá-la: a rede verifica se o código rodou corretamente, não se o código está correto","Devolver o dinheiro pelo suporte"], explain: "Os nós só verificam se um programa rodou de acordo com o próprio código. Se o código em si é bom é uma questão para os autores e auditores. A rede não tem um suporte que devolva dinheiro." },
        { sources: ["ethereum.org: contratos inteligentes","ethereum.org: The Merge"] },
      ],
    },
    "m01-5": {
      title: "Tokens e stablecoins",
      blocks: [
        { text: "Cada rede tem a [[Нативная монета|sua moeda]]: com ela se paga o trabalho da rede. Todo o resto são [[Токен|tokens]]: registros em um contrato inteligente de «qual endereço tem quanto». Para que carteiras e corretoras entendam qualquer token, existem padrões comuns, como o [[ERC-20|ERC-20]]. Um [[NFT|NFT]] também é um token, só que cada exemplar é único.\n\nQualquer um pode emitir um token em poucos minutos por alguns dólares. Por isso o simples fato de um token existir e ser negociado não diz nada sobre o seu valor." },
        { text: "Um tipo especial são as [[Стейблкоин|stablecoins]]: tokens que tentam valer exatamente 1 dólar. A maior parte do trading roda sobre elas, e elas são de três tipos — com riscos diferentes." },
        null,
        { text: "**Lastreadas em dinheiro** (USDT, USDC) se apoiam no [[Эмитент|emissor]]: uma empresa guarda dólares e títulos e promete a troca 1:1. O risco está na empresa, no banco dela e no fato de que ela pode congelar tokens em qualquer endereço a pedido das autoridades.\n\n**Lastreadas em cripto** (DAI) se apoiam em sobregarantia em um contrato inteligente. O risco é um colapso brusco da garantia ou um bug no código.\n\n**Algorítmicas** se apoiam na promessa de troca pelo «seu próprio» token. Em maio de 2022, o UST da Terra perdeu a paridade: vender UST imprimia novos tokens LUNA, a LUNA ficava mais barata, e isso provocava mais vendas. Em poucos dias o UST caiu quase a zero, e dezenas de bilhões de dólares sumiram com ele. Esse descolamento do preço se chama [[Депег|depeg]]." },
        { q: "Qual é a principal coisa a descobrir sobre uma stablecoin antes de manter dinheiro nela?", options: ["Como é o logotipo dela","O que a lastreia e quem é obrigado a trocá-la por 1 dólar","Quanto ela vale hoje — se vale 1 dólar, é confiável"], explain: "O preço de 1 dólar hoje não garante nada: o UST valia 1 dólar até o colapso. O que importa é o que está por trás do token e quem responde pela troca." },
        { sources: ["ethereum.org: stablecoins","ethereum.org: o padrão ERC-20"] },
      ],
    },
    "m01-6": {
      title: "Gas, camada um e camada dois",
      blocks: [
        { text: "O trabalho da rede não é de graça. No Ethereum ele é medido em unidades de [[Газ|gas]]: uma transferência simples custa 21 000 de gas, uma troca em uma corretora várias vezes mais. A taxa é o gas multiplicado pelo [[Цена газа|preço do gas]]. O preço é formado por uma parte base, que é [[Сжигание|queimada]], e uma gorjeta ao validador." },
        null,
        { text: "Quando todos querem entrar em um bloco, o preço do gas sobe — houve dias em que uma troca simples custava dezenas de dólares. Daí a ideia da camada dois. A [[L1 (первый уровень)|camada um]] é a própria rede, com consenso próprio. A [[L2 (второй уровень)|camada dois]] junta muitas transferências em um lote e grava o lote inteiro na camada um de uma vez. A taxa é dividida entre todos." },
        { steps: ["Oito transferências na rede principal — oito registros e oito pagamentos de gas.","As mesmas transferências são enviadas à camada dois.","A camada dois as junta em um lote e o grava na rede principal.","Cada um paga mais ou menos um oitavo do gas mais a taxa da camada dois. Na vida real, um lote tem milhares de transferências."] },
        { text: "Essas segundas camadas se chamam [[Роллап|rollups]]. Os [[Оптимистичный роллап|otimistas]] consideram um lote válido até que alguém prove o contrário — por isso sacar dinheiro para a rede principal pode levar cerca de uma semana. Os [[ZK-роллап|rollups ZK]] anexam ao lote uma prova matemática.\n\nO preço do barato são riscos novos: a camada dois tem um operador que monta os lotes e uma [[Мост|ponte]] para mover dinheiro entre as camadas. Mais sobre isso no módulo 5." },
        { q: "Você transfere 10 dólares e 10 000 000 de dólares do mesmo jeito na mesma rede. A taxa de gas é:", options: ["Um milhão de vezes maior no segundo caso","Mais ou menos a mesma — você paga pelo cálculo, não pelo valor","Grátis no segundo caso"], explain: "O gas é o pagamento pelo trabalho da rede. Transferir qualquer valor é o mesmo trabalho. Por isso transferências pequenas em uma rede principal congestionada não compensam, enquanto as grandes custam quase nada em termos percentuais." },
        { sources: ["ethereum.org: gas e taxas","ethereum.org: camada 2"] },
      ],
    },
  },
};

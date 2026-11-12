// Перевод модуля m02 (pt). Формат — public/course/tr.js.
export default {
  id: "m02",
  src: "33bb3de1",
  title: "Carteiras e segurança",
  summary: [
    "As moedas estão na blockchain; a carteira guarda a chave. Quem conhece a chave ou a frase-semente é o dono, e não há ninguém para reverter uma transferência.",
    "Na corretora você confia na corretora; na sua própria carteira, em si mesmo. As duas opções têm seus próprios jeitos de perder dinheiro.",
    "O dinheiro se perde mais por uma assinatura que a própria pessoa deu do que pela invasão de uma rede: phishing, autorizações, «suporte», renda prometida.",
  ],
  lessons: {
    "m02-1": {
      title: "Quem guarda as chaves: a corretora ou você",
      blocks: [
        { text: "Uma [[Кошелёк|carteira]] não guarda moedas — elas sempre estão registradas na blockchain. A carteira guarda a [[Закрытый ключ|chave privada]]: um número secreto que dá o direito de assinar uma transferência. Daí dois jeitos de guardar.\n\n**[[Хранение у биржи|Custódia na corretora]].** A corretora tem as chaves; você tem um registro no banco de dados dela dizendo «1 BTC é seu». Prático: há senha, recuperação, suporte. Mas se a corretora falir, for invadida ou congelar a conta, o registro pode não ter nada por trás.\n\n**[[Самостоятельное хранение|Autocustódia]].** Só você tem a chave. Ninguém vai congelar nem gastar suas moedas. Mas também ninguém vai ajudar você a recuperar o acesso, e uma transferência errada não pode ser revertida." },
        null,
        { text: "Um exemplo do risco da corretora é a FTX: em novembro de 2022, uma das maiores corretoras do mundo suspendeu os saques e faliu; descobriu-se que o dinheiro dos clientes tinha sido usado pela empresa. Os clientes esperaram anos pelo reembolso na justiça.\n\nUm exemplo do risco da autocustódia são os milhares de pessoas que perderam a frase-semente ou enviaram moedas para o endereço errado. Não há como recuperar esse dinheiro.\n\nA conclusão honesta: a escolha não é «seguro ou inseguro», mas **em quem você confia**. Para operar, o dinheiro precisa ficar em uma corretora. O dinheiro que não é necessário para operar, muita gente guarda na própria carteira." },
        { q: "Você guarda moedas em uma conta de corretora. O que você realmente possui?", options: ["Moedas na blockchain no seu próprio endereço","A obrigação da corretora de entregar as moedas a você quando pedir","A chave do endereço da corretora"], explain: "Na corretora você tem um registro no banco de dados dela. Enquanto a corretora for solvente e permitir saques, a diferença não aparece; numa falência, você vira um dos credores." },
        { sources: ["ethereum.org: carteiras"] },
      ],
    },
    "m02-2": {
      title: "Frase-semente e chaves",
      blocks: [
        { text: "Quando você cria uma carteira, ela mostra uma [[Seed-фраза|frase-semente]] — 12 ou 24 palavras. A partir dessa frase a carteira calcula todas as suas chaves; das [[Закрытый ключ|chaves privadas]], as [[Открытый ключ|públicas]]; e delas, os [[Адрес|endereços]]. As setas só vão para um lado: sabendo um endereço não se descobre a chave; sabendo uma chave não se descobre a frase." },
        null,
        { text: "Daí três regras.\n\n**1. A frase é tudo.** Quem a conhece pode restaurar a carteira em qualquer dispositivo e levar tudo de todos os endereços. A frase da mesma carteira não pode ser trocada — só é possível criar uma carteira nova e mover as moedas para ela.\n\n**2. A frase nunca é digitada em lugar nenhum, exceto para restaurar a sua própria carteira.** Nenhum site, «suporte», «verificação de carteira» ou distribuição de tokens precisa da sua frase. Um pedido para digitar a frase é sinal de golpe em 100% dos casos.\n\n**3. A frase é guardada offline.** Em papel ou em uma placa de metal, em um lugar seguro, de preferência em dois. Não a fotografe e não a guarde na nuvem nem nas notas do celular.\n\nAdivinhar uma frase na força bruta é impossível: 12 palavras têm cerca de 2¹²⁸ combinações; mesmo na velocidade de toda a rede Bitcoin, a busca levaria cerca de 10 bilhões de anos. Por isso as frases não são quebradas — são arrancadas das pessoas." },
        { q: "O site de uma carteira diz: «Foi detectado um erro de sincronização, digite sua frase-semente para verificar». O que fazer?", options: ["Digitar, já que é o site da carteira","Fechar o site: nenhuma verificação precisa da frase, é golpe","Digitar só as 6 primeiras palavras"], explain: "Serviços honestos nunca precisam da frase. Parte da frase também é perigosa: as palavras restantes às vezes podem ser adivinhadas." },
        { sources: ["ethereum.org: segurança"] },
      ],
    },
    "m02-3": {
      title: "Carteiras de hardware e bons hábitos",
      blocks: [
        { text: "Uma [[Горячий кошелёк|carteira quente]] — um app ou uma extensão do navegador — guarda a chave em um dispositivo conectado à internet. Se o dispositivo for infectado, a chave pode ser roubada. Uma [[Аппаратный кошелёк|carteira de hardware]] é um dispositivo separado do qual a chave nunca sai: o computador envia a ele uma transação, e o dispositivo a mostra na própria tela e assina por dentro.\n\nO principal com uma carteira de hardware é **olhar para a tela dela**, não para a do computador. Se um programa malicioso trocou o endereço do destinatário, isso só aparece ali." },
        { caption: "Envenenamento de endereço: o golpista conta com você copiar um endereço parecido do seu histórico de transferências." },
        { text: "Os hábitos que mais salvam dinheiro:\n\n**Uma transferência de teste.** Antes de uma transferência grande para um endereço novo, envie um valor pequeno e confira se chegou.\n\n**O endereço de uma fonte confiável.** Não do seu histórico de transferências nem de uma mensagem no chat; confira o endereço inteiro, não só o começo e o fim.\n\n**Separação.** Um valor pequeno para o dia a dia em uma carteira quente, o grosso em [[Холодное хранение|armazenamento frio]].\n\n**[[Мультиподпись|Multiassinatura]]** para valores grandes: uma transferência exige assinaturas de várias chaves, por exemplo duas de três.\n\n**Sem pressa.** Quase todo golpe empurra a urgência." },
        { q: "A carteira de hardware mostra um endereço de destinatário diferente do que você vê na tela do computador. Em qual confiar?", options: ["Na tela do computador — é maior","Na tela da carteira de hardware: a troca de endereço acontece no computador, não no dispositivo","Enviar e ver onde chega"], explain: "O sentido de uma carteira de hardware é que a tela dela não é controlada por um computador infectado. Se os endereços não batem, cancele a transferência." },
        { sources: ["ethereum.org: segurança"] },
      ],
    },
    "m02-4": {
      title: "Autorizações para contratos inteligentes",
      blocks: [
        { text: "Para trocar um token em uma corretora descentralizada, primeiro é preciso dar ao contrato dela uma [[Разрешение (approve)|autorização]] para gastar esse token. As carteiras muitas vezes sugerem por padrão uma autorização ilimitada: assim você não paga por uma nova autorização a cada troca.\n\nO problema é que a autorização continua depois da troca. Se o contrato for invadido mais tarde, ou se o site era falso desde o começo, seus tokens podem ser levados sem uma nova assinatura." },
        { steps: ["Você quer trocar 100 USDT.","A carteira pede que você assine uma autorização. Olhe o valor: muitas vezes é «ilimitado».","A troca foi feita, mas a autorização não foi a lugar nenhum.","Um contrato invadido ou falso leva tudo o que foi autorizado. As autorizações de que você não precisa mais devem ser revogadas."] },
        { text: "Os sites fraudulentos do tipo [[Дрейнер|drainer]] são construídos exatamente sobre isso: com o pretexto de «resgatar uma recompensa» ou «verificar a carteira», pedem que você assine uma autorização ou uma mensagem assinada especial (sem taxa de gas, por isso parece inofensiva). Depois da assinatura, os tokens somem.\n\nO que fazer:\n\n**Leia o que você está assinando.** Se a carteira mostra «permitir gasto» ou «assinar mensagem» onde você não está comprando nada, pare.\n\n**Defina um limite** — exatamente o valor da troca.\n\n**[[Отзыв разрешения|Revogue]] autorizações antigas.** O [[Обозреватель блоков|explorador de blocos]] da rede ou a própria carteira mostram a lista das suas autorizações; revogar é uma transação comum, com taxa de gas." },
        { q: "Um site de distribuição de tokens pede que você «assine uma mensagem, é grátis». Por que isso pode ser perigoso?", options: ["Não é perigoso: sem taxa de gas, nada vai acontecer","A mensagem assinada pode ser uma autorização para gastar seus tokens — ela será usada depois","Só é perigoso para o bitcoin"], explain: "Alguns padrões permitem dar uma autorização por meio de uma assinatura, sem transação. Sem taxa não significa sem consequências." },
        { sources: ["ethereum.org: segurança e autorizações"] },
      ],
    },
    "m02-5": {
      title: "Esquemas de golpe",
      blocks: [
        { text: "Em cripto, quase todas as perdas de pessoas físicas não são invasões de rede, mas [[Социальная инженерия|engenharia social]]: a própria pessoa entrega a frase, uma assinatura ou uma transferência. Os esquemas se repetem, e vale a pena conhecê-los de vista." },
        null,
        { text: "**Suporte que escreve primeiro.** O suporte real de corretoras e carteiras não escreve para você em mensagens privadas e nunca pede a frase, uma senha ou um código de e-mail.\n\n**[[Фишинг|Phishing]].** Um site parecido vindo de um anúncio, um e-mail ou uma busca. Abra os sites pelos favoritos salvos.\n\n**Um novo conhecido com uma «plataforma».** Vocês se conhecem numa rede social ou num app, ficam amigos por semanas, e então vem o conselho de investir pela plataforma «dele». Os números lá crescem, mas o saque não sai: pedem um «imposto» ou uma «taxa de saque». A plataforma era falsa desde o começo.\n\n**Renda garantida.** «2% ao dia sem risco» é uma [[Финансовая пирамида|pirâmide financeira]]: a renda é paga com o dinheiro dos que chegam depois, enquanto continuarem chegando.\n\n**[[Памп и дамп|Pump and dump]].** Um grupo: «todos compramos juntos às 20h». Os organizadores compraram antes e vendem para você no pico.\n\n**[[Раг-пул|Rug pull]].** Um token novo com um site bonito; os criadores retiram o dinheiro do pool e somem." },
        { text: "O projeto testou dezenas de ideias de trading, inclusive «multiplicar» rápido um depósito pequeno: alavancagem de 100x, dobrar a aposta depois de uma perda, fazer preço médio na queda. Nenhuma deu renda estável, e os esquemas de dobrar a aposta têm expectativa negativa pela própria construção. Se alguém promete um percentual estável por dia, um teste honesto não encontra resultados assim; então o dinheiro não vem do mercado.", source: "Catálogo de ideias do projeto: «Crescimento rápido: alavancagem de 100x, martingale, DCA e bots de grid»" },
        { q: "O que quase todos os esquemas de golpe têm em comum?", options: ["Uma invasão sofisticada da blockchain","Urgência e o pedido para você mesmo entregar a frase, uma assinatura ou dinheiro","Só acontecem com moedas obscuras"], explain: "Invadir uma rede é caro; convencer uma pessoa é barato. Por isso a principal proteção é não ter pressa e não entregar nada que dê acesso ao dinheiro." },
        { q: "Uma plataforma mostra seu lucro em +300%, mas para sacar pede que você pague um «imposto de 20%» por transferência. O que isso provavelmente é?", options: ["Uma regra normal de corretora","Golpe: os números de uma plataforma falsa não valem nada, e o «imposto» é mais um jeito de levar dinheiro","É preciso pagar para não perder o lucro"], explain: "Corretoras reais não exigem uma transferência para sacar; impostos são pagos ao Estado pela declaração, não a uma plataforma. O dinheiro enviado «para o imposto» também será perdido." },
        { sources: ["FSCA (regulador da África do Sul): alertas de fraude","FBI: Internet Crime Complaint Center"] },
      ],
    },
  },
};

// Перевод модуля m01 (es). Формат — public/course/tr.js.
export default {
  id: "m01",
  src: "7a526d73",
  title: "Blockchain y monedas",
  summary: [
    "Un blockchain es un registro común de transferencias que mantienen miles de ordenadores; los bloques están enlazados por hashes, así que el pasado no puede reescribirse sin que se note.",
    "Quién añade el siguiente bloque lo decide el consenso: trabajo (Bitcoin) o participación (Ethereum). Un ataque necesita la mayoría de la potencia o de la participación.",
    "Las monedas de red, los tokens, las stablecoins y la capa dos son cosas distintas con riesgos distintos: cada una tiene su propio «en quién confía».",
  ],
  lessons: {
    "m01-1": {
      title: "Bloque, hash y cadena",
      blocks: [
        { text: "Un banco guarda para sí el registro de «quién tiene cuánto dinero». Un [[Блокчейн|blockchain]] hace lo mismo, pero el registro lo guardan miles de ordenadores en todo el mundo, y ninguno de ellos manda. Para que ese registro no se convierta en un caos, las transferencias se agrupan en lotes —[[Блок|bloques]]— y se ponen en fila formando una cadena.\n\nEl enlace entre bloques se basa en un [[Хеш|hash]]. Un hash es una huella de los datos: cualquier texto se convierte en una cadena de la misma longitud, y cambiar una sola letra la cambia por completo. A partir del hash no se pueden recuperar los datos." },
        null,
        { text: "Pruebe a cambiar una cifra del importe en el campo de arriba: el hash se vuelve completamente distinto. Para que un bloque sea aceptado, su hash debe empezar con varios ceros. La única forma de lograrlo es la fuerza bruta: cambiar el número [[Nonce|nonce]] y recalcular el hash hasta tener suerte. Eso es la [[Майнинг|minería]].\n\nCada bloque guarda el hash del anterior. Así que falsificar un registro antiguo significa recalcular no un bloque sino todos los que vienen detrás, y hacerlo más rápido de lo que el resto de la red añade bloques nuevos." },
        { steps: ["La cadena está en orden: el hash de cada bloque cuadra y empieza con dos ceros, y cada bloque remite al hash del anterior.","Alguien cambió el importe del segundo bloque a 200. El hash del bloque cambió y ya no empieza con ceros: la falsificación se ve al instante.","El atacante encontró un nuevo nonce para el segundo bloque. Pero el tercer bloque remite al hash antiguo: ahora el enlace está roto.","Para que la falsificación pase, hay que volver a minar todos los bloques siguientes, adelantándose a la red, que mientras tanto sigue añadiendo bloques nuevos. En Bitcoin eso requiere más de la mitad de la potencia de toda la red."] },
        { q: "¿Por qué no se puede cambiar discretamente el importe de una transferencia en un bloque antiguo?", options: ["Los bloques están cifrados con una contraseña","El hash de ese bloque cambia, y los bloques siguientes remiten al hash antiguo: habría que recalcular toda la cadena más rápido que el resto de la red","Las reglas del exchange lo prohíben"], explain: "La protección no es el secreto (los datos del blockchain están abiertos a todos), sino los enlaces de hashes y el coste de la fuerza bruta: reescribir el pasado cuesta más que participar honestamente." },
        { sources: ["El artículo de Bitcoin de Satoshi Nakamoto (2008)"] },
      ],
    },
    "m01-2": {
      title: "Consenso: trabajo o participación",
      blocks: [
        { text: "Miles de [[Узел (нода)|nodos]] deben ponerse de acuerdo sobre qué bloque va después. La regla de ese acuerdo se llama [[Консенсус|consenso]]. Hay dos formas principales.\n\n**[[PoW (доказательство работы)|Prueba de trabajo]].** El derecho a un bloque es para quien primero encuentra el nonce. La probabilidad es proporcional a la potencia de cálculo, y la potencia cuesta dinero: equipos y electricidad. Hacer trampa no compensa: se gastan los mismos recursos, y la red rechaza un bloque no válido.\n\n**[[PoS (доказательство доли)|Prueba de participación]].** Los bloques los proponen [[Валидатор|validadores]] que han depositado una garantía en monedas de la red. Quien firma dos bloques distintos para el mismo turno o rompe las reglas pierde parte del depósito ([[Слэшинг|slashing]]). Casi no hace falta electricidad; en su lugar, la seguridad se apoya en el valor del depósito." },
        null,
        { text: "Ambas formas comparten un punto débil: el [[Атака 51 %|ataque de mayoría]]. Quien controla más de la mitad de la potencia (o una gran parte de la participación) puede reescribir los bloques recientes y hacer un [[Двойная трата|doble gasto]]. En las redes grandes eso cuesta miles de millones de dólares; en redes pequeñas con potencia barata, estos ataques han ocurrido de verdad.\n\nDe ahí la conclusión práctica: un exchange no da por recibida una transferencia al instante, sino tras varias confirmaciones, es decir, bloques encima de ella. Cuanto más pequeña es la red, más confirmaciones exige el exchange." },
        { q: "¿Qué hace que hacer trampa no compense en una red de prueba de participación?", options: ["La contraseña del administrador de la red","El depósito del validador: por romper las reglas, la red le quita parte de sus monedas","El coste de la electricidad"], explain: "En PoS la «participación» es el depósito. La electricidad es la protección de la prueba de trabajo, y una red abierta no tiene administrador." },
        { sources: ["ethereum.org: prueba de participación"] },
      ],
    },
    "m01-3": {
      title: "Bitcoin: reglas de emisión",
      blocks: [
        { text: "Bitcoin es la primera y la mayor red. Las monedas nuevas solo aparecen como [[Награда за блок|recompensa por bloque]]. Al principio la recompensa era de 50 BTC, y cada 210 000 bloques (aproximadamente cada cuatro años) se reduce a la mitad: es el [[Халвинг|halving]]. El último halving fue en abril de 2024: la recompensa pasó a 3,125 BTC. El siguiente se espera hacia abril de 2028, en el bloque 1 050 000.\n\nDe estas reglas se deduce un límite: en total se emitirán algo menos de 21 millones de BTC. Ya se ha emitido más del 95 %." },
        { caption: "La curva se calcula a partir de las reglas de emisión, no se toma de un sitio web: 210 000 bloques por nivel de recompensa, y la recompensa se reduce a la mitad cada vez." },
        { text: "La emisión limitada se presenta a menudo como la razón por la que bitcoin «debe» subir. No es así: la oferta la conocen todos de antemano y ya está en el precio. El precio lo mueve la demanda, y la demanda cambia. A lo largo de su historia, bitcoin ha caído más de un 70 % desde su máximo varias veces.\n\nLa recompensa por bloque es el ingreso principal de los mineros. A medida que se reduce, sus ingresos dependen cada vez más de las comisiones de las transferencias. Cuánto durará esto y cómo terminará, nadie lo sabe con certeza." },
        { text: "El proyecto probó la hipótesis de que los grandes eventos de emisión (halvings, desbloqueos de tokens) producen movimientos de precio predecibles. El resultado para los desbloqueos: «indeterminado»: solo 21 eventos adecuados frente a los 150 necesarios, y el periodo reservado no se abrió. Sacar conclusiones de 3–4 halvings es todavía más arriesgado: no es una muestra, solo unos pocos casos.", source: "Hipótesis U1 (desbloqueos de tokens), registro de investigación del proyecto" },
        { q: "La recompensa por bloque de Bitcoin en noviembre de 2026:", options: ["50 BTC","6,25 BTC","3,125 BTC","Depende del precio"], explain: "Desde el halving de abril de 2024, 3,125 BTC. La recompensa depende del número de bloque, no del precio; bajará a 1,5625 BTC en el bloque 1 050 000." },
        { sources: ["bitcoin.org"] },
      ],
    },
    "m01-4": {
      title: "Ethereum y los contratos inteligentes",
      blocks: [
        { text: "Bitcoin guarda sobre todo transferencias. Ethereum guarda también programas: [[Смарт-контракт|contratos inteligentes]]. Un contrato es como una máquina expendedora: las reglas están escritas en código y no las ejecuta una empresa, sino toda la red. Mete una moneda, recibe el producto; las reglas son iguales para todos y visibles para todos.\n\nLos contratos se ejecutan en la [[EVM|EVM]], el «ordenador» común de la red. Sobre ella se construyen exchanges sin empresa, préstamos, stablecoins y tokens. Cada acción es una [[Транзакция|transacción]] firmada con su clave." },
        null,
        { text: "La fuerza de un contrato es que no se puede cambiar ni detener en secreto. Su debilidad es la misma: un error en el código tampoco se puede corregir rápido, y la red lo ejecutará con la misma precisión. La mayoría de las pérdidas en DeFi no son un «hackeo del blockchain», sino un error en un contrato concreto o una clave de administrador robada (más sobre esto en el módulo 5).\n\nDesde septiembre de 2022 Ethereum funciona con prueba de participación: el cambio se llamó The Merge. El consumo eléctrico de la red cayó más de un 99 %." },
        { q: "El contrato de un exchange ejecutó una operación por un error en su código, no como pretendían sus autores. ¿Qué hará la red?", options: ["Anular la operación","Ejecutarla: la red comprueba que el código se ejecutó correctamente, no que el código sea correcto","Devolver el dinero a través del soporte"], explain: "Los nodos solo comprueban que un programa se ejecutó según su propio código. Si el código es bueno es cosa de sus autores y auditores. La red no tiene un servicio de soporte que devuelva el dinero." },
        { sources: ["ethereum.org: contratos inteligentes","ethereum.org: The Merge"] },
      ],
    },
    "m01-5": {
      title: "Tokens y stablecoins",
      blocks: [
        { text: "Cada red tiene [[Нативная монета|su propia moneda]]: con ella se paga el trabajo de la red. Todo lo demás son [[Токен|tokens]]: registros en un contrato inteligente de «qué dirección tiene cuánto». Para que los wallets y los exchanges entiendan cualquier token, existen estándares comunes, como [[ERC-20|ERC-20]]. Un [[NFT|NFT]] también es un token, solo que cada ejemplar es único.\n\nCualquiera puede emitir un token en unos minutos por unos pocos dólares. Así que el mero hecho de que un token exista y se negocie no dice nada de su valor." },
        { text: "Un tipo especial son las [[Стейблкоин|stablecoins]]: tokens que intentan valer exactamente 1 $. La mayor parte del trading se hace con ellas, y las hay de tres tipos, con riesgos distintos." },
        null,
        { text: "**Respaldadas por dinero** (USDT, USDC): se apoyan en el [[Эмитент|emisor]]: una empresa guarda dólares y bonos y promete un cambio 1:1. El riesgo está en la empresa, en su banco y en que puede congelar tokens en cualquier dirección a petición de las autoridades.\n\n**Respaldadas por cripto** (DAI): se apoyan en una sobregarantía en un contrato inteligente. El riesgo es un desplome brusco de la garantía o un error en el código.\n\n**Algorítmicas**: se apoyan en la promesa de cambio por un token «propio». En mayo de 2022, UST de Terra perdió su paridad: vender UST imprimía nuevos tokens LUNA, LUNA se abarataba y eso provocaba más ventas. En pocos días UST cayó casi a cero, y con él desaparecieron decenas de miles de millones de dólares. Esta ruptura con el precio se llama [[Депег|desanclaje]]." },
        { q: "¿Qué es lo principal que hay que averiguar de una stablecoin antes de tener dinero en ella?", options: ["Cómo es su logotipo","Qué la respalda y quién está obligado a cambiarla por 1 $","Cuánto vale hoy: si 1 $, es fiable"], explain: "El precio de 1 $ hoy no garantiza nada: UST valía 1 $ hasta el mismo desplome. Lo que importa es qué hay detrás del token y quién responde del cambio." },
        { sources: ["ethereum.org: stablecoins","ethereum.org: el estándar ERC-20"] },
      ],
    },
    "m01-6": {
      title: "Gas, capa uno y capa dos",
      blocks: [
        { text: "El trabajo de la red no es gratis. En Ethereum se mide en unidades de [[Газ|gas]]: una transferencia simple son 21 000 de gas, un intercambio en un exchange varias veces más. La comisión es el gas multiplicado por el [[Цена газа|precio del gas]]. El precio se compone de una parte base, que se [[Сжигание|quema]], y una propina al validador." },
        null,
        { text: "Cuando todos quieren entrar en un bloque, el precio del gas sube: ha habido días en que un intercambio simple costaba decenas de dólares. De ahí la idea de la capa dos. La [[L1 (первый уровень)|capa uno]] es la propia red con su propio consenso. La [[L2 (второй уровень)|capa dos]] reúne muchas transferencias en un lote y graba el lote entero en la capa uno de una vez. La comisión se reparte entre todos." },
        { steps: ["Ocho transferencias en la red principal: ocho registros y ocho pagos de gas.","Las mismas transferencias se envían a la capa dos.","La capa dos las junta en un lote y lo graba en la red principal.","Cada uno paga aproximadamente un octavo del gas más la comisión de la capa dos. En la realidad un lote contiene miles de transferencias."] },
        { text: "Estas segundas capas se llaman [[Роллап|rollups]]. Los [[Оптимистичный роллап|optimistas]] consideran válido un lote hasta que alguien demuestre lo contrario, por eso retirar dinero a la red principal puede tardar alrededor de una semana. Los [[ZK-роллап|rollups ZK]] adjuntan al lote una prueba matemática.\n\nEl precio de lo barato son riesgos nuevos: la capa dos tiene un operador que arma los lotes y un [[Мост|puente]] para mover dinero entre capas. Más sobre esto en el módulo 5." },
        { q: "Transfiere 10 $ y 10 000 000 $ de la misma forma en la misma red. La comisión de gas es:", options: ["Un millón de veces mayor en el segundo caso","Más o menos la misma: se paga por el cálculo, no por el importe","Gratis en el segundo caso"], explain: "El gas es el pago por el trabajo de la red. Transferir cualquier importe es el mismo trabajo. Por eso las transferencias pequeñas en una red principal saturada no salen a cuenta, mientras que las grandes no cuestan casi nada en porcentaje." },
        { sources: ["ethereum.org: gas y comisiones","ethereum.org: capa 2"] },
      ],
    },
  },
};

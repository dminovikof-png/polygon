// Перевод модуля m05 (es). Формат — public/course/tr.js.
export default {
  id: "m05",
  src: "e5450a09",
  title: "Protocolos DeFi",
  summary: [
    "Los préstamos DeFi se apoyan en una garantía mayor que la deuda; cuando la garantía cae, el propio contrato se la vende a un liquidador con una bonificación.",
    "Todo interés tiene quien lo paga: los prestatarios, los traders, la emisión de monedas nuevas, o usted mismo, si la fuente no se ve.",
    "El dinero en DeFi está a la vez en varias capas (red, puente, contrato, oráculo, claves), y sus riesgos se suman.",
  ],
  lessons: {
    "m05-1": {
      title: "Préstamos con garantía",
      blocks: [
        { text: "Un banco concede un préstamo tras revisar su historial. [[DeFi|DeFi]] no sabe quién es usted, así que la confianza se sustituye por una garantía. Un [[Кредитование под залог|préstamo con garantía]] funciona así: deposita en un [[Протокол|protocolo]] (por ejemplo, Aave) monedas que valen más de lo que quiere pedir prestado, y toma prestadas otras monedas, normalmente stablecoins.\n\nTres cifras lo deciden todo. El [[LTV|LTV]]: cuánto se puede pedir; con un 75 %, hasta 1500 $ contra 2000 $ de garantía. El [[Порог ликвидации|umbral de liquidación]]: mayor que el LTV, por ejemplo el 80 %. El [[Здоровье займа|factor de salud]]: garantía × umbral / deuda; mientras está por encima de 1, todo va bien." },
        null,
        null,
        { text: "Cuando el factor de salud baja de 1, cualquiera —un liquidador— puede pagar parte de su deuda y quedarse su garantía con una [[Премия ликвидатора|bonificación]], normalmente del 5–10 %. Los bots lo hacen en segundos, sin llamadas ni avisos.\n\n¿Para qué pedir prestado así? Para no vender la moneda: obtener dólares manteniendo la posición. O para comprar más de la misma moneda con los dólares prestados: eso ya es apalancamiento, con todas sus trampas del módulo 3. Un desplome del precio en esos momentos inicia una cadena: las liquidaciones venden garantías, el precio cae más y se liquidan los préstamos siguientes." },
        { q: "La garantía es 1 ETH, la deuda es de 1000 $, el umbral de liquidación es del 80 %. ¿A qué precio de ETH empieza la liquidación?", options: ["1000 $","1250 $","800 $"], explain: "Factor de salud = precio × 1 × 0,8 / 1000. Es igual a 1 con un precio de 1000 / 0,8 = 1250 $." },
        { sources: ["Aave: documentación"] },
      ],
    },
    "m05-2": {
      title: "De dónde salen los intereses",
      blocks: [
        { text: "Los protocolos DeFi muestran rendimientos con cifras grandes: 5 %, 20 %, 200 % al año. Hay una pregunta útil para cualquier cifra así: **¿quién la paga?**" },
        null,
        { text: "**Los prestatarios.** En un depósito en un protocolo de préstamos, los intereses los pagan los prestatarios. La tasa depende de la [[Загрузка пула|utilización del pool]]: cuanto más dinero se ha prestado, más caro el préstamo. El depositante recibe menos de lo que paga el prestatario: los intereses salen solo de la parte prestada, y el protocolo se queda una parte." },
        null,
        { text: "**Los intercambios.** Los proveedores de los pools reciben las comisiones de los traders, y pagan con la pérdida impermanente (módulo 4).\n\n**La emisión de monedas.** La recompensa del staking se paga en parte en monedas nuevas de la red ([[Эмиссия|emisión]]). Si la emisión es del 3 % anual y usted recibe un 3 %, simplemente va al ritmo de la [[Размывание|dilución]].\n\n**Recompensas en tokens.** El [[Фарминг|yield farming]] al 200 % anual suele pagarse en el token propio del protocolo, que se imprime y que sus receptores venden. Su precio a menudo cae más rápido de lo que se acumula el «ingreso».\n\n**Vender riesgo.** Un «depósito con una tasa más alta» a veces resulta ser un [[Структурный продукт|producto estructurado]]: recibe una pequeña prima y, a cambio, se compromete a vender la moneda a un precio fijo si sube mucho.\n\n**Nadie.** Si la fuente no se ve en absoluto, los ingresos se pagan con el dinero de los siguientes depositantes." },
        { text: "El proyecto probó el producto Dual Asset Sell High de un exchange: vender BTC por encima del mercado un día después y recibir una prima. En esencia es una opción vendida: una prima de alrededor del 0,19 % cada vez frente a una ganancia perdida ilimitada en una subida. Ninguna de las 170 combinaciones (BTC, SOL, BNB, oro; distintos precios y plazos) pasó su umbral: todos esos activos subieron en el periodo, y el producto vendía su subida.", source: "Catálogo de ideas del proyecto: «Dual Asset Sell High»" },
        { q: "Un protocolo paga un 150 % anual en su nuevo token. ¿Qué es importante comprobar?", options: ["Nada: la tasa es alta, así que compensa","Cuántos tokens se imprimen y quién los compra: si los receptores venden, el precio del token cae, y el ingreso en dólares puede ser negativo","Si el protocolo tiene un sitio web bonito"], explain: "Un ingreso en un token nuevo es una parte de la emisión. Si no hay demanda del token, la emisión simplemente baja su precio." },
        { sources: ["Aave: modelo de tipos de interés"] },
      ],
    },
    "m05-3": {
      title: "Staking y staking líquido",
      blocks: [
        { text: "En las redes de prueba de participación, los [[Валидатор|validadores]] depositan una garantía y reciben una recompensa. El [[Стейкинг|staking]] es participar en ese depósito: por su cuenta (Ethereum exige 32 ETH y un servidor propio) o a través de un pool de staking, donde se puede depositar cualquier importe.\n\nLos riesgos del staking: el [[Слэшинг|slashing]] por errores del validador, la cola de retirada (el dinero no se puede sacar al instante) y la fiabilidad de aquel a quien confió el depósito." },
        null,
        { text: "El [[Ликвидный стейкинг|staking líquido]] resuelve el problema del dinero bloqueado: el protocolo hace staking de su ETH y emite un [[Токен-расписка|token recibo]] (por ejemplo, stETH), que se puede vender o dar en garantía en otro protocolo.\n\nPero el recibo vale lo que el mercado esté dispuesto a pagar en este momento. En junio de 2022, cuando el mercado caía y muchos necesitaban dinero con urgencia, stETH cotizó unos puntos porcentuales por debajo de ETH durante varias semanas. Quienes habían pedido prestado contra stETH para comprar más stETH fueron liquidados precisamente por esa diferencia." },
        { q: "Tiene un token recibo de ETH en staking. Cotiza un 4 % por debajo de ETH. ¿Por qué es posible?", options: ["Un error del exchange","El recibo no se puede cambiar al instante por ETH 1:1, y los vendedores con prisa aceptan un descuento","El ETH en staking ha desaparecido"], explain: "Cambiar a través de la retirada del staking lleva tiempo. El precio de mercado del recibo es el precio de la inmediatez; en un pánico el descuento crece." },
        { sources: ["ethereum.org: staking"] },
      ],
    },
    "m05-4": {
      title: "Puentes y oráculos",
      blocks: [
        { text: "Las redes no se ven entre sí. Para mover una moneda de una red a otra se usa un [[Мост|puente]]: toma la moneda en una bóveda en la primera red y emite un [[Обёрнутый токен|token envuelto]] en la segunda. El token envuelto es un recibo; vale mientras la bóveda esté intacta." },
        { steps: ["Tiene 10 ETH en la red A.","El puente los toma en su bóveda.","En la red B recibe 10 ETH envueltos.","Hackean la bóveda: los tokens envueltos siguen ahí, pero ya no tienen respaldo."] },
        { text: "Las bóvedas de los puentes guardan sumas enormes, por eso los puentes son el blanco más frecuente de los mayores hackeos. En febrero de 2022 se robaron unos 320 millones de dólares del puente Wormhole, y en marzo de 2022, más de 600 millones del puente de la red Ronin; allí los atacantes obtuvieron las claves de la mayoría de los firmantes.\n\nLos [[Оракул|oráculos]] resuelven el problema contrario: pasan datos externos a los contratos, sobre todo precios. Un protocolo de préstamos conoce el precio de la garantía a través de un oráculo. Si el precio es fácil de mover, lo moverán." },
        null,
        { text: "Así se vaciaron más de 100 millones de dólares de Mango Markets en octubre de 2022: inflaron el precio de un token poco líquido, el protocolo creyó el precio inflado de la garantía y contra esa garantía se pidió prestado casi todo. La protección son varias fuentes de precio, un precio promediado en el tiempo y límites a las garantías poco líquidas.\n\nLos ataques a menudo usan [[Флеш-кредит|préstamos flash]]: un préstamo enorme sin garantía, tomado y devuelto dentro de una misma transacción. Esto permite mover el precio de un pool durante un segundo sin dinero propio." },
        { q: "¿Por qué un token envuelto puede abaratarse aunque la propia moneda no lo haya hecho?", options: ["Siempre cuesta lo mismo","Vale lo que el respaldo en la bóveda del puente; si hackean la bóveda, el recibo pierde su respaldo","Por el gas"], explain: "Un token envuelto es la promesa del puente. Su fiabilidad es la del puente, no la de la moneda." },
        { sources: ["ethereum.org: puentes","ethereum.org: oráculos","DefiLlama: lista de hackeos"] },
      ],
    },
    "m05-5": {
      title: "Hackeos y evaluación del riesgo de un protocolo",
      blocks: [
        { text: "Los [[Взлом протокола|hackeos]] en DeFi ocurren constantemente, y los fondos robados casi nunca se devuelven. Las causas principales se repiten: un error en el código de un contrato, la manipulación de precios a través de un oráculo, [[Ключ администратора|claves de administrador]] robadas, una vulnerabilidad de un puente, un ataque económico con un préstamo flash.\n\nUna [[Аудит|auditoría]] reduce el riesgo de error pero no lo elimina: muchos protocolos hackeados habían pasado auditorías, a veces más de una. Un [[Обновляемый контракт|contrato actualizable]] se puede corregir, pero quien puede corregirlo también puede sustituirlo." },
        null,
        { text: "El dinero de un depósito DeFi suele estar a la vez en varias capas: una stablecoin emitida por un emisor, llevada por un puente a la capa dos, depositada en un protocolo que toma los precios de un oráculo y está gestionado por una multifirma. Cada capa es su propio [[Контрагентский риск|riesgo de contraparte]], y se suman.\n\nPreguntas que conviene hacerse antes de depositar:\n\n**¿Cuántos años lleva funcionando el protocolo** con una suma grande y sin hackeos?\n\n**¿Quién puede cambiar el código** y los parámetros, y cuántas claves hacen falta para ello?\n\n**¿De dónde salen los precios?** ¿Cuántas fuentes tiene el oráculo?\n\n**¿Por cuántas capas** pasa el dinero: un puente, la capa dos, tokens recibo?\n\n**¿Quién paga los intereses?** (lección 2 de este módulo)\n\nEl [[TVL|TVL]] de un protocolo habla de tamaño, no de fiabilidad: las sumas grandes son justo lo que atrae a los atacantes." },
        { q: "Un depósito promete un 8 % anual. El dinero pasa por un puente, la capa dos y un protocolo de préstamos. ¿Cómo pensar con honestidad en el rendimiento?", options: ["El 8 % es un ingreso garantizado","El 8 % es el pago por varias capas de riesgo; si la probabilidad de pérdidas en todas las capas juntas es de unos puntos porcentuales al año, la esperanza real es claramente inferior al 8 %","Los riesgos de las capas no se suman"], explain: "El rendimiento esperado es la tasa prometida menos las pérdidas esperadas. Con unos puntos porcentuales de riesgo de pérdida total al año, del 8 % queda poco." },
        { sources: ["DefiLlama: lista de hackeos","ethereum.org: seguridad de los contratos inteligentes"] },
      ],
    },
  },
};

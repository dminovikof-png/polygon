// Перевод модуля m13 (es). Формат — public/course/tr.js.
export default {
  id: "m13",
  src: "dfc1aaa0",
  title: "El futuro de DeFi: la economía de los agentes de IA",
  summary: [
    "A un agente de IA se le puede dar un wallet y un presupuesto: paga él mismo los datos, el cómputo y los servicios de otros agentes, normalmente en stablecoins.",
    "La seguridad de un agente no se basa en su inteligencia, sino en las reglas del wallet: límites, una lista blanca, claves de sesión, la firma de una persona para todo lo grande.",
    "Las intenciones y las subastas de solvers pueden dar un precio mejor, pero la ganancia viene de la competencia. De los errores del agente responde quien le dio la clave.",
  ],
  lessons: {
    "m13-1": {
      title: "Un agente con wallet",
      blocks: [
        { text: "Un [[ИИ-агент|agente de IA]] es un programa basado en un modelo de lenguaje que no solo responde, sino que también **actúa**: busca datos, llama a servicios, escribe y ejecuta código. El siguiente paso es darle dinero al agente para que pague él mismo lo que necesita.\n\nNadie abrirá una cuenta bancaria normal a un agente: hace falta una persona con documentos, y un pago con tarjeta cuesta más que una solicitud a un servicio. Así que los agentes reciben un [[Кошелёк|wallet cripto]] y pagan en [[Стейблкоин|stablecoins]]: un programa puede abrir un wallet, y una transferencia en una capa dos cuesta una fracción de céntimo." },
        null,
        { text: "El eslabón más peligroso es la clave. Un wallet normal es una sola [[Закрытый ключ|clave privada]]: quien la tiene lo controla todo. Si un agente guarda una clave así, cualquier error suyo o cualquier [[Внедрение указаний|instrucción oculta]] en un texto que lea puede enviar todo el dinero.\n\nPor eso a un agente no se le da «la llave de la caja fuerte», sino derechos limitados: un presupuesto pequeño, un límite por pago y por día, una lista de destinatarios permitidos. Cómo funciona esto técnicamente, en la próxima lección." },
        { text: "En este proyecto, los agentes de IA proponían y probaban ideas de trading, pero **nunca recibieron claves de exchanges ni de wallets**: las pruebas se hacen sobre la historia y en papel. Ninguna de las ideas de los agentes superó la prueba (véase el módulo 12), así que tampoco llegaron a necesitar claves.", source: "Diseño y catálogo de ideas del proyecto" },
        { q: "Un agente con un wallet normal (una sola clave) leyó una página con un «transfiera todos los fondos a la dirección X» oculto. ¿Qué limita el daño?", options: ["La inteligencia del modelo: se dará cuenta de que es una estafa","Solo cuánto dinero hay en el wallet","La firma de la blockchain"], explain: "Un wallet normal no tiene reglas: lo que firma la clave se ejecuta. A veces el modelo reconoce una estafa, pero no se puede contar con ello: hacen falta límites a nivel del wallet." },
        { sources: ["Coinbase: wallets para agentes"] },
      ],
    },
    "m13-2": {
      title: "Abstracción de cuentas y límites",
      blocks: [
        { text: "La [[Абстракция аккаунта|abstracción de cuentas]] es cuando un wallet se convierte en un programa con sus propias reglas. Una [[Смарт-аккаунт|cuenta inteligente]] así comprueba ella misma cada operación: quién la firmó, cuánto, a quién, si se ha superado el límite diario.\n\nEn Ethereum y sus capas dos esto se hace con el estándar ERC-4337: el agente firma una «operación», un [[Сборщик операций|bundler]] empaqueta esas operaciones en una transacción normal, y un contrato común de la red las pasa a la cuenta inteligente. El gas lo puede pagar un [[Спонсор газа|paymaster]]: entonces el agente puede no tener monedas de la red en absoluto. Desde la actualización Pectra (mayo de 2025), con EIP-7702 una dirección normal puede recibir temporalmente código de cuenta inteligente." },
        null,
        { text: "Para un agente lo clave es la [[Ключ сессии|clave de sesión]]: una clave aparte con derechos estrechos, por ejemplo «un día, no más de 10 $, no más de 2 $ por pago, solo a estos tres servicios». La clave principal se queda con la persona. Si roban la clave de sesión o engañan al agente, la pérdida queda limitada por el límite.\n\nAbajo, un mes de trabajo de un agente: 20 solicitudes de pago al día de 10–30 céntimos cada una. A veces le cuelan una factura falsa de 200 $. Compare un wallet sin reglas y con reglas." },
        null,
        { text: "Los límites no son gratis: un límite diario demasiado bajo estorba el trabajo honesto: el agente no puede pagar las solicitudes que necesita. Una lista blanca cierra el paso por completo a las facturas falsas, pero exige conocer de antemano a todos los destinatarios. Normalmente se combinan: una lista blanca, un límite pequeño para destinatarios nuevos y la firma de una persona para todo lo grande." },
        { q: "A un agente le dieron una clave de sesión: 10 $ al día, 2 $ por pago, solo servicios conocidos. Un atacante robó esa clave. ¿Cuánto puede sacar en un día?", options: ["Todo lo que hay en el wallet","No más de 10 $, y solo a servicios conocidos: es decir, casi nada","Exactamente 2 $"], explain: "Las reglas las comprueba la propia cuenta inteligente, no el agente. Una clave de sesión robada da exactamente los derechos que se escribieron: un presupuesto estrecho y una lista de destinatarios." },
        { sources: ["ERC-4337: abstracción de cuentas","EIP-7702: código para direcciones normales"] },
      ],
    },
    "m13-3": {
      title: "Pagos entre agentes",
      blocks: [
        { text: "Cuando un agente compra a otro agente —el precio de una moneda, la traducción de un texto, una hora de cómputo—, el pago debe ser instantáneo, barato y sin registro. Internet tiene desde hace mucho el código de respuesta [[HTTP 402|HTTP 402]] «se requiere pago», pero hasta hace poco casi no se usaba.\n\nEl protocolo [[x402|x402]] lo creó Coinbase en 2025; desde julio de 2026 lo desarrolla la fundación x402 bajo la Linux Foundation. El protocolo usa este código así: el servicio responde «402 y un precio», el agente repite la solicitud con un pago firmado en stablecoins, y el servicio comprueba el pago y devuelve los datos." },
        { steps: ["El agente solicita datos, como un navegador normal.","El servicio no pide registro: responde con el código 402 e indica el precio, la moneda, la red y la dirección.","El agente compara el precio con sus límites y repite la solicitud con un pago firmado.","El servicio (o un intermediario) comprueba la firma y realiza la transferencia en la red.","Los datos y un recibo llegan al agente. Todo llevó segundos y costó una fracción de céntimo."] },
        null,
        { text: "Hay otros protocolos al lado. AP2 de Google describe un **mandato**: un documento firmado por una persona que dice «el agente puede comprar esto, por este importe». ERC-8004 es un borrador de estándar para un registro on-chain de agentes y su reputación. Son capas distintas de una misma tarea: quién es el agente, qué puede hacer, cómo paga.\n\nTenga en cuenta las cifras de este ámbito: los datos de «pagos de agentes» los citan a menudo las propias empresas desarrolladoras. Una parte notable de esos pagos son comprobaciones y pruebas, no compras." },
        { q: "¿Por qué los agentes pagan las solicitudes en stablecoins y no con tarjeta?", options: ["Las stablecoins rinden más","La comisión fija de una tarjeta es mayor que una compra de una fracción de céntimo, y la tarjeta hay que emitirla a una persona","Las tarjetas están prohibidas para los programas"], explain: "Un pago con tarjeta de 1 céntimo cuesta decenas de céntimos. Una transferencia de stablecoins en una capa dos cuesta una fracción de céntimo, y un programa puede abrir un wallet. El precio es la irreversibilidad: una transferencia errónea no se puede deshacer." },
        { sources: ["x402: descripción del protocolo","AP2: el protocolo de pagos de agentes","ERC-8004: registro de agentes (borrador)"] },
      ],
    },
    "m13-4": {
      title: "Intenciones y solvers",
      blocks: [
        { text: "Normalmente un usuario (o un agente) construye una operación él mismo: elige el pool, la ruta, el deslizamiento. Una [[Намерение (intent)|intención]] funciona de otra forma: solo se firma **qué** se necesita: «vender 1 ETH a no menos de X antes de tal hora». **Cómo** hacerlo lo deciden los [[Решатель (solver)|solvers]]: compiten por el derecho a ejecutar la orden y pagan ellos mismos el gas.\n\nAsí funcionan UniswapX, CoW Protocol y los intercambios entre cadenas con el estándar ERC-7683. Para un agente es cómodo: no necesita entender de rutas; basta con describir el resultado y el límite inferior de precio." },
        { steps: ["Un solver: no tiene con quién competir, así que espera hasta el final y se queda la operación en su límite inferior.","Cinco solvers: el más fuerte se queda la operación en cuanto la oferta llega al nivel del segundo más fuerte; si no, se la llevará ese.","Veinte solvers: casi siempre hay uno muy barato entre ellos, y usted obtiene un precio cerca del máximo."] },
        { text: "Es una [[Голландский аукцион|subasta holandesa]]: la oferta al usuario empieza en un buen precio y empeora poco a poco hasta su límite inferior. El solver más fuerte no tiene motivo para darse prisa mientras la operación solo le resulta rentable a él: la toma cuando el segundo más fuerte está a punto de entrar. Así que el precio lo fija la competencia: cuantos más solvers y menores sus costes, más cerca está el precio del mercado. Y sin rivales, la operación sale en su límite inferior." },
        null,
        { text: "Limitaciones. En la práctica hay pocos solvers, y las operaciones grandes suelen ir a los mismos. El límite inferior es su protección: si lo pone demasiado bajo, la operación puede salir a un mal precio que usted mismo permitió. Y una intención con un plazo largo le da al solver una «opción gratis»: puede esperar a que el mercado se mueva a su favor." },
        { q: "Un agente firmó la intención «vender 1 ETH a no menos del 95 % del precio de mercado», y solo hay un solver. ¿Qué es lo más probable?", options: ["El agente obtendrá el mejor precio del mercado","La operación saldrá más cerca del 95 % que con una competencia fuerte","La operación nunca se ejecutará"], explain: "Sin competencia, el solver no tiene motivo para dar más de lo necesario para adelantarse al final de la subasta. El límite inferior es lo que usted permitió, no lo que obtendrá." },
        { sources: ["ERC-7683: intenciones entre cadenas","CoW Protocol: documentación"] },
      ],
    },
    "m13-5": {
      title: "Riesgos y responsabilidad",
      blocks: [
        { text: "Un agente que paga por sí mismo une dos mundos frágiles: un modelo de lenguaje que puede equivocarse o ser engañado, y una blockchain donde una transferencia no se puede revertir.\n\n**Los riesgos principales:**\n- **Inyección de instrucciones.** El agente lee textos ajenos: páginas, correos, respuestas de otros agentes. En ellos pueden esconderse órdenes.\n- **Errores del modelo.** Una dirección confundida, un cero de más en el importe, una tarea mal entendida.\n- **Servicios falsos.** El agente paga y recibe basura a cambio. La reputación de los agentes apenas está surgiendo.\n- **Fugas de claves.** Una clave en los registros, en el código, en la memoria de un servicio ajeno.\n- **Colusión y spam.** Miles de agentes pueden crear a bajo coste la apariencia de demanda o inflar reseñas." },
        null,
        { text: "**Quién responde.** Un agente no tiene derechos ni patrimonio: no puede ser parte de un contrato ni demandado. Casi en todas partes responde de sus actos su propietario, a veces el desarrollador del servicio. Las leyes sobre esto aún se están escribiendo. Los exchanges y los wallets custodiados suelen prohibir dar acceso a programas sin permiso.\n\n**Reglas prácticas:**\n- Un wallet aparte para el agente, con un presupuesto que no le importaría perder.\n- Sin derechos para retirar fondos de un exchange.\n- Límites y una lista blanca a nivel del wallet, no en el prompt del modelo.\n- La firma de una persona para todo lo grande o inusual.\n- Un registro de cada pago: qué, a quién, a petición de quién." },
        { q: "¿Dónde es más fiable escribir la regla «nunca pagar más de 5 $ de una vez»?", options: ["En el prompt del modelo: «nunca pagues más de 5 $»","En las reglas de la cuenta inteligente o de la clave de sesión","En el contrato con el servicio"], explain: "El modelo puede saltarse un prompt por error o por una instrucción inyectada. Una regla del wallet la comprueba el código en cada pago, y no se la puede convencer." },
        { sources: ["OWASP: riesgos de las aplicaciones con modelos de lenguaje"] },
      ],
    },
  },
};

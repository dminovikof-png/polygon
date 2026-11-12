// Перевод модуля m02 (es). Формат — public/course/tr.js.
export default {
  id: "m02",
  src: "33bb3de1",
  title: "Wallets y seguridad",
  summary: [
    "Las monedas están en el blockchain; el wallet guarda la clave. Quien conoce la clave o la frase semilla es el dueño, y nadie puede revertir una transferencia.",
    "En un exchange confía en el exchange; en su propio wallet, en usted mismo. Ambas opciones tienen sus propias formas de perder dinero.",
    "El dinero se pierde casi siempre no porque se hackee una red, sino por una firma que la propia persona dio: phishing, autorizaciones, «soporte», ingresos prometidos.",
  ],
  lessons: {
    "m02-1": {
      title: "Quién tiene las claves: el exchange o usted",
      blocks: [
        { text: "Un [[Кошелёк|wallet]] no guarda monedas: siempre están registradas en el blockchain. Un wallet guarda la [[Закрытый ключ|clave privada]]: un número secreto que da derecho a firmar una transferencia. De ahí dos formas de custodia.\n\n**[[Хранение у биржи|Custodia en el exchange]].** El exchange tiene las claves; usted tiene un registro en su base de datos que dice «1 BTC es suyo». Es cómodo: hay contraseña, recuperación, soporte. Pero si el exchange quiebra, sufre un hackeo o congela la cuenta, el registro puede resultar no estar respaldado por nada.\n\n**[[Самостоятельное хранение|Autocustodia]].** Solo usted tiene la clave. Nadie congelará ni gastará sus monedas. Pero tampoco nadie le ayudará a recuperar el acceso, y una transferencia equivocada no se puede revertir." },
        null,
        { text: "Un ejemplo del riesgo del exchange es FTX: en noviembre de 2022, uno de los mayores exchanges del mundo detuvo las retiradas y quebró; resultó que la empresa había usado el dinero de los clientes. Los clientes esperaron años a cobrar a través de los tribunales.\n\nUn ejemplo del riesgo de la autocustodia son las miles de personas que perdieron su frase semilla o enviaron monedas a una dirección equivocada. Ese dinero no se puede recuperar.\n\nLa conclusión honesta: la elección no es «seguro o inseguro», sino **en quién confía**. Para operar, el dinero tiene que estar en un exchange. El dinero que no hace falta para operar, mucha gente lo guarda en su propio wallet." },
        { q: "Tiene monedas en una cuenta de exchange. ¿Qué posee en realidad?", options: ["Monedas en el blockchain en su propia dirección","La obligación del exchange de entregarle las monedas cuando las pida","La clave de la dirección del exchange"], explain: "En un exchange tiene un registro en su base de datos. Mientras el exchange es solvente y permite retiradas, la diferencia no se nota; en una quiebra pasa a ser uno de los acreedores." },
        { sources: ["ethereum.org: wallets"] },
      ],
    },
    "m02-2": {
      title: "Frase semilla y claves",
      blocks: [
        { text: "Cuando crea un wallet, este muestra una [[Seed-фраза|frase semilla]]: 12 o 24 palabras. A partir de esa frase el wallet calcula todas sus claves; a partir de las [[Закрытый ключ|claves privadas]], las [[Открытый ключ|públicas]]; y a partir de estas, las [[Адрес|direcciones]]. Las flechas van solo en un sentido: conociendo una dirección no se puede hallar la clave; conociendo una clave no se puede hallar la frase." },
        null,
        { text: "De ahí tres reglas.\n\n**1. La frase lo es todo.** Quien la conoce puede restaurar el wallet en cualquier dispositivo y llevarse todo de todas las direcciones. La frase de un mismo wallet no se puede cambiar: solo se puede crear un wallet nuevo y mover allí las monedas.\n\n**2. La frase nunca se escribe en ningún sitio salvo para restaurar su propio wallet.** Ningún sitio web, «soporte», «verificación del wallet» ni reparto de tokens necesita su frase. Que le pidan la frase es señal de fraude en el 100 % de los casos.\n\n**3. La frase se guarda sin conexión.** En papel o en una placa de metal, en un lugar seguro, mejor en dos. No la fotografíe ni la guarde en la nube o en las notas del teléfono.\n\nAdivinar una frase por fuerza bruta es imposible: 12 palabras tienen unas 2¹²⁸ combinaciones; incluso a la velocidad de toda la red de Bitcoin, la búsqueda llevaría unos 10 000 millones de años. Así que las frases no se descifran: se les sonsacan a las personas." },
        { q: "El sitio de un wallet dice: «Se detectó un error de sincronización, introduzca su frase semilla para verificar». ¿Qué debe hacer?", options: ["Introducirla, ya que es el sitio del wallet","Cerrar el sitio: ninguna verificación necesita la frase, es una estafa","Introducir solo las 6 primeras palabras"], explain: "Los servicios honestos nunca necesitan la frase. Una parte de la frase también es peligrosa: las palabras restantes a veces se pueden adivinar." },
        { sources: ["ethereum.org: seguridad"] },
      ],
    },
    "m02-3": {
      title: "Wallets de hardware y buenos hábitos",
      blocks: [
        { text: "Un [[Горячий кошелёк|wallet caliente]] —una app o una extensión del navegador— guarda la clave en un dispositivo conectado a internet. Si el dispositivo está infectado, la clave puede ser robada. Un [[Аппаратный кошелёк|wallet de hardware]] es un dispositivo aparte del que la clave nunca sale: el ordenador le envía una transacción, y el dispositivo la muestra en su propia pantalla y firma dentro de sí mismo.\n\nLo esencial con un wallet de hardware es **mirar su pantalla**, no la del ordenador. Si un malware ha cambiado la dirección del destinatario, solo se ve allí." },
        { caption: "Envenenamiento de direcciones: el estafador cuenta con que usted copie una dirección parecida de su historial de transferencias." },
        { text: "Los hábitos que más dinero ahorran:\n\n**Una transferencia de prueba.** Antes de una transferencia grande a una dirección nueva, envíe una cantidad pequeña y compruebe que llegó.\n\n**La dirección de una fuente fiable.** No de su historial de transferencias ni de un mensaje de chat; compruébela entera, no solo el principio y el final.\n\n**Separación.** Una cantidad pequeña para el día a día en un wallet caliente; el grueso, en [[Холодное хранение|almacenamiento en frío]].\n\n**[[Мультиподпись|Multifirma]]** para importes grandes: una transferencia requiere firmas de varias claves, por ejemplo dos de tres.\n\n**Sin prisas.** Casi todas las estafas meten prisa." },
        { q: "El wallet de hardware muestra una dirección de destinatario distinta de la que ve en la pantalla del ordenador. ¿En cuál confía?", options: ["En la pantalla del ordenador: es más grande","En la pantalla del wallet de hardware: la sustitución de direcciones ocurre en el ordenador, no en el dispositivo","Enviar y ver adónde llega"], explain: "La gracia de un wallet de hardware es que su pantalla no la controla un ordenador infectado. Si las direcciones no coinciden, cancele la transferencia." },
        { sources: ["ethereum.org: seguridad"] },
      ],
    },
    "m02-4": {
      title: "Autorizaciones para contratos inteligentes",
      blocks: [
        { text: "Para intercambiar un token en un exchange descentralizado, primero hay que dar a su contrato una [[Разрешение (approve)|autorización]] para gastar ese token. Los wallets a menudo proponen por defecto una autorización ilimitada: así no paga una autorización nueva en cada intercambio.\n\nEl problema es que la autorización se queda después del intercambio. Si más tarde hackean el contrato, o si el sitio era falso desde el principio, pueden llevarse sus tokens sin una nueva firma." },
        { steps: ["Quiere intercambiar 100 USDT.","El wallet le pide firmar una autorización. Fíjese en el importe: a menudo es «ilimitado».","El intercambio se hizo, pero la autorización no ha desaparecido.","Un contrato hackeado o falso se lleva todo lo autorizado. Las autorizaciones que ya no necesita conviene revocarlas."] },
        { text: "En esto mismo se basan los sitios fraudulentos [[Дрейнер|drainer]]: con el pretexto de «reclamar una recompensa» o «verificar su wallet» le piden firmar una autorización o un mensaje firmado especial (sin comisión de gas, así que parece inofensivo). Tras la firma, los tokens desaparecen.\n\nQué hacer:\n\n**Lea lo que firma.** Si el wallet muestra «permitir el gasto» o «firmar mensaje» cuando no está comprando nada, deténgase.\n\n**Ponga un límite**: exactamente el importe del intercambio.\n\n**[[Отзыв разрешения|Revoque]] las autorizaciones antiguas.** El [[Обозреватель блоков|explorador de bloques]] de la red o el propio wallet muestran la lista de sus autorizaciones; revocar es una transacción normal con comisión de gas." },
        { q: "Un sitio de reparto de tokens le pide «firmar un mensaje, es gratis». ¿Por qué puede ser peligroso?", options: ["No es peligroso: sin comisión de gas no pasará nada","El mensaje firmado puede ser una autorización para gastar sus tokens: se usará más tarde","Solo es peligroso para bitcoin"], explain: "Algunos estándares permiten dar una autorización mediante una firma, sin transacción. Que no haya comisión no significa que no haya consecuencias." },
        { sources: ["ethereum.org: seguridad y autorizaciones"] },
      ],
    },
    "m02-5": {
      title: "Esquemas de estafa",
      blocks: [
        { text: "En cripto, casi todas las pérdidas de particulares no son hackeos de redes sino [[Социальная инженерия|ingeniería social]]: la propia persona entrega la frase, una firma o una transferencia. Los esquemas se repiten, y conviene reconocerlos a simple vista." },
        null,
        { text: "**El soporte que escribe primero.** El soporte real de exchanges y wallets no le escribe por mensaje privado y nunca pide la frase, una contraseña ni un código de un correo.\n\n**[[Фишинг|Phishing]].** Un sitio parecido que llega desde un anuncio, un correo o un buscador. Abra los sitios desde marcadores guardados.\n\n**Un nuevo conocido con una «plataforma».** Se conocen en redes sociales o en una app, se hacen amigos durante semanas y luego le aconseja invertir a través de «su» plataforma. Las cifras en ella crecen, pero retirar el dinero no funciona: le piden un «impuesto» o una «comisión de retirada». La plataforma era falsa desde el principio.\n\n**Ingresos garantizados.** «2 % al día sin riesgo» es un [[Финансовая пирамида|esquema Ponzi]]: los ingresos se pagan con el dinero de los recién llegados mientras sigan llegando.\n\n**[[Памп и дамп|Pump and dump]].** Un grupo: «compramos todos juntos a las 20:00». Los organizadores compraron antes y le venden a usted en el pico.\n\n**[[Раг-пул|Rug pull]].** Un token nuevo con un sitio bonito; los creadores retiran el dinero del pool y desaparecen." },
        { text: "El proyecto probó decenas de ideas de trading, entre ellas «hacer crecer» rápido un depósito pequeño: apalancamiento 100x, doblar la apuesta tras una pérdida, promediar a la baja. Ninguna dio ingresos estables, y los esquemas de doblar la apuesta tienen una esperanza negativa por su propio diseño. Si alguien promete un porcentaje fijo al día, una prueba honesta no encuentra esos resultados; así que el dinero no sale del mercado.", source: "Catálogo de ideas del proyecto: «Crecimiento rápido: apalancamiento 100x, martingala, DCA y bots de grid»" },
        { q: "¿Qué tienen en común casi todos los esquemas de estafa?", options: ["Un hackeo sofisticado del blockchain","La urgencia y la petición de que usted mismo entregue la frase, una firma o dinero","Solo ocurren con monedas poco conocidas"], explain: "Hackear una red es caro; convencer a una persona es barato. Por eso la principal protección es no tener prisa y no entregar nada que dé acceso al dinero." },
        { q: "Una plataforma muestra su ganancia en +300 %, pero para retirarla le pide pagar un «impuesto del 20 %» por transferencia. ¿Qué es lo más probable?", options: ["Una regla normal de un exchange","Una estafa: las cifras de una plataforma falsa no valen nada, y el «impuesto» es una forma más de quitarle dinero","Hay que pagar para no perder la ganancia"], explain: "Los exchanges reales no exigen una transferencia para retirar; los impuestos se pagan al Estado mediante la declaración, no a una plataforma. El dinero enviado «para el impuesto» también se perderá." },
        { sources: ["FSCA (regulador de Sudáfrica): avisos de fraude","FBI: Internet Crime Complaint Center"] },
      ],
    },
  },
};

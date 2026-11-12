// Перевод модуля m03 (es). Формат — public/course/tr.js.
export default {
  id: "m03",
  src: "dba8634e",
  title: "Exchanges centralizados (CEX)",
  summary: [
    "El precio es un libro de órdenes: una orden de mercado paga el spread y el deslizamiento; una limitada espera y paga menos.",
    "La comisión de una vuelta «compra — venta» parece mínima, pero operando a menudo se come el capital más rápido que cualquier error de pronóstico.",
    "Los futuros y el apalancamiento dan una posición sin la moneda; con apalancamiento 10x la liquidación llega con un movimiento de un 10 % en contra, aunque luego el precio vuelva.",
  ],
  lessons: {
    "m03-1": {
      title: "Libro de órdenes y órdenes",
      blocks: [
        { text: "En un [[CEX (централизованная биржа)|exchange centralizado]] nadie fija el precio. Hay un [[Стакан|libro de órdenes]]: una lista de todos los que quieren comprar y vender, con precios y volúmenes. Los vendedores están arriba, los compradores abajo. El mejor precio de compra es el [[Бид и аск|bid]], el mejor precio de venta es el ask, y la diferencia entre ellos es el [[Спред|spread]].\n\nHay dos tipos principales de órdenes. Una [[Лимитная заявка|orden limitada]] dice «compro a no más de 99,99» y, si no hay vendedor a ese precio, queda en el libro y espera. Una [[Рыночная заявка|orden de mercado]] dice «compro ya» y toma una tras otra las mejores órdenes de los vendedores hasta completar el volumen necesario." },
        { steps: ["Un libro de órdenes didáctico: en rojo las órdenes de venta, en verde las de compra. El ancho de la barra es el volumen del nivel.","Una compra de mercado de 0,5 monedas cabe en el mejor nivel: el precio es el mejor ask, sin deslizamiento.","Comprar 3 monedas se come varios niveles: cada parte siguiente cuesta más.","Una compra grande entra hondo en el libro. El precio medio es claramente peor que el mejor: eso es el deslizamiento."] },
        null,
        { q: "Coloca una orden limitada de compra por debajo del precio actual. ¿Qué pasa?", options: ["Se ejecuta enseguida a precio de mercado","Queda en el libro y solo se ejecuta si el precio baja hasta ella","El exchange la rechaza"], explain: "Una orden limitada garantiza el precio pero no la ejecución. Una orden de mercado es lo contrario: garantiza la ejecución pero no el precio." },
        null,
      ],
    },
    "m03-2": {
      title: "Maker, taker y comisiones",
      blocks: [
        { text: "Quien tenía una orden en el libro y esperó es un [[Мейкер|maker]]: aportó liquidez al exchange. Quien tomó una orden del libro es un [[Тейкер|taker]]. El taker paga la [[Комиссия|comisión]] más alta.\n\nEn el nivel básico de Bybit en noviembre de 2026: en spot, 0,1 % tanto para el maker como para el taker; en futuros perpetuos, 0,02 % para el maker y 0,055 % para el taker. Las cifras parecen mínimas, pero la comisión se paga en cada lado: una vuelta «compra — venta» como taker en spot cuesta un 0,2 %, y encima se suman el spread y el deslizamiento." },
        { caption: "Una idea sin ventaja que simplemente opera a menudo: cada vuelta solo pierde la comisión. 500 vueltas como taker en spot convierten 100 $ en unos 37 $." },
        { text: "De ahí una regla que la prueba honesta confirma una y otra vez: **cuanto más a menudo opera una idea, mayor ventaja necesita solo para pagar las comisiones.** Una idea que compra y vende cada día con órdenes de mercado en spot pierde alrededor de la mitad de su capital al año solo en comisiones.\n\nEn el programa, la comisión y el deslizamiento se restan de cada operación de una prueba. Si ve resultados sin costes en algún sitio, considérelos inflados." },
        { text: "El proyecto midió el market making pasivo: estar en el libro en ambos lados y ganar el spread. Por orden ejecutada: medio spread +0,33 pb, la pérdida porque se ejecutan precisamente las órdenes desfavorables −0,60 pb, la comisión −2,00 pb. El total es −2,27 pb por operación: incluso con comisión cero el resultado es negativo.", source: "Catálogo de ideas del proyecto: «Market making pasivo»" },
        { q: "Una idea hace 300 vueltas al año con órdenes de mercado en spot (0,1 % por lado). ¿Cuánto pierde, aproximadamente, solo en comisiones?", options: ["0,3 %","Alrededor del 45 % del capital","Nada, si las operaciones son rentables"], explain: "300 vueltas × 0,2 % es un multiplicador de 0,998³⁰⁰ ≈ 0,55, es decir, menos un 45 %. La comisión se paga en cada operación, ganadora o perdedora." },
        { label: "Probar una idea con sus comisiones" },
        { sources: ["Bybit: comisiones de spot","Bybit: comisiones de futuros"] },
      ],
    },
    "m03-3": {
      title: "Deslizamiento y liquidez",
      blocks: [
        { text: "El [[Проскальзывание|deslizamiento]] es cuánto peor es el precio de ejecución que el mejor precio del libro. Depende de lo grande que sea su orden comparada con la [[Глубина стакана|profundidad del libro]]. Para BTC y ETH en exchanges grandes el libro es profundo: una compra de decenas de miles de dólares apenas mueve el precio. Para monedas poco conocidas, incluso unos pocos miles de dólares pueden mover el precio varios puntos porcentuales.\n\nLa [[Ликвидность|liquidez]] cambia con el tiempo: de noche, los fines de semana y en momentos de pánico el libro es más fino y el spread más ancho. Justo entonces el deslizamiento duele más, y justo entonces más ganas hay de vender deprisa." },
        null,
        { text: "Cargue el libro de órdenes de BTC y, por ejemplo, de DOGE, y compare cuánto cuesta la misma compra. El programa solo lee datos públicos del exchange: sin inicio de sesión, claves ni órdenes.\n\nOtra trampa son las [[Стоп-заявка|órdenes stop]]. Un stop «vender si el precio cae a 95» se convierte en una orden de mercado en una caída brusca y se ejecuta al precio que haya en el libro en ese momento, a veces claramente por debajo de 95." },
        { q: "¿Cuándo suele ser mayor el deslizamiento?", options: ["Un día laborable tranquilo para BTC","Durante un movimiento brusco en una moneda poco líquida","El deslizamiento siempre es el mismo"], explain: "Un libro fino y todos con prisa a la vez es la peor combinación. Por eso la prueba de una idea que opera «en pánico» debe suponer un deslizamiento mayor." },
        { sources: ["API de Bybit: libro de órdenes (datos públicos)"] },
      ],
    },
    "m03-4": {
      title: "Spot, futuros y funding",
      blocks: [
        { text: "En [[Спот|spot]] compra la propia moneda. Un [[Фьючерс|futuro]] es un contrato sobre su precio: no tiene la moneda, solo la obligación de liquidar la diferencia de precio.\n\nLos [[Срочный фьючерс|futuros con vencimiento]] tienen una fecha de [[Экспирация|vencimiento]]. Hasta entonces su precio puede diferir del de la moneda: esa diferencia se llama [[Базис|base]], y en la fecha de vencimiento desaparece.\n\nLos [[Бессрочный фьючерс (перп)|futuros perpetuos]] no tienen fecha. Para que su precio no se aleje del de la moneda existe el [[Фандинг|funding]]: pagos periódicos entre los titulares de posiciones largas y cortas." },
        null,
        null,
        { text: "Cuando la multitud quiere comprar con apalancamiento, el futuro se encarece respecto a la moneda, la [[Ставка фандинга|tasa de funding]] se vuelve positiva y los [[Лонг|largos]] pagan a los cortos. Eso cuesta dinero: 0,01 % cada 8 horas es alrededor de un 11 % anual, y en periodos calientes la tasa puede ser varias veces mayor.\n\nSobre esto se construye una idea conocida, el **carry**: comprar la moneda en spot y a la vez vender la misma cantidad en futuros. El precio de la moneda casi deja de importar, y el funding, mientras es positivo, llega a usted." },
        { text: "El carry «spot + corto en perpetuo» es una de las pocas ideas que superaron las pruebas del proyecto: en 19 monedas durante 2021–2026, de media alrededor de un 22 % anual con una caída del 1,4 %. Pero el exceso sobre la referencia por años fue de +18,5, +5,0, +0,1 y 0,0 puntos porcentuales, y en 2026 no hubo ni una operación: el funding en un mercado frío es casi cero. El rendimiento dependía de un mercado caliente, que puede no llegar.", source: "Catálogo de ideas del proyecto: S1-5 «Carry de funding»" },
        { label: "Probar el carry en una moneda" },
        { q: "La tasa de funding es +0,03 % cada 8 horas y tiene una posición larga de 10 000 $. ¿Qué pasa?", options: ["Recibe 3 $ cada 8 horas","Paga 3 $ cada 8 horas: alrededor de un 33 % anual","Nada, el funding solo afecta a los cortos"], explain: "Con una tasa positiva pagan los largos: 10 000 $ × 0,03 % = 3 $ por pago, tres pagos al día: más de 3000 $ al año." },
        { sources: ["Bybit: funding de los contratos perpetuos"] },
      ],
    },
    "m03-5": {
      title: "Apalancamiento, margen y liquidación",
      blocks: [
        { text: "El [[Плечо|apalancamiento]] permite abrir una posición mayor que su dinero. Con apalancamiento 10x, 100 $ de [[Маржа (залог)|margen]] abren una posición de 1000 $. Un movimiento del precio del 1 % es un 10 % de su margen, en cualquier dirección.\n\nCuando la pérdida casi se come el margen, el exchange cierra la posición a la fuerza: es la [[Ликвидация|liquidación]]. El margen se pierde. El exchange guarda un pequeño colchón —el [[Поддерживающая маржа|margen de mantenimiento]]—, así que la liquidación llega un poco antes de que la pérdida iguale el margen." },
        null,
        { text: "La principal trampa del apalancamiento es el camino del precio, no su punto final. Si el precio primero cayó un 12 % y luego subió un 20 %, una posición sin apalancamiento está en ganancia. Una posición con apalancamiento 10x no llegó a ver la subida: fue liquidada en la caída, y la vuelta del precio ya no puede ayudarla." },
        { steps: ["Apalancamiento 2x: la caída es desagradable, pero la posición sobrevive hasta la subida y termina aproximadamente el doble de bien que el precio.","Apalancamiento 5x: en la caída el margen pierde dos tercios, y el resultado final es claramente positivo, si aguantaron los nervios y no se cerró la posición.","Apalancamiento 10x: el precio cayó un 13 %, pero la posición fue liquidada ya en −9,5 %. El precio subió después, pero el margen ya no está.","Apalancamiento 20x: liquidación aún antes, en el primer retroceso apreciable."] },
        { text: "Dos conceptos más. Con [[Изолированная маржа|margen aislado]], la liquidación se lleva solo el margen de esa posición. Con [[Кросс-маржа|margen cruzado]], toda la cuenta es garantía: la liquidación se aleja, pero una mala posición puede llevárselo todo. La liquidación se calcula con el [[Маркировочная цена|precio de marca]], una media de varios exchanges, para que un pico aleatorio no liquide a todos." },
        { text: "El apalancamiento no crea ventaja; la multiplica, igual que la ausencia de ventaja. En las pruebas del proyecto, un apalancamiento de 1,6x sobre una cesta de monedas dio un 31,1 % anual frente a un 32,4 % sin apalancamiento: las caídas y el reequilibrio se comieron más de lo que añadió el apalancamiento. Y la historia de «+15 % en 4 días» en una cuenta resultó, al analizarla, ser simplemente el movimiento del mercado multiplicado por un apalancamiento de 3,5x.", source: "Catálogo de ideas del proyecto: «Apalancamiento sobre una cesta…»; análisis «El take-profit y el stop no crean ventaja»" },
        { q: "Una posición con apalancamiento 10x: el precio cayó un 11 % y luego subió un 30 %. ¿Cuál es el resultado?", options: ["Alrededor de +190 %","El margen se perdió: la posición fue liquidada en la caída","Alrededor de +19 %"], explain: "Con apalancamiento 10x, la liquidación llega con un movimiento de algo menos del 10 % en contra de la posición. La subida posterior ya no le afecta." },
        { sources: ["Bybit: reglas de liquidación"] },
      ],
    },
  },
};

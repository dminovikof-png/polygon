// Перевод модуля m10 (es). Формат — public/course/tr.js.
export default {
  id: "m10",
  src: "9c8f1616",
  title: "Riesgo y tamaño de la posición",
  summary: [
    "Las pérdidas y la recuperación son asimétricas: tras −50 % hace falta +100 %; tras −90 %, +900 %.",
    "El tamaño de la apuesta importa tanto como la ventaja: incluso un juego favorable arruina con una parte en riesgo demasiado grande.",
    "Las monedas dentro de las cripto caen juntas, y el apalancamiento constante sobre un activo volátil se come el capital aunque el precio suba.",
  ],
  lessons: {
    "m10-1": {
      title: "Caída y recuperación",
      blocks: [
        { text: "Una [[Просадка|caída]] es cuánto está el capital por debajo de su máximo anterior. Su principal malicia es la asimetría: para volver hay que crecer más de lo que se cayó." },
        null,
        { text: "Por eso una caída es más peligrosa de lo que parece. Tras −83 % (la peor caída de BTC) hace falta una subida de casi 6 veces. Tras −96 % (SOL), de 25 veces. Y no solo importa la profundidad, sino también la duración: cuántos días seguidos está el capital por debajo de su máximo anterior." },
        { steps: ["BTC: peor caída −83 %, más de 1000 días seguidos por debajo del máximo anterior.","ETH: −94 % y casi 4 años por debajo del máximo.","SOL: −96 %. Quienes compraron en el máximo de 2021 esperaron años a recuperarse.","DOGE: −92 % y más de 2000 días seguidos por debajo del máximo."] },
        { q: "El capital cayó un 50 %. ¿Cuánto hay que ganar para volver?", options: ["50 %","100 %","75 %"], explain: "Para pasar de la mitad al todo hay que duplicar: 0,5 × 2 = 1." },
        { sources: ["Binance: velas diarias públicas"] },
      ],
    },
    "m10-2": {
      title: "Riesgo por operación y el stop",
      blocks: [
        { text: "El enfoque profesional no empieza con la pregunta «cuánto comprar», sino con «cuánto estoy dispuesto a perder si resulta que me equivoco». Es el [[Риск на сделку|riesgo por operación]], normalmente un 0,5–2 % del capital.\n\nDespués hace falta un [[Стоп-лосс|stop]]: el precio al que se admite que la idea era errónea. El tamaño de la posición sale de una división: el riesgo en dólares / la distancia al stop. Cuanto más cerca el stop, mayor la posición con el mismo riesgo." },
        null,
        { text: "Con un riesgo del 1 %, una cuenta sobrevive a 20 operaciones perdedoras seguidas y pierde alrededor del 18 %. Con un riesgo del 10 %, las mismas 20 pérdidas dejan el 12 % de la cuenta. Las rachas largas de pérdidas les pasan incluso a estrategias con ventaja: con un 40 % de aciertos, una racha de 10 pérdidas seguidas en 1000 operaciones ocurre en unos 9 casos de 10.\n\nEl stop no es perfecto: en un movimiento brusco se ejecuta peor ([[Проскальзывание|deslizamiento]]), y los fines de semana y en los desplomes, mucho peor." },
        { q: "El capital es de 10 000 $, el riesgo del 1 %, la entrada a 100 $, el stop a 95 $. ¿Cuál es el tamaño de la posición?", options: ["100 $","2000 $","10 000 $"], explain: "El riesgo es de 100 $, y el stop está un 5 % por debajo de la entrada. 100 $ / 0,05 = una posición de 2000 $: si salta el stop, la pérdida es exactamente de 100 $." },
        null,
      ],
    },
    "m10-3": {
      title: "Kelly y la ruina",
      blocks: [
        { text: "Imagine un juego con ventaja: la mitad de las operaciones aportan 1,2R y la otra mitad pierden 1R. De media, cada operación es rentable. ¿Qué parte del capital conviene arriesgar?\n\nLa respuesta la da el [[Критерий Келли|criterio de Kelly]]: para este juego, un 8,3 %. Con esa parte, el capital crece de media lo más rápido posible. Por encima, el crecimiento se frena, y alrededor de dos Kelly y más, el capital suele reducirse, aunque cada operación siga siendo rentable." },
        null,
        { text: "El simulador juega 1000 versiones del futuro (por el [[Метод Монте-Карло|método de Montecarlo]]) de 200 operaciones cada una. Para el juego 50 % / 1,2R:\n\n**Riesgo del 2 %:** ninguna [[Разорение|ruina]], mediana ×1,42.\n**Riesgo del 4 %:** ninguna ruina, mediana ×1,83.\n**Riesgo del 8,3 % (Kelly):** un 2 % arruinado, mediana ×2,29, pero el camino es muy accidentado.\n**Riesgo del 15 %:** un 28 % arruinado, mediana ×1,35.\n**Riesgo del 25 %:** un 74 % arruinado, mediana ×0,09.\n\nY eso con una ventaja conocida de antemano. En la realidad la ventaja se estima con error y a menudo resulta menor, por eso los profesionales apuestan medio o un cuarto de Kelly." },
        { text: "El proyecto probó hacer crecer rápido un depósito: apalancamiento 100x, martingala, DCA y bots de grid que doblan. Todos tienen esperanza negativa por diseño: una martingala necesita que las rachas ganadoras ocurran más a menudo de lo que permite su propia aritmética de apuestas, y ningún ajuste lo consigue. Cuanto más rápido promete un esquema duplicar la cuenta, más rápido la deja en cero.", source: "Catálogo de ideas del proyecto: lev «Crecimiento rápido: apalancamiento 100x, martingala»" },
        { q: "El juego es favorable, pero arriesga un 25 % del capital en cada operación, mientras que Kelly es un 8 %. ¿Qué es lo más probable?", options: ["El crecimiento más rápido","El capital suele derretirse, aunque cada operación sea rentable","El mismo resultado que con un 8 %"], explain: "Con una parte en riesgo por encima de dos Kelly, una racha de pérdidas destruye el capital más rápido de lo que las ganancias lo restauran." },
        { sources: ["Kelly, 1956: A New Interpretation of Information Rate"] },
      ],
    },
    "m10-4": {
      title: "Correlación y diversificación",
      blocks: [
        { text: "La [[Диверсификация|diversificación]] funciona cuando los activos no se mueven juntos. Cuánto se mueven juntos lo muestra la [[Корреляция|correlación]]: 1 es siempre juntos, 0 es independientes, −1 es siempre al contrario." },
        null,
        { text: "La correlación diaria de BTC y ETH en dos años es de 0,83. Con la mayoría de las demás monedas el cuadro es parecido, y en los desplomes la correlación es aún mayor: en un mal día cae casi todo. Diez monedas en lugar de una reducen el riesgo de que una moneda concreta se vaya a cero, pero apenas protegen de una caída del mercado." },
        { text: "**Una cartera de 19 monedas frente a BTC:** supera a la moneda media, pero pierde frente a BTC en rendimiento por unidad de caída.\n\n**Rotar BTC / ETH / altcoins según indicadores:** la correlación máxima entre señal y resultado es de 0,171, y el signo cambia en 6 casos de 15.\n\n**Elegir las 5 monedas más tranquilas del top 40** fue aceptado por riesgo: caída −94 % → −44…−68 %. Pero el exceso de rendimiento no alcanza el umbral de significancia.", source: "Catálogo de ideas del proyecto: H6 «Una cartera de 19 monedas», #3 «Rotación», #32 «Elegir monedas tranquilas»" },
        { q: "La correlación de dos monedas es de 0,9. ¿Cuánto ayuda tener las dos en lugar de una?", options: ["Mucho, el riesgo se reduce a la mitad","Poco: casi siempre caen y suben juntas","El riesgo desaparece"], explain: "Con una correlación de 0,9, la segunda moneda casi repite a la primera. La diversificación funciona con correlación baja." },
        null,
      ],
    },
    "m10-5": {
      title: "Apalancamiento a largo plazo",
      blocks: [
        { text: "Parece que un apalancamiento 2x sobre una moneda que sube da el doble. A largo plazo no es así. Si mantiene un apalancamiento constante, cada oscilación se lleva parte del capital: −50 % y luego +50 % no dan cero, sino −25 %. Es el [[Снос волатильности|lastre de volatilidad]]; con apalancamiento crece con el cuadrado del apalancamiento." },
        null,
        { text: "BTC desde 2020: sin apalancamiento ×10,6 con una caída del −77 %. Con apalancamiento 2x, ×6,4 y una caída del −97 %: más riesgo y menos dinero. Los apalancamientos 3x y 5x se fueron a cero ya en marzo de 2020 y no participaron en la subida posterior. Y eso sin comisiones ni funding, que en la realidad reducen aún más el resultado.\n\nPara BTC, con una subida diaria media del 0,147 % y oscilaciones del 3,48 %, el mejor apalancamiento constante en su historia es de alrededor de 1,2x. Un pequeño error al estimar el futuro, y el mejor apalancamiento resulta ser menor que 1." },
        { text: "Apalancamiento 1,6x sobre una cesta de monedas: un 31,1 % anual frente a un 32,4 % sin apalancamiento. Ninguna variante de apalancamiento, piramidación o ponderación por volatilidad dio una ventaja duradera.", source: "Catálogo de ideas del proyecto: #20-38 «Apalancamiento sobre una cesta, piramidación»" },
        { q: "En dos días una moneda cayó un 50 % y luego subió un 50 %. ¿El capital sin apalancamiento?", options: ["Sin cambios","−25 %","+25 %"], explain: "100 → 50 → 75. La subida se cuenta sobre la suma reducida. Con apalancamiento la pérdida por estas oscilaciones es aún mayor." },
        null,
      ],
    },
  },
};

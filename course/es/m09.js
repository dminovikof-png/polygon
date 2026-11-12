// Перевод модуля m09 (es). Формат — public/course/tr.js.
export default {
  id: "m09",
  src: "6f14547d",
  title: "Estrategias",
  summary: [
    "Toda estrategia tiene un supuesto oculto sobre cómo se comportará el precio; si es falso, la mecánica no la salvará.",
    "En un mercado alcista, casi cualquier estrategia que sale del mercado más a menudo pierde frente a simplemente mantener en rendimiento, pero puede ganar en caída.",
    "Los grids, el market making y el arbitraje estadístico parecen «neutrales», pero en la práctica pierden frente a las comisiones y frente a quienes saben más.",
  ],
  lessons: {
    "m09-1": {
      title: "El supuesto oculto",
      blocks: [
        { text: "Una estrategia es fácil de describir con reglas: «comprar cuando…, vender cuando…». Es más útil preguntar: **¿qué tiene que pasar con el precio para que esto gane dinero?** Ese es el [[Скрытое предположение|supuesto oculto]]. Toda estrategia tiene uno, incluso la que se llama «neutral al mercado»." },
        null,
        { text: "A partir de aquí, cada lección tiene tres partes: la mecánica, el supuesto oculto y lo que mostró la prueba del proyecto. Al final de la lección hay un botón que abre el modo de trabajo con la estrategia ya elegida: allí puede probarla con honestidad, con comisiones y datos reservados." },
        { q: "A un bot de grid se le llama «neutral». ¿Cuál es su supuesto oculto?", options: ["Ninguno","El precio se moverá dentro de un rango y volverá a él tras salir","El precio subirá"], explain: "Un grid gana con la vuelta del precio. Si el precio sale del rango y no vuelve, el grid se queda con una posición perdedora." },
        null,
      ],
    },
    "m09-2": {
      title: "Mantener y comprar por partes",
      blocks: [
        { text: "**Mecánica.** Comprar y mantener. O [[DCA (покупка частями)|DCA]]: comprar el mismo importe una vez al mes sin mirar el precio.\n\n**Supuesto oculto.** Dentro de años el precio será mayor que ahora. Nada más, pero no es poco: muchas monedas de ciclos pasados nunca volvieron a sus máximos.\n\nEl DCA se vende a menudo como «una forma de comprar más barato». No lo es: solo reparte la fecha de entrada. Si el mercado sube sobre todo, comprar de una vez gana, porque el dinero trabaja más tiempo. Si cae, gana el DCA. Compárelo en la historia real de BTC." },
        null,
        { text: "Invirtiendo 2500 $ por partes durante 24 meses a partir de 2019, 2020 o 2023, comprar de una vez dio el doble que el DCA. Empezando en 2018 o 2022, al revés. Nadie lo sabe de antemano, así que el DCA es una forma de reducir el arrepentimiento por una fecha desafortunada, no de ganar más." },
        { text: "El proyecto probó variantes «trucadas»: DCA con apalancamiento, martingala (doblar tras una pérdida), compras en grid a la baja. Su esperanza es negativa por diseño. Una martingala necesita que las rachas ganadoras ocurran más a menudo de lo que permite su propia aritmética de apuestas, y ningún ajuste lo consigue. Lo único que sobrevivió fue un filtro de volatilidad: +6,5 puntos porcentuales en el 40 % de datos reservados.", source: "Catálogo de ideas del proyecto: lev «Crecimiento rápido: apalancamiento 100x, martingala, DCA y bots de grid»" },
        { q: "El precio de BTC subió sobre todo durante dos años seguidos. ¿Qué ganó: el DCA o comprar todo el importe el primer día?", options: ["El DCA: siempre compra más barato","Comprar de una vez: todo el dinero estuvo antes en el activo que subía","Lo mismo"], explain: "El DCA solo gana si el precio cayó durante el periodo de compras. En un mercado alcista, las compras posteriores cuestan más que las primeras." },
        { label: "Probar una proporción constante en el polígono" },
        { sources: ["Binance: velas diarias públicas"] },
      ],
    },
    "m09-3": {
      title: "Seguimiento de tendencia y las tortugas",
      blocks: [
        { text: "**Mecánica.** [[Следование тренду|Seguimiento de tendencia]]: estar en el mercado mientras el precio sube y salir cuando cae. La versión más simple es mantener mientras el precio esté por encima de la SMA 200. Las [[Черепахи|tortugas]] compran en la ruptura del máximo de 20 días y venden en el mínimo de 10 días.\n\n**Supuesto oculto.** Los movimientos fuertes duran más de lo que parece. Entonces las muchas pérdidas pequeñas en rupturas falsas se pagan con raras tendencias grandes.\n\nCambie las reglas y la comisión abajo. Las barras verdes son días en el mercado." },
        null,
        { text: "En BTC desde 2017 con una comisión del 0,1 %, la regla de la SMA 200 dio ×7, y mantener, ×17,7; pero la peor caída fue del −64 % frente al −83 %. Las «tortugas» dieron ×22,9 con una caída del −55 %. Es bonito, pero es una moneda, un juego de parámetros y una mirada a posteriori. Cómo probarlo con honestidad es el tema del próximo módulo." },
        { text: "**Las tortugas** en la prueba del proyecto: la mejor variante dio ×21 en el sandbox, y ×0,84 en los datos reservados de 2025–2026 (t 0,44). Añadir a una posición ganadora (piramidación) arruinó la cuenta en cripto: los retrocesos bruscos se comieron todos los añadidos de golpe.\n\n**Las rupturas** en velas de 4 horas no cumplieron la condición prerregistrada en ninguna variante. **Las rupturas rápidas**: un grupo de control sin selección dio casi lo mismo (+2,791R frente a +2,919R); el resultado lo explicaba la subida del mercado, no la regla.", source: "Catálogo de ideas del proyecto: «Tortugas», S1-4, fast «Ruptura rápida»" },
        { q: "Una regla de tendencia hizo ×7 frente a ×17,7 de mantener, pero con una caída del −64 % en vez del −83 %. ¿Cómo describirlo con honestidad?", options: ["La regla es mejor que mantener","La regla es peor que mantener","Es un intercambio: menos rendimiento por menos caída; una moneda y un juego de parámetros no prueban nada"], explain: "Hay que comparar rendimiento, riesgo y robustez en otras monedas y periodos. Una sola historia es un ejemplo, no una prueba." },
        { label: "Probar las tortugas en el polígono" },
        null,
      ],
    },
    "m09-4": {
      title: "Reversión a la media",
      blocks: [
        { text: "**Mecánica.** [[Возврат к среднему|Reversión a la media]]: comprar tras una caída brusca (RSI por debajo de 30, el precio en la banda inferior de Bollinger, varios días rojos seguidos) y vender tras el rebote.\n\n**Supuesto oculto.** Los movimientos bruscos son exagerados y se revierten. Entonces llegan muchas ganancias pequeñas y raras pérdidas grandes: cuando una caída resulta ser el inicio de un desplome y no un rebote.\n\nAbajo, la misma regla en BTC: desde 2017, ×2,1 frente a ×17,7 de mantener, en el mercado solo el 21 % del tiempo. Las cripto tienen tendencias largas, y salir tras un rebote a menudo se pierde el movimiento principal." },
        null,
        { text: "**Rachas de pérdidas.** Estadísticamente hay un rebote tras una serie de días rojos, y fuerte: t −9,8. Pero es 5 veces menor que la comisión por operación.\n\n**Rebote tras una cascada de liquidaciones:** t 3,02 en 4 monedas, t 0,98 en otras 10. El efecto se debilitó al crecer el número de monedas: señal de ajuste a los primeros datos.\n\n**Apostar contra rupturas falsas en velas de 15 minutos:** −210,7 puntos porcentuales en el sandbox, t −3,79.", source: "Catálogo de ideas del proyecto: «Rachas de pérdidas», N «Rebote tras una cascada de liquidaciones», fb «Contra rupturas falsas»" },
        { q: "El efecto de rebote es estadísticamente fuerte (t −9,8), pero 5 veces menor que la comisión. ¿Qué significa para operar?", options: ["Hay que operar más a menudo","Operar con él no compensa: la ventaja no cubre los costes","Hay que usar apalancamiento"], explain: "Ni la frecuencia ni el apalancamiento convierten un resultado negativo por operación en positivo. El apalancamiento solo agrandará la pérdida." },
        { label: "Probar la reversión por RSI en el polígono" },
        null,
      ],
    },
    "m09-5": {
      title: "Grid",
      blocks: [
        { text: "**Mecánica.** Un [[Сетка (грид-бот)|bot de grid]] coloca órdenes de compra a pasos iguales por debajo del precio y de venta por encima. Cada bajada del precio y vuelta es una [[Круг сетки|ronda]] y una pequeña ganancia.\n\n**Supuesto oculto.** El precio se moverá dentro de un rango y volverá a él. Si el precio baja y no vuelve, el grid compra la moneda que cae y carga con toda su pérdida." },
        { steps: ["Un rango: compras abajo, ventas arriba, las rondas dan ganancia.","El precio bajó: se ejecutaron todas las compras y ninguna venta. El grid se ha convertido en un gran largo en una moneda que cae."] },
        { text: "El paso del grid decide mucho. Con un paso del 0,25 %, la comisión se come alrededor del 80 % de la ganancia de una ronda. Con un paso del 2–4 % hay menos rondas, pero cada una paga claramente su comisión." },
        { text: "9 de 9 configuraciones de grid perdieron con datos de un minuto. Un resultado brillante en velas horarias (+275,7 puntos porcentuales) resultó ser un error del modelo: con datos de un minuto el mismo bot dio −931 %. Un grid neutral por ATR tampoco lo salvó: es neutral por diseño, pero no en resultados.", source: "Catálogo de ideas del proyecto: grid «Bots de grid y grid neutral por ATR»" },
        { q: "Una moneda cayó un 40 % y no volvió. ¿Qué pasa con el grid?", options: ["Ganó en cada nivel","Compró en cada nivel y carga con una gran pérdida","Se cerró solo sin pérdida"], explain: "Un grid solo vende en los movimientos de vuelta al alza. Sin vuelta se convierte en promediar a la baja en una moneda que cae." },
        { label: "Probar un grid en el polígono" },
        null,
      ],
    },
    "m09-6": {
      title: "Carry, market making, arbitraje estadístico",
      blocks: [
        { text: "Estas estrategias no adivinan la dirección del precio. Por eso se las llama neutrales, y por eso sus supuestos ocultos son más difíciles de ver." },
        null,
        { text: "**Carry.** Comprar una moneda y vender los mismos futuros perpetuos; el precio casi no importa, y queda el funding. El supuesto: el funding seguirá siendo positivo, y el exchange que tiene ambas patas seguirá siendo fiable.\n\n**Market making.** Tener órdenes de compra y de venta y ganar el spread. El supuesto: el spread será mayor que las pérdidas por operar con quienes saben más que usted ([[Неблагоприятный отбор|selección adversa]]).\n\n**[[Стат-арбитраж|Arbitraje estadístico]].** Comprar una moneda que se ha quedado atrás respecto a otras parecidas y vender la que se ha adelantado. El supuesto: las monedas separadas volverán a juntarse, y más rápido de lo que las comisiones se comen la ganancia." },
        { text: "**Carry** en 19 monedas: +121 % en 2021–2026, una caída del 1,4 %: la estrategia fue aceptada. Pero el exceso sobre la referencia por años: +18,5, +5,0, +0,1, 0,0 puntos porcentuales; en un mercado frío no opera en absoluto.\n\n**Market making pasivo** por operación: medio spread +0,33 pb, selección adversa −0,60, comisión −2,00. Total: −2,27 pb.\n\n**Arbitraje estadístico:** hay previsibilidad, pero su tamaño es de 0,31 pb frente a unos costes de al menos 8 pb.", source: "Catálogo de ideas del proyecto: S1-5 «Carry de funding», mm «Market making pasivo», stat «Arbitraje estadístico de residuos»" },
        { q: "¿Por qué pierde el market making pasivo, aunque cada operación «gana el spread»?", options: ["El spread es demasiado grande","Las órdenes tienden a ejecutarse cuando el precio va en su contra, y la comisión es más de la mitad del spread","El exchange prohíbe el market making"], explain: "Su orden la toman sobre todo quienes ven antes el movimiento. Las pérdidas en esas operaciones más la comisión superan el spread ganado." },
        { label: "Probar el carry en el polígono" },
        null,
      ],
    },
  },
};

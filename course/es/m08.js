// Перевод модуля m08 (es). Формат — public/course/tr.js.
export default {
  id: "m08",
  src: "acb0ab60",
  title: "Análisis técnico",
  summary: [
    "Las velas y los indicadores son formas de comprimir un gráfico pasado; describen lo que fue, no lo que será.",
    "El ojo encuentra tendencias y figuras incluso en lanzamientos de moneda, así que cualquier figura debe probarse en miles de casos con comisiones.",
    "El proyecto probó la SMA200, las rupturas, Gartley y la compresión de Bollinger: la SMA200 reduce la caída a costa del rendimiento; lo demás no gana dinero.",
  ],
  lessons: {
    "m08-1": {
      title: "Velas y marcos temporales",
      blocks: [
        { text: "El [[Технический анализ|análisis técnico]] estudia el propio gráfico del precio. Su lenguaje principal son las [[Японская свеча|velas japonesas]]: cada una muestra la apertura, el cierre, el máximo y el mínimo de su intervalo de tiempo." },
        null,
        null,
        { text: "La duración del intervalo es el [[Таймфрейм|marco temporal]]. El mismo mes son 30 velas diarias, 720 horarias o 43 200 de un minuto. Cuanto más corta la vela, más ruido aleatorio contiene y más a menudo opera una estrategia. La comisión por operación, en cambio, no se reduce.\n\nPor eso en gráficos de un minuto pierden incluso ideas que parecen rentables en los horarios: el proyecto lo ha visto muchas veces." },
        { text: "Un bot de grid en velas horarias mostró +275,7 puntos porcentuales. El mismo bot con datos de un minuto: −931 %. El modelo horario no veía cómo el precio dentro de una hora cruza los niveles del grid de un lado a otro, y contaba operaciones que en realidad no habrían ocurrido. 9 de 9 configuraciones con datos de un minuto acabaron en pérdida.", source: "Catálogo de ideas del proyecto: grid «Bots de grid y grid neutral por ATR»" },
        { q: "Una estrategia gana un 0,05 % por operación antes de comisiones y opera 20 veces al día. La comisión de entrada y salida es del 0,2 %. ¿Qué pasa?", options: ["Una ganancia del 1 % al día","Una pérdida de alrededor del 3 % al día: la comisión es 4 veces la ventaja","Cero"], explain: "(0,05 − 0,2) × 20 = −3 % al día. Los marcos temporales cortos exigen una ventaja mayor que la comisión, y eso es raro." },
        null,
      ],
    },
    "m08-2": {
      title: "Indicadores: medias, RSI, bandas",
      blocks: [
        { text: "Un indicador es una fórmula de precios pasados. Los más conocidos:\n\nLa [[Скользящая средняя (SMA)|media móvil]]: el precio medio de N días. A la SMA 200 se la suele llamar la frontera entre un mercado «alcista» y uno «bajista». La [[EMA|EMA]] es lo mismo, pero los días recientes pesan más.\n\nEl [[RSI|RSI]]: de 0 a 100, qué parte de los cambios recientes fueron subidas. Por encima de 70, «sobrecalentado»; por debajo de 30, «sobrevendido».\n\nLas [[Полосы Боллинджера|bandas de Bollinger]]: la media ± dos desviaciones típicas; muestran cuánto se ha alejado ahora el precio de lo habitual. El [[Канал Дончиана|canal de Donchian]]: el máximo y el mínimo de N días; salir de él se llama ruptura.\n\nActívelos de uno en uno en el gráfico real de abajo. La escala es [[Логарифмическая шкала|logarítmica]]: la misma distancia es el mismo porcentaje." },
        null,
        { text: "Fíjese en dos cosas. Las medias siempre van con retraso: la SMA 200 gira meses después del máximo. Y el RSI puede estar «sobrecalentado» semanas seguidas mientras el precio sigue subiendo. Un indicador no conoce el futuro: vuelve a contar el pasado de otra forma." },
        { text: "**SMA200.** La regla «mantener BTC y ETH mientras el precio esté por encima de su media de 200 días» redujo la caída en la prueba del proyecto del −77 % al −36 %, en 6 años de 6. Pero es un seguro con prima: el rendimiento sin contar 2022 bajó del 47,8 % al 16,3 % anual. Dimensionar la posición por volatilidad empeoró el resultado (Sharpe 0,16 frente a 0,24). La «vida» mediana de una señal por encima de la media es de unos 4 días: el precio cruza a menudo la línea de un lado a otro.\n\n**Compresión de Bollinger y ATR.** La idea de que «tras una calma llega un movimiento fuerte» no se confirmó: −18,1 puntos porcentuales en el sandbox, el signo coincidió en 2 subperiodos de 4, t −1,19. Antes de los grandes movimientos, el estrechamiento de las bandas no fue más frecuente de lo habitual.", source: "Catálogo de ideas del proyecto: #1 «Largo por régimen SMA200», H4 «Expansión de volatilidad tras una compresión de ATR»" },
        { q: "El RSI de BTC lleva dos semanas por encima de 70. ¿Qué significa?", options: ["Pronto llegará sin falta un giro a la baja","El precio ha subido sobre todo en las últimas semanas; el indicador por sí solo no dice nada del futuro","Hay que vender con urgencia"], explain: "El RSI describe la proporción de subidas y bajadas recientes. En una tendencia fuerte puede seguir «sobrecalentado» durante semanas." },
        { label: "Probar la SMA200 en BTC en el polígono" },
        { sources: ["Binance: velas diarias públicas"] },
      ],
    },
    "m08-3": {
      title: "Figuras y azar",
      blocks: [
        { text: "Las [[Фигура (паттерн)|figuras]] —«hombro-cabeza-hombro», «doble suelo», «bandera», los patrones armónicos de Gartley— se enseñan a reconocer por la forma del gráfico. Los [[Уровень поддержки и сопротивления|niveles de soporte y resistencia]] se trazan por los giros pasados. El problema es que el ojo humano encuentra formas en todas partes, incluso en el ruido." },
        { steps: ["Intente adivinar cuál de los cuatro gráficos es BTC real. Todos tienen «tendencias», «niveles» y «figuras».","El real es el segundo. Los otros tres son lanzamientos de moneda con la misma fuerza de oscilación. En los cuatro aparecen figuras parecidas."] },
        { text: "Si una figura también aparece en un gráfico aleatorio, por sí sola no significa nada. Solo puede significar algo si tras la figura el precio se comporta de otra forma que tras un momento al azar. Se comprueba así: encontrar todos los casos de la figura en años, calcular el resultado con comisiones y compararlo con entradas aleatorias de la misma forma." },
        { text: "**Gartley** en velas horarias: 49 operaciones, 33 % ganadoras, −0,348R de media (t −2,13): peor que entradas aleatorias con la misma geometría. En una rejilla de 36 ajustes, todos los resultados fueron negativos.\n\n**Rupturas.** Una entrada con stop en el canal de Donchian en velas de 4 horas no cumplió su condición prerregistrada: un [[Фактор прибыли (PF)|factor de beneficio]] de 1,17 / 1,03 / 1,07 / 1,09 por años frente al 1,25 necesario. La clase de las rupturas está cerrada.\n\n**Entrada en el primer retroceso tras un cambio de estructura:** 8045 operaciones, −0,094R después de costes (t −6,36), pérdida en los 4 años.", source: "Catálogo de ideas del proyecto: gart «Patrón de Gartley», S1-4 «Horquilla de entrada con stop en Donchian», P1 «Entrada en el primer retroceso»" },
        { q: "¿Cómo se comprueba si una figura funciona?", options: ["Buscar unos cuantos ejemplos bonitos en el gráfico","Encontrar todos los casos en años, calcular el resultado con comisiones y comparar con entradas aleatorias","Preguntar a un trader experimentado"], explain: "Unos cuantos ejemplos siempre se pueden elegir a posteriori. Una prueba son todos los casos, los costes y la comparación con el azar." },
        null,
      ],
    },
    "m08-4": {
      title: "Volumen y fuerza de la señal",
      blocks: [
        { text: "El [[Объём торгов|volumen de negociación]] se recomienda a menudo como confirmación: una ruptura con volumen alto es «real», con volumen bajo, «falsa». Dos salvedades. Parte del volumen de los exchanges son operaciones consigo mismo, que pintan actividad. Y el volumen de distintos exchanges se agrega de forma distinta, así que la misma vela puede verse diferente en dos sitios web." },
        { text: "¿Cómo se mide si una señal sirve para algo? El proyecto usa el [[IC (связь сигнала с будущим)|IC]]: la correlación de una señal con los rendimientos futuros. 0 significa ninguna relación. Las buenas señales en los mercados de acciones dan 0,02–0,05. Pero incluso una relación real puede no pagar las comisiones. En el proyecto, 1 unidad de IC daba unos 56 puntos básicos de diferencia de rendimiento. Así que una señal con un IC de 0,03 da unos 1,7 pb, mientras que una operación cuesta al menos 8–20 pb." },
        { text: "**Funding alto → rendimiento futuro:** IC −0,046, y la diferencia entre el mejor y el peor grupo en dinero +0,0004 (t +0,29). Estadísticamente hay relación; no se puede convertir en dinero.\n\n**Siete señales débiles juntas:** la relación creció de 0,023 a 0,036, pero después de costes 0 de 31 conjuntos quedaron en ganancia. Para que una combinación así compense, harían falta unas 43 señales independientes, y no hay tantas.", source: "Catálogo de ideas del proyecto: D «Funding alto», #33 «Combinación de siete señales débiles»" },
        { q: "Una señal está ligada de forma estadísticamente significativa al precio futuro. ¿Significa que se puede ganar dinero con ella?", options: ["Sí, ya que la relación es significativa","No necesariamente: la relación puede ser menor que las comisiones por operación","No, las señales significativas no funcionan"], explain: "La significancia dice que la relación no es aleatoria. Que compense es otra cuestión: el tamaño de la ventaja frente a los costes." },
        null,
      ],
    },
  },
};

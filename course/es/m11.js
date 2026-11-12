// Перевод модуля m11 (es). Формат — public/course/tr.js.
export default {
  id: "m11",
  src: "2b7cb093",
  title: "Prueba honesta",
  summary: [
    "Un backtest muestra qué habría pasado si una regla hubiera funcionado en el pasado; miente con facilidad por anticipación, sobreajuste y costes equivocados.",
    "Entre cientos de estrategias aleatorias siempre hay una brillante; el umbral de significancia sube con el número de intentos, y la mejor del sandbox suele ser corriente con datos nuevos.",
    "El orden de la prueba: dejar la regla por escrito antes, contar cada intento, abrir los datos reservados una vez, luego el papel.",
  ],
  lessons: {
    "m11-1": {
      title: "Un backtest y sus promesas",
      blocks: [
        { text: "Un [[Бэктест|backtest]] es un cálculo de lo que habría ganado una regla si se hubiera operado con ella en el pasado. Es la única forma barata de probar una idea: no hace falta dinero, y años de historia se calculan en segundos.\n\nPero un backtest es un modelo, no el pasado. Supone que las operaciones se habrían ejecutado al precio correcto, que las comisiones eran las indicadas, que la regla se conocía de antemano y no cambió. Cada uno de estos supuestos puede romperse sin que se dé cuenta, y obtiene una curva bonita que nunca ocurrirá en la realidad." },
        null,
        { text: "Un bot de grid en velas horarias mostró +275,7 puntos porcentuales. Con datos de un minuto el mismo bot dio −931 %. El modelo de ejecución horario contaba rondas que no habrían ocurrido dentro de la hora. El backtest era aritméticamente correcto; el supuesto sobre la ejecución era falso.\n\nUn bot construido con reglas de TradingView (VWAP, RSI(3), EMA(8) en velas de un minuto) dio 18 señales en 5,6 años: las condiciones casi se excluían entre sí. Tras corregir las condiciones, una pérdida de −1,9 puntos porcentuales.", source: "Catálogo de ideas del proyecto: grid «Bots de grid», vwap «VWAP + RSI(3) + EMA(8)»" },
        { q: "Un backtest mostró +300 % en tres años. ¿Qué hay que comprobar primero?", options: ["Nada, el cálculo lo hizo un ordenador","La ejecución, los costes, el número de intentos y si la regla mira al futuro","Solo la comisión"], explain: "Un ordenador calcula correctamente lo que se le dice. Los errores están en los supuestos: a qué precio se ejecuta una operación, qué se sabía en el momento de decidir, cuántas variantes se probaron." },
        null,
      ],
    },
    "m11-2": {
      title: "Mirar al futuro",
      blocks: [
        { text: "El [[Заглядывание в будущее|sesgo de anticipación]] es cuando el cálculo usa algo que aún no existía en el momento de la decisión. El caso más común es una sola vela: la regla mira el cierre del día y «compra» al inicio de ese mismo día.\n\nEl error parece inocente: en el código es el desplazamiento de una línea. Pero el resultado cambia muchas veces." },
        null,
        { text: "La línea azul es el cálculo honesto: una decisión tomada al cierre del día surte efecto desde el día siguiente. La roja recibe la subida del mismo día en que se tomó la decisión. La diferencia es ×7 frente a ×176.\n\nOtros tipos de anticipación: la lista de monedas «de hoy» (las muertas han desaparecido: [[Выжившая вселенная|sesgo de supervivencia]]); un indicador recalculado sobre toda la historia; parámetros elegidos con los mismos datos en los que luego se muestra el resultado." },
        { text: "El clasificador de regímenes Markov 2.0 prometía un 82 % de persistencia del régimen. El proyecto lo comprobó: las ventanas de cálculo se solapaban, y los días vecinos casi se duplicaban entre sí. Con un paso honesto y sin solapamiento, un 30 % frente a un 33 % de adivinar al azar.", source: "Catálogo de ideas del proyecto: markov «Markov 2.0: un clasificador de regímenes de mercado»" },
        { q: "Una regla decide al cierre del día, y el backtest le atribuye la subida de ese mismo día. ¿Qué está mal?", options: ["Todo es correcto","Es anticipación: en el momento de decidir, la subida del día ya había ocurrido","Solo hay que tener en cuenta la comisión"], explain: "Con honestidad, el rendimiento solo debe recibirse a partir del día siguiente a la decisión." },
        null,
      ],
    },
    "m11-3": {
      title: "500 monos y el umbral",
      blocks: [
        { text: "Tomemos 500 «monos». Cada día cada uno cambia su decisión con una probabilidad del 5 %: estar en la moneda o no. Sin análisis, puro azar. Hagámoslos correr sobre la historia real de BTC con una comisión del 0,1 %." },
        { steps: ["La mayoría de los monos se quedan detrás de simplemente mantener: están fuera del mercado parte del tiempo, y el mercado subió.","Pero el mejor de los 500 superó a mantener varias veces. Si fuera una «estrategia» con un nombre bonito, se podría vender."] },
        { text: "De ahí la lección principal: **si se han probado muchas variantes, la mejor de ellas no demuestra nada**. Para distinguir habilidad de suerte, el [[t-статистика|estadístico t]] de la mejor variante se compara con el [[Планка значимости|umbral]]: lo que da la mejor de N variantes de puro ruido. Un intento: 1,96. Veinte: 2,45. Quinientos: 3,53." },
        null,
        null,
        { text: "Cada intento cuenta: cada parámetro, cada moneda, cada variante de la regla, incluso una descartada. Por eso el polígono lleva un diario de intentos y sube el umbral por sí mismo. El número honesto de intentos casi siempre es mayor de lo que uno querría admitir." },
        { text: "**Amplitud del mercado:** t 1,67 frente a un umbral de 2,39. **Datos macro:** el mejor resultado, t 2,71 frente a un umbral de 2,87: cerca, pero no. Sin el umbral ambas ideas habrían parecido funcionar: para un solo intento habría bastado con 1,96.", source: "Catálogo de ideas del proyecto: K7-H5 «Amplitud del mercado», macro «Macro»" },
        { q: "Probó 200 variantes de una regla, y la mejor dio t = 2,5. ¿Qué significa?", options: ["La regla funciona: 2,5 es más que 1,96","Nada concreto: para 200 intentos el umbral es de alrededor de 3,3, y 2,5 es un resultado corriente para la mejor del ruido","La regla sin duda no funciona"], explain: "√(2·ln 200) ≈ 3,26. La mejor de 200 variantes aleatorias da de media más o menos ese t." },
        { label: "Ver el umbral y el diario en el polígono" },
        null,
      ],
    },
    "m11-4": {
      title: "Sobreajuste y datos reservados",
      blocks: [
        { text: "El [[Переподгонка|sobreajuste]] es cuando una regla se ajusta con tanta precisión al pasado que ha memorizado su ruido. En el sandbox brilla; con datos nuevos es como todas.\n\nHay una defensa: los [[Песочница и холдаут|datos reservados]]. La historia se divide en dos partes. En la primera (el sandbox) se puede probar y ajustar cualquier cosa. La segunda se deja sin tocar hasta el final y se abre **una vez**, cuando la regla ya está escrita de forma definitiva." },
        null,
        { text: "Los monos lo muestran con claridad: el mejor del sandbox se comporta como uno al azar en los datos reservados; su habilidad era suerte. La relación entre el puesto en el sandbox y el puesto después es casi nula.\n\nCon reglas reales pasa lo mismo, solo que más suave. Abajo, la regla «mantener por encima de la media de n días» con 30 variantes de n." },
        null,
        { text: "En BTC el mejor n del sandbox dio ×36 frente a una mediana de ×7,6 entre variantes. En los datos reservados el mismo n dio ×2,2: algo mejor que la mediana (×1,7) y que mantener (×1,8). La promesa del sandbox está exagerada muchas veces, aunque la regla en sí no carece de sentido. Cambie la moneda: en otras monedas la mejor variante del sandbox queda 4.ª, 6.ª, 9.ª de 30." },
        { text: "**Tortugas:** la mejor variante ×21 en el sandbox y ×0,84 en los datos reservados de 2025–2026 (t 0,44).\n\n**Rebote tras una cascada de liquidaciones:** t 3,02 en 4 monedas, 0,98 en otras 10.\n\n**Entrada de stablecoins:** la relación es real (t 3,02), pero la [[PBO (вероятность подгонки)|probabilidad de sobreajuste]] de la regla es del 62,9 %.\n\n**Una condición prerregistrada:** el carry con expansión de la base mostró un factor de beneficio de 7,6–9,3, pero incumplió la condición escrita antes del cálculo, «ni un solo año perdedor», y fue rechazado, por tentador que fuera quedárselo.", source: "Catálogo de ideas del proyecto: «Tortugas», N, chain, S1-6" },
        { q: "Abrió los datos reservados y el resultado fue malo. Ajustó la regla y volvió a probar: ahora es bueno. ¿Puede fiarse?", options: ["Sí, la regla se ha mejorado","No: los datos reservados se han convertido en un sandbox más; hacen falta datos nuevos sin tocar o trading en papel","Sí, si la mejora es grande"], explain: "Los datos reservados funcionan una vez. Tras ajustarse a ellos, dejan de ser una prueba independiente." },
        null,
      ],
    },
    "m11-5": {
      title: "Los costes deciden",
      blocks: [
        { text: "Comisiones, [[Проскальзывание|deslizamiento]], [[Фандинг|funding]], spread: pequeños porcentajes por operación. Pero se pagan en cada operación, y la ventaja de una regla suele ser aún menor. Cuanto más a menudo opera una regla, más importan los costes." },
        null,
        { text: "Las «tortugas» en BTC hicieron 136 operaciones y, al subir la comisión de 0 a 0,5 %, perdieron la mitad del resultado: ×26 → ×13. Una regla con 40 operaciones apenas notó la diferencia. En velas horarias y de un minuto hay decenas de veces más operaciones: allí los costes suelen comérselo todo." },
        { text: "**Market making pasivo:** +0,33 pb de spread, −0,60 de selección adversa, −2,00 de comisiones: un total de −2,27 pb por operación.\n\n**Estacionalidad intradía:** un efecto de 3–10 pb frente a un umbral de 10.\n\n**Comprar al líder de la hora:** el líder cambia 21 veces al día: eso es un 1532 % al año solo en comisiones.", source: "Catálogo de ideas del proyecto: mm, seas, pump" },
        { q: "Una regla gana un 0,08 % por operación antes de costes, y la comisión con deslizamiento es del 0,15 % por vuelta. ¿Qué hacer?", options: ["Operar más a menudo para ganar más","No operar: después de costes cada operación es una pérdida","Usar apalancamiento"], explain: "Ni la frecuencia ni el apalancamiento cambian el signo del resultado de una operación. Hace falta una ventaja mayor o costes menores." },
        { label: "Probar con sus comisiones" },
        null,
      ],
    },
  },
};

// Перевод модуля m00 (es). Формат — public/course/tr.js.
export default {
  id: "m00",
  src: "fabae8b7",
  title: "Cómo funciona el curso y qué esperar",
  summary: [
    "El curso explica las cripto y el trading con palabras sencillas; el programa permite comprobarlo todo en la historia real.",
    "Casi todas las ideas de trading, probadas con honestidad, no superan a simplemente mantener.",
    "Las cifras principales del programa: rendimiento, caída, comparación con la referencia y el umbral de significancia.",
  ],
  lessons: {
    "m00-1": {
      title: "Qué da el curso y qué no",
      blocks: [
        { text: "El programa tiene dos modos. **Aprendizaje** es el curso: qué son las monedas, los exchanges, los wallets y los protocolos, cómo funciona el trading y cómo probar ideas con honestidad. **Trabajo** es la prueba en sí: elegir monedas, ver su estado, escoger una idea, probarla en la historia y seguirla en papel, sin dinero." },
        { caption: "Los modos están enlazados: desde una lección se puede saltar directamente a una prueba con datos reales, y desde el modo de trabajo se puede abrir la lección necesaria." },
        { text: "El curso **da** comprensión: qué pasa cuando pulsa «comprar», de dónde salen los intereses en DeFi, por qué la misma estrategia parece brillante en un tramo de la historia y fracasa en otro.\n\nEl curso **no da** una forma lista de ganar dinero ni le dice qué comprar. No es asesoramiento de inversión. Cuando una lección muestra una estrategia, siempre muestra lo que encontró una prueba honesta, también cuando el resultado es malo." },
        { q: "¿Qué obtendrá en el modo de trabajo?", options: ["Señales de qué comprar hoy","Una prueba de su idea en la historia, con costes y comparación con la referencia","Trading automático en un exchange"], explain: "El programa prueba ideas con datos pasados y hace trading en papel. No tiene señales de «compre ya» ni hace operaciones reales." },
      ],
    },
    "m00-2": {
      title: "Por qué la mayoría de las estrategias no funcionan",
      blocks: [
        { text: "Imagine 500 personas, cada una lanza una moneda 10 veces. Seguro que alguien saca 8 o 9 caras. No lanza monedas mejor que los demás: simplemente hay mucha gente. Con las ideas de trading pasa lo mismo: pruebe muchas ideas y unas cuantas parecerán excelentes por azar." },
        { steps: ["10 personas: el mejor resultado suele ser 6–8 caras.","100 personas: alguien ya tiene 8–9 caras, aunque la moneda es justa.","500 personas: el mejor parece un maestro, pero es azar. Cuantos más intentos, más alto debe estar el umbral."] },
        { text: "Por eso el programa calcula el [[t-статистика|estadístico t]] —con qué constancia la idea superó a la referencia, vela tras vela— y lo compara con el [[Планка значимости|umbral de significancia]]. El umbral sube con el número de pruebas del diario: es la misma corrección de las «500 personas con una moneda»." },
        { text: "La investigación sobre la que se construye el programa: 29 hipótesis y 563 variantes en cripto. Con tantos intentos, el umbral es t por encima de 3,09. Ninguna idea que predice la dirección del precio lo superó: la relación entre la señal y el movimiento futuro (IC) es de unos 0,04 y cambia de signo de un periodo a otro. Solo resultó predecible el tamaño de los movimientos (IC de unos 0,51), pero dimensionar posiciones con él no compensó.", source: "Resumen del programa de investigación del proyecto" },
        { label: "Ver cuántos intentos hay ya en su diario" },
        { q: "Probó 200 variantes de una idea y la mejor superó a mantener. ¿Qué significa?", options: ["La idea funciona, hay que operar","Todavía nada: entre 200 variantes la mejor casi siempre parece buena por azar; hace falta un umbral alto y una prueba con datos nuevos","Hay que probar 200 variantes más"], explain: "La mejor de muchas es como el mejor de 500 lanzadores de monedas. Sin corrección por el número de intentos y sin prueba con datos que no ha visto, no es una prueba." },
      ],
    },
    "m00-3": {
      title: "Cómo leer las cifras del programa",
      blocks: [
        { text: "Cada prueba tiene cuatro cifras principales.\n\n**Rendimiento**: cuánto creció el capital en todo el periodo, después de comisiones y deslizamiento.\n\n**[[Просадка|Caída]]**: la mayor bajada del capital desde un pico hasta un valle. Es lo que tendrá que aguantar sin abandonar la idea." },
        { caption: "El resultado final puede ser positivo mientras el capital cayó un tercio por el camino. Dos ideas con el mismo rendimiento y distinta caída son ideas distintas." },
        { text: "**Comparación con la referencia.** «+80 %» por sí solo no significa nada: si la moneda subió un 120 % en el mismo tiempo, la idea perdió frente a simplemente [[Удержание (buy&hold)|mantener]]. Por eso el programa siempre muestra la referencia al lado.\n\n**Por encima del umbral o no.** Aunque la idea supere a la referencia, puede ser suerte: vea la lección anterior. La línea de resumen del programa responde a ambas preguntas a la vez: si superó a la referencia y si pasó el umbral." },
        { q: "Una idea ganó +150 %, mantener la misma moneda ganó +200 %, y la caída de la idea es la mitad de profunda. ¿Cómo describirlo con honestidad?", options: ["La idea es peor: perdió frente a la referencia","La idea es mejor: ganó mucho","La idea ganó menos que mantener pero con menor caída; qué importa más lo decide usted, y si es azar lo muestra el umbral"], explain: "El rendimiento y la caída son propiedades distintas. Perder en rendimiento pero ganar en caída es una elección legítima si se hace a conciencia y supera la prueba del azar." },
        { label: "Abrir la prueba de ideas" },
        null,
      ],
    },
  },
};

// Перевод модуля m12 (es). Формат — public/course/tr.js.
export default {
  id: "m12",
  src: "20ec1cae",
  title: "Trading algorítmico y con IA",
  summary: [
    "Un bot ejecuta una regla sin emociones pero no hace mejor la regla; la mayoría de los fallos están en los datos, las órdenes y la contabilidad, no en la idea.",
    "El aprendizaje automático solo con precios casi siempre encuentra ruido: alta precisión en el entrenamiento, alrededor del 50 % en una prueba walk-forward.",
    "Los modelos de lenguaje son útiles como ayudantes: explicar, escribir código, encontrar un error. No se les puede confiar predecir precios ni decidir por usted.",
  ],
  lessons: {
    "m12-1": {
      title: "Algoritmo y bot",
      blocks: [
        { text: "Un algoritmo es una regla escrita con tanta precisión que una máquina puede ejecutarla. Un [[Торговый бот|bot de trading]] es un programa que, siguiendo esa regla, obtiene datos, decide y envía órdenes a un exchange por sí solo.\n\nUn bot elimina dos problemas humanos: las emociones y el cansancio. No tiene miedo de vender tras una caída y no se olvida de poner un stop por la noche. Pero un bot no hace rentable una regla: si la regla no tiene ventaja, el bot simplemente la ejecutará con más pulcritud." },
        null,
        { text: "La regla es un eslabón de cinco. Los demás: de dónde vienen los datos y si llegan tarde, si el exchange acepta la orden, a qué precio se ejecuta, cómo se contabilizan las comisiones y el funding. En la práctica, la mayoría de los problemas de un bot están justo ahí: una vela perdida, un rechazo del exchange, una ejecución parcial, una orden repetida tras un fallo de conexión.\n\nAsí que el camino de un bot hasta el dinero es el mismo que el de cualquier idea: un backtest honesto, luego [[Бумажная торговля|trading en papel]], luego un importe pequeño." },
        { text: "El proyecto tenía agentes de IA que proponían ellos mismos reglas para bots. Sus ideas se probaron como cualquier otra:\n\n**BearShort:** cortos en régimen bajista, un factor de beneficio de 1,17 en 81 operaciones (t 0,62), −57,6 puntos porcentuales al volver a probarlo. **Funding Contrarian:** −16,6 puntos porcentuales, [[Суррогатный тест|prueba subrogada]] p = 0,517. **Rupturas rápidas:** un grupo de control sin selección dio casi lo mismo.\n\nNinguna pasó. El autor de una regla, humano o IA, no la exime de la prueba.", source: "Catálogo de ideas del proyecto: bear, FC, fast" },
        { q: "Un bot opera con una regla que no tiene ventaja. ¿Qué cambiará el bot?", options: ["Hará rentable la regla gracias a la velocidad","Nada en esperanza: ejecutará con pulcritud una regla no rentable","Eliminará las comisiones"], explain: "Un bot es un ejecutor. Elimina errores de ejecución, pero no crea una ventaja que no está en la regla." },
        { label: "Abrir el trading en papel en el polígono" },
        null,
      ],
    },
    "m12-2": {
      title: "Ejecución y latencia",
      blocks: [
        { text: "Entre una decisión y una operación pasa un tiempo: la [[Задержка (латентность)|latencia]]. Mientras la orden viaja al exchange, el precio tiene tiempo de moverse. Cuanto más corto el horizonte de la regla, más importan esos milisegundos." },
        null,
        { text: "Los grandes jugadores colocan servidores junto al exchange ([[Колокация|colocation]]) y reaccionan en fracciones de milisegundo. No tiene sentido competir con ellos en velocidad desde casa. A un bot particular le quedan las reglas para las que da igual entrar ahora o dentro de un minuto: diarias y horarias.\n\nAdemás de la velocidad, la ejecución tiene sus propias trampas. El exchange limita el número de solicitudes (un [[Лимит запросов|límite de solicitudes]]) y puede rechazar temporalmente. Una orden grande se ejecuta por partes y a un precio medio peor. En los desplomes, los stops saltan peor de donde estaban puestos. Un buen backtest supone una ejecución **pesimista**: si una idea sobrevive a una mala ejecución, sobrevivirá a la real." },
        { text: "**Cortos en pumps:** un 53–55 % de aciertos. Pero tras una subida del 20 %, en el 69 % de los casos el precio consigue subir otro 5 % en la hora, antes de que el corto se ejecute al precio deseado. El resultado de la cuenta osciló entre ×0,000 y ×0,041, con una peor operación de −142 %.\n\n**Entrar en medio de un pump:** 0 de 24 variantes en ganancia con ejecución pesimista.", source: "Catálogo de ideas del proyecto: short-pump, bounce-pump" },
        { q: "Una regla opera con velas de un minuto y gana un 0,05 % por operación en un backtest. El bot funciona en un ordenador de casa. ¿Qué esperar?", options: ["El mismo 0,05 %","Muy probablemente peor: la latencia y el deslizamiento con datos de un minuto son comparables a esa ventaja","Mejor, porque un bot es más rápido que una persona"], explain: "En horizontes cortos, la ejecución se lleva la mayor parte de una ventaja pequeña. Sin tener en cuenta la latencia, un backtest es demasiado optimista." },
        { sources: ["Bybit: límites de solicitudes de la API"] },
      ],
    },
    "m12-3": {
      title: "Aprendizaje automático con precios",
      blocks: [
        { text: "El [[Машинное обучение|aprendizaje automático]] es cuando una regla no se escribe a mano, sino que se ajusta a partir de datos. Al modelo se le muestran [[Признак (в машинном обучении)|variables]] (por ejemplo, los rendimientos de los últimos 5 días) y las respuestas correctas (si el precio subió al día siguiente), y busca una relación.\n\nDos modelos sencillos. La [[Логистическая регрессия|regresión logística]] busca la suma ponderada de variables que mejor separa los días de subida de los de bajada. Los [[k ближайших соседей|k vecinos más cercanos]] encuentran los k días pasados más parecidos a hoy y miran qué vino después.\n\nLo principal de la prueba es la [[Проверка вперёд|prueba walk-forward]]: para cada día el modelo aprende solo de los días anteriores." },
        null,
        null,
        { text: "kNN con k = 1, sobre los mismos datos con los que aprendió, acierta el 100 % de los días: simplemente recuerda la respuesta. En una prueba walk-forward, el 49 %: peor que una moneda. Cuanto más flexible el modelo, mayor la brecha entre entrenamiento y prueba: eso es el sobreajuste.\n\nCambie el modelo, k y el número de variables abajo. Con una prueba honesta, todas las variantes se quedan alrededor del 50 %, y la [[IC (связь сигнала с будущим)|relación con el futuro]], alrededor de cero." },
        null,
        { text: "**Predecir la volatilidad** (el modelo HAR): funciona: calidad +29 %, mejor en 11 monedas de 14. Pero la versión de trading perdió: Sharpe 0,18 frente a 0,35. La volatilidad es predecible; con ella no se gana dinero.\n\n**Siete señales débiles juntas:** la relación con el futuro creció de 0,023 a 0,036, pero después de costes 0 de 31 conjuntos quedaron en ganancia.\n\nLos modelos complejos (redes neuronales, boosting) con los mismos precios buscan la misma relación débil, solo que con más margen para el sobreajuste.", source: "Catálogo de ideas del proyecto: HAR, #33" },
        { q: "En el entrenamiento un modelo acierta el 85 % de los días; en una prueba walk-forward, el 51 %. ¿Qué significa?", options: ["El modelo es excelente: 85 %","El modelo memorizó el pasado: un 51 % cuando casi el 50 % de los días son subidas es nivel de moneda al aire","Hay que añadir más variables"], explain: "Solo importa el resultado en días que el modelo no ha visto. Añadir variables suele ampliar la brecha, no el resultado." },
        null,
      ],
    },
    "m12-4": {
      title: "Modelos de lenguaje como ayudantes",
      blocks: [
        { text: "Un [[Языковая модель|modelo de lenguaje]] (ChatGPT, Claude, Gemini y otros) puede explicar, escribir código y razonar. Eso lo hace útil en el trading, pero no como prometen los anuncios de «un bot de IA que gana solo»." },
        null,
        { text: "**Dónde ayuda.** Explicar un término desconocido o el código de otro. Escribir un cálculo y sus pruebas. Encontrar una anticipación o una comisión olvidada. Enumerar qué puede salir mal. Convertir un diario de operaciones en un informe.\n\n**Dónde no ayuda.** El modelo no conoce el precio de mañana: no tiene ese conocimiento, igual que nadie. Puede inventarse con seguridad un dato, una cifra o un enlace, así que cualquier cifra se comprueba con la fuente original. Su conocimiento acaba en la fecha de su entrenamiento: puede no saber las noticias de ayer.\n\n**Seguridad.** No dé a un bot o agente claves con derecho a retirar fondos. El texto de una página web, un correo o un documento puede contener instrucciones ocultas para el modelo: [[Внедрение указаний|inyección de instrucciones]]. Un agente que lee internet y además puede operar es un blanco fácil." },
        { text: "Este polígono se construyó con ayuda de un asistente de IA: código, pruebas, comprobación de cálculos. Al mismo tiempo, todas las ideas de trading, incluidas las propuestas por agentes de IA, pasaron por el mismo umbral, los datos reservados y el diario de intentos, y la mayoría no lo superó. La IA acelera las pruebas, pero no las sustituye.", source: "Catálogo de ideas y diario de intentos del proyecto" },
        { q: "Un asistente de IA escribe con seguridad que una estrategia da un 40 % anual y cita un enlace. ¿Qué hacer?", options: ["Creerle: el modelo sabe mucho","Abrir el enlace, comprobar la cifra en la fuente original y probar la propia estrategia en el polígono","Pedir al modelo que lo confirme otra vez"], explain: "Los modelos a veces se inventan cifras y enlaces, y al preguntarles de nuevo confirman su propio error. La comprobación se hace con la fuente original y con datos." },
        { sources: ["OWASP: riesgos de las aplicaciones con modelos de lenguaje"] },
      ],
    },
  },
};

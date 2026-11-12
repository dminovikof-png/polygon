// Перевод модуля m07 (es). Формат — public/course/tr.js.
export default {
  id: "m07",
  src: "58c0c122",
  title: "Análisis fundamental",
  summary: [
    "Un protocolo y su token tienen dinero distinto: lo que importa es si hay un camino de los ingresos al tenedor: recompra, quema, reparto.",
    "La emisión de monedas nuevas y los desbloqueos son vendedores constantes; para que el precio se quede quieto, la demanda debe crecer en la misma medida.",
    "La actividad de la red y el precio de la moneda están ligados de forma débil y con mucho retraso; muchas métricas on-chain son fáciles de falsear.",
  ],
  lessons: {
    "m07-1": {
      title: "Ingresos y el camino hasta el token",
      blocks: [
        { text: "El [[Фундаментальный анализ|análisis fundamental]] pregunta: ¿qué hay detrás del precio? Una acción tiene el beneficio de la empresa y el derecho a una parte de él. Un token no tiene ese derecho por defecto.\n\nUn protocolo de intercambio puede cobrar cientos de millones de dólares en comisiones al año, pero si todas van a los proveedores de liquidez, el tenedor del token no recibe nada. Por eso no se mira a los [[Выручка протокола|ingresos del protocolo]] en general, sino al camino de los ingresos al token." },
        null,
        { text: "Hay tres caminos. **Reparto**: una parte de las comisiones se paga a quienes han hecho staking del token. **[[Выкуп и сжигание|Recompra y quema]]**: el protocolo compra tokens en el mercado y los destruye. **Derecho de voto**: los tenedores quizá algún día voten un reparto; es una promesa, no dinero.\n\nCuando hay un camino, se puede calcular un [[Мультипликатор|múltiplo]], como en las acciones: el valor de todos los tokens / los ingresos anuales que llegan a los tenedores. Para empresas maduras lo típico es 10–30. Para muchos tokens son cientos o infinito, porque a los tenedores no llega nada." },
        { q: "Un protocolo ganó 100 millones de $ en comisiones, pero todo va a los proveedores de liquidez. ¿Qué recibe el tenedor del token?", options: ["Su parte de los 100 millones de $","Nada, mientras no haya reparto, recompra ni quema","Intereses de un depósito"], explain: "Los ingresos del protocolo y los ingresos del token son cosas distintas. Sin un mecanismo que transmita el dinero, el tenedor solo posee un voto y una esperanza." },
        { sources: ["DefiLlama: comisiones e ingresos de protocolos"] },
      ],
    },
    "m07-2": {
      title: "Oferta: emisión y desbloqueos",
      blocks: [
        { text: "El precio está donde se encuentran la oferta y la demanda. Se habla mucho de la demanda y menos de la oferta, aunque la oferta es más fácil de contar.\n\nLas monedas nuevas aparecen de dos formas. La [[Эмиссия|emisión]] es la recompensa a validadores o mineros, y ocurre cada día. Los [[Разблокировка|desbloqueos]] son lotes de tokens del equipo y de los inversores que quedan disponibles para la venta según un calendario. Quienes los reciben a menudo venden: tienen que pagar sueldos, y los fondos tienen que devolver dinero a sus propios inversores." },
        null,
        { text: "Si una moneda emite un 8 % al año y el precio se queda quieto, la demanda en dólares en realidad creció un 8 %: las monedas nuevas se la comieron. Mientras tanto, el tenedor sufre [[Размывание|dilución]]: su parte de la red se reduce.\n\nLa emisión de BTC está ahora por debajo del 1 % anual y se reduce a la mitad cada cuatro años. Los tokens jóvenes con una [[FDV|FDV]] de 5 a 10 veces su capitalización tienen por delante varios años de grandes desbloqueos." },
        { text: "El proyecto intentó comprobar si los grandes desbloqueos presionan el precio en los días alrededor del evento. Solo se encontraron 21 eventos adecuados con fechas y volúmenes exactos, frente a los 150 necesarios para una prueba honesta. La idea se congeló el 12.10.2026 sin abrir los datos reservados: todavía no hay respuesta de «funciona» o «no funciona».\n\nEso también es un resultado: los bonitos gráficos de «precio tras un desbloqueo» en redes sociales suelen construirse con unos pocos eventos elegidos a posteriori.", source: "Catálogo de ideas del proyecto: U1 «Desbloqueos de tokens»" },
        { q: "Una moneda emite un 10 % de monedas nuevas al año. Su capitalización creció un 10 % en el año. ¿Qué pasó con el precio?", options: ["Subió un 10 %","Apenas cambió: todo el crecimiento de la capitalización se fue a las monedas nuevas","Cayó un 10 %"], explain: "Capitalización = precio × monedas. Hay un 10 % más de monedas, y la capitalización creció ese mismo 10 %: el precio siguió igual." },
        { sources: ["Token Unlocks: calendarios de desbloqueo"] },
      ],
    },
    "m07-3": {
      title: "La red funciona, el precio cae",
      blocks: [
        { text: "Una idea tentadora: si una red se usa cada vez más, la moneda debería encarecerse. En tramos largos la relación existe de verdad. Pero en un horizonte de meses e incluso de un año se ahoga en el ánimo del mercado." },
        null,
        { text: "En 2022 la red de Bitcoin funcionó sin fallos y el hashrate creció; aun así el precio cayó más de tres cuartos. La red no cambió; cambiaron los tipos de interés, la liquidez y el apetito de la gente por el riesgo.\n\nAsí que los datos fundamentales responden a la pregunta «qué es esto y cuánto podría valer en años», pero sirven poco para decidir «comprar esta semana»." },
        { text: "El proyecto probó si los datos macro (el dólar, los tipos de interés, los diferenciales de crédito, el VIX, el rendimiento del bono a 10 años) predicen los rendimientos de las cripto. El mejor resultado fue t 2,71 frente a un umbral de 2,87: cerca, pero no lo supera. El efecto del rendimiento de los bonos sobre BTC con t 3,60 de un estudio ajeno no se reprodujo.", source: "Catálogo de ideas del proyecto: macro «Macro: el dólar, los tipos, el crédito, el VIX»" },
        { q: "El número de direcciones activas de una red se duplicó en un año. ¿Qué se puede decir del precio dentro de un mes?", options: ["Se duplicará","Casi nada: en un horizonte corto el precio depende sobre todo del ánimo del mercado","Caerá"], explain: "El uso de la red influye en el precio despacio y de forma imprecisa. En un mes deciden los tipos, la liquidez y el estado de ánimo." },
        { sources: ["Blockchain.com: hashrate de Bitcoin"] },
      ],
    },
    "m07-4": {
      title: "Métricas on-chain y sus trampas",
      blocks: [
        { text: "Un blockchain es abierto, así que se puede contar mucho: transferencias, direcciones, comisiones, entradas de monedas a exchanges, la oferta de stablecoins. Son las [[Ончейн-метрики|métricas on-chain]]. Pero abierto no significa honesto: muchas cifras cuestan casi nada de falsear." },
        null,
        { text: "El número de direcciones se infla creando millones de wallets vacíos. El volumen de transferencias, enviando las mismas monedas en círculo. El [[TVL|TVL]] crece cuando el mismo dinero se deposita en varios protocolos en cadena. Lo más difícil de falsear es lo que cuesta dinero real: las comisiones de la red, los ingresos del protocolo, las monedas quemadas." },
        { text: "Dos ideas on-chain populares en las pruebas del proyecto:\n\n**La entrada de stablecoins** como señal de subida: la relación es real (t 3,02), pero la regla de trading concreta resultó sobreajustada: un 62,9 % de probabilidad de sobreajuste.\n\n**Los flujos de monedas a los exchanges** («las ballenas llevan monedas para vender»): t 1,24, y en 5 años de 7 el signo fue el contrario del esperado.", source: "Catálogo de ideas del proyecto: chain «Oferta de stablecoins, flujos a exchanges»" },
        { q: "¿Qué métrica es la más difícil de falsear?", options: ["El número de direcciones nuevas","El volumen de transferencias dentro de la red","Las comisiones que los usuarios pagaron a la red"], explain: "Las comisiones son gastos reales. Solo se pueden inflar quemando el propio dinero, y eso es caro." },
        { sources: ["DefiLlama: stablecoins"] },
      ],
    },
  },
};

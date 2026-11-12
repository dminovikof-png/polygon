// Перевод модуля m06 (es). Формат — public/course/tr.js.
export default {
  id: "m06",
  src: "b149fbbe",
  title: "Tipos de activos",
  summary: [
    "Una opción es un derecho con precio: la pérdida del comprador se limita a la prima; la ganancia del vendedor se limita a la prima, y su pérdida puede ser grande.",
    "En una moneda no solo importa el precio, sino también la tokenómica: cuántas monedas quedan por llegar, quién las tiene y cuándo pueden venderse.",
    "Las grandes monedas han caído un 80–96 % desde su máximo y han tardado años en volver a él; las memecoins y los activos tokenizados añaden sus propios riesgos.",
  ],
  lessons: {
    "m06-1": {
      title: "Monedas, tokens, memecoins",
      blocks: [
        { text: "La palabra «cripto» mete en el mismo saco cosas muy distintas.\n\n**Las monedas de red** (BTC, ETH, SOL) pagan el trabajo de la propia red: en ellas se pagan las comisiones y las recompensas de los validadores. **Los tokens de protocolo** se emiten sobre una red y dan derechos en una aplicación: un voto, una parte de las comisiones, un descuento. Las [[Стейблкоин|stablecoins]] mantienen el precio del dólar. Las [[Мемкоин|memecoins]] no dan nada salvo la propia moneda: su precio se sostiene solo en la atención.\n\nDe cualquiera de ellas conviene conocer la [[Токеномика|tokenómica]]: cuántas monedas hay en total, cuántas se negocian ya y qué llegará al mercado después." },
        null,
        { text: "Se suelen confundir dos valoraciones. La [[Рыночная капитализация|capitalización de mercado]] es precio × monedas en circulación. La [[FDV|FDV]] es precio × todas las monedas que se emitirán. Si un 15 % está en circulación, el otro 85 % es del equipo, de los fondos y de la tesorería, y sale según un calendario de [[Вестинг|vesting]]. Cada [[Разблокировка|desbloqueo]] añade vendedores: para que el precio se sostenga, la demanda debe crecer más rápido que la oferta." },
        null,
        { text: "Incluso las mayores monedas han pasado por caídas tras las que la mayoría se rinde. Y eso que son las supervivientes: miles de monedas de ciclos pasados han desaparecido por completo, así que el gráfico de «todas las cripto» se ve mejor que el resultado de un comprador típico ([[Выжившая вселенная|sesgo de supervivencia]])." },
        { q: "El precio de un token es 1 $, hay 100 millones en circulación y en total se emitirán 1000 millones. ¿Cuál es la FDV?", options: ["100 millones de $","1000 millones de $","10 000 millones de $"], explain: "FDV = precio × todos los tokens futuros = 1 $ × 1000 millones. La capitalización es de 100 millones de $: los otros 900 millones de tokens aún tienen que llegar al mercado." },
        { sources: ["Binance: velas diarias públicas"] },
      ],
    },
    "m06-2": {
      title: "Opciones: un derecho con precio",
      blocks: [
        { text: "Una [[Опцион|opción]] es un contrato por el que el comprador obtiene el derecho, pero no la obligación, de comprar o vender una moneda al precio de [[Страйк|strike]] en la fecha de vencimiento. Por el derecho paga al vendedor una [[Премия|prima]] por adelantado.\n\nUna [[Колл|call]] es el derecho a comprar: rentable en una subida. Una [[Пут|put]] es el derecho a vender: rentable en una caída, y se parece a un seguro. Es importante recordar que toda opción tiene dos lados. El comprador arriesga la prima, mientras que el vendedor recibe la prima y asume una obligación." },
        { steps: ["Una call comprada con strike 100 por una prima de 6. Por debajo de 100 la opción no vale nada y pierde la prima. Por encima de 106, ganancia.","La misma operación vista por el vendedor: cobró 6 y está contento mientras el precio esté por debajo de 106. En una subida fuerte su pérdida es ilimitada.","Una put comprada: el derecho a vender a 100. Si la moneda cae a 60, la put aporta 40 menos la prima, como un seguro.","Una put vendida: una prima de 5 por adelantado, pero la obligación de comprar a 100 incluso tras un desplome. Muchos «depósitos con una tasa más alta» funcionan así."] },
        { text: "¿Cuánto vale el derecho? Lo principal es la [[Волатильность|volatilidad]]: cuanto más oscila una moneda, más probable es que la opción termine siendo rentable, y más cuesta. El mercado incorpora al precio las oscilaciones esperadas: es la [[Подразумеваемая волатильность|volatilidad implícita]]. El modelo clásico de Black–Scholes la convierte en una prima. Pruébelo abajo." },
        null,
        { text: "El proyecto probó comprar opciones baratas como una lotería: raras ganancias multiplicadas frente a pérdidas frecuentes de la prima. Esa lotería perdió frente a simplemente mantener BTC.\n\nVender volatilidad se ve mejor: la volatilidad implícita supera de media a la que realmente hubo después en 5,6–8,7 puntos. Pero el proyecto no logró predecir cuándo compensa esa prima (t 1,27, por debajo del [[Планка значимости|umbral]]). Y vender opciones a través de un «depósito» Dual Asset es una call vendida: una prima de alrededor del 0,19 % frente a una ganancia perdida ilimitada en una subida.", source: "Catálogo de ideas del proyecto: opt «Lotería de opciones, venta de volatilidad», dual «Dual Asset Sell High»" },
        { q: "Compró una put de BTC con strike de 60 000 $ por 2000 $. Al vencimiento BTC está en 70 000 $. ¿Cuál es el resultado?", options: ["Una ganancia de 10 000 $","Una pérdida de 2000 $: la put no hace falta; el derecho a vender a 60 000, por debajo del mercado, es inútil","Una pérdida de 10 000 $"], explain: "Una put paga solo si el precio está por debajo del strike. Si no, no se ejerce, y la pérdida es igual a la prima, como un seguro no usado." },
        null,
      ],
    },
    "m06-3": {
      title: "Futuros y la base",
      blocks: [
        { text: "El módulo 3 trató los futuros perpetuos con [[Фандинг|funding]]. También los hay normales, con plazo: un contrato para comprar o vender una moneda en una fecha fijada a un precio acordado hoy. El precio de un futuro así suele diferir del de la moneda. La diferencia se llama [[Базис|base]].\n\nCuando el mercado sube y muchos quieren comprar con apalancamiento, el futuro cuesta más que la moneda. Para la fecha de liquidación la base debe desaparecer: ese día el futuro y la moneda son lo mismo." },
        null,
        { text: "De ahí una operación: «comprar la moneda y a la vez vender el futuro». En ella el precio de la moneda casi no importa: lo que se pierde en una pata se gana en la otra. Lo que queda es la base menos las comisiones. Se parece a un depósito, con riesgos parecidos por el exchange que tiene ambas patas, más el riesgo de una subida brusca, cuando le piden añadir garantía en la pata corta." },
        { text: "Base trimestral en BTC y ETH: 13 operaciones de 13 en ganancia, un 14,6 % por operación de media, una caída del 3,6 %. Ahora mismo la idea «duerme»: la base anual ha bajado al 1–3 %, y tras las comisiones no queda nada que llevarse.\n\nLa misma idea con funding en lugar de base ([[Carry|carry]] en 19 monedas): +121 % en 2021–2026, una caída del 1,4 %. Pero el exceso sobre la referencia se derrite año tras año: +18,5, +5,0, +0,1, 0,0 puntos porcentuales, y en 2026 no hubo ni una operación. El carry gana cuando el mercado está recalentado y se calla cuando está frío.", source: "Catálogo de ideas del proyecto: H1 «Carry de base trimestral», S1-5 «Carry de funding»" },
        { q: "BTC está en 100 000 $ y el futuro a 90 días, en 102 500 $. ¿Qué pasa con la diferencia para la fecha de liquidación?", options: ["Se mantiene","Desaparece: el día de la liquidación los precios coinciden","Se duplica"], explain: "El día de la liquidación el futuro se convierte en la propia moneda. Así que la base converge a cero, y quien la vendió cobra esa base." },
        { label: "Probar el carry en el polígono" },
        { sources: ["Binance: liquidación de los futuros trimestrales"] },
      ],
    },
    "m06-4": {
      title: "Activos tokenizados",
      blocks: [
        { text: "Los [[Токенизированный актив|activos tokenizados]] prometen llevar al blockchain bonos, oro, inmuebles y acciones. Técnicamente es un token que el emisor se compromete a cambiar por el activo real. El blockchain en sí no sabe nada del activo: solo guarda el registro de quién tiene cuántos tokens." },
        null,
        { text: "Así que lo que hay que comprobar es una cadena de personas, no código. ¿Quién es el emisor y quién lo supervisa? ¿Dónde se guarda el activo y quién lo confirma? ¿Puede un tenedor normal cambiar el token por el activo, o el reembolso solo está abierto a grandes clientes? ¿Qué pasa con el token si el emisor quiebra?\n\nLos bonos del Tesoro de EE. UU. tokenizados pagan un interés cercano al tipo de la Fed, porque dentro hay bonos normales. Aquí no hay milagros de rendimiento. Hay comodidad de liquidación y un eslabón más de riesgo." },
        { q: "Un token de oro cotiza 50 $ por debajo del oro. ¿Cuál es la explicación más probable?", options: ["Una ganga, el mercado se equivoca","El mercado duda de la posibilidad de reembolso o del emisor","El oro en un blockchain es más barato por naturaleza"], explain: "Si el token pudiera cambiarse libremente por oro, los arbitrajistas comprarían el descuento. El descuento es el pago por el riesgo de algún eslabón de la cadena." },
        null,
      ],
    },
  },
};

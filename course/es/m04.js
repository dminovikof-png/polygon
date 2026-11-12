// Перевод модуля m04 (es). Формат — public/course/tr.js.
export default {
  id: "m04",
  src: "dbfb429c",
  title: "Exchanges descentralizados (DEX)",
  summary: [
    "Un DEX no tiene libro de órdenes: intercambia con un pool, y el precio lo fija la fórmula x·y = k; cuanto mayor es el intercambio respecto al pool, peor el precio.",
    "Los proveedores del pool ganan comisiones pero pagan con la pérdida impermanente: el pool entrega lo que se encarece y acumula lo que se abarata.",
    "La cola de transacciones es visible para todos, así que un intercambio grande con una tolerancia al deslizamiento alta es un regalo para los bots de sándwich.",
  ],
  lessons: {
    "m04-1": {
      title: "Un pool de liquidez en lugar de un libro de órdenes",
      blocks: [
        { text: "Un [[DEX (децентрализованная биржа)|exchange descentralizado]] es un conjunto de contratos inteligentes. No hay una empresa que guarde el dinero y verifique la identidad: conecta su wallet e intercambia tokens directamente desde él.\n\nMantener un libro de órdenes en un blockchain es caro: cada orden costaría gas. Por eso la mayoría de los DEX funcionan de otra forma: hay un [[Пул ликвидности|pool]], un contrato con una reserva de dos tokens. Los [[Поставщик ликвидности|proveedores de liquidez]] depositan ambos tokens en él, los traders intercambian con el pool y una fórmula calcula el precio. Este esquema se llama [[AMM (автоматический маркетмейкер)|creador de mercado automatizado]]." },
        null,
        { text: "Las ventajas: intercambiar en cualquier momento, sin registro, cualquier token puede tener su propio pool. Las desventajas son la otra cara de las ventajas. Cualquiera puede crear un pool incluso para un token sin valor, y nadie responde de los errores del contrato. En lugar de la comisión del exchange paga el gas de la red, la comisión del pool y el impacto de su intercambio en el precio." },
        { q: "¿Quién le vende un token en un DEX con un pool de liquidez?", options: ["Otro trader cuya orden estaba en el libro de órdenes","El propio pool: entrega un token y toma otro al precio que calcula la fórmula","La empresa del exchange"], explain: "No hay orden contraria. Su contraparte es un contrato con reservas depositadas por los proveedores de liquidez." },
        { sources: ["Uniswap: cómo funciona el protocolo"] },
      ],
    },
    "m04-2": {
      title: "La fórmula x·y = k",
      blocks: [
        { text: "La fórmula de pool más conocida es el [[Постоянное произведение (x·y=k)|producto constante]]. Supongamos que el pool tiene x ETH e y USDT. El precio de ETH es y / x. En un intercambio el producto x × y debe mantenerse (la comisión se añade aparte y se queda en el pool).\n\nEjemplo: el pool tiene 100 ETH y 200 000 USDT, el precio es 2000. Quiere sacar 10 ETH. Quedarán 90 ETH, y el producto 20 000 000 exige que los USDT pasen a ser 20 000 000 / 90 ≈ 222 222. Así que paga unos 22 222 USDT: 2222 por ETH, no 2000. Cuanto más saca, más cara cada unidad siguiente: los 100 ETH no se pueden sacar a ningún precio." },
        { steps: ["El pool está siempre sobre la curva x·y = k. El punto verde es el ahora: 100 ETH y 200 000 USDT.","Una compra de 10 000 USDT: el punto se movió por la curva y el precio subió alrededor de un 10 %.","Una compra de 50 000 USDT, un cuarto del pool: el precio medio es alrededor de un 25 % peor que el inicial.","Cuanto más se avanza por la curva, más empinada es: cada ETH siguiente cuesta más y más."] },
        null,
        { text: "De ahí el [[Влияние на цену|impacto en el precio]]: depende del tamaño del intercambio respecto al tamaño del pool. En un pool de cientos de millones de dólares, un intercambio de mil dólares apenas mueve nada; en un pool de 50 000 $, el mismo intercambio mueve el precio varios puntos porcentuales.\n\nTras un intercambio grande, el precio del pool difiere del de otros exchanges. Los [[Арбитраж|arbitrajistas]] lo devuelven enseguida: compran donde es más barato y venden donde es más caro. Esto mantiene los precios de los pools cerca del mercado y, como veremos en la próxima lección, se hace a costa de los proveedores." },
        { q: "El pool tiene 10 ETH y 20 000 USDT. Compra ETH por 20 000 USDT. ¿Cuántos ETH recibe (sin la comisión)?", options: ["10 ETH","5 ETH: los USDT pasan a 40 000, y el producto 200 000 exige 5 ETH en el pool","Casi 10 ETH, pero algo menos por la comisión"], explain: "x·y = 10 × 20 000 = 200 000. Tras el intercambio y = 40 000, así que x = 5. Sacó 5 ETH a 4000 de media: el doble del precio inicial." },
        { sources: ["Uniswap v2: la fórmula del producto constante"] },
      ],
    },
    "m04-3": {
      title: "Pérdida impermanente",
      blocks: [
        { text: "Un proveedor depositó 1 ETH y 2000 USDT en un pool a un precio de 2000. El precio de ETH se duplicó. Los arbitrajistas compraron ETH barato del pool hasta que el precio del pool llegó a 4000. Ahora la parte del proveedor en el pool es de unos 0,71 ETH y 2828 USDT: 5657 $ en total. Si simplemente hubiera mantenido 1 ETH y 2000 USDT, tendría 6000 $.\n\nEsta diferencia es la [[Непостоянные потери|pérdida impermanente]]: −5,7 % cuando el precio se duplica. El pool vende constantemente lo que se encarece y compra lo que se abarata. «Impermanente» porque, si el precio vuelve al inicial, la pérdida desaparece. Si no vuelve, la pérdida es bastante permanente." },
        { caption: "La pérdida es la misma para una subida y una caída del mismo factor: ×4 y ÷4 dan cada una −20 %." },
        null,
        { text: "Un proveedor gana comisiones de cada intercambio. El resultado es comisiones menos pérdida impermanente. Para pares que se mueven juntos (dos stablecoins en dólares), las pérdidas son pequeñas. Para pares en los que una moneda puede desplomarse respecto a la otra, las pérdidas pueden comerse todas las comisiones y más.\n\nLa [[Концентрированная ликвидность|liquidez concentrada]] es especialmente arriesgada: el proveedor mantiene monedas solo dentro de un rango de precios estrecho. Hay más comisiones, pero cuando el precio sale del rango, el proveedor se queda solo con la moneda que se abarató." },
        { text: "Un pool de dos monedas en esencia reequilibra, como un grid sobre la relación de sus precios. El proyecto lo probó directamente: la cosecha de oscilaciones es real y captura un 83–87 % del techo teórico. Pero para 76 pares altcoin/bitcoin la mediana fue de −3,46 puntos porcentuales al año frente a mantener, y el 45 % de las altcoins cayó más de un 90 % frente a bitcoin. Las oscilaciones aportan poco; la deriva larga de una moneda se lleva mucho.", source: "Catálogo de ideas del proyecto: «Prima de reequilibrio y grid sobre la relación»" },
        { q: "Un pool ETH/USDT: el precio de ETH cayó a la cuarta parte. ¿Cuánto se quedó atrás la participación en el pool respecto a simplemente mantener (sin comisiones)?", options: ["No se quedó atrás: el pool está en dólares","Un 20 %","Un 75 %"], explain: "La fórmula de la pérdida impermanente es simétrica: tanto ×4 como ÷4 dan −20 % respecto a mantener. Mantener también cayó; el pool simplemente perdió más." },
        { sources: ["Uniswap: proveedores de liquidez"] },
      ],
    },
    "m04-4": {
      title: "MEV y ataques sándwich",
      blocks: [
        { text: "Una transacción que envía llega primero a la [[Мемпул|cola pública]] y es visible para todos hasta que entra en un bloque. Quien arma el bloque decide en qué orden colocar las transacciones. Los ingresos de una reordenación rentable se llaman [[MEV|MEV]].\n\nEl tipo más conocido es el [[Сэндвич-атака|sándwich]]. Un bot ve su intercambio grande, coloca su propia compra delante y una venta justo después." },
        { steps: ["Su intercambio espera en la cola.","El bot compra primero y empuja el precio hacia arriba.","Usted compra a un precio peor, dentro de su tolerancia al deslizamiento.","El bot vende justo después de usted y se queda la diferencia."] },
        { text: "El bot puede mover el precio exactamente hasta donde usted permitió con su [[Допуск проскальзывания|tolerancia al deslizamiento]]: si acepta recibir un 5 % menos, el bot intentará llevarse casi todo ese 5 %.\n\nCómo protegerse:\n\n**Una tolerancia pequeña**: 0,1–0,5 % para pares líquidos. Si el intercambio falla, es mejor repetirlo que pagar de más.\n\n**Un intercambio grande, por partes** o a través de un [[Агрегатор|agregador]] (próxima lección).\n\n**[[Частная отправка транзакций|Envío privado de transacciones]]**: muchos wallets pueden enviar una transacción directamente a los constructores de bloques, saltándose la cola pública." },
        { q: "Pone una tolerancia al deslizamiento del 10 % «para que el intercambio salga seguro». ¿Qué tiene de malo?", options: ["Nada, es solo un seguro","Un bot puede mover el precio casi un 10 % y quedarse la diferencia: la tolerancia es cuánto acepta perder","El intercambio costará más gas"], explain: "La tolerancia es el límite superior de la pérdida, no un seguro. Los bots ganan empujando su precio justo hasta ese límite." },
        { sources: ["ethereum.org: MEV"] },
      ],
    },
    "m04-5": {
      title: "Agregadores y el coste total de un intercambio",
      blocks: [
        { text: "Un mismo par de tokens suele tener varios pools en distintos protocolos y redes. Un [[Агрегатор|agregador]] busca cómo repartir el intercambio entre ellos para que cada parte mueva menos el precio." },
        null,
        { text: "El coste total de un intercambio en un DEX tiene cuatro partes: **el gas de la red** (por cada pool de la ruta), **la comisión del pool** (a menudo 0,05–1 %), **el impacto en el precio** y **el MEV**, si la transacción pasó por la cola pública. En un exchange centralizado, en cambio, están la comisión del exchange, el spread y el deslizamiento por el libro de órdenes.\n\nPara importes pequeños en la red principal de Ethereum, el gas puede superar a todo lo demás; en la capa dos el gas es pequeño, pero los pools también suelen serlo. Lo que hay que comparar es el resultado: cuántos tokens recibe en mano." },
        { q: "¿Qué hay que comparar al elegir dónde intercambiar 500 $?", options: ["Solo la comisión del pool","Cuántos tokens recibe en mano después del gas, las comisiones, el impacto en el precio y el deslizamiento","El precio del gráfico"], explain: "Cada parte por separado puede ser pequeña, pero se paga la suma. Un agregador muestra el resultado; en un exchange el resultado es el precio de ejecución menos la comisión." },
        { sources: ["ethereum.org: exchanges descentralizados"] },
      ],
    },
  },
};

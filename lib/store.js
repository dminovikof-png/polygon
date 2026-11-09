// Хранилище данных программы. Ключ — путь внутри data/: "journal.json", "paper.json", "cache/bybit_BTCUSDT_1h.json".
// На компьютере — файлы в data/ (lib/store-node.js), на планшете и телефоне — база браузера (public/store-idb.js).
// Расчётные модули работают только через этот слой, поэтому один и тот же код считает и там, и там.
//
// Два вида доступа:
//  get(key) / set(key, value, { pretty }) — синхронно, для небольших данных (журнал, сессии, прогресс, фандинг, списки пар);
//  load(key) / save(key, value)           — асинхронно, для больших данных (свечи).
//  text(key)                              — сырой текст (журнал автообновления сессий), если он есть.
let impl = null;

export function useStore(s) { impl = s; }

// В Node хранилище по умолчанию — файлы data/; в браузере его подключает рабочий поток до первого расчёта.
if (globalThis.process?.versions?.node) impl = (await import("./store-node.js")).nodeStore();

export function store() {
  if (!impl) throw new Error("Хранилище данных не подключено");
  return impl;
}

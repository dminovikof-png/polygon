// Хранилище на планшете и телефоне: база браузера IndexedDB. Небольшие данные (журнал, сессии, прогресс, фандинг)
// при запуске читаются в память целиком и доступны синхронно, запись уходит в базу в фоне. Свечи — отдельно и только
// по запросу: их может быть десятки мегабайт. Интерфейс тот же, что у файлов на компьютере (lib/store.js).

// В памяти: для тестов и как основа для IndexedDB.
export function memoryStore(small = new Map(), big = new Map(), onSet = () => {}, onSave = async () => {}) {
  const copy = (v) => (v === undefined ? undefined : structuredClone(v)); // как при чтении файла: изменения копии не портят хранилище
  return {
    get: (key) => copy(small.get(key)),
    set: (key, value) => { small.set(key, copy(value)); onSet(key, value); },
    load: async (key) => copy(big.get(key)),
    save: async (key, value) => { big.set(key, copy(value)); await onSave(key, value); },
    text: () => null,
    keys: () => [...small.keys()],
  };
}

const req = (r) => new Promise((ok, fail) => { r.onsuccess = () => ok(r.result); r.onerror = () => fail(r.error); });

export async function idbStore(name = "polygon") {
  const open = indexedDB.open(name, 1);
  open.onupgradeneeded = () => { open.result.createObjectStore("small"); open.result.createObjectStore("big"); };
  const db = await req(open);
  const tx = (store, mode) => db.transaction(store, mode).objectStore(store);
  const small = new Map();
  const [keys, values] = await Promise.all([req(tx("small", "readonly").getAllKeys()), req(tx("small", "readonly").getAll())]);
  keys.forEach((k, i) => small.set(k, values[i]));
  let pending = Promise.resolve();
  const s = memoryStore(small, new Map(),
    (key, value) => { pending = pending.then(() => req(tx("small", "readwrite").put(value, key))).catch(() => {}); },
    (key, value) => req(tx("big", "readwrite").put(value, key)));
  // свечи не держим в памяти: читаем из базы при каждом запросе
  s.load = async (key) => req(tx("big", "readonly").get(key));
  s.save = async (key, value) => { await req(tx("big", "readwrite").put(value, key)); };
  s.flush = () => pending;
  s.clearCandles = () => req(tx("big", "readwrite").clear());
  return s;
}

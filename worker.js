// Рабочий поток для планшета и телефона: тот же расчётный слой, что у сервера на компьютере (lib/service.js),
// но свечи качаются прямо с биржи, а данные хранятся в базе браузера. Поток фоновый — экран не замирает во время расчёта.
import { useStore } from "./lib/store.js";
import { idbStore } from "./store-idb.js";
import { call } from "./lib/service.js";

const ready = idbStore().then((s) => { useStore(s); return s; });

const DEVICE = {
  // сколько места занято и сколько доступно браузеру
  "GET device/storage": async () => { const e = (await navigator.storage?.estimate?.()) || {}; return { usage: e.usage ?? null, quota: e.quota ?? null }; },
  "POST device/clear": async () => { await (await ready).clearCandles(); return { ok: true }; },
};

onmessage = async (e) => {
  const { id, method, url, body } = e.data;
  try {
    const s = await ready;
    const local = DEVICE[`${method} ${url}`];
    const data = local ? await local(body) : await call(method, url, body || {});
    await s.flush(); // запись в базу закончена до ответа: закрытие вкладки сразу после не теряет журнал
    postMessage({ id, data });
  } catch (err) {
    postMessage({ id, error: String(err?.message || err) });
  }
};

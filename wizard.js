// Мастер рабочего режима (интерфейс): какой шаг сейчас, что на нём сделать и о чём предупредить.
// Отметка шага ставится по факту (отмечены монеты, есть запись в журнале, создана сессия), а не по нажатию «дальше».
// Мастер ничего не запрещает, только объясняет. Работает и на сервере, и в браузере; расчёта и записи здесь нет.

export const MIN_YEARS = 3;     // меньше — монета не видела полного цикла рынка
export const IDEA_COINS = 3;    // путь «с идеи»: проверка на стольких монетах, чтобы не подогнать идею под одну

export const STEPS = [
  { n: 1, stage: "coins", title: "Монеты",
    what: "Отметьте монеты, с которыми будете работать. Смотрите на длину истории (лучше от 3 лет) и оборот.",
    why: "Короткая история не покажет, как идея переживает долгое падение рынка.",
    mistake: "Брать монету потому, что она недавно сильно выросла: этот рост уже в прошлом." },
  { n: 2, stage: "state", title: "Состояние рынка",
    what: "Посмотрите, где сейчас каждая монета относительно средней за 200 дней, какой у неё размах и есть ли сжатие полос.",
    why: "Это описание, а не прогноз: оно показывает, в каких условиях идее предстоит работать.",
    mistake: "Читать «выше средней» как сигнал к покупке. Последний столбец показывает, что после таких дней рост был ненамного чаще обычного." },
  { n: 3, stage: "idea", title: "Подход и идея", lesson: "m00-2",
    what: "Выберите способ зарабатывать и конкретную идею. Кнопка «Проверить» откроет её на этапе 4.",
    why: "Каждая идея — предположение о цене. Лучше заранее знать, какое именно предположение должно сбыться.",
    mistake: "Перебирать идеи, пока одна не покажет красивую цифру: каждая проверка поднимает планку." },
  { n: 4, stage: "test", title: "Проверка", lesson: "m00-3",
    what: "Запустите проверку выбранной идеи на одной из отмеченных монет. Результат запишется в журнал.",
    whatIdea: `Проверьте идею сразу на нескольких монетах (не меньше ${IDEA_COINS}) — удобнее всего сканом.`,
    why: "Проверка учитывает комиссию и проскальзывание и сравнивает идею с простым эталоном.",
    mistake: "Подгонять параметры под одну монету. Если идея работает только при одной настройке, это скорее случайность." },
  { n: 5, stage: "paper", title: "Наблюдение",
    what: "Создайте бумажную сессию: правило будет торговать без денег на новых свечах.",
    why: "Смысл — увидеть, как правило ведёт себя вживую: сколько сделок, когда входит и выходит.",
    mistake: "Считать месяц наблюдения проверкой. За месяц почти ничего не доказать: проверка была на этапе 4." },
];

export const PATHS = { coins: [1, 2, 3, 4, 5], idea: [3, 4, 5] };

const plural = (n, one, few, many) => (n % 10 === 1 && n % 100 !== 11 ? one : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many);

// f: { path, picked: [монеты] | null (не отмечались), coinYears: {монета: лет}, stateSeen, idea, journal, sessions, stage }
export function wizardState(f) {
  const path = f.path === "idea" ? "idea" : "coins", order = PATHS[path];
  const picked = Array.isArray(f.picked) ? f.picked : null, journal = f.journal || [], sessions = f.sessions || [];
  const onIdea = f.idea ? journal.filter((e) => e.strategy === f.idea) : [];
  const testedCoins = new Set((path === "coins" && picked ? onIdea.filter((e) => picked.includes(e.symbol)) : onIdea).map((e) => e.symbol));
  const done = {
    1: !!picked?.length,
    2: !!f.stateSeen,
    3: !!f.idea,
    4: path === "idea" ? testedCoins.size >= IDEA_COINS : testedCoins.size >= 1,
    5: sessions.length > 0,
  };
  const note = {
    1: picked ? `отмечено ${picked.length} ${plural(picked.length, "монета", "монеты", "монет")}` : "пока не отмечали",
    2: f.stateSeen ? "просмотрено" : "ещё не смотрели",
    3: f.idea ? "идея выбрана" : "идея не выбрана",
    4: !f.idea ? "сначала выберите идею" : `проверено на ${testedCoins.size} ${plural(testedCoins.size, "монете", "монетах", "монетах")}${path === "idea" ? ` из ${IDEA_COINS} нужных` : ""}`,
    5: sessions.length ? `сессий: ${sessions.length}` : "сессий нет",
  };
  const firstOpen = order.find((n) => !done[n]) ?? null;
  const here = STEPS.find((s) => s.stage === f.stage);
  const n = here ? here.n : firstOpen ?? order.at(-1);
  const step = STEPS[n - 1];
  const warnings = [];
  const short = picked && f.coinYears ? picked.filter((s) => f.coinYears[s] != null && f.coinYears[s] < MIN_YEARS) : [];
  if ((n === 1 || n === 4) && short.length) warnings.push(`У ${short.join(", ")} история меньше ${MIN_YEARS} лет: проверка на них не увидит полного цикла рынка.`);
  if (n === 5 && f.idea && done[4] === false) warnings.push("Идея ещё не проверена на истории. Бумажная сессия не заменяет проверку.");
  return {
    path, order, n, step, done, note, firstOpen,
    pos: order.indexOf(n) + 1, total: order.length, inPath: order.includes(n),
    next: order[order.indexOf(n) + 1] ?? null,
    what: path === "idea" && step.whatIdea ? step.whatIdea : step.what,
    warnings, allDone: order.every((k) => done[k]),
  };
}

// Перед созданием бумажной сессии: прошла ли эта идея проверку на этой монете.
// last — результат последней проверки в окне (точнее журнала: там есть эталон), journal — записи журнала.
export function paperCheck({ strategy, symbol, journal = [], plank, last = null }) {
  if (strategy === "dca") return { ok: true };
  if (last && last.strategy === strategy && last.symbol === symbol) {
    const ok = last.beat !== false && last.tExcess > last.plank;
    return ok ? { ok: true } : { ok: false, message: last.beat === false ? `Идея не обогнала эталон «${last.benchmarkLabel}» на ${symbol}.` : `Идея не прошла планку на ${symbol}: t = ${last.tExcess.toFixed(2)} при планке ${last.plank.toFixed(2)}.` };
  }
  const mine = journal.filter((e) => e.strategy === strategy && e.symbol === symbol);
  if (!mine.length) return { ok: false, message: `Идея ещё не проверялась на ${symbol}.` };
  const best = Math.max(...mine.map((e) => e.tExcess));
  return best > plank ? { ok: true } : { ok: false, message: `Идея не прошла планку на ${symbol}: лучшее t = ${best.toFixed(2)} при планке ${plank.toFixed(2)}.` };
}

// Скан поднимает планку: предупредить, если заметно (на 0,1 и больше).
export function scanWarning(plankNow, plankAfter) {
  return plankAfter - plankNow >= 0.1 ? `Этот скан поднимет планку с ${plankNow.toFixed(2)} до ${plankAfter.toFixed(2)}: после него каждой следующей идее будет труднее пройти проверку, в том числе уже проверенным.` : null;
}

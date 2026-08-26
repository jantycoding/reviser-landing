/**
 * Приём заявки с лендинга → запись в базу → уведомление в Telegram.
 *
 * Зачем эта функция вообще существует
 * -----------------------------------
 * Кнопка в блоке #checkout уводит человека в WhatsApp через ссылку wa.me с
 * подставленным текстом. Проблема в том, что переход в WhatsApp — это ещё не
 * сообщение: человек может не нажать «отправить», у него может не стоять
 * WhatsApp на десктопе, он может отвлечься на переключении приложений.
 * В этом случае имя и телефон, которые он уже ввёл, пропадали безвозвратно —
 * причём именно у тех, кто дошёл до конца страницы, то есть у самых дорогих.
 *
 * Теперь браузер параллельно с переходом отправляет данные сюда, а отсюда они
 * уходят в базу и в Telegram. Даже если человек до WhatsApp не дошёл, номер
 * у вас есть и ему можно написать первым.
 *
 * Почему это серверная функция, а не запрос в Telegram прямо из браузера
 * ---------------------------------------------------------------------
 * Всё, что попадает в переменные с префиксом VITE_, вшивается в JS-бандл и
 * читается любым человеком через «Просмотр кода». Токен бота там оказаться не
 * должен: с ним можно писать от вашего имени и читать историю бота.
 * Здесь токен живёт в переменных окружения Vercel и в браузер не попадает.
 *
 * Переменные окружения (Vercel → Settings → Environment Variables):
 *   TELEGRAM_BOT_TOKEN — токен от @BotFather
 *   TELEGRAM_CHAT_ID   — id чата или группы, куда слать заявки
 *   DATABASE_URL       — pooled-строка Neon (необязательна: без неё функция
 *                        работает как раньше, просто не пишет в базу)
 *
 * ──────────────────────────────────────────────────────────────────────────
 * ПОРЯДОК ДЕЙСТВИЙ ИЗМЕНЁН 26.08.2026, и это не косметика.
 *
 * Раньше проверка TELEGRAM_BOT_TOKEN стояла В САМОМ НАЧАЛЕ и делала ранний
 * выход. Если бы запись в базу просто добавили ниже по коду, она бы никогда
 * не выполнялась при незаданном токене — то есть ровно в той ситуации, ради
 * которой база и заводится.
 *
 * Теперь так: сначала разбираем и проверяем заявку, потом ПИШЕМ В БАЗУ, и
 * только затем занимаемся Telegram. База — хранилище, Telegram — уведомление.
 * Уведомление имеет право не дойти, хранилище — нет.
 * ──────────────────────────────────────────────────────────────────────────
 */

const MAX_FIELD = 200;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

/* Примитивный лимит: держит счётчик в памяти работающего экземпляра функции.
   От целенаправленной атаки не спасёт (Vercel поднимает экземпляры по нагрузке),
   но отсекает случайный цикл в коде и школьника с консолью — то есть ровно те
   два сценария, из-за которых чат засыпает мусором. */
const hits = new Map();

function tooManyRequests(ip) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 500) hits.clear(); // не даём карте расти бесконечно
  return list.length > MAX_PER_WINDOW;
}

/* Схлопываем любые пробельные символы в один пробел. Главное здесь —
   переводы строк: имя вида «Арсен\n\nЗаявка с сайта…» разрывает сообщение
   в Telegram и позволяет подделать внутри одного текста вторую, чужую
   заявку. Заодно уходят табы и вертикальные пробелы. */
const clean = v =>
  String(v ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_FIELD);

/* Экранируем то, что Telegram в режиме HTML считает разметкой. Иначе имя вида
   «<b>Арсен» либо сломает сообщение, либо пролезет тегом. */
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ------------------------------------------------------------------ *
 * База (Neon)
 *
 * Клиент создаётся ЛЕНИВО и внутри try, а не строкой на верхнем уровне
 * модуля. Разница принципиальна: `neon(undefined)` бросает исключение сразу
 * при загрузке модуля, и функция начинает отвечать 500 на КАЖДЫЙ запрос —
 * то есть незаданная DATABASE_URL убила бы и телеграм-уведомления тоже.
 *
 * Импорт тоже динамический, по той же причине: если пакет
 * @neondatabase/serverless ещё не установлен, статический import обрушит
 * весь файл при сборке. Динамический — только эту одну попытку записи.
 * Результат кэшируется, так что импорт реально происходит один раз на
 * экземпляр функции, а не на запрос.
 * ------------------------------------------------------------------ */
let sqlPromise = null;

function getSql() {
  if (!process.env.DATABASE_URL) return null;
  if (!sqlPromise) {
    sqlPromise = import('@neondatabase/serverless')
      .then(({ neon }) => neon(process.env.DATABASE_URL))
      .catch(err => {
        console.error('lead: не удалось поднять клиент Neon', err);
        sqlPromise = null; // дадим следующему запросу попробовать снова
        return null;
      });
  }
  return sqlPromise;
}

async function saveLead({ name, phone, source, page }) {
  const p = getSql();
  if (!p) return false;
  try {
    const sql = await p;
    if (!sql) return false;
    /* Шаблонная строка драйвера подставляет значения ПАРАМЕТРАМИ, а не
       склейкой текста. Если писать запрос конкатенацией, имя вида
       `'); drop table leads; --` сделает ровно то, что в нём написано. */
    await sql`insert into leads (name, phone, source, page)
              values (${name}, ${phone}, ${source}, ${page})`;
    return true;
  } catch (err) {
    /* База НЕ ДОЛЖНА ронять заявку. Если Neon недоступен, человек всё равно
       уходит в WhatsApp, а уведомление всё равно летит в телеграм. */
    console.error('lead: не записалось в базу', err);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  if (tooManyRequests(ip)) return res.status(429).json({ ok: false });

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body && typeof body === 'object' ? body : {};

  /* Ловушка для ботов: поле company скрыто от человека через CSS. Живой
     посетитель его не видит и не заполнит, автозаполнялка спам-бота — заполнит. */
  if (clean(body.company)) return res.status(200).json({ ok: true, delivered: false });

  const name = clean(body.name);
  const phone = clean(body.phone);
  const source = clean(body.source) || 'неизвестно';
  const page = clean(body.page);

  if (!name && !phone) return res.status(400).json({ ok: false });

  /* ─── ЗАПИСЬ В БАЗУ ─── до всего, что связано с Telegram. */
  const stored = await saveLead({ name, phone, source, page });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    // Переменные не заданы — молчим в статусе 200. Для человека на сайте
    // ничего не изменилось: он всё равно уходит в WhatsApp по ссылке.
    // Заявка при этом уже лежит в базе, если DATABASE_URL задан.
    console.error('lead: TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы');
    return res.status(200).json({ ok: true, delivered: false, stored });
  }

  const lines = [
    '<b>Заявка с сайта Reviser</b>',
    '',
    `Имя: ${esc(name) || '—'}`,
    `Телефон: ${esc(phone) || '—'}`,
    `Откуда: ${esc(source)}`,
  ];
  if (page) lines.push(`Страница: ${esc(page)}`);
  /* Маркер «не сохранилось» виден прямо в чате. Иначе про отвалившуюся базу
     вы узнаете через месяц, когда полезете считать заявки за август. */
  if (!stored && process.env.DATABASE_URL) lines.push('', '⚠️ В базу не записалось');
  lines.push('', 'Если он не написал в WhatsApp сам — напишите первыми.');

  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join('\n'),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!tg.ok) {
      console.error('lead: telegram ответил', tg.status, await tg.text());
      return res.status(200).json({ ok: true, delivered: false, stored });
    }
  } catch (err) {
    console.error('lead: не дозвонились до telegram', err);
    return res.status(200).json({ ok: true, delivered: false, stored });
  }

  return res.status(200).json({ ok: true, delivered: true, stored });
}

/**
 * Приём заявки с лендинга → уведомление в Telegram.
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
 * уходят в Telegram. Даже если человек до WhatsApp не дошёл, номер у вас есть
 * и ему можно написать первым.
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    // Переменные не заданы — молчим в статусе 200. Для человека на сайте
    // ничего не изменилось: он всё равно уходит в WhatsApp по ссылке.
    console.error('lead: TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы');
    return res.status(200).json({ ok: true, delivered: false });
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

  const lines = [
    '<b>Заявка с сайта Reviser</b>',
    '',
    `Имя: ${esc(name) || '—'}`,
    `Телефон: ${esc(phone) || '—'}`,
    `Откуда: ${esc(source)}`,
  ];
  if (page) lines.push(`Страница: ${esc(page)}`);
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
      return res.status(200).json({ ok: true, delivered: false });
    }
  } catch (err) {
    console.error('lead: не дозвонились до telegram', err);
    return res.status(200).json({ ok: true, delivered: false });
  }

  return res.status(200).json({ ok: true, delivered: true });
}

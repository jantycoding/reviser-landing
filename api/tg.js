/**
 * Обработчик нажатий на кнопки под заявкой в Telegram.
 *
 * ЗАЧЕМ ЭТО НУЖНО
 * ---------------
 * До сих пор бот был односторонним: присылал заявку в группу и забывал о ней.
 * Через неделю на вопрос «сколько заявок мы реально обработали» ответить
 * нечем — в чате видно, сколько ПРИШЛО, и ничего о том, что с ними стало.
 * А это и есть цифра, ради которой всё затевалось: не «сколько лидов», а
 * «сколько лидов не потеряли».
 *
 * Теперь под каждой заявкой три кнопки. Нажатие пишет статус в ту же строку
 * таблицы `leads` и переписывает само сообщение, чтобы в чате было видно, кто
 * взял и когда. Никакой отдельной CRM для этого не нужно — группа в телеграме
 * и есть интерфейс, а Neon хранит.
 *
 * КАК ЭТО ПОДКЛЮЧАЕТСЯ (один раз)
 * -------------------------------
 * 1. Переменные в Vercel (все три окружения):
 *      TELEGRAM_WEBHOOK_SECRET — придумайте строку 30–60 символов,
 *                                латиница, цифры, дефис, подчёркивание
 * 2. Миграция базы — SQL в конце файла.
 * 3. Зарегистрировать вебхук у Telegram, подставив свои значения:
 *      https://api.telegram.org/bot<ТОКЕН>/setWebhook
 *        ?url=https://reviser-landing.vercel.app/api/tg
 *        &secret_token=<TELEGRAM_WEBHOOK_SECRET>
 *        &allowed_updates=["callback_query"]
 *    Ответ `{"ok":true,"result":true}` — готово.
 *
 * ПОЧЕМУ ЗДЕСЬ ПРОВЕРКА СЕКРЕТА
 * -----------------------------
 * Адрес вебхука публичный: его знает Telegram, он светится в настройках и в
 * логах. Без проверки любой человек, знающий адрес, сможет присылать сюда
 * поддельные нажатия и менять статусы чужих заявок. Telegram специально для
 * этого шлёт заголовок X-Telegram-Bot-Api-Secret-Token — сравниваем с нашим.
 * Это ровно та же логика, что и с подписью платёжного вебхука.
 */

/* Три состояния, между которыми живёт заявка. Больше не нужно: длинный список
   статусов в чате никто не заполняет, а три кнопки нажимаются одним пальцем. */
const ACTIONS = {
  take: { status: 'in_work', label: '🟡 В работе' },
  done: { status: 'reached', label: '🟢 Дозвонились' },
  lost: { status: 'no_answer', label: '🔴 Не отвечает' },
};

let sqlPromise = null;

function getSql() {
  if (!process.env.DATABASE_URL) return null;
  if (!sqlPromise) {
    sqlPromise = import('@neondatabase/serverless')
      .then(({ neon }) => neon(process.env.DATABASE_URL))
      .catch(err => {
        console.error('tg: не удалось поднять клиент Neon', err);
        sqlPromise = null;
        return null;
      });
  }
  return sqlPromise;
}

async function tg(method, payload) {
  return fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/* ------------------------------------------------------------------ *
 * Самопочинка вебхука — 26.08.2026.
 *
 * ЗАЧЕМ. Кнопки статусов под заявкой работают только если Telegram знает
 * адрес этой функции И присылает вместе с нажатием тот же секрет, что лежит
 * в переменных окружения. Регистрируется это вызовом setWebhook — руками,
 * один раз, с токеном бота в командной строке.
 *
 * На практике этот шаг раз за разом не доходил до конца: секрет в панели
 * меняли после регистрации, команду выполняли не полностью, токен путали.
 * Итог был один и тот же — Telegram каждую минуту стучался сюда, получал 401
 * и повторял, а нажатия в чате не работали. В логах Vercel это выглядело как
 * ровный поток ошибок «неверный секрет вебхука» сутки напролёт.
 *
 * КАК ЧИНИТ. Функция сама знает и токен, и секрет, и собственный адрес —
 * всё это есть в её окружении. Значит, регистрацию можно не просить у
 * человека, а выполнить самой. При первой заявке после запуска экземпляра
 * (и потом не чаще раза в час) проверяем через getWebhookInfo, что адрес наш
 * и последняя доставка прошла без ошибки. Если нет — перерегистрируем.
 *
 * ПОЧЕМУ НЕ ЧАЩЕ РАЗА В ЧАС. getWebhookInfo — сетевой вызов; делать его на
 * каждую заявку значит добавлять задержку человеку, который в этот момент
 * ждёт перехода в WhatsApp. Раз в час достаточно: сломаться регистрация может
 * только при ручном вмешательстве, а не сама по себе.
 *
 * ПОЧЕМУ БЕЗ AWAIT НА ВЫЗЫВАЮЩЕЙ СТОРОНЕ. Починка вебхука — не часть приёма
 * заявки. Если Telegram сейчас недоступен, заявка всё равно должна лечь в
 * базу и уйти в чат.
 * ------------------------------------------------------------------ */
const RECHECK_MS = 60 * 60 * 1000;
let lastWebhookCheck = 0;

export async function ensureWebhook(origin) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!token || !secret || !origin) return;

  const now = Date.now();
  if (now - lastWebhookCheck < RECHECK_MS) return;
  lastWebhookCheck = now;

  const want = `${origin.replace(/\/+$/, '')}/api/tg`;

  try {
    const info = await tg('getWebhookInfo', {}).then(r => r.json());
    const cur = info?.result ?? {};
    /* Условия «всё хорошо»: адрес наш и последняя доставка не провалилась.
       last_error_message заполнен как раз в случае 401 — то есть по нему
       видно рассинхрон секрета, которого getWebhookInfo прямо не показывает. */
    if (cur.url === want && !cur.last_error_message) return;

    console.error('tg: перерегистрирую вебхук', {
      было: cur.url || '—',
      надо: want,
      последняяОшибка: cur.last_error_message || '—',
      вОчереди: cur.pending_update_count ?? 0,
    });

    const res = await tg('setWebhook', {
      url: want,
      secret_token: secret,
      allowed_updates: ['callback_query'],
      /* Копившиеся нажатия сбрасываем: иначе после починки прилетят разом
         все клики за сутки и перепишут статусы задним числом. */
      drop_pending_updates: true,
    }).then(r => r.json());

    console.error('tg: setWebhook →', res?.ok ? 'ok' : res?.description);
  } catch (err) {
    console.error('tg: не удалось проверить вебхук', err);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  /* Секрет обязателен. Если переменная не задана — не «пропускаем всех»,
     а отказываем: незаданный секрет означает открытый эндпоинт. */
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.headers['x-telegram-bot-api-secret-token'] !== secret) {
    console.error('tg: неверный секрет вебхука');
    return res.status(401).json({ ok: false });
  }

  let update = req.body;
  if (typeof update === 'string') {
    try {
      update = JSON.parse(update);
    } catch {
      update = {};
    }
  }

  const cq = update?.callback_query;
  /* Telegram повторяет доставку, пока не получит 200. На всё, что мы не
     обрабатываем, отвечаем 200 сразу — иначе он будет слать это по кругу. */
  if (!cq) return res.status(200).json({ ok: true });

  const [action, rawId] = String(cq.data ?? '').split(':');
  const cfg = ACTIONS[action];
  const leadId = Number(rawId);

  if (!cfg || !Number.isInteger(leadId)) {
    await tg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Неизвестная кнопка' });
    return res.status(200).json({ ok: true });
  }

  /* Кто нажал. username есть не у всех, поэтому запасной вариант — имя. */
  const who = cq.from?.username ? `@${cq.from.username}` : (cq.from?.first_name ?? 'кто-то');

  let saved = false;
  const p = getSql();
  if (p) {
    try {
      const sql = await p;
      if (sql) {
        await sql`update leads
                  set status = ${cfg.status}, owner = ${who}, status_at = now()
                  where id = ${leadId}`;
        saved = true;
      }
    } catch (err) {
      console.error('tg: не записался статус', err);
    }
  }

  /* Всплывашка на телефоне у нажавшего — подтверждение, что тап засчитан.
     Без неё кнопка выглядит «залипшей» пару секунд, пока идёт запись. */
  await tg('answerCallbackQuery', {
    callback_query_id: cq.id,
    text: saved ? cfg.label : 'Статус не записался в базу',
  });

  /* Переписываем исходное сообщение: дописываем статус и УБИРАЕМ кнопки.
     Кнопки убираются намеренно — иначе двое нажмут по очереди и в базе
     останется последний, а в чате будет непонятно, кто на самом деле ведёт. */
  const original = cq.message?.text ?? '';
  const stamp = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' });
  await tg('editMessageText', {
    chat_id: cq.message.chat.id,
    message_id: cq.message.message_id,
    text: `${original}\n\n${cfg.label} · ${who} · ${stamp}`,
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: [] },
  });

  return res.status(200).json({ ok: true });
}

/* ------------------------------------------------------------------ *
 * МИГРАЦИЯ. Выполнить один раз в Neon → SQL Editor:
 *
 *   alter table leads
 *     add column if not exists status    text not null default 'new',
 *     add column if not exists owner     text,
 *     add column if not exists status_at timestamptz;
 *
 *   create index if not exists leads_status_idx on leads (status);
 *
 * После этого запрос «сколько заявок за неделю и сколько из них обработано»
 * выглядит так:
 *
 *   select status, count(*) from leads
 *   where created_at > now() - interval '7 days'
 *   group by status;
 * ------------------------------------------------------------------ */

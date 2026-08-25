/**
 * ВРЕМЕННЫЙ диагностический эндпоинт. Удалить сразу после проверки.
 *
 * Отвечает на единственный вопрос: что видит серверная функция, которая
 * реально работает на этом домене. Скриншот панели Vercel этого не говорит —
 * он говорит только о том, что переменные где-то заведены.
 *
 * Токен не возвращается никогда — только длина и результат обращения к
 * Telegram. По длине видно лишний пробел или обрезанный хвост, по коду
 * ответа — какая именно половина пары сломана.
 */

const KEY = 'rv-check-8813';

export default async function handler(req, res) {
  if (req.query.k !== KEY) return res.status(404).json({ ok: false });

  const rawToken = process.env.TELEGRAM_BOT_TOKEN ?? '';
  const rawChat = process.env.TELEGRAM_CHAT_ID ?? '';
  const token = rawToken.trim();
  const chat = rawChat.trim();

  const out = {
    tokenPresent: Boolean(rawToken),
    tokenLength: rawToken.length,
    tokenHasWhitespace: rawToken.length !== token.length,
    chatPresent: Boolean(rawChat),
    chatLength: rawChat.length,
    chatHasWhitespace: rawChat.length !== chat.length,
    chatStartsWithMinus: chat.startsWith('-'),
    chatHasQuotes: /["']/.test(rawChat),
  };

  if (token) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      out.getMeStatus = r.status;
      out.getMeBody = (await r.text()).slice(0, 200);
    } catch (e) {
      out.getMeError = String(e).slice(0, 200);
    }
  }

  if (token && chat) {
    try {
      const r = await fetch(
        `https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chat)}`,
      );
      out.getChatStatus = r.status;
      out.getChatBody = (await r.text()).slice(0, 300);
    } catch (e) {
      out.getChatError = String(e).slice(0, 200);
    }
  }

  return res.status(200).json(out);
}

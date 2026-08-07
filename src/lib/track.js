/**
 * Две вещи, которые обязаны случиться в момент клика по CTA:
 *   1. заявка уходит на бэкенд (→ Telegram), чтобы лид не пропал;
 *   2. событие уходит в Meta Pixel, чтобы реклама умела оптимизироваться.
 *
 * Обе — «выстрелил и забыл». Ни одна не имеет права задержать переход
 * человека в WhatsApp: клик по кнопке оплаты — самое дорогое действие на
 * странице, и если между кликом и переходом появится ожидание сети, часть
 * людей просто уйдёт.
 */

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID ?? null;

/* --------------------------------------------------------------- *
 * Meta Pixel
 * --------------------------------------------------------------- */

/**
 * Пиксель грузится один раз при старте приложения и только если задан
 * VITE_META_PIXEL_ID. Без переменной на странице не появляется ни одного
 * запроса к facebook.net — это важно и для скорости, и для того, чтобы
 * локальная разработка не засоряла статистику рекламного кабинета.
 */
export function initPixel() {
  if (!PIXEL_ID || typeof window === 'undefined' || window.fbq) return;

  /* Официальный загрузчик Meta, переписанный читаемо. Смысл: до того как
     скрипт скачается, вызовы fbq(...) складываются в очередь и проигрываются
     после загрузки — поэтому трекать можно сразу, не дожидаясь сети. */
  const fbq = function (...args) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = '2.0';
  window.fbq = window._fbq = fbq;

  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);

  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');
}

/**
 * @param {string} event  стандартное имя события Meta (Lead, Contact, InitiateCheckout…)
 * @param {object} params произвольные параметры события
 */
export function pixel(event, params = {}) {
  if (typeof window === 'undefined' || !window.fbq) return;
  try {
    window.fbq('track', event, params);
  } catch {
    /* реклама не должна ронять страницу */
  }
}

/* --------------------------------------------------------------- *
 * Заявка
 * --------------------------------------------------------------- */

/**
 * Отправляет заявку на /api/lead.
 *
 * Используем navigator.sendBeacon, а не fetch. Разница принципиальна именно
 * здесь: сразу после этого вызова браузер уходит по ссылке wa.me, то есть
 * выгружает страницу. Обычный fetch в этот момент отменяется — заявка не
 * доходит ровно в том сценарии, ради которого всё и делалось. sendBeacon
 * браузер обязан доставить даже после выгрузки документа.
 *
 * Тип Blob выставлен в application/json, чтобы Vercel разобрал тело сам.
 *
 * @param {{name?: string, phone?: string, source: string}} data
 */
export function sendLead(data) {
  if (typeof navigator === 'undefined') return;
  const payload = JSON.stringify({
    ...data,
    page: typeof location !== 'undefined' ? location.pathname + location.search : '',
  });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/lead', new Blob([payload], { type: 'application/json' }));
      return;
    }
    /* Старые браузеры без sendBeacon: keepalive делает то же самое,
       только через fetch. */
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* потеря заявки хуже, чем её потеря вместе с ошибкой в консоли,
       но ронять переход в WhatsApp нельзя ни в каком случае */
  }
}

/**
 * Единая точка для всех кнопок «написать в WhatsApp».
 *
 * @param {string} source  откуда кликнули: 'checkout' | 'hero' | 'faq' | 'footer'
 * @param {{name?: string, phone?: string}} [values]  то, что человек успел ввести
 */
export function trackWhatsAppClick(source, values) {
  const hasForm = Boolean(values?.name?.trim() || values?.phone?.trim());

  if (hasForm) sendLead({ ...values, source });

  /* Lead — событие, по которому Meta учится находить похожих людей. Ставим его
     только там, где человек оставил контакт: если пометить Lead-ом каждый клик
     по «написать в WhatsApp» в подвале, алгоритм будет оптимизироваться на
     любопытных, а не на покупателей. Остальные клики — Contact. */
  if (source === 'checkout') {
    pixel('InitiateCheckout', { content_name: 'audit', value: 14990, currency: 'KZT' });
    if (hasForm) pixel('Lead', { content_name: 'audit', value: 14990, currency: 'KZT' });
  } else {
    pixel('Contact', { content_name: source });
  }
}

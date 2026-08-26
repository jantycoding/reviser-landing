import { useEffect, useRef, useState } from 'react';
import { useLeadModal } from '../lib/leadModal';
import Reveal from '../components/ui/Reveal';
import { Section, Eyebrow, SectionTitle, SectionLead } from '../components/ui/Section';
import PriceUsd from '../components/ui/PriceUsd';
import { checkout, contacts, payEndpoint, auditPrice, auditPriceUsd, assistantName } from '../content/site';
import { trackWhatsAppClick } from '../lib/track';

/**
 * Оплата аудита прямо на странице.
 *
 * Поток: телефон → счёт в Kaspi → QR/кнопка оплаты → код доступа → WhatsApp-агент.
 * Код нужен, чтобы агент в WhatsApp понимал, что перед ним оплативший клиент,
 * и сразу начинал анкету. Логика кода — на бэкенде, здесь только отображение.
 *
 * Пока VITE_PAY_ENDPOINT не задан, блок работает в запасном режиме и уводит
 * в WhatsApp — страницу можно публиковать до подключения эквайринга.
 *
 * ВАЖНО про запасной режим: уводить в WhatsApp через window.open из обработчика
 * submit нельзя. iOS Safari и встроенный браузер Instagram (а оттуда идёт весь
 * трафик) режут окно, открытое не по прямому клику по ссылке. При блокировке не
 * происходило ровным счётом ничего: статус idle, aria-live пуст, форма
 * заполнена — человек тапал последнюю кнопку воронки и оставался на месте.
 * Поэтому в запасном режиме кнопка — настоящая <a href> с уже подставленными
 * именем и телефоном.
 */
/** Неразрывные пробелы в цене: «Аудит бизнеса за 20 990 ₸» иначе рвётся на
 *  «за 9 / 900 ₸» — в заголовке блока, где человек платит. */
const bindNumbers = s => String(s).replace(/(\d)\s(?=\d)/g, '$1\u00A0').replace(/\s₸/g, '\u00A0₸');

function Field({ id, label, value, onChange, type = 'text', autoComplete, inputMode, required = true }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-fine font-medium text-fog">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        /* bg-surface, а не bg-ink: поле темнее карточки читается как
           заблокированное — человек не понимает, что туда можно писать. */
        className="w-full rounded-xl border border-line-2 bg-surface px-4 py-3.5 text-body text-chalk outline-none transition-colors focus:border-signal"
      />
    </label>
  );
}

/* ------------------------------------------------------------------ *
 * Поле телефона — маска, постоянный префикс, проверка перед отправкой.
 *
 * Зачем маска. Номер отсюда уходит в три места: в текст сообщения WhatsApp,
 * в уведомление Telegram и в базу. Без маски туда прилетает «87071234567»,
 * «+7 707 123 45 67», «7071234567» и «8 (707) 123-45-67» — четыре записи
 * одного номера, по которым нельзя ни найти повтор, ни отсортировать.
 *
 * Почему «+7» вынесен из поля отдельной надписью (правка 26.08.2026).
 * Раньше он жил внутри плейсхолдера и был такой же бледный, как остальная
 * подсказка, — значит читался как «то, что надо ввести», а не «то, что уже
 * стоит». Теперь это статичная надпись обычной яркости слева от поля, а
 * бледной осталась только форма номера. Само значение поля префикса не
 * содержит: в состояние уезжает «+7 (707) 123-45-67», в input показывается
 * «(707) 123-45-67». Побочная польза — счётчик курсора больше не спотыкается
 * о семёрку префикса, из-за которой первая версия дублировала цифры.
 * ------------------------------------------------------------------ */

/**
 * Национальная часть номера — до десяти цифр после «+7».
 *
 * Ловушка: «7071234567» одинаково законно читается как «страна 7 +
 * 071234567» и как «оператор 707 + 1234567», а 707 — реальный казахстанский
 * код. Ведущие 7 или 8 отрезаем только когда цифр 11 и больше, то есть номер
 * точно вставлен целиком с кодом страны. Всё, что набирают руками, считается
 * национальной частью: «+7» человек и так видит слева от поля.
 */
function phoneDigits(raw) {
  const str = String(raw ?? '');
  const trimmed = str.trimStart();
  if (trimmed.startsWith('+7')) {
    return trimmed.slice(2).replace(/\D/g, '').slice(0, 10);
  }
  let d = str.replace(/\D/g, '');
  if (d.length >= 11 && (d[0] === '7' || d[0] === '8')) d = d.slice(1);
  return d.slice(0, 10);
}

/** «(707) 123-45-67» — без кода страны, он нарисован отдельно. */
function formatNational(d) {
  if (!d) return '';
  let out = `(${d.slice(0, 3)}`;
  if (d.length >= 3) out += ')';
  if (d.length > 3) out += ` ${d.slice(3, 6)}`;
  if (d.length > 6) out += `-${d.slice(6, 8)}`;
  if (d.length > 8) out += `-${d.slice(8, 10)}`;
  return out;
}

/** Полное значение для состояния, WhatsApp, телеграма и базы. */
const fullPhone = d => (d ? `+7 ${formatNational(d)}` : '');

function PhoneField({ id, label, value, onChange, required, error, inputRef }) {
  const own = useRef(null);
  const ref = inputRef ?? own;
  const caretAt = useRef(null);

  /* Курсор считаем в цифрах слева от него, а не в символах: скобки и дефисы
     вставляет маска, и между двумя перерисовками их количество меняется.
     Без этого курсор прыгает в конец при любой правке в середине номера. */
  useEffect(() => {
    const el = ref.current;
    const want = caretAt.current;
    if (!el || want === null) return;
    caretAt.current = null;
    if (want === 0) {
      el.setSelectionRange(0, 0);
      return;
    }
    let seen = 0;
    let pos = el.value.length;
    for (let i = 0; i < el.value.length; i += 1) {
      if (!/\d/.test(el.value[i])) continue;
      seen += 1;
      if (seen === want) {
        pos = i + 1;
        break;
      }
    }
    el.setSelectionRange(pos, pos);
  });

  const handle = event => {
    const el = event.target;
    const caret = el.selectionStart ?? el.value.length;
    caretAt.current = el.value.slice(0, caret).replace(/\D/g, '').length;
    onChange({ target: { name: id, value: fullPhone(phoneDigits(el.value)) } });
  };

  const digits = phoneDigits(value);
  const hintId = `${id}-error`;

  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-fine font-medium text-fog">{label}</span>

      {/* Рамка переехала с input на обёртку: иначе «+7» оказался бы за
          пределами поля и читался как подпись, а не как часть номера. */}
      <div
        /* focus-within НЕ применяется в состоянии ошибки. Иначе он перебивал
           бы красную рамку ровно тогда, когда она нужна: после неудачной
           отправки мы сами ставим фокус в это поле, и подсветка ошибки
           гасла бы в тот же миг, что и появлялась. Проверено замером —
           рамка оставалась цвета --color-signal. */
        className={`flex items-center rounded-xl border bg-surface transition-colors ${
          error
            ? 'border-[#c22e23] ring-2 ring-[#c22e23]/20'
            : 'border-line-2 focus-within:border-signal focus-within:ring-2 focus-within:ring-signal/20'
        }`}
      >
        <span aria-hidden="true" className="pl-4 pr-1.5 text-body text-chalk tabular-nums">
          +7
        </span>
        <input
          ref={ref}
          id={id}
          name={id}
          type="tel"
          value={formatNational(digits)}
          onChange={handle}
          required={required}
          autoComplete="tel"
          inputMode="tel"
          placeholder="(___) ___-__-__"
          aria-invalid={error || undefined}
          aria-describedby={error ? hintId : undefined}
          /* placeholder:text-mist/60 — свой цвет, не браузерный: у Chrome и
             Safari разная прозрачность по умолчанию, и на одном из них
             подсказка почти пропадает. */
          /* Обводка фокуса гасится ИНЛАЙНОМ, а не классом. В index.css есть
             глобальное правило `:focus-visible { outline: 2px solid … }` вне
             @layer — оно старше любой Tailwind-утилиты, и `outline-none`
             его не перебивал: обводка рисовалась вокруг input внутри обёртки,
             и поле выглядело вложенным в другое поле. Инлайновый стиль
             выигрывает у таблицы стилей без !important.
             Доступность не пострадала: кольцо фокуса переехало на обёртку,
             где оно охватывает и «+7», и сам ввод. */
          style={{ outline: 'none' }}
          className="w-full rounded-r-xl bg-transparent py-3.5 pr-4 text-body tabular-nums text-chalk placeholder:text-mist/60"
        />
      </div>

      {/* Сообщение появляется ТОЛЬКО после попытки отправки, не по ходу
          набора: подсказывать «введите номер полностью» человеку, который
          ещё печатает, — это ругать его за незаконченное действие. */}
      {error && (
        <span id={hintId} role="alert" className="mt-1.5 block text-label text-[#c22e23]">
          Введите номер полностью — 10 цифр после +7
        </span>
      )}
    </label>
  );
}

/**
 * «Чек» — что человек покупает, прямо над кнопкой списания денег.
 * До этого между заголовком с ценой и кнопкой на 390px было около 700px
 * пустоты и два пустых поля: решение о платеже принималось без состава
 * услуги на экране.
 */
function Summary() {
  return (
    <div className="rounded-xl border border-line bg-surface/60 px-4 py-4 md:px-5">
      {/* Нейтральный заголовок чека. Раньше здесь стояла та же фраза, что в h2
          слева («Аудит бизнеса — 20 990 ₸»), — одно и то же предложение дважды
          на одном экране в 550px друг от друга. */}
      <div className="text-body font-semibold text-chalk">{checkout.summaryTitle ?? 'Вы платите за'}</div>
      <ul className="mt-3 space-y-2">
        {checkout.summary.map(row => (
          <li key={row} className="flex gap-2.5 text-fine text-fog">
            <svg viewBox="0 0 20 20" className="mt-[0.42em] h-3 w-3 shrink-0 text-verify" fill="none" aria-hidden="true">
              <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {row}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Шаги после оплаты. На мобильном — вертикальный нумерованный список: четыре
 * чипа в строку переносились в три ряда с висящими в пустоте тире, и блок,
 * который должен доказывать «после оплаты всё понятно», сам выглядел сломанным.
 * Соединительные тире появляются только с md, где ряд реально горизонтальный.
 */
function Steps({ active }) {
  return (
    <ol className="flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-center md:gap-x-2.5 md:gap-y-2">
      {checkout.steps.map((step, i) => {
        const done = i < active;
        const now = i === active;
        return (
          <li key={step} className="flex items-center gap-2.5">
            <span
              className={`flex items-center gap-2.5 rounded-full border px-3 py-1.5 text-fine ${
                i <= active ? 'border-signal/50 bg-signal/10 text-chalk' : 'border-line text-mist'
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-label ${
                  done ? 'bg-verify/15 text-verify' : now ? 'bg-signal text-ink' : 'border border-line-2 text-mist'
                }`}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              {step}
            </span>
            {i < checkout.steps.length - 1 && <span className="hidden h-px w-4 bg-line md:block" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

export default function Checkout() {
  const { open: openLead } = useLeadModal();
  const [values, setValues] = useState({ name: '', phone: '', company: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | pay | paid | error
  const [order, setOrder] = useState(null); // { code, payUrl, qr }
  /* Ошибка телефона держится ОТДЕЛЬНО от статуса формы: она появляется только
     по попытке отправки и гаснет, как только номер дозаполнили. */
  const [phoneError, setPhoneError] = useState(false);
  const phoneRef = useRef(null);
  const pollRef = useRef(null);

  const handleChange = e => {
    const { name, value } = e.target;
    /* Гасим красноту сразу, как только номер стал полным — не дожидаясь
       следующей попытки отправки. Человек уже исправил, ругаться не за что. */
    if (name === 'phone' && phoneDigits(value).length === 10) setPhoneError(false);
    setValues(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Единственная проверка перед уходом в WhatsApp.
   *
   * Она нужна именно здесь, а не в атрибутах поля: в запасном режиме кнопка —
   * настоящая <a href> (иначе iOS и встроенный браузер Instagram режут
   * переход), а по ссылке браузер валидацию формы не запускает вообще.
   * Поэтому required и pattern на поле молчали, и уйти можно было с любым
   * огрызком номера. Вызывается из всех трёх выходов: клик по кнопке,
   * Enter в поле и submit в боевом режиме.
   */
  const phoneReady = () => {
    if (phoneDigits(values.phone).length === 10) return true;
    setPhoneError(true);
    phoneRef.current?.focus();
    return false;
  };

  /**
   * Единственная точка, через которую человек уходит в WhatsApp из этого блока.
   *
   * Порядок важен: сначала отправляем заявку и событие, потом отдаём переход
   * браузеру. Заявка уходит через sendBeacon, поэтому «сначала» стоит доли
   * миллисекунды и переход не задерживается — см. src/lib/track.js.
   *
   * Вызывается из трёх мест, потому что уйти в WhatsApp можно тремя способами:
   * тап по кнопке, Enter в поле и (в боевом режиме оплаты) сабмит формы.
   * Пропустить любой из них — значит терять именно тех, кто дошёл до конца.
   */
  const handOff = () => trackWhatsAppClick('checkout', values);

  /**
   * Текст сообщения агенту. В запасном режиме подставляем то, что человек уже
   * ввёл в форму: раньше эти данные выбрасывались всегда и он печатал их заново
   * в WhatsApp — лишняя работа ровно на последнем шаге воронки.
   */
  const waLink = ({ code, name, phone } = {}) => {
    let text;
    if (code) {
      text = `Код ${code}. Оплатил аудит, готов начать.`;
    } else {
      const parts = [`Здравствуйте! Хочу аудит бизнеса за ${auditPrice}.`];
      if (name?.trim()) parts.push(`Меня зовут ${name.trim()}.`);
      if (phone?.trim()) parts.push(`Телефон: ${phone.trim()}.`);
      text = parts.join(' ');
    }
    return `https://wa.me/${contacts.whatsapp}?text=${encodeURIComponent(text)}`;
  };

  // Ждём подтверждения оплаты от бэкенда
  useEffect(() => {
    if (status !== 'pay' || !order?.code || !payEndpoint) return;
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`${payEndpoint}/status?code=${encodeURIComponent(order.code)}`);
        const data = await res.json();
        if (data.status === 'paid') setStatus('paid');
      } catch {
        /* сеть моргнула — просто ждём следующей попытки */
      }
    }, 4000);
    return () => window.clearInterval(pollRef.current);
  }, [status, order]);

  const handleSubmit = async e => {
    e.preventDefault();
    /**
     * Запасной режим. Раньше здесь стоял голый `return`: человек заполнял
     * телефон, жал Enter (привычный жест и на десктопе, и на мобильной
     * клавиатуре) — и не происходило ничего. Ни перехода, ни сообщения, ни
     * ошибки. Последний шаг воронки превращался в тупик именно для тех, кто
     * дошёл до конца страницы. Кнопка — настоящая <a href>, поэтому сабмит
     * ведёт туда же, куда клик.
     */
    if (!phoneReady()) return;

    if (!payEndpoint) {
      handOff();
      window.location.href = waLink(values);
      return;
    }

    handOff();
    setStatus('sending');
    try {
      const res = await fetch(`${payEndpoint}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, product: 'audit', amount: 20990 }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json(); // { code, payUrl, qr }
      setOrder(data);
      setStatus('pay');
    } catch {
      setStatus('error');
    }
  };

  // В запасном режиме оплаты на странице не происходит — подсвечивать шаг
  // «Оплата» значит обещать то, чего в этом сценарии не будет.
  const activeStep = !payEndpoint ? -1 : status === 'paid' ? 2 : status === 'pay' ? 1 : 0;

  const ctaClass =
    'press group relative mt-1 block w-full overflow-hidden rounded-xl bg-signal px-6 py-4 text-center text-body font-semibold text-ink transition-colors hover:bg-signal-soft disabled:opacity-70';
  const shineClass =
    'pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full';

  return (
    <Section id="checkout">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface/50 p-6 md:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(185,190,199,0.16), transparent 70%)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -bottom-40 h-96 w-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(61,123,255,0.12), transparent 70%)' }}
        />

        <div className="relative grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <Eyebrow>{checkout.eyebrow}</Eyebrow>
            {/* В запасном режиме нельзя обещать оплату на странице: заголовок и
                лид описывают ровно то, что произойдёт после клика. */}
            <SectionTitle>{bindNumbers(payEndpoint ? checkout.title : checkout.fallbackTitle)}</SectionTitle>

            {/* Долларовый эквивалент — сразу под ценой в заголовке блока, где
                принимается решение о платеже, а не в подписи мелким шрифтом.
                Строкой ниже, а не в одну строку с h2: заголовок здесь
                флюидный (до 48px) и на 390px переносится на две строки —
                бейдж, вклеенный внутрь, уезжал бы в случайное место. */}
            <div className="mt-4 flex items-center gap-3">
              <PriceUsd>{auditPriceUsd}</PriceUsd>
              <span className="text-fine text-mist">дешевле, чем один рекламный день</span>
            </div>

            <SectionLead>{payEndpoint ? checkout.subtitle : checkout.fallbackSubtitle}</SectionLead>

            {/* Цепочка шагов переехала из-под кнопки сюда. «Что будет после
                того, как я нажму» — вопрос, который задают ДО нажатия, а не
                после; под кнопкой он отвечал уже принявшему решение. */}
            <div className="mt-8">
              <Steps active={activeStep} />
            </div>

            {/* Снятие риска. Здесь оно потому, что это последняя точка, где
                человек ищет причину не платить — в свёрнутом FAQ и в подвале
                с пальцем на кнопке никто не читает.

                Правка 26.08.2026: рамки и заливка сняты. На этом экране было
                ЧЕТЫРЕ обведённых блока сразу — три плашки слева и чек справа,
                — и глаз не понимал, что из них главное. Теперь обведён ровно
                один блок, тот, где кнопка. Строки остались, вес ушёл. */}
            {Array.isArray(checkout.assurances) && checkout.assurances.length > 0 && (
              <ul className="mt-8 grid gap-2.5 border-t border-line pt-5">
                {checkout.assurances.map(text => (
                  <li key={text} className="flex gap-2.5 text-fine text-mist">
                    <svg viewBox="0 0 20 20" className="mt-[0.4em] h-3 w-3 shrink-0 text-verify" fill="none" aria-hidden="true">
                      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {text}
                  </li>
                ))}
              </ul>
            )}
          </Reveal>

          <Reveal delay={0.08}>
            {status === 'pay' || status === 'paid' ? (
              <div className="rounded-2xl border border-line bg-ink p-6 md:p-7">
                {status === 'paid' ? (
                  <>
                    <div className="flex items-center gap-2.5 text-verify">
                      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
                        <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-card font-semibold">{checkout.successTitle}</span>
                    </div>
                    <p className="mt-3 text-body text-fog">{checkout.successText}</p>
                  </>
                ) : (
                  <p className="text-body text-fog">Отсканируйте QR в приложении Kaspi или откройте оплату на этом устройстве.</p>
                )}

                {order?.qr && status !== 'paid' && (
                  <img
                    src={order.qr}
                    alt="QR-код для оплаты через Kaspi"
                    className="mx-auto mt-6 h-52 w-52 rounded-xl bg-white p-3"
                  />
                )}

                {order?.code && (
                  <div className="mt-6 rounded-xl border border-signal/40 bg-signal/[0.07] px-5 py-4 text-center">
                    <div className="font-mono text-label tracking-[0.14em] text-mist uppercase">код доступа</div>
                    <div className="mt-1.5 font-mono text-h3 font-bold tracking-[0.1em] text-chalk">{order.code}</div>
                  </div>
                )}

                <div className="mt-5 grid gap-3">
                  {order?.payUrl && status !== 'paid' && (
                    <a
                      href={order.payUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="press block rounded-xl bg-signal px-6 py-4 text-center text-body font-semibold text-ink transition-colors hover:bg-signal-soft"
                    >
                      Оплатить в Kaspi
                    </a>
                  )}
                  <a
                    href={waLink({ code: order?.code })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`press block rounded-xl px-6 py-4 text-center text-body font-semibold transition-colors ${
                      status === 'paid'
                        ? 'bg-signal text-ink hover:bg-signal-soft'
                        : 'border border-line text-chalk hover:border-line-2 hover:bg-surface-2'
                    }`}
                  >
                    {checkout.successCta}
                  </a>
                </div>
              </div>
            ) : (
              /* ФОРМА ОТСЮДА УБРАНА 26.08.2026 (решение владельца).
                 Было: два поля и кнопка прямо в секции. Стало: цена, состав
                 и кнопка, которая открывает то же всплывающее окно, что и
                 все остальные кнопки страницы.

                 Причина не в экономии места. Форм на сайте стало две — здесь
                 и в окне, — и обе принимали деньги. Две формы неизбежно
                 расходятся: правку валидации вносят в одну, вторая остаётся
                 старой, и ломается та, о которой забыли. Проверка «номер
                 введён полностью» и «имя не пустое» теперь живёт ровно в
                 одном месте. */
              <div className="rounded-2xl border border-line bg-ink p-6 md:p-7">
                <Summary />

                <button type="button" onClick={() => openLead('секция оплаты')} className={`${ctaClass} mt-6 w-full`}>
                  <span className="relative z-10">{checkout.fallbackCta}</span>
                  <span className={shineClass} />
                </button>

                <p className="mt-4 text-fine text-mist">{checkout.fallbackNote}</p>
              </div>
            )}
          </Reveal>
        </div>

      </div>
    </Section>
  );
}

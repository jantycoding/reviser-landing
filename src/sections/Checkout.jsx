import { useEffect, useRef, useState } from 'react';
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
/** Неразрывные пробелы в цене: «Аудит бизнеса за 14 990 ₸» иначе рвётся на
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
          слева («Аудит бизнеса — 14 990 ₸»), — одно и то же предложение дважды
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
  const [values, setValues] = useState({ name: '', phone: '', company: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | pay | paid | error
  const [order, setOrder] = useState(null); // { code, payUrl, qr }
  const pollRef = useRef(null);

  const handleChange = e => setValues(prev => ({ ...prev, [e.target.name]: e.target.value }));

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
        body: JSON.stringify({ ...values, product: 'audit', amount: 14990 }),
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
    <Section id="checkout" className="bg-ink-2">
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

            {/* Три плашки снятия риска. Замер: левая колонка была занята
                контентом на 210px из 565px — в самой дорогой точке страницы
                стояла дыра в полэкрана, а всё, что удерживает (NDA через ЭЦП,
                гостевой доступ только на чтение, реквизиты, возврат), лежало в
                свёрнутом FAQ и в подвале. С пальцем на кнопке туда не ходят.
                Ни одного нового обещания — только перенос уже сказанного туда,
                где возникает сомнение. */}
            {Array.isArray(checkout.assurances) && checkout.assurances.length > 0 && (
              <ul className="mt-8 grid gap-3">
                {checkout.assurances.map(text => (
                  <li
                    key={text}
                    className="flex gap-3 rounded-xl border border-line bg-surface/50 px-4 py-3.5 text-fine text-fog"
                  >
                    <svg viewBox="0 0 20 20" className="mt-[0.35em] h-3.5 w-3.5 shrink-0 text-verify" fill="none" aria-hidden="true">
                      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
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
              <form
                onSubmit={handleSubmit}
                /**
                 * Enter в поле — вручную. В запасном режиме у формы нет кнопки
                 * type="submit" (кнопка — настоящая <a href>, иначе iOS и
                 * встроенный браузер Instagram режут переход), а браузер при
                 * ДВУХ текстовых полях и без submit-кнопки неявную отправку не
                 * делает вовсе. Проверено: Enter не давал ни перехода, ни
                 * сообщения — последний шаг воронки был тупиком для всех, кто
                 * заканчивает ввод клавишей, а не тапом.
                 */
                onKeyDown={e => {
                  if (e.key !== 'Enter' || payEndpoint) return;
                  e.preventDefault();
                  handOff();
                  window.location.href = waLink(values);
                }}
                className="grid gap-4"
              >
                {/* Имя не required: в запасном режиме кнопка — ссылка, и пустое
                    поле не должно быть поводом задержать человека на форме. */}
                <Field
                  id="name"
                  label={checkout.fields.name}
                  value={values.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required={false}
                />
                <Field
                  id="phone"
                  label={checkout.fields.phone}
                  value={values.phone}
                  onChange={handleChange}
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  required={Boolean(payEndpoint)}
                />

                {/* Ловушка для спам-ботов. Поле есть в разметке, но скрыто от
                    человека и убрано из порядка табуляции и из дерева
                    доступности: живой посетитель его не увидит и не заполнит,
                    автозаполнялка бота — заполнит. Бэкенд молча отбрасывает
                    заявку с непустым company. Дешевле любой капчи и не требует
                    от клиента ни одного лишнего действия. */}
                <input
                  type="text"
                  name="company"
                  value={values.company}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="pointer-events-none absolute h-0 w-0 opacity-0"
                />

                <Summary />

                {payEndpoint ? (
                  <button type="submit" disabled={status === 'sending'} className={ctaClass}>
                    <span className="relative z-10">{status === 'sending' ? checkout.submitting : checkout.submit}</span>
                    <span className={shineClass} />
                  </button>
                ) : (
                  <a
                    href={waLink(values)}
                    onClick={handOff}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ctaClass}
                  >
                    <span className="relative z-10">{checkout.fallbackCta}</span>
                    <span className={shineClass} />
                  </a>
                )}

                {/* Строка про Kaspi стоит вплотную к кнопке — там, где человек
                    решается платить, а не под разделительной линией в подвале
                    блока. В запасном режиме её нет вовсе: «оплата на стороне
                    Kaspi» рядом с «написать агенту в WhatsApp» читается как
                    обман, а не как гарантия. */}
                {payEndpoint && <p className="text-fine text-fog">{checkout.kaspiNote}</p>}

                {/* В запасном режиме сабмита нет — значит нет и статуса ошибки:
                    пустой резерв под сообщение только отодвигал пояснение от
                    кнопки на лишние 40px. */}
                <div aria-live="polite" className={payEndpoint ? 'min-h-5' : 'sr-only'}>
                  {status === 'error' && (
                    <p className="text-fine text-signal">
                      Не удалось создать счёт.{' '}
                      <a href={waLink(values)} target="_blank" rel="noopener noreferrer" className="underline">
                        Напишите {assistantName} в WhatsApp
                      </a>{' '}
                      — выставим вручную.
                    </p>
                  )}
                </div>

                <p className="text-fine text-mist">{payEndpoint ? checkout.privacy : checkout.fallbackNote}</p>
              </form>
            )}
          </Reveal>
        </div>

      </div>
    </Section>
  );
}

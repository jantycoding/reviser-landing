import { useEffect, useRef, useState } from 'react';
import PhoneField, { phoneComplete } from './ui/PhoneField';
import { useLeadModal } from '../lib/leadModal';
import { sendLead, pixel } from '../lib/track';
import { contacts, leadForm, auditPrice } from '../content/site';

/**
 * Окно заявки поверх страницы — 26.08.2026, по референсу владельца (виджет
 * pleep) и его прямому запросу.
 *
 * ЧТО ЗДЕСЬ ВАЖНОГО, КРОМЕ ВНЕШНЕГО ВИДА
 *
 * 1. Отправить заявку с незаполненным именем или неполным номером нельзя.
 *    Проверка стоит на кнопке, а не только в атрибутах input: главная кнопка
 *    страницы раньше была ссылкой <a href="wa.me/…">, и встроенная проверка
 *    формы у неё не срабатывала вообще — человек уходил в WhatsApp с пустым
 *    номером, а мы получали заявку без контакта.
 *
 * 2. Номер и имя уезжают на сервер ДО перехода в WhatsApp. Переход — это ещё
 *    не сообщение: человек может не нажать «отправить». Контакт у нас уже
 *    есть, и можно написать первым.
 *
 * 3. Фокус запирается внутри окна, Esc закрывает, фон под окном не
 *    прокручивается. Без этого клавиатурный пользователь табом уходит на
 *    ссылки под затемнением и не понимает, где он.
 *
 * ПРО АВАТАР. На референсе — фотография человека, которого, судя по всему, не
 * существует. У нас вместо фотографии знак с буквой: имя менеджера настоящее,
 * и в WhatsApp ответит он же. Выдуманное лицо в окне, где просят телефон, —
 * это ставка на то, что клиент не проверит; проверять он будет ровно в тот
 * момент, когда решит платить.
 */

const nameValid = value => {
  const v = String(value ?? '').trim();
  /* Две буквы минимум и хотя бы одна настоящая буква: «1», «-» и «..»
     именем не являются, а «Ли» — является. Цифры внутри допускаем (бывают
     названия компаний), но одними цифрами имя быть не может. */
  return v.length >= 2 && /\p{L}/u.test(v);
};

export default function LeadModal() {
  const { isOpen, source, close } = useLeadModal();
  const [values, setValues] = useState({ name: '', phone: '', company: '' });
  const [errors, setErrors] = useState({ name: false, phone: false });
  const [sent, setSent] = useState(false);

  const dialogRef = useRef(null);
  const phoneRef = useRef(null);
  const nameRef = useRef(null);

  /* Каждое открытие — чистая форма. Иначе человек, закрывший окно на полпути,
     возвращается к своей же недозаполненной заявке с красной рамкой. */
  useEffect(() => {
    if (!isOpen) return;
    setValues({ name: '', phone: '', company: '' });
    setErrors({ name: false, phone: false });
    setSent(false);
    pixel('InitiateCheckout', { content_name: 'audit', value: 20990, currency: 'KZT' });
    /* Фокус на первое поле, но не мгновенно: на телефоне немедленный фокус
       поднимает клавиатуру раньше, чем окно доехало, и оно открывается уже
       наполовину скрытым. */
    const t = setTimeout(() => nameRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [isOpen]);

  /* Скролл страницы под окном. Ширина полосы прокрутки компенсируется
     отступом: без этого на десктопе в момент открытия вся страница дёргается
     вправо на 15 пикселей. */
  useEffect(() => {
    if (!isOpen) return;
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
    };
  }, [isOpen]);

  /* Esc и ловушка фокуса. */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const nodes = dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([type="hidden"]), [tabindex]:not([tabindex="-1"])',
      );
      if (!nodes?.length) return;
      const list = [...nodes].filter(n => n.offsetParent !== null);
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const handleChange = event => {
    const { name, value } = event.target;
    setValues(v => ({ ...v, [name]: value }));
    /* Гасим ошибку сразу, как только поле стало верным: держать красную
       рамку под уже исправленным полем — значит спорить с человеком. */
    if (name === 'name' && nameValid(value)) setErrors(e => ({ ...e, name: false }));
    if (name === 'phone' && phoneComplete(value)) setErrors(e => ({ ...e, phone: false }));
  };

  const waHref = () => {
    const parts = [
      `Здравствуйте! Хочу аудит бизнеса за ${auditPrice}.`,
      values.name.trim() && `Меня зовут ${values.name.trim()}.`,
      values.phone.trim() && `Мой номер: ${values.phone.trim()}.`,
    ].filter(Boolean);
    return `https://wa.me/${contacts.whatsapp}?text=${encodeURIComponent(parts.join(' '))}`;
  };

  const submit = event => {
    event.preventDefault();

    const bad = { name: !nameValid(values.name), phone: !phoneComplete(values.phone) };
    setErrors(bad);
    if (bad.name || bad.phone) {
      /* Фокус — на первое неверное поле, а не на форму: человеку не нужно
         искать глазами, где именно он ошибся. */
      (bad.name ? nameRef : phoneRef).current?.focus();
      return;
    }

    /* Ловушка для ботов уезжает вместе с заявкой: сервер отбрасывает всё,
       где поле company заполнено. */
    sendLead({ name: values.name.trim(), phone: values.phone.trim(), company: values.company, source });
    pixel('Lead', { content_name: 'audit', value: 20990, currency: 'KZT' });
    setSent(true);
    /* Открываем WhatsApp вручную, а не ссылкой: сначала должна уйти заявка.
       noopener — чтобы открытая вкладка не имела доступа к нашей странице. */
    window.open(waHref(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overscroll-contain p-0 sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={event => {
        /* Закрываем только по клику именно в подложку. Проверка на target
           обязательна: без неё выделение текста внутри окна, законченное
           движением мыши за его край, закрывало бы форму. */
        if (event.target === event.currentTarget) close();
      }}
    >
      {/* Подложка: затемнение + размытие страницы под ним. */}
      <div aria-hidden="true" className="absolute inset-0 bg-ink/45 backdrop-blur-md" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title"
        className="modal-in relative flex max-h-[92dvh] w-full max-w-[27rem] flex-col overflow-y-auto rounded-t-3xl border border-line bg-ink p-6 shadow-[0_40px_80px_-32px_rgba(17,18,22,0.45)] sm:rounded-3xl sm:p-7"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Закрыть"
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full text-mist transition-colors hover:bg-surface-2 hover:text-chalk"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        {/* Шапка: кто ответит. */}
        <div className="flex items-center gap-3 pr-10">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-body font-semibold text-chalk ring-1 ring-line-2">
            {leadForm.manager.initial}
            {/* Зелёная точка «на связи» — единственный элемент здесь, который
                что-то обещает. Поэтому и подпись рядом честная: не «отвечает
                мгновенно», а срок, который вы реально держите. */}
            <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-ink bg-verify" />
          </span>
          <span className="min-w-0">
            <span className="block text-body font-semibold text-chalk">{leadForm.manager.name}</span>
            <span className="block text-label text-mist">{leadForm.manager.note}</span>
          </span>
        </div>

        {sent ? (
          <div className="mt-6">
            <h2 id="lead-modal-title" className="text-h3 font-semibold text-chalk">
              {leadForm.doneTitle}
            </h2>
            <p className="mt-3 text-body text-fog">{leadForm.doneText}</p>
            <a
              href={waHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="press mt-6 block rounded-xl bg-signal px-6 py-3.5 text-center text-body font-semibold text-ink transition-colors hover:bg-signal-soft"
            >
              {leadForm.doneCta}
            </a>
            <button
              type="button"
              onClick={close}
              className="mt-3 w-full rounded-xl border border-line-2 px-6 py-3 text-center text-fine font-medium text-fog transition-colors hover:bg-surface-2"
            >
              Закрыть
            </button>
          </div>
        ) : (
          <>
            <h2 id="lead-modal-title" className="mt-5 text-h3 font-semibold text-balance text-chalk">
              {leadForm.title}
            </h2>

            {/* Реплика менеджера. Это не «сообщение от бота»: текст написан
                от лица человека, который действительно напишет. */}
            <p className="mt-4 rounded-2xl rounded-tl-md bg-surface-2 px-4 py-3.5 text-fine text-fog">
              {leadForm.hello}
            </p>

            <form onSubmit={submit} className="mt-5 flex flex-col gap-4" noValidate>
              <label htmlFor="lead-name" className="block">
                <span className="mb-2 block text-fine font-medium text-fog">{leadForm.nameLabel}</span>
                <input
                  ref={nameRef}
                  id="lead-name"
                  name="name"
                  type="text"
                  value={values.name}
                  onChange={handleChange}
                  autoComplete="name"
                  placeholder={leadForm.namePlaceholder}
                  aria-invalid={errors.name || undefined}
                  aria-describedby={errors.name ? 'lead-name-error' : undefined}
                  style={{ outline: 'none' }}
                  className={`w-full rounded-xl border bg-surface px-4 py-3.5 text-body text-chalk transition-colors placeholder:text-mist/60 ${
                    errors.name
                      ? 'border-[#c22e23] ring-2 ring-[#c22e23]/20'
                      : 'border-line-2 focus:border-signal focus:ring-2 focus:ring-signal/20'
                  }`}
                />
                {errors.name && (
                  <span id="lead-name-error" role="alert" className="mt-1.5 block text-label text-[#c22e23]">
                    {leadForm.nameError}
                  </span>
                )}
              </label>

              <PhoneField
                id="lead-phone"
                name="phone"
                label={leadForm.phoneLabel}
                value={values.phone}
                onChange={handleChange}
                error={errors.phone}
                inputRef={phoneRef}
              />
              <span className="-mt-2 block text-label text-mist">{leadForm.phoneNote}</span>

              {/* Ловушка для ботов: человек этого поля не видит. */}
              <input
                type="text"
                name="company"
                value={values.company}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
              />

              <button
                type="submit"
                className="press mt-1 flex items-center justify-center gap-2.5 rounded-xl bg-signal px-6 py-4 text-body font-semibold text-ink transition-colors hover:bg-signal-soft"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M12 3a9 9 0 0 0-7.7 13.7L3.2 21l4.4-1.1A9 9 0 1 0 12 3Zm0 1.8a7.2 7.2 0 1 1-3.7 13.4l-.3-.2-2.4.6.6-2.3-.2-.3A7.2 7.2 0 0 1 12 4.8Zm-3 3.8c-.3.1-.7.5-.8 1.2-.1.7.2 1.4.9 2.3.9 1.2 2 2 3.3 2.5.8.3 1.6.3 2-.2.2-.3.3-.7.2-1l-1.2-.7c-.2-.1-.5-.1-.7.1l-.5.5c-1-.5-1.8-1.2-2.3-2.2l.4-.5c.2-.2.2-.5.1-.8l-.7-1.2Z" />
                </svg>
                {leadForm.submit}
              </button>

              <span className="text-center text-label text-mist">{leadForm.footnote}</span>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

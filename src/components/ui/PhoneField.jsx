import { useEffect, useRef } from 'react';

/**
 * Поле телефона с маской +7 (___) ___-__-__ — вынесено из Checkout.jsx
 * 26.08.2026, когда та же форма понадобилась во всплывающем окне заявки.
 *
 * Копировать её второй раз было нельзя: в маске сидят два бага, которые
 * ловятся только руками на живом наборе, и оба уже были найдены и починены
 * здесь (см. комментарии внутри). Вторая копия неизбежно разошлась бы с
 * первой — и разошлась бы именно в поле, через которое приходят все деньги.
 */

export function phoneDigits(raw) {
  const str = String(raw ?? '');
  const trimmed = str.trimStart();
  /* Своё же отформатированное значение разбираем ОТДЕЛЬНОЙ веткой. Иначе
     «+7 (707) …» превращалось в 7707…, семёрка кода страны принималась за
     первую цифру номера и дублировалась: 707 123 45 67 → +7 (777) 732-17-07.
     Юнит-тесты этого не показывали — только реальный набор в браузере. */
  if (trimmed.startsWith('+7')) {
    return trimmed.slice(2).replace(/\D/g, '').slice(0, 10);
  }
  let d = str.replace(/\D/g, '');
  if (d.length >= 11 && (d[0] === '7' || d[0] === '8')) d = d.slice(1);
  return d.slice(0, 10);
}

/** «(707) 123-45-67» — без кода страны, он нарисован отдельно. */
export function formatNational(d) {
  if (!d) return '';
  let out = `(${d.slice(0, 3)}`;
  if (d.length >= 3) out += ')';
  if (d.length > 3) out += ` ${d.slice(3, 6)}`;
  if (d.length > 6) out += `-${d.slice(6, 8)}`;
  if (d.length > 8) out += `-${d.slice(8, 10)}`;
  return out;
}

/** Полное значение для состояния, WhatsApp, телеграма и базы. */
export const fullPhone = d => (d ? `+7 ${formatNational(d)}` : '');

/** Номер введён полностью — 10 цифр после кода страны. */
export const phoneComplete = value => phoneDigits(value).length === 10;

/* id и name разделены сознательно. На странице теперь два поля телефона:
   одно в секции оплаты, второе во всплывающем окне. Одинаковый id на двух
   элементах — невалидная разметка: label перестаёт указывать на своё поле,
   а автозаполнение и скринридер начинают путать их между собой. */
export default function PhoneField({ id, name = id, label, value, onChange, required, error, inputRef }) {
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
    onChange({ target: { name, value: fullPhone(phoneDigits(el.value)) } });
  };

  const digits = phoneDigits(value);
  const hintId = `${id}-error`;

  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-fine font-medium text-fog">{label}</span>

      {/* Рамка на обёртке, а не на input: иначе «+7» оказался бы за пределами
          поля и читался как подпись, а не как часть номера. */}
      <div
        /* focus-within НЕ применяется в состоянии ошибки: иначе он перебивал
           бы красную рамку ровно тогда, когда она нужна — после неудачной
           отправки мы сами ставим фокус в это поле. */
        className={`flex items-center rounded-xl border bg-surface transition-colors ${
          error
            ? 'border-[#c22e23] ring-2 ring-[#c22e23]/20'
            : 'border-line-2 focus-within:border-signal focus-within:ring-2 focus-within:ring-signal/20'
        }`}
      >
        <span aria-hidden="true" className="pr-1.5 pl-4 text-body text-chalk tabular-nums">
          +7
        </span>
        <input
          ref={ref}
          id={id}
          name={name}
          type="tel"
          value={formatNational(digits)}
          onChange={handle}
          required={required}
          autoComplete="tel"
          inputMode="tel"
          placeholder="(___) ___-__-__"
          aria-invalid={error || undefined}
          aria-describedby={error ? hintId : undefined}
          /* Обводка фокуса гасится ИНЛАЙНОМ: в index.css есть глобальное
             `:focus-visible { outline: … }` вне @layer — оно старше любой
             Tailwind-утилиты, и outline-none его не перебивает. Кольцо фокуса
             при этом никуда не делось: оно на обёртке, где охватывает и «+7». */
          style={{ outline: 'none' }}
          className="w-full rounded-r-xl bg-transparent py-3.5 pr-4 text-body text-chalk tabular-nums placeholder:text-mist/60"
        />
      </div>

      {/* Сообщение появляется ТОЛЬКО после попытки отправки, не по ходу
          набора: подсказывать «введите номер полностью» человеку, который
          ещё печатает, — значит ругать его за незаконченное действие. */}
      {error && (
        <span id={hintId} role="alert" className="mt-1.5 block text-label text-[#c22e23]">
          Введите номер полностью — 10 цифр после +7
        </span>
      )}
    </label>
  );
}

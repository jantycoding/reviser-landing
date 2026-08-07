import Reveal from '../components/ui/Reveal';
import { Section, Eyebrow, SectionTitle, SectionLead } from '../components/ui/Section';
import { gate } from '../content/site';

/**
 * Разряды числа и знак валюты склеиваются неразрывными пробелами.
 * На 390px строка цены иначе рвётся как «от 600 / 000 ₸» — ровно там,
 * где человек впервые видит обе цифры и решает, дорого это или нет.
 * Текст не меняется, меняется только перенос.
 */
const bindNumbers = s => s.replace(/(\d)\s(?=\d)/g, '$1\u00A0').replace(/\s₸/g, '\u00A0₸');

/**
 * Поворотная точка воронки: до этого блока продавали агентов,
 * после — продаём разбор как обязательный первый шаг.
 *
 * Здесь же — первое осмысленное появление цены. Согласие человека («да,
 * наугад ставить нельзя») максимально именно в конце трёх аргументов, и
 * тратить его на прокрутку ещё трёх экранов до первой кнопки нельзя:
 * сразу после доводов идут обе цифры и переход на #checkout.
 */
export default function Gate() {
  return (
    <Section id="gate">
      <Reveal className="max-w-3xl">
        <Eyebrow>{gate.eyebrow}</Eyebrow>
        <SectionTitle>{gate.title}</SectionTitle>
        <SectionLead>{gate.subtitle}</SectionLead>
      </Reveal>

      {/* Подложка: поворотная секция должна читаться как один довод, а не как
          три подписи в пустоте, иначе её проскакивают на скролле. */}
      <div className="mt-stack rounded-2xl border border-line bg-surface/40 p-6 sm:p-8 md:p-10">
        <div className="grid gap-x-8 gap-y-9 md:grid-cols-3">
          {gate.reasons.map((reason, i) => (
            <Reveal key={reason.n} delay={i * 0.07}>
              {/* Тот же кружок с моно-цифрой, что в «Как проходит» и в шагах
                  оплаты: четыре разных способа нумерации на одной странице —
                  это то, по чему шаблон отличают от продукта.
                  Прежний вариант — крупная цифра text-signal/35 — давал
                  контраст 1.77:1 при требуемых 3:1: на телефоне при уличном
                  свете цифры просто пропадали, а вблизи читались как
                  недогруженная графика в блоке, который поворачивает воронку. */}
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface font-mono text-fine font-semibold text-fog tabular-nums"
                aria-hidden="true"
              >
                {reason.n}
              </div>
              <h3 className="mt-5 text-h3 font-semibold text-chalk">{reason.title}</h3>
              <p className="mt-2.5 text-body text-fog">{reason.text}</p>
            </Reveal>
          ))}
        </div>

        {/* Цена и выход в оплату — в той же рамке, как вывод из трёх доводов. */}
        <Reveal delay={0.12}>
          <div className="mt-8 flex flex-col items-start gap-6 border-t border-line pt-8 md:mt-10 md:flex-row md:items-center md:justify-between md:pt-10">
            <p className="max-w-[62ch] text-lead text-pretty text-chalk">{bindNumbers(gate.priceLine)}</p>

            <div className="flex shrink-0 flex-col items-start gap-2.5 md:items-end">
              <a
                href="#checkout"
                className="press rounded-xl bg-signal px-5 py-4 min-[400px]:px-7 text-body font-semibold whitespace-nowrap text-ink hover:-translate-y-0.5 hover:bg-signal-soft hover:shadow-[0_12px_28px_-14px_rgba(185,190,199,0.85)]"
              >
                {gate.cta}
              </a>
              <span className="text-fine text-mist">{gate.ctaNote}</span>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

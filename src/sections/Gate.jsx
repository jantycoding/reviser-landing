import Reveal from '../components/ui/Reveal';
import { Section, Eyebrow, SectionTitle, SectionLead } from '../components/ui/Section';
import { gate } from '../content/site';

/**
 * Поворотная точка воронки: до этого блока продавали агентов,
 * после — продаём аудит как обязательный первый шаг.
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

        {/* Выход в оплату — вывод из трёх доводов.
            Решение владельца 07.08.2026: вместо полосы «абзац с ценами слева +
            мелкая кнопка справа» здесь одна крупная кнопка. Раньше текст
            занимал две трети строки, и кнопка — единственное действие
            секции — читалась как сноска к абзацу.
            Ширина ограничена 34rem и блок центрирован: кнопка во всю ширину
            рамки на 1152px превращается в полосу, по которой непонятно, куда
            целиться, и перестаёт читаться как кнопка. */}
        <Reveal delay={0.12}>
          <div className="mt-8 flex flex-col items-center gap-3 border-t border-line pt-8 md:mt-10 md:pt-10">
            <a
              href={gate.ctaHref}
              className="press group relative block w-full max-w-[34rem] overflow-hidden rounded-2xl bg-signal px-6 py-5 text-center text-lead font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-20px_rgba(185,190,199,0.95)]"
            >
              <span className="relative z-10">{gate.cta}</span>
              {/* Тот же блик, что на кнопке оплаты в #checkout. Он остался ровно
                  на двух кнопках страницы — тех, что ведут к деньгам. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              />
            </a>
            <span className="text-fine text-mist">{gate.ctaNote}</span>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

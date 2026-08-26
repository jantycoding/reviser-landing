import { useState } from 'react';
import Reveal from '../components/ui/Reveal';
import { Section, Eyebrow, SectionTitle, SectionLead } from '../components/ui/Section';
import PriceUsd from '../components/ui/PriceUsd';
import { pricing } from '../content/site';

/**
 * Галочка всегда мятная. verify по дизайн-системе значит «это вы получаете»,
 * signal — «действие и находки».
 */
function Check() {
  return (
    <svg viewBox="0 0 20 20" className="mt-[0.4em] h-3.5 w-3.5 shrink-0 text-verify" fill="none" aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Карточка тарифа.
 *
 * ПОДСВЕТКА ВЫБРАННОГО, 26.08.2026 (запрос владельца: «когда навожу на цены,
 * они становятся чёрными — чтобы было видно, что я переключаюсь»).
 *
 * Сделано не компонентом из react-bits, а переключением класса `.scope-dark`,
 * который в проекте уже есть. Причина не в экономии: `.scope-dark` меняет
 * ЗНАЧЕНИЯ токенов внутри своего поддерева — ink становится чёрным, chalk
 * белым, signal почти белым. Поэтому чернеет не фон, а вся карточка целиком и
 * согласованно: заголовок, цена, описание, галочки и кнопка, которая из
 * тёмной становится светлой. Ни один класс внутри карточки для этого не
 * переписывается. Любой компонент-обёртка покрасил бы только фон, и текст на
 * нём пришлось бы чинить руками в семи местах.
 *
 * Активная карточка выбирается наведением, фокусом И тапом. Тап здесь не
 * дублирование, а единственный способ на телефоне: ховера там нет, а именно
 * телефон — основной экран этой страницы.
 */
function PlanCard({ plan, active, onActivate }) {
  return (
    <div
      onMouseEnter={onActivate}
      onFocusCapture={onActivate}
      onClick={onActivate}
      className={`relative flex h-full cursor-pointer flex-col rounded-2xl border p-7 transition-colors duration-300 md:p-8 ${
        active ? 'scope-dark border-ink bg-ink' : 'border-line bg-surface/50'
      }`}
    >
      <div className="flex min-h-7 items-center justify-between gap-3">
        <span className="text-h3 font-semibold text-chalk">{plan.name}</span>
        {plan.badge && (
          <span className="rounded-md bg-signal px-2.5 py-1 font-mono text-label font-semibold tracking-[0.12em] text-ink uppercase">
            {plan.badge}
          </span>
        )}
      </div>

      {/* Один кегль цены на все три карточки: это единственная таблица
          страницы, которую сканируют по горизонтали, и сравнивать в ней
          нужно цифры, а не размеры шрифта. Резерв высоты — чтобы описания
          во всех карточках начинались на одной линии. */}
      <div className="mt-6 flex min-h-[5rem] flex-col justify-start">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <span className="text-metric font-bold whitespace-nowrap text-chalk">{plan.price}</span>
          {plan.priceUsd && <PriceUsd className="-translate-y-[0.15em]">{plan.priceUsd}</PriceUsd>}
        </div>
        <div className="mt-2 text-fine text-mist">{plan.note}</div>
      </div>

      <p className="mt-4 text-body text-fog lg:min-h-[7.4em]">{plan.description}</p>

      <ul className="mt-7 flex-1 space-y-3">
        {plan.features.map(feature => (
          <li key={feature} className="flex gap-3 text-body text-chalk/90">
            <Check />
            {feature}
          </li>
        ))}
      </ul>

      <a
        href="#checkout"
        className="press mt-7 block rounded-xl bg-signal px-6 py-3.5 text-center text-body font-semibold text-ink transition-colors hover:bg-signal-soft"
      >
        {plan.cta}
      </a>
    </div>
  );
}

export default function Pricing() {
  /* Стартовое состояние — рекомендованный тариф. Так на телефоне, где ховера
     нет, человек сразу видит, какой из трёх мы считаем основным. */
  const [active, setActive] = useState(() => {
    const i = pricing.plans.findIndex(p => p.featured);
    return i < 0 ? 0 : i;
  });

  return (
    <Section id="pricing">
      <Reveal>
        <Eyebrow>{pricing.eyebrow}</Eyebrow>
        <SectionTitle>{pricing.title}</SectionTitle>
        <SectionLead>{pricing.subtitle}</SectionLead>
      </Reveal>

      {/* Колонки равной ширины. Раньше стартовая была шире остальных (1.25fr),
          потому что тарифы были разнородными. Теперь это три сравнимых
          продукта одной лестницы, и разная ширина мешала бы сравнивать
          построчно — а именно построчно их и читают. */}
      <div className="mt-stack grid items-stretch gap-4 lg:grid-cols-3">
        {pricing.plans.map((plan, i) => (
          <Reveal key={plan.name} delay={i * 0.07} className="h-full">
            <PlanCard plan={plan} active={active === i} onActivate={() => setActive(i)} />
          </Reveal>
        ))}
      </div>

      {/* Пакеты сверх тарифа — строкой, а не четвёртой карточкой: они не
          конкурируют с тарифами, а достраиваются к любому из них. */}
      {pricing.addons && (
        <Reveal delay={0.24} className="mt-8">
          <div className="flex flex-col gap-3 border-t border-line pt-6 md:flex-row md:items-baseline md:gap-6">
            <span className="shrink-0 text-body font-semibold text-chalk">{pricing.addons.title}</span>
            <ul className="flex min-w-0 flex-1 flex-wrap gap-2">
              {pricing.addons.items.map(item => (
                <li key={item} className="rounded-lg border border-line px-3 py-1.5 text-fine text-fog">
                  {item}
                </li>
              ))}
            </ul>
            <span className="text-fine text-mist md:ml-auto md:shrink-0">{pricing.addons.note}</span>
          </div>
        </Reveal>
      )}

      {/* Внедрение вынесено из ряда карточек: это проект под задачу, а не
          сравнимый с аудитами продукт. Четвёртой карточкой в одном ряду оно
          ломало сравнение остальных трёх. */}
      {pricing.next && (
        <Reveal delay={0.3} className="mt-5">
          <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface/50 p-6 md:flex-row md:items-center md:justify-between md:p-7">
            <div>
              <div className="text-card font-semibold text-chalk">{pricing.next.title}</div>
              <p className="mt-1.5 max-w-[62ch] text-fine text-fog">{pricing.next.text}</p>
            </div>
            <a
              href="#checkout"
              className="press shrink-0 rounded-xl border border-line-2 px-5 py-3.5 text-center text-body font-semibold whitespace-nowrap text-chalk transition-colors hover:bg-surface-2"
            >
              {pricing.next.cta}
            </a>
          </div>
        </Reveal>
      )}
    </Section>
  );
}

import Reveal from '../components/ui/Reveal';
import { Section, Eyebrow, SectionTitle, SectionLead } from '../components/ui/Section';
import PriceUsd from '../components/ui/PriceUsd';
import { pricing } from '../content/site';

/**
 * Галочка всегда мятная. verify по дизайн-системе значит «это вы получаете»,
 * signal — «действие и находки». Оранжевые галочки в главном тарифе лишали
 * стартовую карточку единственного сигнала «вот что входит в 14 990 ₸» и
 * смешивали два смысла в одном цвете.
 */
function Check() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="mt-[0.4em] h-3.5 w-3.5 shrink-0 text-verify"
      fill="none"
      aria-hidden="true"
    >
      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Выделенный тариф раньше обводил react-bits ElectricBorder: SVG-фильтр
 * с турбулентностью, который перерисовывался каждый кадр и давал дрожащий
 * край. Заменён на статичную рамку + мягкое свечение — тот же акцент,
 * ноль работы для GPU.
 */
function PlanCard({ plan, muted = false }) {
  const { featured } = plan;

  return (
    <div
      /* Одинаковый внутренний паддинг у всех трёх карточек — обязательное
         условие построчного сравнения: при p-10 против p-7 содержимое
         разъезжалось по вертикали ещё до всякой типографики.
         Вес выделенного тарифа держат рамка, свечение и фон, а не размер полей.
         Ховер: у главной карточки — самый сильный на странице (раньше она была
         единственной вообще без ховера, при том что нажать нужно именно её),
         у остальных рамка уходит в тёплый оттенок вместо неразличимого
         line → line-2. */
      className={`relative flex h-full flex-col rounded-2xl border p-7 transition-[border-color,box-shadow] md:p-8 ${
        featured
          ? 'border-signal/50 bg-surface hover:border-signal hover:shadow-[0_24px_60px_-30px_rgba(185,190,199,0.9)]'
          : 'border-line bg-surface/50 hover:border-signal/25'
      }`}
    >
      {featured && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px -z-10 rounded-2xl"
          style={{ background: 'radial-gradient(70% 60% at 50% 0%, rgba(185,190,199,0.22), transparent 70%)' }}
        />
      )}

      <div className="flex min-h-7 items-center justify-between gap-3">
        <h3 className="text-h3 font-semibold text-chalk">{plan.name}</h3>
        {plan.badge && (
          <span className="rounded-md bg-signal px-2.5 py-1 font-mono text-label font-semibold tracking-[0.12em] text-ink uppercase">
            {plan.badge}
          </span>
        )}
      </div>

      {/* Один кегль цены на все три карточки.
          Замер до правки: цены стояли на трёх разных высотах и трёх кеглях —
          68px / 44px / 25.9px, — то есть в единственной таблице страницы,
          которую сканируют горизонтально, сравнивать было нечего, а лестница
          читалась наоборот: «6 900» выглядело весомее, чем «600 000».
          Стартовый тариф выделен весом и полной яркостью текста, а не
          размером; резерв высоты рассчитан на самый высокий блок, поэтому
          описания и списки во всех карточках начинаются на одной линии. */}
      <div className="mt-6 flex min-h-[5rem] flex-col justify-start">
        {plan.priceHidden ? (
          /* Цена под размытием, а не удалённая.
             Пустое место на месте цифры читается как «мы сами не знаем»;
             размытая цифра — как «считается под вас», и заодно оставляет
             якорь порядка величины, ради которого тариф вообще стоит рядом.
             aria-hidden + select-none обязательны: цифра здесь декоративная и
             не должна попадать ни в скринридер, ни в выделение мышью, ни в
             поиск по странице — иначе размытие оказывается косметикой поверх
             доступного текста, то есть обманом. Смысл несёт priceNote. */
          <>
            <div
              aria-hidden="true"
              className="text-metric font-semibold whitespace-nowrap text-chalk/70 opacity-70 blur-[9px] select-none"
            >
              {plan.price}
            </div>
            <div className="mt-2 text-fine text-fog">{plan.priceNote}</div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <span
                className={`text-metric whitespace-nowrap ${featured ? 'font-bold text-chalk' : muted ? 'font-semibold text-chalk/80' : 'font-semibold text-chalk/90'}`}
              >
                {plan.price}
              </span>
              {plan.priceUsd && <PriceUsd className="-translate-y-[0.15em]">{plan.priceUsd}</PriceUsd>}
            </div>
            <div className="mt-2 text-fine text-mist">{plan.note}</div>
          </>
        )}
      </div>

      {/* Резерв под четыре строки описания: у стартового тарифа их четыре, у
          остальных две, и без общей высоты перечни фич начинались с разбросом
          до 81px — глаз каждый раз заново искал, где начинается список. */}
      <p className="mt-4 text-body text-fog lg:min-h-[8.2em]">{plan.description}</p>

      <ul className="mt-7 flex-1 space-y-3">
        {plan.features.map(feature => (
          <li key={feature} className="flex gap-3 text-body text-chalk/90">
            <Check />
            {feature}
          </li>
        ))}
      </ul>

      <p className="mt-6 min-h-5 text-fine text-mist">{plan.footnote ?? ''}</p>

      <a
        href="#checkout"
        className={`press mt-6 block rounded-xl px-6 py-3.5 text-center text-body font-semibold ${
          featured
            ? 'bg-signal text-ink hover:-translate-y-0.5 hover:bg-signal-soft hover:shadow-[0_12px_28px_-14px_rgba(185,190,199,0.85)]'
            : 'border border-line text-chalk hover:-translate-y-0.5 hover:border-line-2 hover:bg-surface-2'
        }`}
      >
        {plan.cta}
      </a>
    </div>
  );
}

export default function Pricing() {
  return (
    <Section id="pricing">
      <Reveal>
        <Eyebrow>{pricing.eyebrow}</Eyebrow>
        <SectionTitle>{pricing.title}</SectionTitle>
        <SectionLead>{pricing.subtitle}</SectionLead>
      </Reveal>

      {/* Стартовый тариф шире остальных: цель страницы — импульсная покупка
          аудита за 14 990 ₸, и на широком экране это должно быть видно ещё до
          чтения текста карточек. */}
      <div className="mt-stack grid items-stretch gap-5 lg:grid-cols-[1.25fr_1fr_1fr]">
        {pricing.plans.map((plan, i) => (
          <Reveal key={plan.name} delay={i * 0.07} className="h-full">
            <PlanCard plan={plan} muted={i === pricing.plans.length - 1} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

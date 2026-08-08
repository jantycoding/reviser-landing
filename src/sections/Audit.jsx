import Reveal from '../components/ui/Reveal';
import { Section, Eyebrow, SectionTitle, SectionLead } from '../components/ui/Section';
import SpotlightCard from '../components/reactbits/SpotlightCard';
import { audit, headerCta } from '../content/site';

/** Разряды числа и знак валюты склеиваются неразрывными пробелами: иначе
 *  «Аудит бизнеса за 14 990 ₸» рвётся на «за 14 / 990 ₸» — цена в заголовке
 *  главного продукта разъезжается по двум строкам. Текст не меняется. */
const bindNumbers = s => String(s).replace(/(\d)\s(?=\d)/g, '$1 ').replace(/\s₸/g, ' ₸');

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-verify" fill="none" aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Заголовок колонки. Номер — тем же кружком, что в «Воротах» и «Как
 *  проходит»: один паттерн счёта на всю страницу. */
function ColumnTitle({ n, children }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface font-mono text-label font-semibold text-fog tabular-nums"
        aria-hidden="true"
      >
        {n}
      </span>
      <h3 className="text-fine font-semibold text-chalk">{children}</h3>
    </div>
  );
}

/**
 * Карта направлений аудита.
 *
 * Была решётка пилюль 2×6 / 3×4. Проблема, которую она создавала: подписи
 * разной длины («Продажи и воронка» против «Реклама и стоимость сделки»)
 * переносились на вторую строку по-разному, ряды получались разной высоты, и
 * блок читался как случайно рассыпанные ярлыки, а не как «ровно 12
 * направлений одного разбора».
 *
 * Здесь — ветвление от одного узла: слева «Аудит», справа два столбца веток
 * с общим стволом. Высота строки фиксирована, поэтому интервалы одинаковые
 * при любой длине подписи. На узком экране узел уезжает наверх, ствол — влево,
 * ветки идут одной колонкой: та же схема, без горизонтальной прокрутки.
 */
function AreasMap({ areas }) {
  const half = Math.ceil(areas.length / 2);
  const columns = [areas.slice(0, half), areas.slice(half)];

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[auto_1fr] md:items-center md:gap-8">
      {/* Узел, от которого расходятся ветки */}
      <div className="flex items-center gap-4 md:flex-col md:items-start">
        <div className="rounded-2xl border border-line bg-surface px-5 py-4">
          <div className="font-mono text-label tracking-[0.14em] text-mist uppercase">Аудит</div>
          <div className="mt-1 font-display text-h3 leading-none font-medium text-chalk tabular-nums">
            {areas.length}
          </div>
          <div className="text-fine text-fog">направлений</div>
        </div>
      </div>

      {/* Ствол + ветки. Ствол — левая граница списка, ветка — короткая черта. */}
      <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
        {columns.map((column, ci) => (
          <ul key={ci} className="border-l border-line">
            {column.map(area => (
              <li key={area} className="group flex min-h-11 items-center gap-3 pl-0">
                {/* Ветка: черта от ствола к точке. */}
                <span aria-hidden="true" className="h-px w-5 shrink-0 bg-line transition-colors group-hover:bg-verify/70" />
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-line-2 transition-colors group-hover:bg-verify"
                />
                <span className="text-fine text-fog transition-colors group-hover:text-chalk">{area}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

export default function Audit() {
  return (
    /* tight: «Ворота → Аудит» — один аргумент, а не два отдельных блока. */
    <Section id="audit" tone="raised" tight>
      {/* Правый столбец с параметрами («3 рабочих дня / 12 направлений /
          ~1 час вашего времени / CRM не обязательна») снят по запросу
          владельца 08.08.2026. Три пункта из четырёх дословно повторяли
          подзаголовок секции, стоя в двух сантиметрах от него.
          Единственный уникальный — «CRM не обязательна»; он снимает реальное
          возражение половины аудитории (автомойки, пекарни, салоны без CRM),
          и его место — в FAQ, откуда его сюда и подняли. */}
      <Reveal className="max-w-3xl">
        <Eyebrow>{audit.eyebrow}</Eyebrow>
        <SectionTitle>{bindNumbers(audit.title)}</SectionTitle>
        <SectionLead>{audit.subtitle}</SectionLead>
      </Reveal>

      {/* «Аудит — законченный продукт» — ответ на страх «меня втягивают в
          воронку». Снимать его надо ДО перечисления направлений и цены. */}
      <Reveal delay={0.08}>
        <div className="mt-stack flex flex-col items-start justify-between gap-6 rounded-2xl border border-line bg-surface/50 p-6 md:flex-row md:items-center md:p-8">
          <p className="max-w-[62ch] text-body text-pretty text-chalk">{audit.standalone}</p>
          <a
            href={headerCta.href}
            className="press shrink-0 rounded-xl bg-signal px-5 py-4 min-[400px]:px-7 text-body font-semibold whitespace-nowrap text-ink hover:-translate-y-0.5 hover:bg-signal-soft hover:shadow-[0_12px_28px_-14px_rgba(185,190,199,0.85)]"
          >
            {headerCta.label}
          </a>
        </div>
      </Reveal>

      {/* Что на выходе — поднято выше направлений и укрупнено (запрос
          владельца 08.08.2026). Человек платит не за «12 направлений»,
          а за четыре документа на выходе; раньше они лежали мелким списком
          в правой колонке, ниже перечня того, что мы смотрим. */}
      <div className="mt-stack">
        <Reveal>
          <ColumnTitle n="01">Что получаете на выходе</ColumnTitle>
        </Reveal>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {audit.outputs.map((out, i) => (
            <Reveal key={out.title} delay={0.06 * i}>
              <SpotlightCard className="h-full rounded-2xl border border-line bg-surface/60 p-6 transition-colors hover:border-line-2 md:p-7">
                <div className="flex items-center gap-2.5">
                  <Check />
                  <div className="text-card font-medium text-chalk">{out.title}</div>
                </div>
                <p className="mt-3 max-w-[46ch] text-fine text-fog">{out.text}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Что смотрим */}
      <div className="mt-stack">
        <Reveal>
          <ColumnTitle n="02">Что смотрим</ColumnTitle>
        </Reveal>
        <Reveal delay={0.06}>
          <AreasMap areas={audit.areas} />
        </Reveal>
      </div>
    </Section>
  );
}

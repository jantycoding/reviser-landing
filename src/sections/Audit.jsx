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
 * Направления аудита — роадмап (14.08.2026, запрос владельца: «центрировано,
 * направление идёт друг за другом»).
 *
 * Вертикальный ствол по центру (на телефоне — слева), направления нанизаны
 * на него зигзагом и проявляются по одному со ступенчатой задержкой. Сверху —
 * узел входа, снизу — чёрная капсула «Отчёт на 3-й рабочий день»: путь
 * заканчивается тем, за что человек платит.
 */
function AreasMap({ areas }) {
  return (
    <div className="relative mx-auto mt-10 max-w-3xl">
      {/* Узел входа */}
      <div className="relative z-10 mb-6 flex justify-center">
        <span className="rounded-full border border-line bg-surface px-5 py-2.5 font-mono text-label tracking-[0.14em] text-fog uppercase">
          Аудит · {areas.length} направлений
        </span>
      </div>

      {/* Ствол. Слева на телефоне, по центру с md. */}
      <span
        aria-hidden="true"
        className="absolute top-14 bottom-16 left-[9px] w-px bg-line-2 md:left-1/2 md:-translate-x-1/2"
      />

      <ol className="space-y-1.5">
        {areas.map((area, i) => {
          const right = i % 2 === 1;
          return (
            <Reveal key={area} as="li" delay={Math.min(i * 0.045, 0.4)} className="relative list-none">
              {/* Узел на стволе */}
              <span
                aria-hidden="true"
                className="absolute top-1/2 left-[5px] z-10 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-line-2 bg-ink md:left-1/2 md:-translate-x-1/2"
              />
              {/* СОЕДИНИТЕЛЬ — то, чего не хватало. Раньше подпись висела в
                  сорока пикселях от ствола, ничем с ним не связанная, и глазу
                  не за что было зацепиться: двенадцать строк читались как
                  список, а не как карта. Теперь от узла к плашке идёт
                  короткая горизонтальная линия — ветка. */}
              <span
                aria-hidden="true"
                className={`absolute top-1/2 h-px w-5 bg-line-2 md:w-8 ${
                  right ? 'left-[9px] md:left-1/2' : 'left-[9px] md:right-1/2 md:left-auto'
                }`}
              />
              <div
                className={`py-1 pl-9 md:w-1/2 md:py-1.5 ${
                  right ? 'md:ml-auto md:pl-10' : 'md:pr-10 md:pl-0 md:text-right'
                }`}
              >
                {/* Плашка вместо голого текста: у направления появляется
                    граница, и взгляд получает конечную точку ветки. */}
                <span className="inline-block rounded-lg border border-line bg-ink px-3 py-1.5 text-fine text-fog transition-colors hover:border-line-2 hover:text-chalk">
                  {area}
                </span>
              </div>
            </Reveal>
          );
        })}
      </ol>

      {/* Финал пути */}
      <Reveal delay={0.5}>
        <div className="relative z-10 mt-6 flex justify-center">
          <span className="rounded-full bg-signal px-5 py-2.5 text-fine font-medium text-ink">
            Отчёт на 3-й рабочий день
          </span>
        </div>
      </Reveal>
    </div>
  );
}

export default function Audit() {
  return (
    /* tight: «Ворота → Аудит» — один аргумент, а не два отдельных блока. */
    <Section id="audit">
      {/* Правый столбец с параметрами («3 рабочих дня / 12 направлений /
          ~1 час вашего времени / CRM не обязательна») снят по запросу
          владельца 08.08.2026. Три пункта из четырёх дословно повторяли
          подзаголовок секции, стоя в двух сантиметрах от него.
          Единственный уникальный — «CRM не обязательна»; он снимает реальное
          возражение половины аудитории (автомойки, пекарни, салоны без CRM),
          и его место — в FAQ, откуда его сюда и подняли. */}
      <Reveal className="max-w-3xl blur-in">
        <Eyebrow>{audit.eyebrow}</Eyebrow>
        <SectionTitle>{bindNumbers(audit.title)}</SectionTitle>
        <SectionLead>{audit.subtitle}</SectionLead>
      </Reveal>


      {/* Что на выходе — поднято выше направлений и укрупнено (запрос
          владельца 08.08.2026). Человек платит не за «12 направлений»,
          а за четыре документа на выходе; раньше они лежали мелким списком
          в правой колонке, ниже перечня того, что мы смотрим. */}
      <div className="mt-stack">
        <Reveal>
          <ColumnTitle n="01">Что получаете на выходе</ColumnTitle>
        </Reveal>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {audit.outputs.map((out, i) => (
            <Reveal key={out.title} delay={0.06 * i}>
              <SpotlightCard className="h-full rounded-2xl border border-line bg-surface/60 p-7 transition-colors hover:border-line-2 md:p-8">
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

import Reveal from '../components/ui/Reveal';
import { Section, Eyebrow, SectionTitle, SectionLead } from '../components/ui/Section';
import { audit, headerCta } from '../content/site';

/** Разряды числа и знак валюты склеиваются неразрывными пробелами: иначе
 *  «Аудит бизнеса за 14 990 ₸» рвётся на «за 9 / 900 ₸» — цена в заголовке
 *  главного продукта разъезжается по двум строкам. Текст не меняется. */
const bindNumbers = s => String(s).replace(/(\d)\s(?=\d)/g, '$1\u00A0').replace(/\s₸/g, '\u00A0₸');

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="mt-[0.4em] h-3.5 w-3.5 shrink-0 text-verify" fill="none" aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Заголовок колонки: раньше это был самый слабый элемент системы
 *  (text-label + mist), хотя он возглавляет описание главного продукта.
 *  Номер — тем же кружком, что в «Воротах» и «Как проходит»: один паттерн
 *  счёта на всю страницу, и он же снимает лишнее оранжевое пятно. */
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

export default function Audit() {
  return (
    /* tight: «Ворота → Аудит → Отчёт» — один аргумент, а не три отдельных
       блока. Токен --spacing-section-tight и проп tight завели в этом раунде,
       но ни одна секция их не использовала: на стыках оставалось по 256px
       пустоты, и каждый стык читался как конец мысли, то есть как повод уйти
       со страницы до того, как названа цена. */
    <Section id="audit" className="bg-ink-2" tight>
      {/* Параметры продукта вынесены из лида вправо: на телефоне абзац
          дочитывают единицы, а «3 дня / 12 направлений / час времени» —
          это ответ на главные вопросы «сколько ждать» и «сколько с меня». */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,auto)] lg:items-end lg:gap-14">
        <Reveal className="max-w-3xl">
          <Eyebrow>{audit.eyebrow}</Eyebrow>
          <SectionTitle>{bindNumbers(audit.title)}</SectionTitle>
          <SectionLead>{audit.subtitle}</SectionLead>
        </Reveal>

        <Reveal delay={0.08} className="lg:justify-self-end">
          <ul className="flex flex-col gap-3 border-l border-line pl-5">
            {audit.params.map(param => (
              <li key={param} className="font-mono text-fine whitespace-nowrap text-chalk">
                {param}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      {/* «Аудит — законченный продукт» поднят в начало блока. Это ответ на
          страх «меня втягивают в воронку», и снимать его надо ДО перечисления
          12 направлений и цены, а не последней плашкой, когда человек уже
          решил, что дальше будет допродажа. Кнопка стоит там же: согласие
          максимально сразу после того, как сказано «даже без внедрения
          документ остаётся у вас». */}
      <Reveal delay={0.1}>
        <div className="mt-stack flex flex-col items-start justify-between gap-6 rounded-2xl border border-line bg-surface/50 p-7 md:flex-row md:items-center md:p-9">
          <p className="max-w-[62ch] text-lead text-pretty text-chalk">{audit.standalone}</p>
          {/* Одна подпись у целевого действия на всю страницу: раньше на восьми
              одинаковых оранжевых кнопках стояло шесть разных формулировок, и
              человек каждый раз оценивал новое предложение вместо того, чтобы
              узнавать одно и то же. */}
          <a
            href={headerCta.href}
            className="press shrink-0 rounded-xl bg-signal px-5 py-4 min-[400px]:px-7 text-body font-semibold whitespace-nowrap text-ink hover:-translate-y-0.5 hover:bg-signal-soft hover:shadow-[0_12px_28px_-14px_rgba(185,190,199,0.85)]"
          >
            {headerCta.label}
          </a>
        </div>
      </Reveal>

      <div className="mt-stack grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
        {/* Что смотрим */}
        <Reveal>
          <ColumnTitle n="01">12 направлений аудита</ColumnTitle>
          {/* Жёсткая сетка вместо flex-wrap: рваное облако рядами 3-2-2-3-2
              не читается как «ровно 12 направлений» и на мобильном занимает
              два экрана прыгающих пилюль. */}
          <ul className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-3">
            {audit.areas.map(area => (
              <li
                key={area}
                /* Без hover: двенадцать направлений — это ярлыки, а не элементы
                   управления. Подсветка рамки и текста под курсором обещала,
                   что по ним можно кликнуть, и ни один не кликался — интерфейс
                   подсвечивал то, что не работает. */
                className="flex items-center rounded-lg border border-line bg-surface px-3 py-2.5 text-fine text-fog"
              >
                {area}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Что на выходе */}
        <Reveal delay={0.08}>
          <ColumnTitle n="02">Что получаете на выходе</ColumnTitle>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2">
            {audit.outputs.map(out => (
              <li key={out.title} className="flex gap-3">
                <Check />
                <div>
                  <div className="text-body font-semibold text-chalk">{out.title}</div>
                  <p className="mt-1 text-fine text-fog">{out.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

    </Section>
  );
}

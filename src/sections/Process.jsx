import Reveal from '../components/ui/Reveal';
import { Section, Eyebrow, SectionTitle, SectionLead } from '../components/ui/Section';
import { process, headerCta } from '../content/site';

/**
 * «Как проходит» — путь клиента от оплаты до отчёта.
 *
 * ПЕРЕРИСОВАНО 25.08.2026. Владелец: «сделано не совсем корректно, слишком
 * много лишнего, плен текст, я бы такое не читал; кругляшки центрированные и
 * чуть побольше, покажи, что это первый, второй, третий».
 *
 * Что изменилось против версии 08.08:
 *  · шаги выровнены ПО ЦЕНТРУ колонки, а не по левому краю. Раньше кружок,
 *    заголовок и текст стояли по левому краю каждой колонки, и пять
 *    разноразмерных блоков давали рваную правую границу — та самая «сырость»;
 *  · кружки выросли с 40px до 56px и получили крупную цифру: номер шага
 *    теперь виден раньше, чем текст, и путь считывается до чтения;
 *  · тексты сокращены до одного предложения (в site.js);
 *  · линия между шагами — ПУНКТИР, один сквозной элемент на весь ряд, как у
 *    pleep (замер их DOM 25.08: `border-top: 1px dashed`, `hidden md:block`,
 *    `aria-hidden`, растянут от 12,5% до 87,5% ширины). Прежняя версия рисовала
 *    отрезок внутри каждой ячейки, и путь распадался на куски.
 *
 * Интерактивность сделана на CSS-группе, без состояния в JS: наведение или
 * тап заливает кружок. На телефоне это работает как :active, отдельная
 * ветка кода не нужна, и ничего не ломается при выключенном JS.
 */
export default function Process() {
  return (
    <Section id="process">
      <Reveal className="max-w-3xl blur-in">
        <Eyebrow>{process.eyebrow}</Eyebrow>
        <SectionTitle>{process.title}</SectionTitle>
        <SectionLead>{process.subtitle}</SectionLead>
      </Reveal>

      <div className="relative mt-stack">
        {/* Сквозная пунктирная линия за кружками. Живёт ОДНИМ элементом на
            весь ряд, поэтому не рвётся на зазорах сетки. Отступы по краям —
            чтобы линия начиналась у первого кружка и кончалась у последнего,
            а не улетала за границы блока. top = половина высоты кружка (28px)
            минус пол-пикселя линии. Только с md: на телефоне ряд вертикальный,
            и горизонтальная линия там не нужна. */}
        <div
          aria-hidden="true"
          className="rule-dashed absolute top-[27px] right-[10%] left-[10%] hidden md:block"
        />

        <ol className="relative grid gap-y-8 md:grid-cols-5 md:gap-x-4 md:gap-y-0">
          {process.steps.map((step, i) => (
            <Reveal
              key={step.n}
              as="li"
              delay={Math.min(i * 0.08, 0.32)}
              className="group list-none text-center"
            >
              <span
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-line bg-ink font-mono text-h3 font-semibold text-fog tabular-nums transition-colors group-hover:border-signal group-hover:bg-signal group-hover:text-ink"
                aria-hidden="true"
              >
                {step.n}
              </span>

              <h3 className="mt-5 text-card font-semibold text-chalk">
                {/* Номер дублируется для скринридера: визуально он в кружке,
                    который aria-hidden, иначе порядок шагов теряется. */}
                <span className="sr-only">Шаг {i + 1}. </span>
                {step.title}
              </h3>

              <div className="mt-1.5 font-mono text-label tracking-[0.12em] text-mist uppercase">
                {step.time}
              </div>

              {/* max-w + mx-auto: на десктопе колонка узкая, и без ограничения
                  строки в 5 слов выглядят рваными. */}
              <p className="mx-auto mt-3 max-w-[30ch] text-fine text-fog">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>

      <Reveal delay={0.1} className="mt-stack flex justify-center">
        <a
          href={headerCta.href}
          className="press btn-sheen inline-flex items-center justify-center rounded-xl bg-signal px-5 py-4 text-body font-semibold whitespace-nowrap text-ink transition-colors min-[400px]:px-7 hover:-translate-y-0.5 hover:bg-signal-soft"
        >
          {headerCta.label}
        </a>
      </Reveal>
    </Section>
  );
}

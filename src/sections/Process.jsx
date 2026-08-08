import Reveal from '../components/ui/Reveal';
import { Section, Eyebrow, SectionTitle, SectionLead } from '../components/ui/Section';
import { process, headerCta } from '../content/site';

/**
 * «Как проходит» — путь клиента от оплаты до отчёта.
 *
 * Перестроено 08.08.2026 (запрос владельца, референс — блок «От ссылки до
 * агента» на pleep.app). Что было не так в прежней версии: сетка на шесть
 * колонок разрывала пять шагов на ряд из трёх и ряд из двух, а линия-коннектор
 * жила внутри каждой ячейки и упиралась в горизонтальный зазор сетки. Итог —
 * пять карточек с обрывками черты между ними: последовательности не видно,
 * хотя весь смысл блока именно в порядке.
 *
 * Стало: один ряд из пяти шагов, зазор по горизонтали убран (`lg:gap-x-0`,
 * внутренний отступ переехал в `lg:pr-7`), поэтому черта каждого шага
 * дотягивается до кружка следующего и путь читается сквозным. На узком
 * экране тот же путь разворачивается вертикально: кружки нанизаны на левый
 * ствол, порядок сохраняется.
 *
 * Кегли снижены: заголовок шага text-card вместо text-h3, описание text-fine
 * вместо text-body. Пять заголовков по 26px в ряду — это пять конкурирующих
 * акцентов в блоке, который должен читаться одним движением.
 */
export default function Process() {
  const last = process.steps.length - 1;

  return (
    <Section id="process">
      <Reveal className="max-w-3xl">
        <Eyebrow>{process.eyebrow}</Eyebrow>
        <SectionTitle>{process.title}</SectionTitle>
        <SectionLead>{process.subtitle}</SectionLead>
      </Reveal>

      <ol className="mt-stack grid gap-y-0 lg:grid-cols-5 lg:gap-x-0">
        {process.steps.map((step, i) => (
          <Reveal key={step.n} delay={i * 0.06} as="li" className="relative list-none lg:pr-7">
            {/* Узкий экран: кружок на вертикальном стволе слева. */}
            <div className="flex gap-4 lg:hidden">
              <div className="flex flex-col items-center" aria-hidden="true">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface font-mono text-fine font-semibold text-fog tabular-nums">
                  {step.n}
                </span>
                {i < last && <span className="mt-2 w-px flex-1 bg-line" />}
              </div>
              <div className="pb-9">
                <h3 className="text-card font-medium text-chalk">{step.title}</h3>
                <div className="mt-1.5 font-mono text-label tracking-[0.12em] text-mist uppercase">{step.time}</div>
                <p className="mt-2.5 max-w-[46ch] text-fine text-fog">{step.text}</p>
              </div>
            </div>

            {/* Широкий экран: кружок и черта до следующего шага. */}
            <div className="hidden lg:block">
              <div className="flex items-center gap-3" aria-hidden="true">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface font-mono text-fine font-semibold text-fog tabular-nums">
                  {step.n}
                </span>
                {/* Дотягивается до кружка следующего шага: зазора между
                    колонками нет, поэтому путь не рвётся. */}
                {i < last && <span className="h-px flex-1 bg-line" />}
              </div>
              <h3 className="mt-5 text-card font-medium text-chalk">{step.title}</h3>
              <div className="mt-1.5 font-mono text-label tracking-[0.12em] text-mist uppercase">{step.time}</div>
              <p className="mt-2.5 text-fine text-fog">{step.text}</p>
            </div>
          </Reveal>
        ))}
      </ol>

      {/* Между кнопкой в «Аудите» и ценами оставался длинный участок без единого
          действия — ровно там, где человек уже понял, что от него нужен час
          времени. Кнопка ловит это состояние на месте. */}
      <Reveal delay={0.1} className="mt-stack">
        <a
          href={headerCta.href}
          className="press inline-flex items-center justify-center rounded-xl bg-signal px-5 py-4 min-[400px]:px-7 text-body font-semibold whitespace-nowrap text-ink hover:-translate-y-0.5 hover:bg-signal-soft hover:shadow-[0_12px_28px_-14px_rgba(185,190,199,0.85)]"
        >
          {headerCta.label}
        </a>
      </Reveal>
    </Section>
  );
}

import Reveal from '../components/ui/Reveal';
import { Section, Eyebrow, SectionTitle, SectionLead } from '../components/ui/Section';
import { process, headerCta } from '../content/site';

export default function Process() {
  return (
    <Section id="process" className="bg-ink-2">
      <Reveal className="max-w-3xl">
        <Eyebrow>{process.eyebrow}</Eyebrow>
        <SectionTitle>{process.title}</SectionTitle>
        <SectionLead>{process.subtitle}</SectionLead>
      </Reveal>

      {/* Пять колонок по ~200px давали меру строки около 22 символов — вдвое
          ниже нормы. Но и сетка 3×2 не работает: во втором ряду оставалась
          пустая ячейка 368×250px, а линия-коннектор пятого шага уходила вправо
          в пустоту — последовательность читалась как пять несвязанных карточек
          ровно там, где весь смысл блока в порядке шагов.
          Сетка на 6 колонок: первый ряд — три шага по 2 колонки, второй —
          два шага по 3. Пустой ячейки нет, мера строки во втором ряду даже
          шире, а линия ведёт от шага к шагу и обрывается только на последнем. */}
      <ol className="mt-stack grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-6">
        {process.steps.map((step, i) => (
          <Reveal
            key={step.n}
            delay={i * 0.07}
            as="li"
            className={`relative list-none ${i < 3 ? 'lg:col-span-2' : 'lg:col-span-3'}`}
          >
            {/* Горизонтальная ось: номер кружком на тонкой линии — глаз читает
                последовательность шагов, а не пять независимых карточек.
                Номер нейтральный: оранжевый на странице оставлен за тем, что
                нажимается, и за одним смысловым маркером в отчёте. */}
            <div className="flex items-center gap-4" aria-hidden="true">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface font-mono text-fine font-semibold text-fog">
                {step.n}
              </span>
              {i < process.steps.length - 1 && <span className="h-px flex-1 bg-line" />}
            </div>

            <h3 className="mt-5 text-h3 font-semibold text-chalk">{step.title}</h3>
            {/* Тайминг — моно-строкой под заголовком, а не пилюлей у номера:
                в пилюле он спорил с номером шага, а здесь читается ответом на
                главное возражение «сколько это займёт моего времени». */}
            <div className="mt-2 font-mono text-label tracking-[0.12em] text-mist uppercase">{step.time}</div>
            <p className="mt-3 max-w-[54ch] text-body text-fog">{step.text}</p>
          </Reveal>
        ))}
      </ol>

      {/* Между CTA в «Аудите» и ценами было 2619px без единой кнопки — ровно
          тот участок, где человек уже понял, что от него нужен час времени, и
          готов платить. Кнопка ловит это состояние на месте. */}
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

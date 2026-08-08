import Reveal from '../components/ui/Reveal';
import { Section, Eyebrow, SectionTitle, SectionLead } from '../components/ui/Section';
import { compare } from '../content/site';

/**
 * «Что вы выбираете на самом деле» — сравнение с альтернативами.
 *
 * Добавлено 08.08.2026 (запрос владельца, референс — «Pleep против
 * альтернатив»). Блок стоит сразу после цен: человек, который увидел цифру,
 * в этот момент сравнивает нас не с пустотой, а с тремя понятными вариантами.
 * Если рамку сравнения не задать самим, её задаст конкурент.
 *
 * Разметка — настоящая <table> с <caption> и <th scope>: скринридер должен
 * читать «Возврат, если не найдено ни одной проблемы — Reviser: да», а не
 * «галочка, крестик, крестик, крестик». Значки помечены aria-hidden, рядом
 * лежит текстовая подпись в .sr-only.
 *
 * На узком экране таблица прокручивается по горизонтали внутри своей рамки —
 * первый столбец липкий, чтобы подпись строки не уезжала. Это единственное
 * место на странице с горизонтальной прокруткой, и она локальная: правило
 * проекта «никакого overflow-x на <html>» не нарушается.
 */

function Yes() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 text-verify" fill="none" aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function No() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 text-line-2" fill="none" aria-hidden="true">
      <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function Partial() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 text-mist" fill="none" aria-hidden="true">
      <path d="M5 10h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

const LABEL = { true: 'да', false: 'нет', partial: 'частично' };

function Cell({ value }) {
  const key = value === 'partial' ? 'partial' : String(Boolean(value));
  return (
    <span className="inline-flex items-center justify-center">
      {key === 'true' ? <Yes /> : key === 'partial' ? <Partial /> : <No />}
      <span className="sr-only">{LABEL[key]}</span>
    </span>
  );
}

export default function Compare() {
  return (
    <Section id="compare">
      <Reveal className="max-w-3xl">
        <Eyebrow>{compare.eyebrow}</Eyebrow>
        <SectionTitle>{compare.title}</SectionTitle>
        <SectionLead>{compare.subtitle}</SectionLead>
      </Reveal>

      <Reveal delay={0.08} className="mt-stack">
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <caption className="sr-only">
              Сравнение Reviser с альтернативами по пунктам, из-за которых обычно жалеют
            </caption>
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 z-10 bg-surface px-5 py-4 text-fine font-medium text-mist">
                  <span className="sr-only">Пункт сравнения</span>
                </th>
                {compare.columns.map((col, i) => (
                  <th
                    key={col}
                    scope="col"
                    /* Наш столбец — единственный выделенный: тёмная заливка
                       и белый текст. Тот же приём, что у референса; он делает
                       чтение таблицы направленным, без единого лишнего цвета. */
                    className={`px-4 py-4 text-center text-fine font-medium whitespace-nowrap ${
                      i === 0 ? 'bg-surface-2 text-chalk' : 'bg-surface text-mist'
                    }`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compare.rows.map(row => (
                <tr key={row.label} className="border-t border-line">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-ink px-5 py-4 text-fine font-normal text-fog"
                  >
                    {row.label}
                  </th>
                  {row.values.map((value, i) => (
                    <td
                      key={i}
                      className={`px-4 py-4 text-center ${i === 0 ? 'bg-surface/60' : ''}`}
                    >
                      <Cell value={value} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <p className="mt-6 max-w-[64ch] text-fine text-mist">{compare.note}</p>
      </Reveal>
    </Section>
  );
}

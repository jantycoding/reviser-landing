import Reveal from '../components/ui/Reveal';
import { Section, Eyebrow, SectionTitle, SectionLead } from '../components/ui/Section';
import { losses } from '../content/site';

/**
 * «Где утекают деньги» — три цифры второй секцией страницы.
 *
 * Правки 25.08.2026 (вечер), по замечаниям владельца:
 *  · сняты подписи-категории над числом («КАЗАХСТАН», «ЗАЯВКИ», «СКОРОСТЬ») —
 *    они забирали первый взгляд у самой цифры, ради которой блок и существует;
 *  · добавлен контраст «стало / было» — приём с pleep («33,5% · было 16%»).
 *    Одно число это факт, два числа рядом — движение, и читается оно быстрее,
 *    потому что мозгу не надо держать в уме точку отсчёта;
 *  · подпись источника сжата до двух слов и уведена в самый тихий тон;
 *  · снят абзац «своих кейсов пока нет» — самострел, убран по прямому
 *    требованию владельца.
 *
 * ⚠️ ЧЕГО ЗДЕСЬ ДЕЛАТЬ НЕЛЬЗЯ: убирать `source` из карточки. Три крупных
 * числа в брендинге компании без атрибуции читаются как её собственные
 * результаты. Трафик идёт из Meta, ложное заявление о компании — основание
 * для блокировки рекламного кабинета. Подпись можно сделать тише, короче,
 * мельче — но она обязана остаться на странице.
 */

function Card({ card }) {
  const accent = card.accent;
  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 md:p-7 ${
        accent ? 'border-signal bg-signal' : 'border-line bg-ink'
      }`}
    >
      {/* «Интересный фон» под числом — мягкое пятно света в углу карточки.
          На тёмной оно тёплое и заметное, на светлых — почти неразличимое,
          только чтобы плоскость не выглядела бумажной. Декор, поэтому
          aria-hidden и pointer-events-none. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -left-10 h-44 w-44 rounded-full"
        style={{
          background: accent
            ? 'radial-gradient(circle, rgba(255,255,255,0.16), transparent 70%)'
            : 'radial-gradient(circle, rgba(47,108,176,0.10), transparent 70%)',
        }}
      />

      <div className="relative flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={`font-hero text-[clamp(3rem,2.1rem+3.9vw,4.5rem)] leading-[0.95] font-extrabold tracking-[-0.03em] tabular-nums ${
            accent ? 'text-ink' : 'text-chalk'
          }`}
        >
          {card.value}
        </span>
        {/* Точка-разделитель, а не тире: тире рядом с числом читается как
            минус. Та же проблема была бы с «−», поэтому взята «·». */}
        <span className={`text-fine ${accent ? 'text-ink/55' : 'text-mist'}`}>
          <span aria-hidden="true" className="mr-1.5">·</span>
          {card.was}
        </span>
      </div>

      <p className={`relative mt-5 text-body ${accent ? 'text-ink/85' : 'text-fog'}`}>{card.text}</p>

      {/* mt-auto прижимает подпись к низу: у карточек разной длины текста
          источники всё равно встают в одну линию. */}
      <p
        className={`relative mt-auto pt-6 font-mono text-label tracking-wide ${
          accent ? 'text-ink/40' : 'text-mist/80'
        }`}
      >
        {card.source}
      </p>
    </div>
  );
}

export default function Losses() {
  return (
    <Section id="losses">
      <Reveal className="max-w-3xl blur-in">
        <Eyebrow>{losses.eyebrow}</Eyebrow>
        <SectionTitle>{losses.title}</SectionTitle>
        <SectionLead>{losses.subtitle}</SectionLead>
      </Reveal>

      <div className="mt-stack grid gap-3 md:grid-cols-3">
        {losses.cards.map((card, i) => (
          <Reveal key={card.value} delay={Math.min(i * 0.08, 0.24)} className="h-full">
            <Card card={card} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

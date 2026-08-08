/**
 * Обёртка секции и заголовочный блок.
 * Один источник правды по вертикальному ритму и типографике.
 */
/**
 * @param {boolean} tight — сжатый вертикальный ритм (py-section-tight вместо
 * py-section). Ставится на секции, которые продолжают мысль предыдущей и
 * должны читаться как один аргумент, а не как три независимых блока: связка
 * «Ворота → Аудит → Отчёт». Каждый лишний экран пустоты на стыке — повод
 * закрыть страницу до того, как человек дошёл до цены.
 */
/**
 * @param {'base'|'raised'|'deep'} tone — плоскость секции. Соседние секции
 * идут разными планами: `base` — фон страницы (ink), `raised` — приподнятый
 * (ink-2) с волосяной верхней границей и мягким светом у кромки, `deep` —
 * утопленный, для низа страницы. Это единственный способ дать чёрному
 * глубину, не добавляя цветов сверх трёх (палитра «Metal Noir»).
 */
export function Section({ id, children, className = '', tight = false, tone = 'base' }) {
  const rhythm = tight ? 'py-section-tight' : 'py-section';
  const plane =
    tone === 'raised' ? 'bg-ink-2 border-t border-line/70' : tone === 'deep' ? 'plane-deep border-t border-line/70' : '';
  return (
    <section id={id} className={`relative w-full px-5 ${rhythm} md:px-8 ${plane} ${className}`}>
      {tone !== 'base' && <span aria-hidden="true" className="section-glow" />}
      <div className="relative mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

/**
 * Подпись секции. Линейка перед текстом — нейтральная, а не акцентная.
 * Оранжевым на странице покрашено полсотни элементов, и к «Воротам» — первому
 * месту, где мы просим денег, — глаз перестаёт отличать кнопку от декора.
 * Линейка эйбрау не несёт смысла «действие», поэтому уходит в line-2; сам
 * текст подписи остаётся акцентным, он маркирует начало блока.
 */
export function Eyebrow({ children, tone = 'signal' }) {
  const color = tone === 'verify' ? 'text-verify' : 'text-signal';
  const rule = 'bg-line-2';
  return (
    <div className={`mb-5 inline-flex items-center gap-2.5 font-mono text-label font-medium uppercase ${color}`}>
      <span className={`h-px w-7 ${rule}`} />
      {children}
    </div>
  );
}

/**
 * text-balance включается только с sm. На 390px балансировщик режет заголовок
 * на равные куски и оставляет висячие хвосты: «Агент, поставленный / наугад, — /
 * дорогая игрушка» — короткая средняя строка, оканчивающаяся тире в никуда,
 * ровно в том заголовке, который поворачивает воронку к аудиту. На узком
 * экране строк и так две-четыре, балансировать нечего; text-pretty убирает
 * одиночное слово в последней строке и не трогает остальные.
 */
export function SectionTitle({ children, className = '' }) {
  return (
    <h2 className={`max-w-4xl text-h2 font-medium text-pretty text-chalk sm:text-balance ${className}`}>
      {children}
    </h2>
  );
}

export function SectionLead({ children, className = '' }) {
  return <p className={`mt-5 max-w-[60ch] text-lead text-pretty text-fog ${className}`}>{children}</p>;
}

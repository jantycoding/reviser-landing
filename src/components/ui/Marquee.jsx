/**
 * Бегущая строка на чистом CSS.
 * Заменила react-bits LogoLoop (≈15 КБ JS + постоянный rAF-цикл).
 * Лента дублируется ровно один раз, трек уезжает на -50% — шов незаметен.
 *
 * Кнопка паузы убрана 08.08.2026 по прямому запросу владельца (дважды).
 * Что осталось вместо неё:
 *   — пауза по :hover и :focus-within (index.css) — мышь и клавиатура;
 *   — при `prefers-reduced-motion: reduce` лента не движется вообще
 *     (`animation: none !important` в index.css).
 * Чего больше нет: ручной остановки на телефоне, где наведения не существует.
 * Это осознанное решение владельца, не упущение.
 */
export default function Marquee({ children, duration = 46, className = '', ariaLabel }) {
  const items = Array.isArray(children) ? children : [children];

  const strip = keyPrefix =>
    items.map((child, i) => (
      <div key={`${keyPrefix}-${i}`} className="shrink-0">
        {child}
      </div>
    ));

  return (
    <div className={`relative w-full ${className}`}>
      <div className="fade-x relative w-full overflow-hidden" aria-label={ariaLabel} role="group">
        {/* Пауза при наведении ставится в CSS. Platforms.jsx отдельно пишет
            animationPlayState инлайном по IntersectionObserver — лента крутится
            только пока секция в кадре. */}
        <div className="marquee gap-4 pr-4" style={{ '--mq-dur': `${duration}s` }}>
          <div className="flex shrink-0 gap-4 pr-4" aria-hidden="false">
            {strip('a')}
          </div>
          <div className="flex shrink-0 gap-4 pr-4" aria-hidden="true">
            {strip('b')}
          </div>
        </div>
      </div>
    </div>
  );
}

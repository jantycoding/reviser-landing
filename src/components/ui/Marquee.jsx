import { useState } from 'react';

/**
 * Бегущая строка на чистом CSS.
 * Заменила react-bits LogoLoop (≈15 КБ JS + постоянный rAF-цикл).
 * Лента дублируется ровно один раз, трек уезжает на -50% — шов незаметен.
 *
 * Пауза. До кнопки остановка работала только через :hover и :focus-within, то
 * есть мышью и клавиатурой. Вся реклама ведёт с телефона, где остановить ленту
 * было нечем: 52 секунды непрерывного движения рядом с текстом «агент работает
 * внутри ваших систем» — это WCAG 2.2.2 (уровень A, движение дольше 5 секунд
 * обязано иметь механизм паузы) и просто помеха чтению ровно там, где мы
 * снимаем возражение про переезд с текущих систем.
 *
 * Подписи кнопки — пропсами со значениями по умолчанию: текст страницы живёт в
 * src/content/site.js, и вызывающая секция может передать их оттуда.
 */
export default function Marquee({
  children,
  duration = 46,
  className = '',
  ariaLabel,
  pauseLabel = 'Остановить ленту',
  playLabel = 'Продолжить ленту',
}) {
  const items = Array.isArray(children) ? children : [children];
  const [paused, setPaused] = useState(false);

  const strip = keyPrefix =>
    items.map((child, i) => (
      <div key={`${keyPrefix}-${i}`} className="shrink-0">
        {child}
      </div>
    ));

  return (
    <div className={`relative w-full ${className}`}>
      <div className="fade-x relative w-full overflow-hidden" aria-label={ariaLabel} role="group">
        {/* Пауза ставится атрибутом, а не инлайн-стилем: секция Platforms.jsx
            сама пишет track.style.animationPlayState по IntersectionObserver
            (лента крутится только в кадре), и инлайн-стиль отсюда она бы
            затирала при следующем пересечении. Правило под этот атрибут стоит
            в index.css с !important — оно перебивает и инлайн секции тоже. */}
        <div
          className="marquee gap-4 pr-4"
          data-user-paused={paused ? 'true' : undefined}
          style={{ '--mq-dur': `${duration}s` }}
        >
          <div className="flex shrink-0 gap-4 pr-4" aria-hidden="false">
            {strip('a')}
          </div>
          <div className="flex shrink-0 gap-4 pr-4" aria-hidden="true">
            {strip('b')}
          </div>
        </div>
      </div>

      {/* Ряд с кнопкой выключен по той же горизонтальной оси, что заголовок
          секции и весь остальной контент (px-5 / md:px-8): лента идёт в край
          экрана, и кнопка, прижатая к краю, обрезалась на 390px. */}
      <div className="mt-3 px-5 md:px-8">
        {/* min-h-11 у кнопки = 44px, минимальный тап-таргет iOS/Android: без
            него единственный механизм паузы был высотой 30px. */}
        <div className="mx-auto flex w-full max-w-6xl justify-end">
          <button
            type="button"
            onClick={() => setPaused(p => !p)}
            aria-pressed={paused}
            className="press inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-mono text-label tracking-[0.12em] text-mist uppercase transition-colors hover:text-chalk"
          >
            <span aria-hidden="true" className="flex h-2.5 w-2.5 items-center justify-center">
              {paused ? (
                <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 fill-current">
                  <path d="M2 1l6 4-6 4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 fill-current">
                  <rect x="1.5" y="1" width="2.5" height="8" rx="0.6" />
                  <rect x="6" y="1" width="2.5" height="8" rx="0.6" />
                </svg>
              )}
            </span>
            {paused ? playLabel : pauseLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

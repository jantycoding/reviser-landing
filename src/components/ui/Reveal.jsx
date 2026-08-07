import { useLayoutEffect, useRef } from 'react';

/**
 * Появление блока при скролле.
 *
 * Отличие от прежнего AnimatedContent (GSAP + ScrollTrigger): анимация здесь
 * целиком на CSS. JS только вешает два класса. Поэтому она не может «зависнуть»
 * на половине прозрачности, как это делал таймлайн GSAP при быстром скролле.
 *
 * Если JS не отработал вообще — контент остаётся видимым. Это главное правило:
 * прятать содержимое имеет право только код, который гарантированно его покажет.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 22,
  duration = 0.62,
  as: Tag = 'div',
  className = '',
  ...rest
}) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-in');
      return;
    }

    el.classList.add('is-armed');

    const show = () => el.classList.add('is-in');

    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          show();
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.01 },
    );
    io.observe(el);

    // Страховка: если по какой-то причине наблюдатель не сработал, а блок уже
    // на экране — показываем принудительно. Пустых экранов быть не должно.
    const failsafe = window.setTimeout(() => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) show();
    }, 1800);

    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ '--rv-delay': `${delay}s`, '--rv-y': `${y}px`, '--rv-dur': `${duration}s` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

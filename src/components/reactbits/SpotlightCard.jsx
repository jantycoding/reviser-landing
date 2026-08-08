import { useRef, useCallback } from 'react';
import './SpotlightCard.css';

/**
 * SpotlightCard (react-bits, вариант JS + CSS).
 *
 * Мягкое световое пятно следует за курсором внутри карточки. Выбран
 * намеренно вместо более тяжёлых эффектов: ноль зависимостей, ноль rAF-циклов,
 * один обработчик `mousemove`, который пишет две CSS-переменные. Вся отрисовка
 * — на композиторе, слой не перерисовывается.
 *
 * На телефоне (основная аудитория) эффекта нет по построению: `mousemove` там
 * не приходит, пятно остаётся прозрачным, карточка выглядит обычной. Ничего
 * отключать вручную не нужно, лишнего кадрового бюджета не тратится.
 *
 * prefers-reduced-motion обрабатывается в CSS — пятно не показывается вовсе.
 */
export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(185, 190, 199, 0.14)',
  ...rest
}) {
  const ref = useRef(null);

  const onMouseMove = useCallback(e => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - r.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - r.top}px`);
  }, []);

  const onMouseEnter = useCallback(() => {
    ref.current?.style.setProperty('--spot-opacity', '1');
  }, []);

  const onMouseLeave = useCallback(() => {
    ref.current?.style.setProperty('--spot-opacity', '0');
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`spotlight-card ${className}`.trim()}
      style={{ '--spot-color': spotlightColor }}
      {...rest}
    >
      {children}
    </div>
  );
}

import { useLayoutEffect, useRef, Children, isValidElement, cloneElement } from 'react';
import './ScrollStack.css';

export const ScrollStackItem = ({ children, itemClassName = '', style }) => (
  <div className={`scroll-stack-card ${itemClassName}`.trim()} style={style}>
    {children}
  </div>
);

/**
 * ScrollStack — карточки складываются в стопку по мере прокрутки СТРАНИЦЫ.
 *
 * ── Почему переписано (08.08.2026) ──────────────────────────────────
 * Исходная версия react-bits создаёт внутри себя область `overflow-y: auto`
 * и вешает на неё Lenis. Это и есть источник жалобы: колесо над блоком
 * уходило во внутреннюю прокрутку, а на её краю Lenis гасил событие
 * через preventDefault — страница дальше не листалась, пока курсор не
 * уводили за пределы стека. Попытка перехватить колесо раньше Lenis
 * (capture-фаза на внешней обёртке) не помогла: Lenis слушает не там.
 *
 * Вывод: пока внутри есть своя прокручиваемая область, ловушка будет
 * возвращаться в том или ином виде. Поэтому её здесь нет.
 *
 * ── Как устроено теперь ─────────────────────────────────────────────
 * Карточки лежат в обычном потоке страницы, каждая — `position: sticky`
 * со своим `top` (базовый отступ + ступенька на индекс). Прокрутка всегда
 * страничная и всегда нативная: перехватывать нечего, ломать якорную
 * навигацию нечем, Lenis из компонента убран полностью.
 *
 * JS остался ровно для одного — масштаба: карточка, на которую наехали
 * следующие, слегка уменьшается, и стопка читается как стопка. Слушатель
 * пассивный, дросселирован через rAF, читает только геометрию и никогда
 * не вызывает preventDefault. Конфликтовать с Header/Reveal ему нечем —
 * они тоже только читают.
 *
 * ── Совместимость с апстримом ───────────────────────────────────────
 * Пропы `itemDistance`, `itemScale`, `itemStackDistance`, `baseScale`,
 * `onStackComplete` сохранены и работают по смыслу. `stackPosition`,
 * `scaleEndPosition`, `rotationAmount`, `blurAmount`, `scaleDuration`
 * приняты для совместимости вызова, но не используются: поворот и
 * размытие в этом проекте выключены (`rotationAmount={0}`, `blurAmount={0}`),
 * а позиции пина заданы через `pinTop`.
 */
const ScrollStack = ({
  children,
  className = '',
  itemDistance = 24,
  itemScale = 0.035,
  itemStackDistance = 14,
  baseScale = 0.9,
  pinTop = 104,
  onStackComplete,
  // приняты для совместимости с вызовом апстрима, не используются
  stackPosition,
  scaleEndPosition,
  scaleDuration,
  rotationAmount,
  blurAmount,
}) => {
  const rootRef = useRef(null);
  const rafRef = useRef(0);
  const completedRef = useRef(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const cards = Array.from(root.querySelectorAll('.scroll-stack-card'));
    if (!cards.length) return;

    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

    const update = () => {
      rafRef.current = 0;
      const vh = window.innerHeight || 1;
      /* Дистанция, на которой следующая карточка «доезжает» до своего пина.
         Берём от высоты экрана, чтобы эффект не зависел от кегля и длины
         текста внутри карточек. */
      const span = Math.max(160, vh * 0.55);

      // Прогресс пина для каждой карточки: 0 — ещё едет, 1 — села на место.
      const progress = cards.map((card, i) => {
        const pin = pinTop + i * itemStackDistance;
        const top = card.getBoundingClientRect().top;
        return clamp((span - (top - pin)) / span, 0, 1);
      });

      cards.forEach((card, i) => {
        // Насколько глубоко карточка утоплена: сумма прогрессов тех, что выше неё в стопке.
        let depth = 0;
        for (let j = i + 1; j < cards.length; j++) depth += progress[j];

        const scale = Math.max(baseScale, 1 - depth * itemScale);
        card.style.transform = `scale(${Math.round(scale * 1000) / 1000})`;
      });

      const done = progress[progress.length - 1] >= 0.999;
      if (done !== completedRef.current) {
        completedRef.current = done;
        if (done) onStackComplete?.();
      }
    };

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(update);
    };

    cards.forEach((card, i) => {
      card.style.setProperty('--stack-top', `${pinTop + i * itemStackDistance}px`);
      card.style.setProperty('--stack-gap', `${itemDistance}px`);
      card.style.zIndex = String(i + 1);
    });

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      completedRef.current = false;
      cards.forEach(card => {
        card.style.transform = '';
      });
    };
  }, [itemDistance, itemScale, itemStackDistance, baseScale, pinTop, onStackComplete]);

  return (
    <div className={`scroll-stack ${className}`.trim()} ref={rootRef}>
      {Children.map(children, child => (isValidElement(child) ? cloneElement(child) : child))}
      <div className="scroll-stack-end" aria-hidden="true" />
    </div>
  );
};

export default ScrollStack;

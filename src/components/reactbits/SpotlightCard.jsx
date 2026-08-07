import { useRef } from 'react';

/**
 * Карточка с «фонариком» под курсором.
 *
 * Позиция пятна пишется НАПРЯМУЮ в CSS-переменные --mx / --my через ref.
 * Прежняя версия держала координаты в useState: каждое движение мыши
 * перерисовывало поддерево карточки (до 120 раз в секунду), а карточек в
 * секции «Что умеют агенты» восемь — на бюджетном ноутбуке это давало лаг
 * ровно в том блоке, где человек должен спокойно читать сценарии.
 * Теперь React не рендерит вообще ничего: меняются только две переменные,
 * градиент пересчитывает композитор.
 *
 * Градиент объявлен один раз через var(--mx) / var(--my) — объект style
 * константен, React его не трогает.
 */
const SpotlightCard = ({ children, className = '', spotlightColor = 'rgba(255, 255, 255, 0.25)' }) => {
  const divRef = useRef(null);
  const glowRef = useRef(null);
  const focusedRef = useRef(false);

  const move = (x, y) => {
    const glow = glowRef.current;
    if (!glow) return;
    glow.style.setProperty('--mx', `${x}px`);
    glow.style.setProperty('--my', `${y}px`);
  };

  const fade = value => {
    if (glowRef.current) glowRef.current.style.opacity = value;
  };

  const handleMouseMove = e => {
    if (!divRef.current || focusedRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    move(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleFocus = () => {
    focusedRef.current = true;
    // При заходе с клавиатуры координат курсора нет — ставим пятно по центру,
    // иначе фокус подсвечивает левый верхний угол и выглядит как артефакт.
    const el = divRef.current;
    if (el) move(el.offsetWidth / 2, el.offsetHeight / 2);
    fade(0.6);
  };

  const handleBlur = () => {
    focusedRef.current = false;
    fade(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={() => fade(0.6)}
      onMouseLeave={() => fade(0)}
      // Пустой touch-обработчик: без него iOS Safari не применяет :active к
      // некликабельным элементам, и утилита press на карточках не сработала бы.
      onTouchStart={() => {}}
      className={`relative overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 p-8 ${className}`}
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity: 0,
          background: `radial-gradient(circle at var(--mx, 50%) var(--my, 50%), ${spotlightColor}, transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
};

export default SpotlightCard;

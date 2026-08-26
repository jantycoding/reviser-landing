import { useEffect, useState } from 'react';

/**
 * Возвращает набор чисел, подобранный под ширину экрана — 26.08.2026.
 *
 * ЗАЧЕМ. Оба компонента react-bits (CardSwap и DepthCarousel) на узком
 * экране ужимают всю сцену целиком через масштаб. Вместе с карточкой при
 * этом ужимается текст внутри: на телефоне заголовок превращался в девять
 * пикселей. Лечится это не масштабом, а другими размерами: карточка уже,
 * расстояния меньше, кегль — прежний.
 *
 * Точки переключения — брейкпоинты дизайн-системы (640 и 1024), чтобы сцена
 * менялась там же, где перестраивается остальная секция.
 *
 * Первое значение считается синхронно, до первой отрисовки: иначе на
 * телефоне кадр успел бы показать десктопную раскладку и дёрнуться.
 */
export default function useScreenSize({ phone, tablet, desktop }) {
  const read = () => {
    if (typeof window === 'undefined') return desktop;
    const w = window.innerWidth;
    if (w < 640) return typeof phone === 'function' ? phone(w) : phone;
    if (w < 1024) return tablet;
    return desktop;
  };

  const [value, setValue] = useState(read);

  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      /* Пересчёт в следующем кадре: во время перетаскивания угла окна
         resize приходит десятками в секунду, а перекладывать сцену чаще
         кадра всё равно бессмысленно. */
      frame = requestAnimationFrame(() => setValue(read()));
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}

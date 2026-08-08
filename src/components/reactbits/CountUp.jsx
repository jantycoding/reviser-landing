import { useInView, useMotionValue, useSpring } from 'motion/react';
import { useCallback, useEffect, useRef } from 'react';

/**
 * CountUp (react-bits). Число досчитывается до значения, когда попадает
 * во вьюпорт. Добавлен 08.08.2026 по запросу владельца — цифры первого экрана.
 *
 * Зависимость `motion` уже стоит в проекте, новых пакетов не появляется.
 *
 * Базовое состояние — ВЕРНОЕ ЧИСЛО, а не ноль (исправлено 08.08.2026).
 *
 * Первая версия оставляла в ноде стартовое значение и досчитывала до целевого
 * при появлении в кадре. Если анимация не запускалась — вкладка открыта в
 * фоне и заморожена браузером, включён режим «меньше движения», наблюдатель
 * не сработал, — на первом экране оставались нули: «0 дня до готового
 * отчёта». Это не «эффект не проиграл», а ложное утверждение о продукте.
 *
 * Поэтому здесь три уровня защиты:
 *   1. При запросе на минимум движения число сразу конечное, счёта нет.
 *   2. До старта в ноде лежит конечное значение, а не стартовое.
 *   3. Страховка на 2.5 секунды: если счёт так и не начался, число
 *      проставляется конечным принудительно. Тот же приём, что у Reveal.
 */
export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  className = '',
  startWhen = true,
  separator = '',
  onStart,
  onEnd,
}) {
  const ref = useRef(null);
  const startedRef = useRef(false);

  /* Читаем один раз при монтировании: пересчитывать на каждый рендер незачем,
     а в SSR/без matchMedia обращение упало бы. */
  const reducedRef = useRef(
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  const motionValue = useMotionValue(direction === 'down' ? to : from);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);
  const springValue = useSpring(motionValue, { damping, stiffness });

  const isInView = useInView(ref, { once: true, margin: '0px' });

  const getDecimalPlaces = num => {
    const str = num.toString();
    if (str.includes('.')) {
      const decimals = str.split('.')[1];
      if (parseInt(decimals) !== 0) return decimals.length;
    }
    return 0;
  };

  const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

  const formatValue = useCallback(
    latest => {
      const hasDecimals = maxDecimals > 0;
      const options = {
        useGrouping: !!separator,
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0,
      };
      const formatted = Intl.NumberFormat('en-US', options).format(latest);
      return separator ? formatted.replace(/,/g, separator) : formatted;
    },
    [maxDecimals, separator],
  );

  /* Уровни 1 и 2: в ноде сразу конечное число. Счёт, если он состоится,
     сам перепишет его со стартового значения. */
  useEffect(() => {
    if (ref.current) ref.current.textContent = formatValue(direction === 'down' ? from : to);
  }, [from, to, direction, formatValue]);

  /* Уровень 3: страховка. Если через 2.5 секунды счёт так и не стартовал,
     проставляем конечное значение руками и больше ничего не ждём. */
  useEffect(() => {
    const id = setTimeout(() => {
      if (!startedRef.current && ref.current) {
        ref.current.textContent = formatValue(direction === 'down' ? from : to);
      }
    }, 2500);
    return () => clearTimeout(id);
  }, [from, to, direction, formatValue]);

  useEffect(() => {
    /* При запросе на минимум движения не считаем вовсе: в ноде уже конечное
       число, трогать его нечем. */
    if (reducedRef.current) return;

    if (isInView && startWhen) {
      startedRef.current = true;
      /* Счёт начинается отсюда: возвращаем стартовое значение и отпускаем
         пружину. До этого момента в ноде лежало конечное. */
      if (ref.current) ref.current.textContent = formatValue(direction === 'down' ? to : from);
      if (typeof onStart === 'function') onStart();
      const timeoutId = setTimeout(() => {
        motionValue.set(direction === 'down' ? from : to);
      }, delay * 1000);
      const durationTimeoutId = setTimeout(
        () => {
          if (typeof onEnd === 'function') onEnd();
        },
        delay * 1000 + duration * 1000,
      );
      return () => {
        clearTimeout(timeoutId);
        clearTimeout(durationTimeoutId);
      };
    }
  }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration, formatValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', latest => {
      /* До старта пружина «меняется» на нуле и затирала бы конечное число,
         которое мы намеренно держим в ноде. */
      if (startedRef.current && ref.current) ref.current.textContent = formatValue(latest);
    });
    return () => unsubscribe();
  }, [springValue, formatValue]);

  return <span className={className} ref={ref} />;
}

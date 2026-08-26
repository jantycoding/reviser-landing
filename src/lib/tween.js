/**
 * Мини-твинер на requestAnimationFrame — 26.08.2026.
 *
 * ЗАЧЕМ ОН ЕСТЬ. Три компонента из react-bits (MaskedHeading, CardSwap,
 * DepthCarousel) написаны на gsap. Ставить ради них библиотеку — плюс 90 КБ
 * к главному чанку (сжатых — около 36 КБ), и это на странице, куда люди
 * приходят с мобильного интернета по рекламе. Всё, что из gsap реально
 * использовалось, — это «прогнать число от A до B по кривой» и «поставить
 * трансформацию сразу». Здесь ровно это, в шестьдесят строк, и без установки
 * чего бы то ни было.
 *
 * Кривые повторяют формулы gsap буквально, включая elastic.out(0.6, 0.9):
 * анимация должна выглядеть так же, как в примерах библиотеки, иначе
 * настройки из документации (которые владелец просил скопировать дословно)
 * означали бы не то же самое.
 */

/* gsap.Elastic.easeOut.config(amplitude, period).
   При amplitude < 1 gsap поднимает её до 1 и берёт сдвиг фазы p/4 —
   поэтому config(0.6, 0.9) и config(1, 0.9) дают одну кривую. */
export function elasticOut(amplitude = 1, period = 0.3) {
  const a = amplitude < 1 ? 1 : amplitude;
  const s = amplitude < 1 ? period / 4 : (period / (2 * Math.PI)) * Math.asin(1 / a);
  return n => (n === 0 || n === 1 ? n : a * 2 ** (-10 * n) * Math.sin(((n - s) * (2 * Math.PI)) / period) + 1);
}

export const power1InOut = n => (n < 0.5 ? 2 * n * n : 1 - (-2 * n + 2) ** 2 / 2);
export const power3Out = n => 1 - (1 - n) ** 3;
export const power4Out = n => 1 - (1 - n) ** 4;
export const power3InOut = n => (n < 0.5 ? 4 * n * n * n : 1 - (-2 * n + 2) ** 3 / 2);
/* Мягче всех: медленный вход, медленный выход. Для перелистывания, где
   движение должно читаться целиком, а не выстреливать в первые сто
   миллисекунд. */
export const power2InOut = n => (n < 0.5 ? 2 * n * n : 1 - (-2 * n + 2) ** 2 / 2);

/** Кривая по имени, как её пишут в настройках react-bits. */
export function easeByName(name) {
  if (typeof name === 'function') return name;
  const m = /^elastic\.out\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/.exec(String(name));
  if (m) return elasticOut(parseFloat(m[1]), parseFloat(m[2]));
  switch (name) {
    case 'power1.inOut':
      return power1InOut;
    case 'power2.inOut':
      return power2InOut;
    case 'power3.inOut':
      return power3InOut;
    case 'power4.out':
      return power4Out;
    case 'power3.out':
    default:
      return power3Out;
  }
}

/**
 * Прогоняет число от `from` до `to` за `duration` секунд.
 * Возвращает ручку с kill() — как у gsap-твина, чтобы вызывающий код не
 * пришлось переучивать.
 *
 * delay в секундах: в таймлайне CardSwap движения стартуют со сдвигом друг
 * относительно друга, а заводить под это отдельные таймеры значит потерять
 * их при размонтировании.
 */
export function tween({ from = 0, to = 1, duration = 0.5, delay = 0, ease = power3Out, onUpdate, onComplete }) {
  const fn = easeByName(ease);
  let raf = 0;
  let start = 0;
  let dead = false;

  /* duration 0 — не «мгновенно», а «без кадра ожидания»: так ведёт себя gsap
     при duration: 0, и на этом держится режим prefers-reduced-motion. */
  if (duration <= 0 && delay <= 0) {
    onUpdate?.(to);
    onComplete?.();
    return { kill: () => {} };
  }

  const step = now => {
    if (dead) return;
    if (!start) start = now;
    const elapsed = (now - start) / 1000 - delay;
    if (elapsed < 0) {
      raf = requestAnimationFrame(step);
      return;
    }
    const p = duration <= 0 ? 1 : Math.min(1, elapsed / duration);
    onUpdate?.(from + (to - from) * fn(p));
    if (p < 1) {
      raf = requestAnimationFrame(step);
    } else {
      dead = true;
      onComplete?.();
    }
  };

  raf = requestAnimationFrame(step);
  return {
    kill: () => {
      dead = true;
      cancelAnimationFrame(raf);
    },
  };
}

/**
 * Набор твинов, который живёт и умирает целиком, — замена gsap.timeline()
 * там, где нам от таймлайна нужны только параллельные движения со сдвигом.
 */
export function group() {
  let items = [];
  let killed = false;
  return {
    add(t) {
      if (killed) t.kill();
      else items.push(t);
      return t;
    },
    kill() {
      killed = true;
      items.forEach(t => t.kill());
      items = [];
    },
  };
}

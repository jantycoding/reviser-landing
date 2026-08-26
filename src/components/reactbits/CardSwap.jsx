import React, { Children, cloneElement, forwardRef, isValidElement, useEffect, useMemo, useRef } from 'react';
import { easeByName, group, tween } from '../../lib/tween';
import './CardSwap.css';

/**
 * CardSwap (react-bits, вариант JS + CSS), 26.08.2026 по запросу владельца.
 *
 * Стопка карточек: передняя падает вниз, остальные продвигаются вперёд,
 * упавшая заходит в хвост. Настройки на месте вызова — из примера библиотеки:
 * cardDistance 55, verticalDistance 60, delay 3000, pauseOnHover.
 *
 * ДВЕ ПРАВКИ ОТНОСИТЕЛЬНО ИСХОДНИКА
 *
 * 1. Без библиотеки анимаций. Оригинал строит таймлайн с метками и
 *    перекрытием, но по сути там три движения, стартующие со сдвигом по
 *    времени. Здесь это обычные твины с задержкой (lib/tween.js), а кривая
 *    elastic.out(0.6, 0.9) повторена формулой gsap буквально — движение то
 *    же. Причина не в экономии ради экономии: пакет на 90 КБ не установился
 *    на машине владельца и заблокировал сборку всей страницы.
 *
 * 2. Клик по стопке перелистывает её немедленно (запрос владельца
 *    26.08.2026: «нажимаю — не нажимается»). В оригинале клик только
 *    сообщает наружу индекс карточки, а сама стопка ждёт своей секунды по
 *    таймеру. Теперь нажатие прокручивает стопку сразу и заново заводит
 *    отсчёт — иначе следующая смена случилась бы через долю секунды после
 *    ручной, и получился бы дёрганый сдвоенный ход.
 *
 *    Отсюда же требование, которого нет в оригинале: смена обязана
 *    выдерживать прерывание на любом кадре. Поэтому очередь сдвигается в
 *    момент старта, а не в колбэке последнего движения, и каждая смена
 *    начинается с моментальной расстановки стопки по местам.
 *
 * 3. Уважение к prefers-reduced-motion. Оригинал заводит бесконечный
 *    интервал безусловно. Человеку, который в системе просил меньше
 *    движения, страница отдавала бы карточки, скачущие каждые три секунды, —
 *    а это ровно тот блок, где он читает доводы и решает, платить ли.
 *    Мы раскладываем стопку один раз и не запускаем таймер.
 */

export const Card = forwardRef(({ customClass, ...rest }, ref) => (
  <div ref={ref} {...rest} className={`card ${customClass ?? ''} ${rest.className ?? ''}`.trim()} />
));
Card.displayName = 'Card';

const makeSlot = (i, distX, distY, total) => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i,
});

/**
 * Ставит карточку в точку.
 *
 * xPercent/yPercent из оригинала — это «сдвинуть на половину собственного
 * размера», то есть центрирование относительно точки крепления. В CSS это
 * пишется как calc(-50% + Xpx) внутри translate3d: проценты там считаются от
 * размеров самого элемента, ровно как нужно.
 */
const applyTransform = (el, state) => {
  el.style.transform = `translate3d(calc(-50% + ${state.x}px), calc(-50% + ${state.y}px), ${state.z}px) skewY(${state.skew}deg)`;
  el.style.transformOrigin = 'center center';
  el.style.zIndex = String(state.zIndex);
};

const CardSwap = ({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  onCardClick,
  skewAmount = 6,
  easing = 'elastic',
  children,
}) => {
  const config =
    easing === 'elastic'
      ? {
          ease: 'elastic.out(0.6,0.9)',
          durDrop: 2,
          durMove: 2,
          durReturn: 2,
          promoteOverlap: 0.9,
          returnDelay: 0.05,
        }
      : {
          ease: 'power1.inOut',
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.45,
          returnDelay: 0.2,
        };

  const childArr = useMemo(() => Children.toArray(children), [children]);
  const refs = useMemo(
    () => childArr.map(() => React.createRef()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childArr.length],
  );

  const order = useRef(Array.from({ length: childArr.length }, (_, i) => i));
  const stateRef = useRef([]);
  const runRef = useRef(null);
  const intervalRef = useRef();
  const container = useRef(null);
  /* Ссылка на «прокрутить сейчас»: сама функция живёт внутри useEffect, где у
     неё есть доступ к текущим настройкам, а нажатие приходит снаружи. */
  const advanceRef = useRef(null);

  useEffect(() => {
    const total = refs.length;
    const ease = easeByName(config.ease);

    /* Текущее положение каждой карточки держим сами: без библиотеки некому
       ответить на вопрос «где эта карточка сейчас», а движение возврата
       стартует из середины падения. */
    stateRef.current = refs.map((r, i) => {
      const slot = makeSlot(i, cardDistance, verticalDistance, total);
      const state = { ...slot, skew: skewAmount };
      applyTransform(r.current, state);
      return state;
    });

    const reduce =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return undefined;

    /* Твин по трём координатам сразу: гоним прогресс 0 → 1 и смешиваем
       начальную точку с конечной. Так у карточки одно движение, а не три
       рассинхронизированных. */
    const moveTo = (index, target, duration, wait, onDone) => {
      const el = refs[index].current;
      const state = stateRef.current[index];
      const from = { x: state.x, y: state.y, z: state.z };
      return tween({
        from: 0,
        to: 1,
        duration,
        delay: wait,
        ease,
        onUpdate: p => {
          state.x = from.x + (target.x - from.x) * p;
          state.y = from.y + (target.y - from.y) * p;
          state.z = from.z + (target.z - from.z) * p;
          applyTransform(el, state);
        },
        onComplete: onDone,
      });
    };

    /* Моментально расставить стопку по текущей очереди.
       Нужно перед каждой сменой: если предыдущую анимацию оборвали на
       середине (нажатием или следующим тиком таймера), карточки остались
       в произвольных точках — одна на полпути вниз, другая между слотами.
       Без этого шага новая анимация стартовала бы из мусора. */
    const settleAll = () => {
      order.current.forEach((idx, i) => {
        const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
        const state = stateRef.current[idx];
        state.x = slot.x;
        state.y = slot.y;
        state.z = slot.z;
        state.zIndex = slot.zIndex;
        applyTransform(refs[idx].current, state);
      });
    };

    const swap = () => {
      if (order.current.length < 2) return;
      runRef.current?.kill();
      settleAll();
      const running = group();
      runRef.current = running;

      const [front, ...rest] = order.current;

      /* Очередь сдвигается СРАЗУ, а не по окончании анимации.
         Раньше это делал колбэк последнего твина — и ровно поэтому стопка
         ломалась при нажатии: клик обрывал анимацию, колбэк не вызывался,
         очередь оставалась прежней, и следующая смена снова роняла ту же
         карточку. Порядок — это состояние данных, он не должен зависеть от
         того, доиграла картинка или нет. */
      order.current = [...rest, front];

      const frontState = stateRef.current[front];

      /* Падение передней карточки. */
      running.add(moveTo(front, { x: frontState.x, y: frontState.y + 500, z: frontState.z }, config.durDrop, 0));

      /* Метки таймлайна из оригинала, переведённые в секунды ожидания.
         promote начинается раньше конца падения на promoteOverlap. */
      const promoteAt = config.durDrop * (1 - config.promoteOverlap);
      const returnAt = promoteAt + config.durMove * config.returnDelay;

      rest.forEach((idx, i) => {
        const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
        const el = refs[idx].current;
        const state = stateRef.current[idx];
        const wait = promoteAt + i * 0.15;

        /* Слой переключается в момент старта движения, а не плавно —
           так же, как tl.set(..., 'promote') в оригинале. */
        running.add(
          tween({
            from: 0,
            to: 1,
            duration: 0,
            delay: wait,
            onUpdate: () => {
              state.zIndex = slot.zIndex;
              applyTransform(el, state);
            },
          }),
        );
        running.add(moveTo(idx, slot, config.durMove, wait));
      });

      const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length);
      running.add(
        tween({
          from: 0,
          to: 1,
          duration: 0,
          delay: returnAt,
          onUpdate: () => {
            frontState.zIndex = backSlot.zIndex;
            applyTransform(refs[front].current, frontState);
          },
        }),
      );
      running.add(moveTo(front, backSlot, config.durReturn, returnAt));
    };

    swap();
    intervalRef.current = window.setInterval(swap, delay);

    /* Ручная прокрутка: сразу двигаем и перезапускаем таймер с нуля. */
    advanceRef.current = () => {
      swap();
      clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(swap, delay);
    };

    if (pauseOnHover) {
      const node = container.current;
      const pause = () => {
        runRef.current?.kill();
        clearInterval(intervalRef.current);
      };
      const resume = () => {
        clearInterval(intervalRef.current);
        intervalRef.current = window.setInterval(swap, delay);
      };
      node.addEventListener('mouseenter', pause);
      node.addEventListener('mouseleave', resume);
      return () => {
        node.removeEventListener('mouseenter', pause);
        node.removeEventListener('mouseleave', resume);
        clearInterval(intervalRef.current);
        runRef.current?.kill();
        advanceRef.current = null;
      };
    }

    return () => {
      clearInterval(intervalRef.current);
      runRef.current?.kill();
      advanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing]);

  const rendered = childArr.map((child, i) =>
    isValidElement(child)
      ? cloneElement(child, {
          key: i,
          ref: refs[i],
          style: { width, height, ...(child.props.style ?? {}) },
          onClick: e => {
            child.props.onClick?.(e);
            onCardClick?.(i);
            advanceRef.current?.();
          },
        })
      : child,
  );

  return (
    <div ref={container} className="card-swap-container" style={{ width, height }}>
      {rendered}
    </div>
  );
};

export default CardSwap;

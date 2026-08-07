import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Claudik from './Claudik';
import { report } from '../../content/site';

/**
 * Демонстрация работы бригады ИИ-агентов над отчётом.
 *
 * Что происходит: камера едет по строкам отчёта, к каждой строке приходит свой
 * агент, «работает» над ней, и находка проявляется вместе с решением. Дойдя до
 * конца, камера отъезжает и показывает готовый отчёт целиком. Потом всё
 * повторяется.
 *
 * Реализация — состояние + CSS-переходы, без анимационных библиотек:
 *   • камера   — transform: translateY() scale() на обёртке панели;
 *   • агенты   — transform: translateY() внутри левой «лестницы»;
 *   • строки   — переключение классов по состоянию.
 * Всё это композиторные свойства, поэтому анимация не грузит основной поток и
 * не может застрять на полпути, как это делали GSAP-таймлайны.
 *
 * Интерактив: наведение на строку останавливает цикл и переводит камеру на неё,
 * клик по панели ставит на паузу и снимает с неё. При prefers-reduced-motion
 * цикл не запускается вовсе — сразу показывается готовый отчёт.
 */

const STEP_MS = 2600;

export default function AgentSwarm() {
  const { panel, crew } = report;
  const rows = panel.rows;

  // шаг 0 — обзор, 1..rows.length — работа по строкам, последний — готовый отчёт
  const TOTAL = rows.length + 2;
  const DONE_STEP = TOTAL - 1;

  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [reduced, setReduced] = useState(false);

  const viewportRef = useRef(null);
  const panelRef = useRef(null);
  const rowRefs = useRef([]);
  const [metrics, setMetrics] = useState({ height: 0, centers: [], zoom: 1.3 });

  /* --- замеры: высота панели и середина каждой строки ------------------ */
  const measure = useCallback(() => {
    const panelEl = panelRef.current;
    if (!panelEl) return;
    const centers = rowRefs.current.map(el => (el ? el.offsetTop + el.offsetHeight / 2 : 0));
    const narrow = window.innerWidth < 768;
    setMetrics({ height: panelEl.offsetHeight, centers, zoom: narrow ? 1.06 : 1.16 });
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (panelRef.current) ro.observe(panelRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  /* --- уважение к настройке «меньше движения» -------------------------- */
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const apply = () => {
      setReduced(mq.matches);
      if (mq.matches) setStep(DONE_STEP);
    };
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, [DONE_STEP]);

  /* --- цикл ------------------------------------------------------------ */
  useEffect(() => {
    if (reduced || paused || hovered !== null) return;
    const id = window.setInterval(() => setStep(s => (s + 1) % TOTAL), STEP_MS);
    return () => window.clearInterval(id);
  }, [reduced, paused, hovered, TOTAL]);

  /* --- какая строка в фокусе ------------------------------------------- */
  const focusRow = hovered !== null ? hovered : step >= 1 && step <= rows.length ? step - 1 : null;
  const overview = focusRow === null;

  const isDone = i => (reduced ? true : step === DONE_STEP || (step >= 1 && i < step - 1));
  const isActive = i => focusRow === i;

  /* --- камера ------------------------------------------------------------
     Масштаб только НАРУЖУ: на обзоре панель отъезжает до 0.96, в работе
     возвращается к 1. Увеличение выше единицы обрезало бы панель по бокам —
     вместе с бригадой слева и колонкой «кто чинит» справа. Ощущение приближения
     даёт не камера, а фокус: рабочая строка подсвечивается и чуть подрастает,
     остальные приглушаются. */
  const scale = overview ? (step === DONE_STEP ? 0.985 : 0.96) : 1;
  const cameraStyle = {
    transform: `scale(${scale})`,
    transition: reduced ? 'none' : 'transform 1.05s cubic-bezier(0.33, 1, 0.68, 1)',
    transformOrigin: '50% 50%',
    willChange: 'transform',
  };

  /* --- позиции агентов в левой «лестнице» ------------------------------ */
  const agentTop = idx => metrics.centers[idx] ?? 0;

  return (
    <div className="relative">
      {/* окно, в котором ездит камера */}
      <div
        ref={viewportRef}
        className="relative overflow-hidden rounded-2xl border border-line bg-ink-2 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]"
        style={{ minHeight: metrics.height ? `${metrics.height}px` : undefined }}
        onClick={() => setPaused(p => !p)}
        onMouseLeave={() => setHovered(null)}
      >
        <div style={cameraStyle}>
          <div ref={panelRef}>
            {/* шапка окна */}
            <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface/60 px-5 py-3.5">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
                <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
                <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
              </div>
              <div className="font-mono text-fine text-fog">{panel.company}</div>
              <div className="ml-auto flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-verify"
                  style={{ animation: reduced ? 'none' : 'soft-pulse 2.4s ease-in-out infinite' }}
                />
                <span className="font-mono text-label tracking-[0.12em] text-mist uppercase">{panel.caption}</span>
              </div>
            </div>

            {/* строка состояния */}
            <div className="flex items-center gap-3 border-b border-line px-5 py-2.5">
              <span className="font-mono text-label tracking-[0.1em] text-mist uppercase">{panel.meta}</span>
              <span className="ml-auto font-mono text-label tracking-[0.1em] text-iris-soft uppercase">
                {reduced || step === DONE_STEP
                  ? 'отчёт готов'
                  : overview
                    ? 'сканируем бизнес'
                    : `разбираем: ${crew[focusRow % crew.length].name.toLowerCase()}`}
              </span>
            </div>

            {/* таблица находок */}
            <div className="relative">
              <div className="hidden grid-cols-[1fr_2fr_auto] gap-4 py-3 pr-5 pl-16 font-mono text-label tracking-[0.12em] text-mist uppercase sm:grid md:pl-20">
                {panel.columns.map((c, i) => (
                  <div key={c} className={i === 2 ? 'text-right' : ''}>
                    {c}
                  </div>
                ))}
              </div>

              <ul>
                {rows.map((row, i) => {
                  const active = isActive(i);
                  const done = isDone(i);
                  const agent = crew[i % crew.length];
                  return (
                    <li
                      key={row.area}
                      ref={el => (rowRefs.current[i] = el)}
                      onMouseEnter={() => setHovered(i)}
                      className="relative grid grid-cols-1 gap-1 border-t border-line py-3.5 pr-5 pl-16 transition-all duration-500 sm:grid-cols-[1fr_2fr_auto] sm:items-center sm:gap-4 md:pl-20"
                      style={{
                        background: active ? `color-mix(in oklab, ${agent.color} 12%, transparent)` : undefined,
                        transform: active ? 'scale(1.018)' : 'scale(1)',
                        transformOrigin: '50% 50%',
                        opacity: active || done || overview ? 1 : 0.75,
                        zIndex: active ? 2 : 1,
                        boxShadow: active ? `inset 3px 0 0 0 ${agent.color}` : 'none',
                      }}
                    >
                      {/* левая направляющая — «леса», по которым ходят агенты */}
                      <span
                        aria-hidden="true"
                        className="absolute top-0 bottom-0 left-8 w-px transition-colors duration-500 md:left-10"
                        style={{ background: active ? agent.color : 'var(--color-line)' }}
                      />

                      <span
                        className={`relative font-mono text-fine transition-colors duration-500 ${active ? 'text-chalk' : 'text-fog'}`}
                      >
                        {row.area}
                      </span>

                      {/* находка + на чём основан вывод: подзаголовок обещает
                          «привязана к данным», строка source это доказывает */}
                      {/* Ни размытия, ни глубокого приглушения на неразобранных
                          строках. Цикл длится 8 шагов по 2.6 с, и при прежних
                          blur(3px)/opacity 0.45 панель была полностью читаемой
                          ровно один шаг из восьми — то есть 12% времени. Это
                          единственный на странице образец продукта за 9 900 ₸,
                          и человек, поймавший его в любой другой момент, видел
                          размытую таблицу. Драматургия сканирования осталась в
                          подсветке активной строки; текст читается всегда. */}
                      <span
                        className="relative block"
                      >
                        <span className="block text-body text-chalk">{row.finding}</span>
                        {row.source && (
                          <span className="mt-1 block font-mono text-label tracking-normal text-mist normal-case">
                            {row.source}
                            {row.effect ? ` · эффект ${row.effect}` : ''}
                          </span>
                        )}
                      </span>

                      <span
                        className="relative w-fit rounded-md border px-2 py-0.5 font-mono text-label font-medium tracking-[0.08em] uppercase transition-all duration-500 sm:justify-self-end"
                        style={{
                          transform: done ? 'scale(1)' : 'scale(0.98)',
                          borderColor:
                            row.level === 'agent' ? 'color-mix(in oklab, var(--color-iris) 55%, transparent)' : 'var(--color-line-2)',
                          background:
                            row.level === 'agent' ? 'color-mix(in oklab, var(--color-iris) 14%, transparent)' : 'var(--color-surface-2)',
                          color: row.level === 'agent' ? 'var(--color-iris-soft)' : 'var(--color-fog)',
                        }}
                      >
                        {/* Метка «кто чинит» видна всегда: именно она снимает
                            главное возражение («найдут поводы продать
                            внедрение»), и прятать её за «···» большую часть
                            цикла — прятать собственный аргумент. */}
                        {panel.levels[row.level]}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* бригада: ходит по левой направляющей от строки к строке */}
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                {crew.map((a, idx) => {
                  const atWork = focusRow !== null && focusRow % crew.length === idx;
                  return (
                    <div
                      key={a.name}
                      className="absolute left-2.5 md:left-4"
                      style={{
                        transform: `translate3d(0, ${agentTop(idx) - 26}px, 0)`,
                        transition: reduced ? 'none' : 'transform 0.9s cubic-bezier(0.34, 1.3, 0.64, 1)',
                        willChange: 'transform',
                        zIndex: atWork ? 2 : 1,
                      }}
                    >
                      <div
                        style={{
                          transform: atWork ? 'scale(1)' : 'scale(0.72)',
                          opacity: atWork ? 1 : 0.42,
                          transition: reduced ? 'none' : 'transform 0.5s ease, opacity 0.5s ease',
                        }}
                      >
                        <Claudik
                          color={a.color}
                          gear={a.gear}
                          eyes={atWork ? 'focused' : step === DONE_STEP ? 'happy' : 'square'}
                          working={atWork && !reduced}
                          size={atWork ? 30 : 24}
                          className={atWork && !reduced ? 'claudik-work' : ''}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* подвал панели */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line bg-surface/40 px-5 py-3.5 text-fine text-mist">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-iris" />
                закрывает ИИ-агент
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-line-2" />
                чините своими силами
              </span>
            </div>
          </div>
        </div>

        {/* индикатор паузы */}
        {(paused || hovered !== null) && !reduced && (
          <div className="pointer-events-none absolute right-4 bottom-4 rounded-md border border-line bg-ink/85 px-2.5 py-1 font-mono text-label tracking-[0.12em] text-mist uppercase">
            пауза
          </div>
        )}
      </div>

      {/* прогресс разбора */}
      <div className="mt-4 h-px w-full overflow-hidden bg-line" aria-hidden="true">
        <div
          className="h-full bg-iris"
          style={{
            width: `${reduced ? 100 : ((step + 1) / TOTAL) * 100}%`,
            transition: reduced ? 'none' : 'width 1s cubic-bezier(0.65, 0, 0.35, 1)',
          }}
        />
      </div>

      {/* состав бригады */}
      <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
        {crew.map((a, idx) => {
          const atWork = focusRow !== null && focusRow % crew.length === idx;
          return (
            <li key={a.name} className="flex items-center gap-2.5">
              <Claudik color={a.color} gear={a.gear} eyes={atWork ? 'focused' : 'square'} size={22} />
              <span className="text-fine">
                <span className={atWork ? 'text-chalk' : 'text-fog'}>{a.name}</span>
                <span className="text-mist"> · {a.role}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import Marquee from '../components/ui/Marquee';
import Reveal from '../components/ui/Reveal';
import { platforms } from '../content/site';

/**
 * Лента платформ, к которым подключаются агенты.
 *
 * ⚠️ Здесь намеренно НЕ логотипы клиентов. Ставить чужие бренды в роли своих
 * клиентов нельзя: это нарушение рекламной политики Meta (а трафик идёт
 * оттуда), претензии по товарным знакам и мгновенная потеря доверия рынка,
 * где предприниматели общаются между собой. Лента платформ даёт тот же
 * визуальный эффект «эти ребята в теме» и при этом правдива.
 */
function Chip({ label }) {
  return (
    <span className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-5 py-3 text-body whitespace-nowrap text-chalk/85">
      <span className="h-1.5 w-1.5 rounded-full bg-verify/70" />
      {label}
    </span>
  );
}

export default function Platforms() {
  const sectionRef = useRef(null);

  /**
   * Лента крутится только пока секция в кадре.
   * Страница высотой ~15 000px, а анимация бесконечная: без этого композитор
   * не уходит в простой ни на секунду за весь скролл. На бюджетном Android это
   * греет батарею и подтормаживает сам скролл — там, где человек читает
   * аргументы и решает, платить ли за аудит.
   *
   * Пауза ставится инлайном, снятие — очисткой свойства, а не значением
   * 'running': инлайн-'running' перебил бы CSS-правило .marquee:hover,
   * и лента перестала бы останавливаться под курсором для чтения.
   */
  useEffect(() => {
    const root = sectionRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;

    const track = root.querySelector('.marquee');
    if (!track) return;

    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          track.style.animationPlayState = entry.isIntersecting ? '' : 'paused';
        }
      },
      // Запас в пол-экрана: лента набирает ход до того, как попала в кадр,
      // иначе на входе она выглядит замершей.
      { rootMargin: '50% 0px' },
    );

    io.observe(root);

    return () => {
      io.disconnect();
      track.style.animationPlayState = '';
    };
  }, []);

  return (
    <section ref={sectionRef} className="w-full border-y border-line py-stack clip-x">
      {/* Заголовок выключен влево по той же оси max-w-6xl + px-8, что и все
          остальные секции. Центрированный блок посреди левовыключенной
          страницы заставлял глаз на каждом экране заново искать начало строки. */}
      <div className="px-5 md:px-8">
        <Reveal className="mx-auto mb-9 w-full max-w-6xl">
          <h2 className="text-h2 font-medium text-chalk">{platforms.title}</h2>
          <p className="mt-2.5 max-w-[52ch] text-body text-fog">{platforms.note}</p>
        </Reveal>
      </div>

      <Marquee duration={52} ariaLabel="Платформы, к которым подключаются агенты">
        {platforms.items.map(item => (
          <Chip key={item} label={item} />
        ))}
      </Marquee>
    </section>
  );
}

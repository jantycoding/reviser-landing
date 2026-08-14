import { useEffect, useRef, useState } from 'react';
import Logo from './ui/Logo';
import { navItems, brand, headerCta, auditPrice, pricing } from '../content/site';

/**
 * Шапка. Заменила react-bits PillNav: тот весил ~15 КБ, гонял GSAP на каждый
 * ховер, ставил подписи КАПСОМ и терял текст активной пилюли.
 *
 * Здесь — обычные ссылки: 14px, medium, sentence case, как на linear.app.
 * Активный раздел подсвечивается по скроллу.
 */

export default function Header() {
  /* Клик по знаку — всегда возврат на первый экран. href="#top" сам по себе
     не работает, если человек уже стоит на #top: браузер считает переход
     несостоявшимся и ничего не делает. Поэтому скроллим руками и заодно
     чистим якорь из адресной строки. */
  const handleLogoClick = e => {
    e.preventDefault();
    setOpen(false);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');
  const [open, setOpen] = useState(false);
  // Нижняя панель на мобильном: включается после «Ворот», гаснет на оплате.
  const [pastGate, setPastGate] = useState(false);
  const [atCheckout, setAtCheckout] = useState(false);
  const burgerRef = useRef(null);

  /**
   * Один passive-слушатель на две задачи: фон шапки и «ворота пройдены».
   *
   * pastGate раньше считался внутри IntersectionObserver, а тот вызывает
   * колбэк только при СМЕНЕ состояния пересечения. Если #gate за один кадр
   * проскакивает из «ниже экрана» в «выше экрана» (крупная дельта колеса,
   * scrollTo, восстановление позиции), колбэка нет — и единственная постоянная
   * кнопка оплаты на мобильном не появляется до конца сеанса. Здесь состояние
   * выводится из фактической позиции, а не из события.
   */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
      const gate = document.getElementById('gate');
      if (gate) setPastGate(gate.getBoundingClientRect().bottom < 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Подсветка текущего раздела
  useEffect(() => {
    const ids = navItems.map(i => i.href.slice(1));
    const nodes = ids.map(id => document.getElementById(id)).filter(Boolean);
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5] },
    );
    nodes.forEach(n => io.observe(n));
    return () => io.disconnect();
  }, []);

  /**
   * Мобильная панель оплаты.
   *
   * На 390px между первым экраном и первой кнопкой оплаты около восьми
   * экранов прокрутки: человек прогревается на «Агентах», проходит «Ворота»,
   * где впервые видит цену, — и до самого низа страницы у него нет ни одной
   * возможности заплатить, кроме бургер-меню. Панель появляется ровно там,
   * где желание уже создано (после #gate), и убирается, когда виден сам
   * блок оплаты, чтобы не перекрывать форму и не дублировать кнопку.
   */
  useEffect(() => {
    const checkout = document.getElementById('checkout');
    if (!checkout) return;

    // Здесь наблюдатель уместен: переход «блок оплаты виден / не виден»
    // гарантированно меняет состояние пересечения.
    const io = new IntersectionObserver(entries => setAtCheckout(entries.some(e => e.isIntersecting)), {
      threshold: 0,
    });
    io.observe(checkout);
    return () => io.disconnect();
  }, []);

  // Блокируем прокрутку под открытым мобильным меню
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  /**
   * Escape закрывает меню и возвращает фокус на бургер.
   * До этого меню не закрывалось с клавиатуры вообще, а Tab уводил фокус на
   * элементы страницы под оверлеем — при заблокированном скролле доскроллить
   * до них нельзя, то есть фокус уходил в никуда.
   */
  useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === 'Escape') {
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const barVisible = pastGate && !atCheckout && !open;
  const barCta = pricing?.plans?.[0]?.cta ?? headerCta.label;
  /**
   * Пока внизу висит панель оплаты, оранжевая кнопка в шапке — второй
   * одинаковый призыв заплатить на том же экране. Два «плати» одновременно у
   * человека, который ещё не решил, кто мы такие, читаются как давление.
   * Панель остаётся (она ближе к пальцу), пилюля в шапке уходит.
   */
  const pillHiddenOnMobile = pastGate && !atCheckout;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-100 px-3 transition-[padding] duration-300 md:px-5 ${
          scrolled ? 'pt-2.5' : 'pt-4'
        }`}
      >
        {/* Плавающая капсула вместо сплошной полосы во всю ширину — по
            референсу React Bits (закруглённый борт, полупрозрачный фон,
            видимые поля по бокам), решение владельца 06.08.2026.
            gap-2 и px-4 до 400px: на 320px (iPhone SE 1-го поколения, обложка
            Galaxy Fold) ряд «логотип + пилюля + бургер» не помещался и выдавливал
            бургер за край — документ становился шире вьюпорта на 10px, а бургер
            частично уезжал за экран. Ловушка №1 брифа запрещает лечить это
            overflow-x на корне, поэтому лечим сам ряд. */}
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 rounded-full border border-line bg-ink-2/80 px-4 py-2.5 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.7)] backdrop-blur-xl min-[400px]:gap-3 min-[400px]:px-5 md:gap-6 md:px-6">
          <a
            href="#top"
            onClick={handleLogoClick}
            className="flex shrink-0 items-center gap-2.5 rounded-lg transition-opacity hover:opacity-80"
            aria-label={`${brand.name} — наверх`}
          >
            <Logo />
            {/* Словесный знак прячется до 360px: на 320px ряд «логотип + пилюля +
                бургер» не помещался и выдавливал бургер за край экрана. Знак
                остаётся кликабельным по иконке. */}
            {/* Худой начерк словесного знака — решение владельца 06.08.2026:
                без приставки «ai». Начерк уплотнён до font-semibold
                14.08.2026 (запрос владельца, референс — шапка pleep):
                тонкий знак рядом с серым клодиком терялся. */}
            <span className="hidden font-display text-[16px] font-semibold tracking-[-0.01em] text-chalk min-[360px]:inline">
              {brand.name}
            </span>
          </a>

          <nav aria-label="Разделы" className="ml-auto hidden items-center gap-1 md:flex">
            {navItems.map(item => {
              const isActive = active === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'true' : undefined}
                  className={`rounded-lg px-3 py-2 text-[14px] font-medium transition-colors ${
                    isActive ? 'bg-surface text-chalk' : 'text-fog hover:bg-surface/70 hover:text-chalk'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Цена в шапке видна и на телефоне: раньше она пряталась в бургер,
              и 100% мобильного трафика не видело стоимость входа до «Ворот».
              Но голая цифра «14 990 ₸» рядом с «Наймите ИИ-агента» читается как
              цена агента — а через пять экранов человек находит «от 600 000 ₸»
              и получает эффект приманки-подмены. Цена без предмета врёт,
              поэтому на узком экране стоит короткая подпись с предметом.
              Тап-таргет доведён до 44px (min-h-11): и пилюля, и бургер были
              ниже минимума iOS/Android на самых частых элементах навигации. */}
          {/* Решение владельца 06.08.2026: без градиента (флэт-серебро,
              bg-signal-flat) и без жирного начертания — раньше здесь была
              цена, теперь просто «Получить аудит». */}
          <a
            href={headerCta.href}
            aria-label={headerCta.label}
            className={`bg-signal-flat ml-auto min-h-11 shrink-0 items-center rounded-lg bg-signal px-3 text-[14px] font-normal whitespace-nowrap text-ink transition-colors hover:bg-signal-soft md:ml-2 md:inline-flex md:px-4 ${
              pillHiddenOnMobile ? 'hidden' : 'inline-flex'
            }`}
          >
            {/* Две подписи вместо одной. Длинная («Получить аудит вашего
                бизнеса», решение владельца 07.08.2026) на 390px занимает 226px
                при whitespace-nowrap и выталкивает бургер за край экрана —
                навигация на телефоне пропадает целиком. С md места хватает,
                там стоит полная. aria-label выше всегда полный, поэтому для
                скринридера подпись не меняется от ширины окна. */}
            <span className="md:hidden">{headerCta.short}</span>
            <span className="hidden md:inline">{headerCta.label}</span>
          </a>

          <button
            ref={burgerRef}
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line text-chalk md:hidden ${
              pillHiddenOnMobile ? 'ml-auto md:ml-0' : ''
            }`}
          >
            <svg viewBox="0 0 20 20" className="h-4.5 w-4.5" fill="none" aria-hidden="true">
              {open ? (
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              ) : (
                <path d="M3 6h14M3 13h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {/* Затемнение под панелью. Без него контент страницы за меню оставался
            полностью контрастным, пункты меню смешивались с карточками под
            ними, и открытое меню читалось как недоделанный интерфейс — ровно
            тот сигнал «сделано на коленке», который скептик ищет. Клик по
            фону закрывает меню: привычный жест, который до этого не работал. */}
        {open && (
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={() => setOpen(false)}
            className="fixed inset-0 -z-10 h-full w-full cursor-default bg-ink/70 backdrop-blur-sm md:hidden"
          />
        )}

        {open && (
          <div id="mobile-menu" className="mx-5 mt-3 rounded-2xl border border-line bg-ink-2/95 p-2 backdrop-blur-xl md:hidden">
            {navItems.map(item => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-body font-medium text-chalk"
              >
                {item.label}
              </a>
            ))}
            <a
              href={headerCta.href}
              onClick={() => setOpen(false)}
              className="bg-signal-flat mt-1 block rounded-xl bg-signal px-4 py-3 text-center text-body font-normal text-ink"
            >
              {headerCta.label}
            </a>
          </div>
        )}
      </header>

      {/* Закреплённая нижняя панель — только мобильный. Базовое состояние
          скрыто намеренно: показывает и прячет её тот же наблюдатель. */}
      <div
        aria-hidden={barVisible ? undefined : 'true'}
        className={`fixed inset-x-0 bottom-0 z-90 border-t border-line bg-ink/95 backdrop-blur-xl transition-[transform,opacity] duration-300 md:hidden ${
          barVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
        }`}
        style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center gap-3 px-5 pt-2.5">
          <div className="min-w-0 leading-tight">
            <div className="truncate text-fine text-fog">{pricing?.plans?.[0]?.name ?? brand.name}</div>
            <div className="text-body font-semibold text-chalk">{auditPrice}</div>
          </div>
          <a
            href={headerCta.href}
            tabIndex={barVisible ? undefined : -1}
            className="ml-auto shrink-0 rounded-xl bg-signal px-5 py-3 text-body font-semibold whitespace-nowrap text-ink transition-colors hover:bg-signal-soft"
          >
            {barCta}
          </a>
        </div>
      </div>
    </>
  );
}

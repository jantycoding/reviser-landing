import { Suspense, lazy } from 'react';
import Reveal from '../components/ui/Reveal';
import SafeBackground from '../components/ui/SafeBackground';
import SplitText from '../components/reactbits/SplitText';
import { hero } from '../content/site';

/* Фон первого экрана — Prism (react-bits, WebGL через ogl). Поставлен
   08.08.2026 по запросу владельца, заменил Aurora; та, в свою очередь,
   заменила FloatingLines тем же днём. Оба предыдущих компонента остаются в
   кодовой базе неиспользуемыми — как Orb и GradientWaves.

   Компонент декоративный (aria-hidden), грузится через lazy(): интерактивный
   текст показывается раньше фона.

   Правило на будущее: любой WebGL/canvas-фон импортируется только через
   lazy(). Прямой import утащит графическую библиотеку в основной чанк. */
const Silk = lazy(() => import('../components/reactbits/Silk'));

function Bolt() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
      <path d="M11 2L4 11h5l-1 7 7-9h-5l1-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export default function Hero() {
  return (
    /* Без `isolate` и с явным фоном.
       Сценарий «прокрутить страницу колесом донизу → вернуться в начало» давал
       полностью чёрный первый экран: изолированный контейнер с двумя
       радиальными градиентами терял композитный слой, и вместо героя
       оставалась пустота. Возврат наверх — частый жест (тап по логотипу, свайп,
       кнопка Safari), и человек, у которого первый экран схлопнулся в чёрный
       прямоугольник, страницу закрывает. Явный bg-ink гарантирует фон даже при
       потере слоя, а изоляция здесь ничего не держала: у детей свои z-индексы. */
    <section id="top" className="relative flex min-h-[100svh] w-full flex-col justify-center bg-ink clip-x pt-28 pb-16 md:pt-32">
      {/* Герой на весь экран (референс — pleep): min-h-[100svh], контент
          отцентрован по вертикали, шёлк заливает всю секцию, снизу вуаль сама
          уходит в глухой белый — переход к секциям бесшовный. svh, а не vh:
          на телефоне vh прыгает вместе с адресной строкой браузера. */}
      {/* Фон первого экрана — FloatingLines (react-bits, WebGL через three),
          решение владельца 06.08.2026, заменил Orb. Палитра линий —
          серебро → белый → тёмная синева («Metal Noir»), не дефолтные
          розовый/синий из исходника react-bits. На мобильном (≤767px)
          компонент сам рисует один статичный кадр без rAF-цикла — тот же
          приём, что и в Orb/GradientWaves, там же объяснение почему. */}
      {/* Фон — Silk (react-bits), белый шёлк. Настройки владельца дословно:
          speed 10, scale 0.8, #ffffff, noiseIntensity 1.5, rotation 0.
          Сменил чёрную призму 14.08.2026 — «многие бэкграунды не
          адаптированы под белый, этот адаптирован». */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <SafeBackground>
          <Suspense fallback={null}>
            <Silk speed={10} scale={0.8} color="#ffffff" noiseIntensity={1.5} rotation={0} />
          </Suspense>
        </SafeBackground>
      </div>
      {/* Вуаль: шёлк в тёмных гребнях уходит к ~20% яркости, тёмный текст на
          нём проваливается. Полупрозрачный белый сверху выравнивает фон до
          читаемого, внизу — глухой белый, чтобы секции начинались с чистого
          листа. Никакой полосы перехода больше не нужно: шёлк сам светлый. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.45) 45%, rgba(255,255,255,0.75) 78%, #ffffff 100%)',
        }}
      />
      <div className="grid-bg pointer-events-none absolute inset-0 z-0 opacity-30 [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_68%)]" />

      {/* Редизайн 06.08.2026: без чат-демо, всё по центру одной колонкой. */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-5 text-center md:px-8">
        <div className="mb-8 flex max-w-full shrink-0 items-center gap-2.5 rounded-full border border-line bg-surface/70 px-4 py-2">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verify opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-verify" />
          </span>
          <span className="text-fine font-medium text-fog">{hero.badge}</span>
        </div>

        {/* SplitText (react-bits, GSAP) — появление h1 по буквам, не по
            словам: словное разбиение ломало перенос строк на узком экране
            (атомарные inline-block боксы наезжали друг на друга), поэтому
            строки уже разведены на отдельные <span className="block">.
            Разбивка по буквам (splitType="chars") здесь несовместима с
            Unbounded: у него глиф заметно шире, чем у Inter, и вторая фраза
            перестала помещаться в одну строку — при переносе ВНУТРИ одного
            SplitText-таргета атомарные inline-block-боксы букв налезали друг
            на друга между «строкой» переноса и следующей строкой заголовка.
            Разбивка по словам (splitType="words") — те же слова остаются
            целыми блоками, поэтому браузер переносит их как обычный текст,
            без наложения.
            Решение владельца 06.08.2026: заголовок без градиента и без
            пер-строчного акцента — обе строки одним сплошным цветом,
            шрифт — Unbounded (--font-display), «вырезной» геометрический. */}
        {/* Композиция по референсу владельца «Tempting + Switzer», в русской
            локализации: первая строка — рукописный акцент (Marck Script —
            каллиграфический с родной кириллицей; сам Tempting кириллицы не
            имеет), вторая — тяжёлый гротеск Onest 800 (Switzer не имеет
            надёжной кириллицы и отсутствует на Google Fonts). Строки слегка
            перекрываются, как в референсе. */}
        <h1 className="w-full text-balance text-chalk">
          <span className="font-script -mb-2 block text-[clamp(1.5rem,1.2rem+1.5vw,2.25rem)] font-medium text-fog md:-mb-4">{hero.title}</span>
          <span className="block font-display text-[clamp(2.375rem,1.75rem+3vw,4rem)] leading-[1.06] font-extrabold tracking-tight">
            <SplitText
              text={hero.titleAccent}
              tag="span"
              className="block"
              splitType="words"
              delay={40}
              duration={0.7}
              ease="power3.out"
              from={{ opacity: 0, y: 34 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.05}
              rootMargin="0px"
              textAlign="center"
            />
          </span>
        </h1>

        {/* Один связный абзац вместо пилюль — формат по референсу владельца
            (06.08.2026): крупный заголовок + один подзаголовок-абзац под ним. */}
        <Reveal delay={0.4} className="w-full">
          <p className="mx-auto mt-6 max-w-[52ch] text-lead font-normal text-fog">{hero.subtitle}</p>
        </Reveal>

        <Reveal delay={0.6} className="w-full">
          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
            {/* Блик-свип снят: он был у трёх кнопок из восьми одинаковых на
                вид, и пользователь видел один и тот же элемент с разным
                поведением. Теперь блик остался ровно на одной кнопке — той,
                которая списывает деньги (Checkout). Здесь — общее для всех
                кнопок страницы состояние: подъём + тень + осветление, вместо
                прежнего «кнопка просто выцвела». */}
            <a
              href="#agents"
              className="press rounded-xl bg-signal px-6 py-4 text-center text-body font-semibold whitespace-nowrap text-ink hover:-translate-y-0.5 hover:bg-signal-soft hover:shadow-[0_12px_28px_-14px_rgba(185,190,199,0.85)]"
            >
              {hero.primaryCta}
            </a>

            {/* Решение владельца 07.08.2026: кнопка больше не уводит в WhatsApp,
                а ведёт в секцию «Ворота» (#gate). Логика — человек на первом
                экране ещё не знает, что покупает, и диалог в мессенджере
                начинался с объяснений вместо продажи. Теперь между «хочу» и
                «пишу» стоят три довода и кнопка оплаты.
                Ссылка внутренняя, поэтому без target="_blank" и без
                trackWhatsAppClick: событие Contact на переход внутри страницы
                испортило бы статистику пикселя. */}
            <a
              href={hero.secondaryHref}
              className="flex items-center justify-center gap-2.5 rounded-xl border border-line bg-surface/60 px-6 py-4 text-body font-medium whitespace-nowrap text-chalk transition-colors hover:border-verify/50 hover:bg-surface-2"
            >
              <span className="bolt-pulse text-verify">
                <Bolt />
              </span>
              {hero.secondaryCta}
            </a>
          </div>
        </Reveal>
      </div>

      {/* Плитка цифр (3 дня / 12 / ~1 час / 0 паролей) удалена 14.08.2026 по
          запросу владельца: «слишком поверхностные, ничего не дают». Слот
          зарезервирован под настоящие цифры эффекта после первых аудитов —
          придумывать их нельзя, красная линия №6. CountUp остаётся в
          components/reactbits и подключится обратно одной строкой. */}

      {/* Растворение чёрного героя в белую страницу — «плавный переход:
          чёрный, а дальше белый». Полоса лежит поверх призмы (z-10). */}
    </section>
  );
}

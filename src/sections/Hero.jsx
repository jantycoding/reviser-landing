import Reveal from '../components/ui/Reveal';
import SplitText from '../components/reactbits/SplitText';
import FloatingLines from '../components/reactbits/FloatingLines';
import { hero, stats, contacts } from '../content/site';

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
    <section id="top" className="relative w-full bg-ink clip-x pt-32 pb-4 md:pt-40 md:pb-8">
      {/* Фон первого экрана — FloatingLines (react-bits, WebGL через three),
          решение владельца 06.08.2026, заменил Orb. Палитра линий —
          серебро → белый → тёмная синева («Metal Noir»), не дефолтные
          розовый/синий из исходника react-bits. На мобильном (≤767px)
          компонент сам рисует один статичный кадр без rAF-цикла — тот же
          приём, что и в Orb/GradientWaves, там же объяснение почему. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[90vh] opacity-90">
        <FloatingLines
          enabledWaves={['top', 'middle', 'bottom']}
          lineCount={[10, 15, 20]}
          lineDistance={[8, 6, 4]}
          bendRadius={5.0}
          bendStrength={-0.5}
          interactive
          parallax
          linesGradient={['#e4e7ec', '#b9bec7', '#4d84bf']}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[90vh]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 35%, rgba(0,0,0,0.6) 75%, var(--color-ink) 100%)',
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
        <h1 className="w-full font-display text-h1 font-bold text-balance text-chalk">
          <span className="block">
            <SplitText
              text={hero.title}
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
          <span className="mt-1 block">
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

            {/* Живое демо: заявки принимает наш же агент. Лучшее доказательство продукта. */}
            <a
              href={`https://wa.me/${contacts.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 rounded-xl border border-line bg-surface/60 px-6 py-4 text-body font-medium whitespace-nowrap text-chalk transition-colors hover:border-verify/50 hover:bg-surface-2"
            >
              <span className="text-verify">
                <Bolt />
              </span>
              {hero.secondaryCta}
            </a>
          </div>
        </Reveal>
      </div>

      <div className="relative mx-auto mt-stack w-full max-w-6xl px-5 md:px-8">
        <Reveal delay={0.1}>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
            {stats.map(stat => {
              // «~30 сек» читается как одно длинное число и съедает кегль на 390px.
              // Разносим: значение — метрикой, единица — мелким нейтральным.
              const [value, ...rest] = String(stat.display).split(' ');
              const unit = rest.join(' ');
              return (
                <div key={stat.label} className="bg-ink-2 px-5 py-7 text-center md:py-8">
                  <dt className="flex items-baseline justify-center gap-1.5 font-mono whitespace-nowrap">
                    <span className="text-metric font-semibold text-chalk">{value}</span>
                    {unit && <span className="text-fine text-mist">{unit}</span>}
                  </dt>
                  <dd className="mt-2.5 text-fine leading-snug text-fog">{stat.label}</dd>
                </div>
              );
            })}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

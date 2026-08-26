import CardSwap, { Card } from '../components/reactbits/CardSwap';
import Reveal from '../components/ui/Reveal';
import { Section, Eyebrow, SectionTitle, SectionLead } from '../components/ui/Section';
import { useLeadModal } from '../lib/leadModal';
import useScreenSize from '../lib/useScreenSize';
import { gate } from '../content/site';

/**
 * Поворотная точка воронки: до этого блока продавали агентов,
 * после — продаём аудит как обязательный первый шаг.
 *
 * Здесь же — первое осмысленное появление цены. Согласие человека («да,
 * наугад ставить нельзя») максимально именно в конце трёх аргументов, и
 * тратить его на прокрутку ещё трёх экранов до первой кнопки нельзя:
 * сразу после доводов идут обе цифры и переход на #checkout.
 */
export default function Gate() {
  const { open: openLead } = useLeadModal();
  /* Размеры стопки под экран. Не масштаб, а другие числа — почему именно
     так, подробно в lib/useScreenSize.js. */
  const stack = useScreenSize({
    phone: w => ({ width: Math.min(w - 92, 330), height: 250, dx: 26, dy: 28 }),
    tablet: { width: 440, height: 290, dx: 42, dy: 46 },
    desktop: { width: 550, height: 330, dx: 55, dy: 60 },
  });

  return (
    <Section id="gate">
      {/* Подложка: поворотная секция должна читаться как один довод, а не как
          три подписи в пустоте, иначе её проскакивают на скролле. */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface/40 p-6 sm:p-8 md:p-10">
        {/* Раскладка 26.08.2026 (запрос владельца: «здесь нет ничего
            интересного»). Три довода переехали в стопку CardSwap справа,
            слева осталась мысль секции и выход в оплату.

            ЧТО ЭТО СТОИТ, ЧЕСТНО. Раньше все три довода читались одним
            взглядом. Теперь спереди всегда один, остальные два видны краем и
            выходят вперёд по очереди — каждые три секунды. Человек, который
            торопится, прочитает один довод вместо трёх. Взамен секция
            перестала быть плоской таблицей, а сами доводы короткие и
            равнозначные: любой из трёх работает сам по себе.

            Порядок в разметке — довод 01 первым, поэтому он же спереди
            в первый момент. */}
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,640px)]">
          <div>
            <Reveal>
              <Eyebrow>{gate.eyebrow}</Eyebrow>
              <SectionTitle>{gate.title}</SectionTitle>
              <SectionLead>{gate.subtitle}</SectionLead>
            </Reveal>

            {/* Текстовый дубль стопки — для скринридера и для случая, когда
                JS не выполнился. Карточки справа помечены aria-hidden: они
                показывают ровно этот же текст, и без дубля человек с
                экранным диктором услышал бы содержимое трижды подряд в
                перемешанном порядке. */}
            <ul className="sr-only">
              {gate.reasons.map(reason => (
                <li key={reason.n}>
                  {reason.title}. {reason.text}
                </li>
              ))}
            </ul>

            {/* Выход в оплату переехал под текст, в левую колонку: он вывод из
                доводов, а не подпись под всей секцией. Раньше кнопка стояла
                поперёк рамки, и стопка карточек ложилась прямо на неё. */}
            <Reveal delay={0.12}>
              <div className="mt-9 flex flex-col items-start gap-3">
                <a
                  href={gate.ctaHref}
                  onClick={event => {
                    event.preventDefault();
                    openLead('ворота');
                  }}
                  className="press group relative block w-full max-w-[26rem] overflow-hidden rounded-2xl bg-signal px-6 py-5 text-center text-lead font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-20px_rgba(185,190,199,0.95)]"
                >
                  <span className="relative z-10">{gate.cta}</span>
                  {/* Тот же блик, что на кнопке оплаты в #checkout. Он остался
                      ровно на двух кнопках страницы — тех, что ведут к деньгам. */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                </a>
                <span className="text-fine text-mist">{gate.ctaNote}</span>
              </div>
            </Reveal>
          </div>

          {/* Высота задана контейнеру, потому что сама стопка позиционируется
              абсолютно и из потока выпадает: без этого следующий блок
              наехал бы на карточки. */}
          <div
            aria-hidden="true"
            className="relative h-[300px] w-full sm:h-[420px] lg:h-[480px]"
          >
            {/* Правки 26.08.2026 по замечаниям владельца:
                — карточки крупнее на 10% (400×264 → 440×290), контейнер под
                  них подрос на 5%, иначе нижняя карточка упиралась в край;
                — наклон 4° вместо 6°: при большем размере тот же угол
                  читался как перекос вёрстки, а не как приём;
                — карточки ещё на 25% шире (440 → 550): владелец сказал
                  «слишком маленькая»;
                — пауза между сменами 4 с, и это не «сделал длиннее».
                  Сама анимация с упругой кривой идёт около 2,5 с. При паузе
                  2,2 с следующая смена стартовала раньше, чем заканчивалась
                  предыдущая: стопка не останавливалась никогда, и нажатие на
                  неё не давало никакого отклика — двигалось и до нажатия.
                  Теперь после каждой смены есть полторы секунды покоя, и
                  клик читается как клик. */}
            <CardSwap
              width={stack.width}
              height={stack.height}
              cardDistance={stack.dx}
              verticalDistance={stack.dy}
              delay={4000}
              skewAmount={4}
              pauseOnHover
            >
              {gate.reasons.map(reason => (
                <Card key={reason.n} className="flex flex-col justify-center p-5 sm:p-7 md:p-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface-2 font-mono text-fine font-semibold text-fog tabular-nums">
                    {reason.n}
                  </div>
                  <h3 className="mt-5 text-h3 font-semibold text-chalk">{reason.title}</h3>
                  <p className="mt-2.5 text-body text-fog">{reason.text}</p>
                </Card>
              ))}
            </CardSwap>
          </div>
        </div>

      </div>
    </Section>
  );
}

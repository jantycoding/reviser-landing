import DepthCarousel from '../components/reactbits/DepthCarousel';
import useScreenSize from '../lib/useScreenSize';
import Reveal from '../components/ui/Reveal';
import { Section, Eyebrow, SectionTitle, SectionLead } from '../components/ui/Section';
import { audit, headerCta } from '../content/site';

/** Разряды числа и знак валюты склеиваются неразрывными пробелами: иначе
 *  «Аудит бизнеса за 14 990 ₸» рвётся на «за 14 / 990 ₸» — цена в заголовке
 *  главного продукта разъезжается по двум строкам. Текст не меняется. */
const bindNumbers = s => String(s).replace(/(\d)\s(?=\d)/g, '$1 ').replace(/\s₸/g, ' ₸');

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-verify" fill="none" aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Заголовок колонки. Номер — тем же кружком, что в «Воротах» и «Как
 *  проходит»: один паттерн счёта на всю страницу. */
function ColumnTitle({ n, children }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface font-mono text-label font-semibold text-fog tabular-nums"
        aria-hidden="true"
      >
        {n}
      </span>
      <h3 className="text-fine font-semibold text-chalk">{children}</h3>
    </div>
  );
}

/**
 * Направления аудита — роадмап (14.08.2026, запрос владельца: «центрировано,
 * направление идёт друг за другом»).
 *
 * Вертикальный ствол по центру (на телефоне — слева), направления нанизаны
 * на него зигзагом и проявляются по одному со ступенчатой задержкой. Сверху —
 * узел входа, снизу — чёрная капсула «Отчёт на 3-й рабочий день»: путь
 * заканчивается тем, за что человек платит.
 */
function AreasMap({ areas }) {
  return (
    <div className="relative mx-auto mt-10 max-w-3xl">
      {/* Узел входа */}
      <div className="relative z-10 mb-6 flex justify-center">
        <span className="rounded-full border border-line bg-surface px-5 py-2.5 font-mono text-label tracking-[0.14em] text-fog uppercase">
          Аудит · {areas.length} направлений
        </span>
      </div>

      {/* Ствол. Слева на телефоне, по центру с md. */}
      <span
        aria-hidden="true"
        className="absolute top-14 bottom-16 left-[9px] w-px bg-line-2 md:left-1/2 md:-translate-x-1/2"
      />

      <ol className="space-y-1.5">
        {areas.map((area, i) => {
          const right = i % 2 === 1;
          return (
            <Reveal key={area} as="li" delay={Math.min(i * 0.045, 0.4)} className="relative list-none">
              {/* Узел на стволе */}
              <span
                aria-hidden="true"
                className="absolute top-1/2 left-[5px] z-10 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-line-2 bg-ink md:left-1/2 md:-translate-x-1/2"
              />
              {/* СОЕДИНИТЕЛЬ — то, чего не хватало. Раньше подпись висела в
                  сорока пикселях от ствола, ничем с ним не связанная, и глазу
                  не за что было зацепиться: двенадцать строк читались как
                  список, а не как карта. Теперь от узла к плашке идёт
                  короткая горизонтальная линия — ветка. */}
              <span
                aria-hidden="true"
                className={`absolute top-1/2 h-px w-5 bg-line-2 md:w-8 ${
                  right ? 'left-[9px] md:left-1/2' : 'left-[9px] md:right-1/2 md:left-auto'
                }`}
              />
              <div
                className={`py-1 pl-9 md:w-1/2 md:py-1.5 ${
                  right ? 'md:ml-auto md:pl-10' : 'md:pr-10 md:pl-0 md:text-right'
                }`}
              >
                {/* Плашка вместо голого текста: у направления появляется
                    граница, и взгляд получает конечную точку ветки. */}
                <span className="inline-block rounded-lg border border-line bg-ink px-3 py-1.5 text-fine text-fog transition-colors hover:border-line-2 hover:text-chalk">
                  {area}
                </span>
              </div>
            </Reveal>
          );
        })}
      </ol>

      {/* Финал пути */}
      <Reveal delay={0.5}>
        <div className="relative z-10 mt-6 flex justify-center">
          <span className="rounded-full bg-signal px-5 py-2.5 text-fine font-medium text-ink">
            Отчёт на 3-й рабочий день
          </span>
        </div>
      </Reveal>
    </div>
  );
}

export default function Audit() {
  /* Размеры сцены под экран — та же причина, что у стопки в «Воротах»:
     компонент из библиотеки на узком экране ужимает карточку вместе с
     текстом внутри. Подробно — в lib/useScreenSize.js. */
  /* arrows: на телефоне стрелки выключены — карточка занимает почти всю
     ширину экрана, и кнопки ложились прямо на текст. Пальцем там листать
     удобнее, а точки внизу показывают, сколько карточек осталось. */
  const deck = useScreenSize({
    phone: w => ({ width: Math.min(w - 64, 320), height: 300, spread: 26, depth: 130, arrows: false }),
    tablet: { width: 480, height: 330, spread: 110, depth: 170, arrows: true },
    desktop: { width: 640, height: 380, spread: 168, depth: 200, arrows: true },
  });

  return (
    /* tight: «Ворота → Аудит» — один аргумент, а не два отдельных блока. */
    <Section id="audit">
      {/* Правый столбец с параметрами («3 рабочих дня / 12 направлений /
          ~1 час вашего времени / CRM не обязательна») снят по запросу
          владельца 08.08.2026. Три пункта из четырёх дословно повторяли
          подзаголовок секции, стоя в двух сантиметрах от него.
          Единственный уникальный — «CRM не обязательна»; он снимает реальное
          возражение половины аудитории (автомойки, пекарни, салоны без CRM),
          и его место — в FAQ, откуда его сюда и подняли. */}
      {/* Заголовок этой секции центрирован (запрос владельца 26.08.2026):
          дальше по центру идёт карусель, и левовыключенный заголовок над ней
          заставлял глаз прыгать с края на середину и обратно. Остальные
          секции страницы остаются левовыключенными — здесь исключение
          оправдано тем, что содержимое секции тоже по центру. */}
      <Reveal className="mx-auto max-w-3xl text-center blur-in">
        <Eyebrow>{audit.eyebrow}</Eyebrow>
        <SectionTitle>{bindNumbers(audit.title)}</SectionTitle>
        <SectionLead className="mx-auto">{audit.subtitle}</SectionLead>
      </Reveal>


      {/* Что на выходе — поднято выше направлений и укрупнено (запрос
          владельца 08.08.2026). Человек платит не за «12 направлений»,
          а за четыре документа на выходе; раньше они лежали мелким списком
          в правой колонке, ниже перечня того, что мы смотрим. */}
      <div className="mt-stack">
        <Reveal>
          {/* justify-center + маленький отступ до карусели: подпись должна
              стоять НАД карточкой, а не в другом углу экрана от неё. */}
          <div className="flex justify-center">
            <ColumnTitle n="01">Что получаете на выходе</ColumnTitle>
          </div>
        </Reveal>

        {/* DepthCarousel (react-bits), 26.08.2026 по запросу владельца.
            Настройки правились 26.08.2026 по замечаниям владельца, от
            исходного примера библиотеки отличаются четырьмя числами:

            — spread 185 → 120 → 168. Промежуточное значение продержалось
              недолго: после того как карточка выросла до 640 пикселей,
              смещения в 120 стало не хватать — задняя карточка почти
              накрывала переднюю, и её край резал текст пополам. Разброс
              должен расти вместе с шириной карточки, иначе стопка
              превращается в кашу;
            — tilt 22° → 30°: угол шире, видно ребро карточки, стопка
              выглядит уходящей вглубь, а не разложенной веером вбок;
            — карточка 420×260 → 676×390: росла в три захода по просьбам
              владельца, суммарно шире исходной на 60%;
            — visibleCards 3 → 2 и falloff 0.12 → 0.04. Это правка про
              «сзади появляется лишняя карточка, как будто чужая». Затемнение
              на светлой странице читается не как глубина, а как грязь:
              четвёртая карточка становилась серым пятном позади белых.
              Теперь в глубину уходят две, и почти не темнея — расстояние
              показывают размытие и смещение, а не серый цвет;
            — duration 400 → 950 мс и кривая power2.inOut вместо power3.out.
              Вот это была не косметика. При 400 мс с power3.out три четверти
              пути проходят за первые 150 мс — глаз видит скачок, а не
              перелистывание; замерено покадрово, за 200 мс карточка уходила
              с 0 на 220 по оси Z. Дело не только в длительности: у кривой
              «out» скорость максимальна в первом кадре, поэтому движение
              всегда начинается рывком. У «inOut» разгон и торможение
              симметричны — карточка трогается с места плавно.

            ЧТО ЭТО СТОИТ, ЧЕСТНО. Здесь лежат четыре документа, за которые
            человек платит, и раньше он видел все четыре сразу. Теперь в фокусе
            один, остальные уходят в глубину и подменяются каждые 3,2 секунды.
            Автолистание к тому же уносит карточку, которую человек ещё читает.
            Если после запуска рекламы окажется, что до оплаты доходит меньше
            людей, чем сейчас, — начинать откат стоит с этого блока: сетка
            из четырёх карточек вернётся одной правкой.

            Слайд здесь — не картинка, а разметка (поле `content`). Ветка с
            изображениями в компоненте сохранена: когда появятся развороты
            настоящего отчёта, они встанут сюда без правок. */}
        {/* clip-x, иначе на 390px страница уезжает вбок на 31 пиксель:
            карточка карусели шире экрана по замыслу (420px), а компонент
            рассчитан на то, что её края обрежет контейнер. Проверено:
            без обрезки window.scrollTo(500,0) даёт scrollX = 31. */}
        <div className="mt-3 h-[430px] w-full clip-x sm:h-[520px]">
          <DepthCarousel
            items={audit.outputs.map(out => ({
              alt: out.title,
              content: (
                /* justify-start, а не justify-center — правка 26.08.2026.
                   При центрировании по вертикали заголовок каждой карточки
                   вставал на своей высоте: у «Карты потерь» описание в две
                   строки, у «Что чинить руками» — в четыре, и на
                   перелистывании текст прыгал вверх-вниз. Владелец назвал
                   это «разными интервалами от контейнера». Теперь у всех
                   четырёх карточек одинаковый отступ сверху и заголовки
                   стоят на одной линии. */
                <div className="flex h-full flex-col justify-start p-7 sm:p-9 md:p-10">
                  <div className="flex items-start gap-3">
                    <span className="mt-[0.35em]">
                      <Check />
                    </span>
                    {/* Кегль поднят: было text-card (17px) у заголовка и
                        text-fine (15px) у описания — на карточке шириной
                        640 пикселей это выглядело подписью к пустоте.
                        Начертание bold: заголовок должен читаться первым,
                        это перечень того, за что человек платит. */}
                    <div className="text-h3 font-bold text-chalk">{out.title}</div>
                  </div>
                  <p className="mt-4 max-w-[46ch] text-lead text-fog">{out.text}</p>
                </div>
              ),
            }))}
            depth={deck.depth}
            spread={deck.spread}
            tilt={30}
            tiltDirection="right"
            perspective={1850}
            autoScale={false}
            showControls={deck.arrows}
            visibleCards={2}
            falloff={0.04}
            blur={1.5}
            autoplay
            loop
            cardWidth={deck.width}
            cardHeight={deck.height}
            radius={13}
            tint="#ffffff"
            duration={950}
            ease="power2.inOut"
            autoplayDelay={4200}
          />
        </div>

        {/* Тот же список текстом — для скринридера и для случая, когда JS не
            выполнился: карусель без него не покажет ничего, а это перечень
            того, за что берут деньги. */}
        <ul className="sr-only">
          {audit.outputs.map(out => (
            <li key={out.title}>
              {out.title}. {out.text}
            </li>
          ))}
        </ul>
      </div>

      {/* Что смотрим */}
      <div className="mt-stack">
        <Reveal>
          <ColumnTitle n="02">Что смотрим</ColumnTitle>
        </Reveal>
        <Reveal delay={0.06}>
          <AreasMap areas={audit.areas} />
        </Reveal>
      </div>
    </Section>
  );
}

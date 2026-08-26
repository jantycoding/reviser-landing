import DepthCarousel from '../components/reactbits/DepthCarousel';
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

            — spread 185 → 120: карточки стояли слишком широко и читались
              как три отдельных объекта, а не как одна стопка;
            — tilt 22° → 30°: угол шире, видно ребро карточки, стопка
              выглядит уходящей вглубь, а не разложенной веером вбок;
            — карточка 420×260 → 588×340: за два захода стала шире на 40%,
              последние 25% — по прямой просьбе владельца;
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
        <div className="mt-3 h-[430px] w-full clip-x sm:h-[470px]">
          <DepthCarousel
            items={audit.outputs.map(out => ({
              alt: out.title,
              content: (
                <div className="flex h-full flex-col justify-center p-7 md:p-8">
                  <div className="flex items-center gap-2.5">
                    <Check />
                    <div className="text-card font-medium text-chalk">{out.title}</div>
                  </div>
                  <p className="mt-3 text-fine text-fog">{out.text}</p>
                </div>
              ),
            }))}
            depth={200}
            spread={120}
            tilt={30}
            tiltDirection="right"
            perspective={1850}
            visibleCards={3}
            falloff={0.12}
            blur={1}
            autoplay
            loop
            cardWidth={588}
            cardHeight={340}
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

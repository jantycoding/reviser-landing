import Reveal from '../components/ui/Reveal';
import { Section, Eyebrow, SectionTitle } from '../components/ui/Section';
import { agents } from '../content/site';

/**
 * Что умеют агенты — сетка коротких карточек.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * История блока, чтобы никто не откатил его по кругу третий раз:
 *
 * 06.08 — плоская решётка заменена на ScrollStack (липкая стопка).
 * 25.08 (утро) — ScrollStack снят: секция занимала 4430px при 240px текста
 *   в карточке, и две соседние карточки нельзя было увидеть одновременно.
 * 25.08 (вечер) — владелец: «полностью убрал — мне это не нравится, верни
 *   анимацию, но переоформи в минималистичном виде по референсу».
 *
 * Итог: формат карточки взят с присланного референса (иконка в мягком
 * квадрате, заголовок, одна строка пояснения), анимация вернулась — но не
 * липкой стопкой, а каскадом появления при входе секции в кадр. Разница
 * принципиальна: каскад стоит 0px дополнительной прокрутки, стопка стоила
 * четыре экрана.
 *
 * Тексты сокращены до ОДНОГО предложения каждый (запрос владельца). Правило
 * для будущих правок: если предложение не помещается в две строки на 390px —
 * оно слишком длинное для этого формата.
 *
 * Стрелки «→» с референса намеренно не перенесены. Там карточки — ссылки на
 * страницы разделов, у нас переходить некуда: стрелка обещала бы действие,
 * которого нет. Это тот же класс ошибки, что кнопка, которая никуда не ведёт.
 * ──────────────────────────────────────────────────────────────────────────
 */

/* Иконки — инлайновый SVG, а не иконочный шрифт и не пакет: шесть штук по
   ~200 байт дешевле любой зависимости, красятся currentColor и наследуют
   тему. stroke-width 1.6 — тонкая линия, как в референсе. */
const ICONS = {
  inbox: (
    <>
      <path d="M3 13h4l1.5 2.5h7L17 13h4" />
      <path d="M4.5 6.5h15l1.5 6.5v4a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17v-4z" />
    </>
  ),
  repeat: (
    <>
      <path d="M4 9a5 5 0 0 1 5-5h11" />
      <path d="M17 1.5 20.5 4 17 6.5" />
      <path d="M20 15a5 5 0 0 1-5 5H4" />
      <path d="M7 17.5 3.5 20 7 22.5" />
    </>
  ),
  star: (
    <path d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85z" />
  ),
  phone: (
    <>
      <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z" />
    </>
  ),
  report: (
    <>
      <path d="M6 3.5h9l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1-1.5z" />
      <path d="M14.5 3.5V8H19" />
      <path d="M8.5 13h7M8.5 16.5h4.5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 16.5v-4M12.5 16.5v-8M17 16.5v-5.5" />
    </>
  ),
};

function Icon({ name }) {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-fog">
      <svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {ICONS[name] ?? ICONS.inbox}
      </svg>
    </span>
  );
}

export default function Agents() {
  return (
    <Section id="agents">
      <Reveal className="max-w-3xl blur-in">
        <Eyebrow>{agents.eyebrow}</Eyebrow>
        <SectionTitle>{agents.title}</SectionTitle>
      </Reveal>

      <ul className="mt-stack grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agents.items.map((item, i) => (
          /* Каскад: задержка растёт по индексу, но упирается в потолок.
             Без потолка последняя карточка ждала бы почти секунду после
             первой — на телефоне, где в кадре сразу две-три карточки, это
             читается не как каскад, а как подвисание.
             as="li" — не косметика: Reveal по умолчанию рисует <div>, а <div>
             прямым ребёнком <ul> делает разметку невалидной и ломает список
             для скринридера. */
          <Reveal
            key={item.name}
            as="li"
            delay={Math.min(i * 0.07, 0.35)}
            className="h-full rounded-2xl border border-line bg-ink p-5 transition-colors hover:border-line-2 md:p-6"
          >
            <Icon name={item.icon} />
            <h3 className="mt-4 text-card font-semibold text-chalk">{item.name}</h3>
            <p className="mt-1.5 text-fine text-mist">{item.text}</p>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}

import Reveal from '../components/ui/Reveal';
import { Section, Eyebrow } from '../components/ui/Section';
import FoldText from '../components/reactbits/FoldText';
import ScrollStack, { ScrollStackItem } from '../components/reactbits/ScrollStack';
import { agents } from '../content/site';

/**
 * Главный «разогревающий» блок страницы.
 * Задача — показать конкретику: что именно агент делает руками вместо человека.
 * Абстрактное «ИИ для бизнеса» здесь не работает, инстаграм им уже забит.
 *
 * Редизайн 06.08.2026 (решение владельца): плоская решётка карточек заменена
 * на ScrollStack (react-bits) — карточки складываются друг на друга внутри
 * своей локальной прокручиваемой области, а не текут в общем потоке страницы.
 * Заголовок остаётся ОБЫЧНЫМ элементом секции, ВНЕ ScrollStack — со своим
 * FoldText-эффектом (переворот по словам при попадании во вьюпорт). Вступительный
 * абзац (`agents.subtitle`), «мостик» в конце (`agents.bridge`) и строка
 * «ВМЕСТО …» у каждой карточки (`item.replaces`) убраны тем же решением — их
 * больше нет в `site.js`, не восстанавливать по памяти из старых версий.
 */

export default function Agents() {
  return (
    <Section id="agents">
      <Reveal className="max-w-3xl">
        <Eyebrow>{agents.eyebrow}</Eyebrow>
        <h2 className="max-w-4xl text-pretty text-chalk sm:text-balance">
          <FoldText
            text={agents.title}
            splitBy="word"
            hinge="top"
            trigger="scroll"
            duration={0.6}
            stagger={0.05}
            ease="power3.out"
            perspective={800}
            creaseShading={0.45}
            fontSize="clamp(1.75rem, 1.33rem + 1.95vw, 3rem)"
            fontWeight={600}
            color="#ffffff"
          />
        </h2>
      </Reveal>

      {/* Локальная прокручиваемая область — своя высота, свой скролл (Lenis
          привязан к этому контейнеру, не к window, см. ScrollStack.jsx),
          страницу не трогает. */}
      <Reveal delay={0.1} className="mt-stack">
        <div style={{ height: '72vh', maxHeight: '640px' }}>
          <ScrollStack itemDistance={90} itemStackDistance={26} baseScale={0.88} rotationAmount={0} blurAmount={0}>
            {agents.items.map(item => (
              <ScrollStackItem key={item.name} itemClassName="bg-surface border border-line">
                <h3 className="text-card font-semibold text-chalk">{item.name}</h3>
                <p className="mt-3 text-body text-fog">{item.text}</p>
              </ScrollStackItem>
            ))}
          </ScrollStack>
        </div>
      </Reveal>
    </Section>
  );
}

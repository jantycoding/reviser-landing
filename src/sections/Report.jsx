import Reveal from '../components/ui/Reveal';
import AgentSwarm from '../components/agents/AgentSwarm';
import { Section, Eyebrow, SectionTitle, SectionLead } from '../components/ui/Section';
import { report } from '../content/site';

export default function Report() {
  return (
    <Section id="report">
      <Reveal className="max-w-3xl">
        <Eyebrow>{report.eyebrow}</Eyebrow>
        <SectionTitle>{report.title}</SectionTitle>
        <SectionLead>{report.subtitle}</SectionLead>
      </Reveal>

      {/* Живая демонстрация: бригада агентов разбирает бизнес по направлениям.
          Наведение на строку останавливает показ, клик ставит на паузу. */}
      <Reveal delay={0.08} className="mt-stack">
        <AgentSwarm />
      </Reveal>

      <Reveal delay={0.12}>
        {/* max-w-[62ch]: строка тянулась на всю ширину контента (1152px, ~110
            знаков — вдвое выше предела читаемости) и выглядела не как подпись к
            панели, а как оторвавшийся кусок текста. Это ровно та строка, которая
            по красной линии обязана быть прочитанной: пример демонстрационный. */}
        <p className="mt-5 max-w-[62ch] text-fine text-mist">{report.footnote}</p>
      </Reveal>
    </Section>
  );
}

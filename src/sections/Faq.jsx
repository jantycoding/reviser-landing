import { useState } from 'react';
import Reveal from '../components/ui/Reveal';
import { Section, Eyebrow, SectionTitle, SectionLead } from '../components/ui/Section';
import { faq, contacts } from '../content/site';

function Item({ item, index, isOpen, onToggle }) {
  const panelId = `faq-panel-${index}`;

  return (
    /* Подложка у раскрытого вопроса: без неё восемь одинаковых полосок не дают
       понять, где ты сейчас находишься, и открытый ответ визуально не связан
       со своим вопросом. */
    <div className={`-mx-4 border-b border-line px-4 transition-colors ${isOpen ? 'rounded-lg bg-surface/40' : ''}`}>
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="flex w-full items-center gap-4 py-6 text-left"
        >
          {/* max-w-[46ch]: строка вопроса кончается там же, где кончается текст,
              и «+» стоит сразу за ним. Раньше justify-between уносил плюс на
              700px вправо — связь «этот вопрос раскрывается» терялась. */}
          <span
            className={`max-w-[46ch] text-card font-medium transition-colors ${isOpen ? 'text-chalk' : 'text-chalk/85 hover:text-chalk'}`}
          >
            {item.q}
          </span>
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
              isOpen ? 'rotate-45 border-signal bg-signal/15 text-signal' : 'border-line text-mist'
            }`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </span>
        </button>
      </h3>

      {/* invisible в закрытом состоянии убирает панель из дерева доступности:
          до этого у свёрнутого ответа была реальная высота и computed opacity 1,
          скринридер читал подряд все ответы, а aria-expanded="false" ему врал.
          visibility внутри transition-all гаснет в конце анимации, поэтому
          сворачивание по-прежнему видно целиком. */}
      <div
        id={panelId}
        className={`grid transition-all duration-300 ease-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'invisible grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="max-w-[62ch] pr-10 pb-6 text-body text-fog">{item.a}</p>
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  // Первый вопрос открыт по умолчанию: секция снятия возражений при всех
  // закрытых пунктах несёт ноль информации до клика, а именно здесь человек
  // решает, платить ли. Открытый первый ответ показывает, что внутри.
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <Section id="faq">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_1fr] lg:gap-16">
        <Reveal>
          {/* Левая колонка больше не пустует: заголовок + лид + прямой контакт */}
          <div className="lg:sticky lg:top-28">
            <Eyebrow>{faq.eyebrow}</Eyebrow>
            <SectionTitle>{faq.title}</SectionTitle>
            <SectionLead>{faq.lead}</SectionLead>
            <a
              href={`https://wa.me/${contacts.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2.5 rounded-xl border border-line bg-surface px-5 py-3 text-body font-medium text-chalk transition-colors hover:border-line-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-verify" />
              Написать в WhatsApp
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="border-t border-line">
            {faq.items.map((item, i) => (
              <Item
                key={item.q}
                item={item}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

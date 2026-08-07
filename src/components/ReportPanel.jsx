import { report } from '../content/site';

const LEVEL_STYLE = {
  agent: 'border-signal/45 bg-signal/12 text-signal',
  manual: 'border-line-2 bg-surface-2 text-fog',
};

/** Курсор агента: стрелка + подпись. Двигается CSS-кейфреймами, только transform. */
function AgentCursor({ name, tone, animation, delay }) {
  const color = tone === 'signal' ? '#ff6b2c' : tone === 'verify' ? '#35d6a4' : '#f3f4f6';

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 hidden md:block"
      style={{ animation: `${animation} 14s ease-in-out ${delay}s infinite`, willChange: 'transform' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 16 18" className="h-4 w-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
        <path d="M1 1l13 6.2-5.6 1.6L6 16z" fill={color} stroke="#08090d" strokeWidth="1.1" strokeLinejoin="round" />
      </svg>
      <span
        className="mt-1 ml-3 inline-block rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold whitespace-nowrap"
        style={{ background: color, color: '#08090d' }}
      >
        {name}
      </span>
    </div>
  );
}

export default function ReportPanel() {
  const { panel, agentsOnPanel } = report;
  const anims = ['agent-1', 'agent-2', 'agent-3'];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-ink-2 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface/60 px-5 py-3.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
        </div>
        <div className="font-mono text-fine text-fog">{panel.company}</div>
        <div className="ml-auto flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full bg-verify"
            style={{ animation: 'soft-pulse 2.4s ease-in-out infinite' }}
          />
          <span className="font-mono text-label tracking-[0.12em] text-mist uppercase">{panel.caption}</span>
        </div>
      </div>

      <div className="border-b border-line px-5 py-3 font-mono text-label tracking-[0.1em] text-mist uppercase">
        {panel.meta}
      </div>

      <div className="relative">
        <div className="hidden grid-cols-[1fr_2.1fr_auto] gap-4 px-5 py-3 font-mono text-label tracking-[0.12em] text-mist uppercase sm:grid">
          {panel.columns.map((c, i) => (
            <div key={c} className={i === 2 ? 'text-right' : ''}>
              {c}
            </div>
          ))}
        </div>

        <ul>
          {panel.rows.map((row, i) => (
            <li
              key={row.area}
              className="relative grid grid-cols-1 gap-1 border-t border-line px-5 py-3.5 sm:grid-cols-[1fr_2.1fr_auto] sm:items-center sm:gap-4"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-signal/[0.07]"
                style={{ animation: `soft-pulse 14s ease-in-out ${i * 1.6}s infinite`, opacity: 0 }}
              />
              <span className="relative font-mono text-fine text-fog">{row.area}</span>
              <span className="relative text-body text-chalk">{row.finding}</span>
              <span
                className={`relative w-fit rounded-md border px-2 py-0.5 font-mono text-label font-medium tracking-[0.08em] uppercase sm:justify-self-end ${LEVEL_STYLE[row.level]}`}
              >
                {panel.levels[row.level]}
              </span>
            </li>
          ))}
        </ul>

        <div className="pointer-events-none absolute inset-0">
          {agentsOnPanel.map((a, i) => (
            <AgentCursor key={a.name} name={a.name} tone={a.tone} animation={anims[i % 3]} delay={i * 1.9} />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line bg-surface/40 px-5 py-3.5 text-fine text-mist">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal" />
          закрывает ИИ-агент
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-line-2" />
          чините своими силами
        </span>
      </div>
    </div>
  );
}

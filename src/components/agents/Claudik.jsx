/**
 * Клодик — маскот ИИ-агента.
 *
 * Пиксельная фигурка в духе Claude Code: прямоугольное тело, два боковых
 * выступа, квадратные глаза, три ножки. Рисуется как SVG, поэтому масштабируется
 * без потери резкости и красится через currentColor.
 *
 * Роль агента различается цветом и головным убором, а не формой —
 * так вся бригада читается как одна команда.
 */

const EYES = {
  // обычные квадратные глаза
  square: (
    <>
      <rect x="15" y="14" width="5.5" height="5.5" fill="currentColor" />
      <rect x="27.5" y="14" width="5.5" height="5.5" fill="currentColor" />
    </>
  ),
  // прищур «за работой» — как на стикере
  focused: (
    <>
      <path d="M14.5 14.5l4.5 2.5-4.5 2.5" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="square" />
      <path d="M33.5 14.5L29 17l4.5 2.5" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="square" />
    </>
  ),
  // довольный — работа сделана
  happy: (
    <>
      <path d="M14 18.5l2.5-3 2.5 3" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="square" />
      <path d="M29 18.5l2.5-3 2.5 3" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="square" />
    </>
  ),
};

const BODY = 'M8 4H40V12H46V26H40V40H33V31H28V40H20V31H15V40H8V26H2V12H8Z';

function Helmet() {
  return (
    <g>
      <path d="M14 0v-4c0-3.4 4.4-5.5 10-5.5S34 -7.4 34 -4V0Z" fill="#FFC24B" />
      <rect x="5" y="-0.5" width="38" height="4" rx="1.6" fill="#FFC24B" />
      <rect x="22.6" y="-9" width="2.8" height="9" fill="#E8A52F" />
    </g>
  );
}

function Headset() {
  return (
    <g>
      <path d="M6 4C6 -4 14 -9 24 -9s18 5 18 13" stroke="#E9EBF2" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <rect x="2" y="2" width="6" height="10" rx="2.4" fill="#E9EBF2" />
      <rect x="40" y="2" width="6" height="10" rx="2.4" fill="#E9EBF2" />
    </g>
  );
}

function Antenna() {
  return (
    <g>
      <rect x="22.8" y="-8" width="2.4" height="9" fill="currentColor" opacity="0.55" />
      <circle cx="24" cy="-9.5" r="3" fill="currentColor" />
    </g>
  );
}

const GEAR = { helmet: Helmet, headset: Headset, antenna: Antenna };

export default function Claudik({
  color = '#b9bec7',
  eyes = 'square',
  gear = null,
  size = 44,
  working = false,
  className = '',
  style,
}) {
  const Gear = gear ? GEAR[gear] : null;

  return (
    <svg
      viewBox="0 -14 48 58"
      width={size}
      height={(size * 58) / 48}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {/* мягкое свечение под фигуркой, чтобы читалась на тёмной панели */}
      <ellipse cx="24" cy="41" rx="15" ry="3.2" fill={color} opacity="0.22" />
      <g style={{ color }}>
        {Gear && <Gear />}
        <path d={BODY} fill={color} />
        {/* глаза вырезаны цветом фона панели */}
        <g style={{ color: '#1B1B2C' }}>{EYES[eyes] ?? EYES.square}</g>
      </g>
      {working && (
        <circle cx="42" cy="-4" r="3" fill={color}>
          <animate attributeName="opacity" values="0.25;1;0.25" dur="1.1s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

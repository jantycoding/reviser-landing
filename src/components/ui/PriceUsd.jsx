/**
 * Долларовый эквивалент рядом с ценой аудита.
 *
 * Зачем: «14 990 ₸» человек в Казахстане соотносит с обедом и баком бензина,
 * то есть с суммами, которые обдумывают. «$32» соотносится с подпиской — с
 * суммой, которую не обдумывают вообще. Одна и та же цена, две разные полки
 * в голове; вторая нам выгоднее.
 *
 * Почему verify, а не signal: signal по дизайн-системе значит «действие»,
 * и оранжевый... то есть серебряный акцент рядом с кнопкой создавал бы вторую
 * цель на экране. verify значит «подтверждено» — ровно то, чем эта цифра и
 * является: перепроверяемым пересчётом, а не рекламой.
 *
 * Блик проезжает раз в 4.5 секунды, а не по ховеру: на телефоне ховера нет,
 * а замечен бейдж должен быть именно там. Анимация — на transform, то есть
 * идёт на композиторе и не стоит ничего. При prefers-reduced-motion блик
 * отключается глобальным правилом в index.css.
 */
export default function PriceUsd({ children, className = '' }) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center overflow-hidden rounded-full border border-verify/45 bg-verify/10 px-3 py-1 font-mono text-fine font-semibold whitespace-nowrap text-verify ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <span aria-hidden="true" className="usd-shine pointer-events-none absolute inset-0" />
    </span>
  );
}

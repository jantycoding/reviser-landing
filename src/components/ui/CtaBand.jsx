import { useLeadModal } from '../../lib/leadModal';
import { cta } from '../../content/site';

/**
 * Полоса действия между секциями — 26.08.2026 (запрос владельца: «после
 * каждой секции большая кнопка, слева получить аудит, справа пример отчёта»).
 *
 * ЧЕСТНОЕ ПРЕДУПРЕЖДЕНИЕ, ОСТАВЛЕННОЕ В КОДЕ. Повторять одно и то же
 * предложение после каждой секции — приём с известной ценой: он поднимает
 * число нажатий и одновременно снижает доверие, потому что страница начинает
 * выглядеть навязчивой. Здесь полос ЧЕТЫРЕ, а не восемь: они стоят после
 * блоков, где у человека уже есть повод согласиться (доводы, состав аудита,
 * цены, ответы на возражения), и не стоят там, где он ещё не понял продукт.
 * Если после запуска рекламы окажется, что до оплаты доходит меньше людей —
 * убирать надо отсюда, а не из секций.
 *
 * `source` обязателен: он приезжает в заявку строкой «Откуда» и отвечает на
 * вопрос, какая полоса реально работает.
 */
export default function CtaBand({ source, title = cta.bandTitle, note = cta.bandNote }) {
  const { open } = useLeadModal();

  return (
    <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
      <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface/50 p-6 sm:p-7 md:flex-row md:items-center md:justify-between md:gap-8 md:p-8">
        <div className="min-w-0">
          <div className="text-card font-semibold text-chalk">{title}</div>
          <p className="mt-1.5 max-w-[52ch] text-fine text-fog">{note}</p>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => open(source)}
            className="press rounded-xl bg-signal px-6 py-3.5 text-center text-body font-semibold whitespace-nowrap text-ink transition-colors hover:bg-signal-soft"
          >
            {cta.primary}
          </button>

          {/* Вторая кнопка — пример отчёта. Ведёт в ту же секцию «что внутри
              аудита»: настоящего файла с разворотами отчёта пока нет, и
              подсовывать вместо него картинку-заглушку нельзя — это ровно тот
              случай, когда человек кликает за доказательством, а получает
              обещание. Как только появится PDF, здесь меняется один href. */}
          <a
            href={cta.secondaryHref}
            className="rounded-xl border border-line-2 px-6 py-3.5 text-center text-body font-medium whitespace-nowrap text-chalk transition-colors hover:bg-surface-2"
          >
            {cta.secondary}
          </a>
        </div>
      </div>
    </div>
  );
}

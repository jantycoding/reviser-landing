import Header from './components/Header';
import LeadModal from './components/LeadModal';
import CtaBand from './components/ui/CtaBand';
import { LeadModalProvider } from './lib/leadModal';
import Hero from './sections/Hero';
import Losses from './sections/Losses';
import Agents from './sections/Agents';
import Gate from './sections/Gate';
import Audit from './sections/Audit';
import Compare from './sections/Compare';
import Pricing from './sections/Pricing';
import Process from './sections/Process';
import Faq from './sections/Faq';
import Checkout from './sections/Checkout';
import Platforms from './sections/Platforms';
import Footer from './sections/Footer';

export default function App() {
  return (
    /* Провайдер оборачивает всё: кнопка заявки есть и в шапке, и в подвале,
       и между секциями — окно должно быть одно на всю страницу. */
    <LeadModalProvider>
      <Header />
      <main>
        {/*
          ОДНА СТРАНИЦА. Маршрутизация на /audit была сделана 26.08.2026 и
          в тот же день отменена владельцем. Не возвращать без прямого запроса.

          1  Hero      — заголовок про потерю денег
          2  Losses    — три цифры со ссылками на исследования
          3  Agents    — что именно делает агент
          4  Gate      — почему нельзя внедрять наугад
          5  Audit     — что внутри аудита, 12 направлений
          6  Compare   — выше цен: рамку сравнения задаём мы, а не конкурент
          7  Pricing   — три тарифа
          8  Platforms — к чему подключаемся
          9  Process   — как всё пройдёт
          10 Faq       — возражения
          11 Checkout  — оплата

          Между секциями стоят три полосы CtaBand — после «Ворот», после
          «Аудита» и после «Вопросов». Каждая передаёт свой ярлык источника,
          он виден в телеграме строкой «Откуда»: через месяц по нему будет
          понятно, какая полоса приносит заявки, а какая просто занимает
          экран. Их намеренно три, а не после каждой секции — почему,
          написано в components/ui/CtaBand.jsx.

          Platforms поднят из хвоста страницы 26.08.2026 (решение владельца).
          Причина видна из порядка чтения: человек только что увидел три цены
          и первым делом думает «а с моей-то CRM это заработает». Ответ должен
          стоять здесь, а не через четыре экрана после оплаты, где его читают
          уже только те, кто и так согласился.
        */}
        <Hero />
        <Losses />
        <Agents />
        <Gate />
        {/* Полоса после «Ворот»: человек только что согласился, что ставить
            агента наугад нельзя. Это первый момент страницы, когда предложение
            купить аудит перестаёт быть преждевременным. */}
        <CtaBand source="полоса после ворот" />
        <Audit />
        <Compare />
        {/* После состава аудита — второй момент: понятно, что внутри. */}
        <CtaBand source="полоса после аудита" />
        <Pricing />
        <Platforms />
        <Process />
        <Faq />
        {/* После возражений — последний, самый сильный: вопросы сняты. */}
        <CtaBand source="полоса после вопросов" />
        <Checkout />
      </main>
      <Footer />
      <LeadModal />
    </LeadModalProvider>
  );
}

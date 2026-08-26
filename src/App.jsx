import Header from './components/Header';
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
    <>
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
        <Audit />
        <Compare />
        <Pricing />
        <Platforms />
        <Process />
        <Faq />
        <Checkout />
      </main>
      <Footer />
    </>
  );
}

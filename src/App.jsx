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
          8  Process   — как всё пройдёт
          9  Faq       — возражения
          10 Checkout  — оплата
          11 Platforms — лента платформ, вне потока аргументов
        */}
        <Hero />
        <Losses />
        <Agents />
        <Gate />
        <Audit />
        <Compare />
        <Pricing />
        <Process />
        <Faq />
        <Checkout />
        <Platforms />
      </main>
      <Footer />
    </>
  );
}

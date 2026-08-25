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
          ПОРЯДОК СЕКЦИЙ, согласован с владельцем 25.08.2026.
          Прежний порядок начинался с возможностей продукта: человек с рекламы
          видел «что умеют агенты» и только на четвёртом экране — зачем ему это.
          На телефоне до четвёртого экрана доезжает меньшинство.

          1  Hero      — заголовок про потерю денег
          2  Losses    — три цифры со ссылками на исследования  ← НОВАЯ
          3  Agents    — что именно делает агент
          4  Gate      — почему нельзя внедрять наугад
          5  Audit     — что внутри аудита, 12 направлений
          6  Compare   — ПОДНЯТ выше цен: рамку сравнения задаём мы, а не
                         конкурент. Человек должен знать, с чем сравнивать,
                         ДО того как увидит цифру.
          7  Pricing   — цена после сравнения
          8  Process   — как всё пройдёт, снятие страха
          9  Faq       — возражения
          10 Checkout  — оплата
          11 Platforms — лента платформ УБРАНА ИЗ ПОТОКА вниз (решение
                         владельца: блок не доработан). На втором экране она
                         занимала место боли, а «мы подключаемся к amoCRM» —
                         это снятие возражения, а не аргумент.

          ЧЕРЕДОВАНИЕ ФОНА. tone="raised" стоит через одну секцию. Это и есть
          разделение блоков: до 25.08 все секции шли одним белым полотном без
          единой границы, и страница читалась как один длинный текст.
          Менять порядок — значит пересчитать чередование, иначе две соседние
          секции окажутся одного тона и снова слипнутся.
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

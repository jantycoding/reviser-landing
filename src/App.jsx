import Header from './components/Header';
import Hero from './sections/Hero';
import Agents from './sections/Agents';
import Platforms from './sections/Platforms';
import Gate from './sections/Gate';
import Audit from './sections/Audit';
import Process from './sections/Process';
import Pricing from './sections/Pricing';
import Compare from './sections/Compare';
import Faq from './sections/Faq';
import Checkout from './sections/Checkout';
import Footer from './sections/Footer';

export default function App() {
  return (
    <>
      <Header />
      <main>
        {/*
          Воронка страницы:
          1–3  желание   — что умеет агент, к чему подключается
          4    логика    — почему нельзя внедрить наугад
          5–6  доверие   — что в аудите, как он проходит
          7–10 действие  — цены, сравнение с альтернативами, возражения, оплата
        */}
        <Hero />
        <Agents />
        <Platforms />
        <Gate />
        <Audit />
        <Process />
        <Pricing />
        <Compare />
        <Faq />
        <Checkout />
      </main>
      <Footer />
    </>
  );
}

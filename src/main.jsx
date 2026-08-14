import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { initPixel } from './lib/track';

// React Scan подсвечивает лишние ре-рендеры. Только в dev и только локальным
// пакетом: скрипт с CDN в <head> грузился бы у каждого посетителя и в проде.
if (import.meta.env.DEV) {
  import('react-scan').then(({ scan }) => scan({ enabled: true }));
}

// Пиксель поднимается до рендера, чтобы PageView ушёл сразу. Если
// VITE_META_PIXEL_ID не задан — функция не делает ничего и на страницу не
// попадает ни одного стороннего запроса.
initPixel();

// Без <StrictMode>: он монтирует эффекты дважды, а часть компонентов react-bits
// строит анимацию в useEffect и на втором проходе дублирует состояние.
createRoot(document.getElementById('root')).render(<App />);

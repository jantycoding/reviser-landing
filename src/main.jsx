import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Без <StrictMode>: он монтирует эффекты дважды, а часть компонентов react-bits
// строит анимацию в useEffect и на втором проходе дублирует состояние.
createRoot(document.getElementById('root')).render(<App />);

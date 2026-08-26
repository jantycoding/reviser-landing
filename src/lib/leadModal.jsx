import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Одно окно заявки на всю страницу — 26.08.2026.
 *
 * ЗАЧЕМ КОНТЕКСТ, А НЕ ПО ОКНУ НА КНОПКУ. Кнопок, ведущих к заявке, на
 * странице девять: в шапке, в первом экране, в «Воротах», под каждым из трёх
 * тарифов, в полосах между секциями и внизу. Девять копий формы — это девять
 * мест, где может разойтись валидация, и девять мест, которые придётся
 * править при смене текста. Форма одна, живёт в корне приложения, а кнопки
 * только просят её открыть.
 *
 * ЗАЧЕМ ЗАПОМИНАТЬ ИСТОЧНИК. Вместе с окном открывающая кнопка передаёт свой
 * ярлык, он уезжает в заявку и виден в телеграме строкой «Откуда». Без этого
 * через месяц не ответить на вопрос, какая из девяти кнопок приносит деньги,
 * а какая просто занимает место.
 */

const LeadModalContext = createContext({
  isOpen: false,
  source: '',
  open: () => {},
  close: () => {},
});

export function LeadModalProvider({ children }) {
  const [state, setState] = useState({ isOpen: false, source: '' });

  const open = useCallback((source = 'неизвестно') => {
    setState({ isOpen: true, source });
  }, []);

  const close = useCallback(() => {
    setState(s => ({ ...s, isOpen: false }));
  }, []);

  const value = useMemo(() => ({ ...state, open, close }), [state, open, close]);

  return <LeadModalContext.Provider value={value}>{children}</LeadModalContext.Provider>;
}

export function useLeadModal() {
  return useContext(LeadModalContext);
}

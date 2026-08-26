import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Абсолютный адрес для og:image — 26.08.2026.
 *
 * ЗАЧЕМ. Мессенджеры не достраивают относительный путь до полного адреса:
 * WhatsApp получает «/og.png», не находит домена и отдаёт ссылку голым
 * текстом. Домен нельзя вписать в index.html руками — прод, превью-деплои и
 * локальная сборка живут на разных адресах, и вписанный намертво домен
 * ломал бы два из трёх.
 *
 * ОТКУДА БЕРЁТСЯ ДОМЕН. VERCEL_PROJECT_PRODUCTION_URL Vercel выставляет сам
 * на каждой сборке, включая превью-деплои, и держит там продакшн-домен
 * (короткий кастомный, иначе *.vercel.app), без «https://». Документация
 * прямо называет её пригодной для генерации адресов og-картинок. Ничего
 * добавлять в панель не нужно — переменная системная.
 *
 * SITE_URL перекрывает её: понадобится в день, когда домен переедет, а
 * настройки Vercel ещё не догонят.
 *
 * ЕСЛИ ПЕРЕМЕННОЙ НЕТ (локальная сборка, чужой хостинг) — подставляется
 * пустая строка, и в разметке остаётся «/og.png», ровно как было до правки.
 * Хуже не становится ни в одном сценарии.
 */
function ogAbsoluteUrl() {
  const raw = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || ''
  const base = raw ? (raw.startsWith('http') ? raw : `https://${raw}`).replace(/\/+$/, '') : ''
  return {
    name: 'reviser-og-absolute-url',
    transformIndexHtml(html) {
      return html.replaceAll('%OG_BASE%', base)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), ogAbsoluteUrl()],
  // Алиас нужен shadcn-реестру: компоненты React Bits приходят с импортами
  // вида `@/components/...`. Существующие относительные импорты не трогает.
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
})

# Скиллы штаба Reviser

Открывай `SKILL.md` нужного скилла ДО правки файлов, которые относятся к твоей задаче.
Базовый набор и правила использования — см. раздел 8 в `/root/build/BRIEF.md`.

## Проектные (уникальные для Reviser)

| Скилл | Откуда | Для какой роли |
|---|---|---|
| `reviser-landing` | внутренний | Все. Дизайн-система лендинга, структура воронки, три ловушки проекта. Обязателен всем. |
| `reviser-audit` | внутренний | Все, кто трогает тексты про разбор, панель отчёта, блок «что на выходе». Методика разбора за 9 900 ₸: 12 направлений, схема находки. |

## Дизайн, вёрстка, мотион

| Скилл | Откуда | Для какой роли |
|---|---|---|
| `frontend-design` | Anthropic (встроенный) | Композиция, типографика, избегание шаблонного «нейросетевого» дизайна. |
| `brand-guidelines` | Anthropic (встроенный) | Соблюдение бренд-палитры и тона (три цвета, никаких новых). |
| `theme-factory` | Anthropic (встроенный) | Работа с токенами темы. |
| `web-artifacts-builder` | Anthropic (встроенный) | Сборка веб-артефактов. |
| `ui-ux-pro-max` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT) | Дизайн. Поисковая база: 84 стиля, 192 цветовые палитры, 74 пары шрифтов, 98 UX-гайдлайнов. Python-скрипты только для поиска (stdlib, без сети/eval/subprocess), запись на диск — только с явным `--persist`. |

## Копирайт и конверсия

| Скилл | Откуда | Для какой роли |
|---|---|---|
| `doc-coauthoring` | Anthropic (встроенный) | Совместная работа над текстом. |
| `copywriting` | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT) | Копирайтеры. Продающий текст: ясность важнее остроумия, выгоды важнее фич, язык клиента, фреймворки текста. Правки `src/content/site.js`. |
| `cro` | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT) | Конверсия. Чек-лист CRO-анализа страницы: ценностное предложение за 5 секунд, иерархия CTA, трение, доверие. |
| `marketing-psychology` | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT) | Копирайт, конверсия. Каталог поведенческих моделей (якорение, decoy-эффект, неприятие потери) для работы с возражениями. |
| `ux-psychology` | [Nuclear-Marmalade/ux-psychology-skill](https://github.com/Nuclear-Marmalade/ux-psychology-skill) (MIT) | Дизайн + конверсия. 65 принципов психологии по типам страниц (hero, pricing, checkout) с code-level примерами «до/после» и явным списком запрещённых тёмных паттернов. |
| `pricing` | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT) | Блок `Pricing.jsx`. Якорение тарифов, чарм-прайсинг, чек-лист аудита страницы цен. |

## SEO и производительность

| Скилл | Откуда | Для какой роли |
|---|---|---|
| `seo-mastery` | [kpab/seo-mastery-agent-skills](https://github.com/kpab/seo-mastery-agent-skills) (MIT) | Техническое SEO, Core Web Vitals (LCP/INP/CLS с порогами), JSON-LD структурированные данные, чек-лист аудита сайта. |

## Доступность (a11y) и QA

| Скилл | Откуда | Для какой роли |
|---|---|---|
| `webapp-testing` | Anthropic (встроенный) | QA. Проверка в браузере. |
| `reviewing-a11y` | [masuP9/a11y-specialist-skills](https://github.com/masuP9/a11y-specialist-skills) (MIT) | QA/доступность. Практический ревью доступности страницы, кода компонентов или макетов с приоритезацией находок. |
| `auditing-wcag` | [masuP9/a11y-specialist-skills](https://github.com/masuP9/a11y-specialist-skills) (MIT) | QA/доступность. Формальный аудит WCAG 2.2 AA: Pass/Fail/NT/NA по каждому критерию с доказательствами. Перед финальной сдачей. |

## Документы и коммерческие материалы

| Скилл | Откуда | Для какой роли |
|---|---|---|
| `pdf` | Anthropic (встроенный) | Отчёт как PDF-продукт. |
| `docx`, `pptx`, `xlsx` | Anthropic (встроенный) | Коммерческие материалы. |

## Инфраструктура агентов и интеграции

| Скилл | Откуда | Для какой роли |
|---|---|---|
| `skill-creator` | Anthropic (встроенный) | Создание новых скиллов под процессы штаба. |
| `mcp-builder` | Anthropic (встроенный) | Коннекторы к CRM и рекламным кабинетам. |
| `claude-api` | Anthropic (встроенный) | Интеграции через Claude API. |

## Планирование и ревью решений

| Скилл | Откуда | Для какой роли |
|---|---|---|
| `grill-me` | [mattpocock/skills](https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me) (MIT) | **Обязателен в редизайнах лендинга** (прямой запрос заказчика). Тонкий триггер, запускает `/grilling` — см. ниже. |
| `grilling` | [mattpocock/skills](https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling) (MIT) | Методика, которую вызывает `grill-me`. Прогоняет план редизайна через раунды вопросов по «дереву решений» вместо того, чтобы молча предполагать — факты ищет сам через саб-агентов, у пользователя спрашивает только то, что решает он. |

---

Каждый скилл, установленный не из встроенного набора Anthropic, несёт рядом файл
`ATTRIBUTION.md` — источник, лицензия, дата установки, зачем он нам. Ничего из
скачанных скиллов не запускалось (`npm install`/`pip install`/скрипты) — это
только методички в `SKILL.md` и файлах `references/`.

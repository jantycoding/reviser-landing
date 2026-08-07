# ui-ux-pro-max

- Источник: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Автор: nextlevelbuilder (Next Level Builder)
- Лицензия: MIT
- Установлен: 2026-08-05, вся папка скилла целиком (SKILL.md + data + references + scripts)

## Зачем нам

База знаний по UI/UX с поиском: 84 стиля, 192 палитры, 74 пары шрифтов,
98 правил UX, 16 пресетов движения GSAP, правила по стеку React и Tailwind.
Используется отделом дизайна и критиками при выборе палитры, типографики,
композиции и анимации.

## Проверка безопасности перед установкой

Скрипты (`scripts/*.py`) читались глазами. Импортируют только стандартную
библиотеку: csv, json, os, re, sys, argparse, pathlib, math, collections,
datetime, io. Сети нет, `subprocess`, `eval`, `exec`, `pickle` нет. Запись на
диск — только в режиме `--design-system --persist`, который создаёт файл
дизайн-системы в указанном каталоге. Данные — обычные CSV.

## Как пользоваться

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "dark landing page" --stack react
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "deep violet palette" --domain color
```

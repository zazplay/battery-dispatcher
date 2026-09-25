# Battery Dispatcher — landing

**Live:** https://battery.azileon.cz/ — публикуется автоматически из ветки `main` (GitHub Actions → Pages, сайт отдаётся из корня домена).

У каждого языка свой адрес — эти ссылки и отправляют клиентам:
[/en/](https://battery.azileon.cz/en/) · [/cs/](https://battery.azileon.cz/cs/) · [/pl/](https://battery.azileon.cz/pl/) · [/uk/](https://battery.azileon.cz/uk/).
Корень без языка открывает сохранённый или браузерный язык и подставляет его в адрес.

React 19 + Vite + TypeScript + three.js. Презентация-визитка системы управления батареями солнечных станций «под ключ» — страница, которую отправляют клиентам (не основной сайт компании). Первый экран — 3D-макет станции (панели, накопители, ЛЭП, ИИ-контроллер) с живой симуляцией одного дня: цикл начинается с восхода, светлое время идёт 64 секунды, ночь прокручивается за 6.

## Запуск

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # проверка типов + сборка в dist/ + пререндер языковых страниц (готовый HTML для поисковиков)
npm run preview  # посмотреть собранную версию
```

## Структура

```
src/
  sim/day.ts            модель дня: цена, солнце, режимы (charge / sell / hold), симуляция
  sim/store.ts          общий таймер симуляции; сцена и интерфейс читают один снимок состояния
  sim/useSim.ts         React-хук подписки на симуляцию
  scene/Stage.ts        рендерер, камера, свет, кадрирование (камера статичная)
  scene/buildSite.ts    3D-модель станции из исходного макета + анимация потоков энергии
  components/
    Hero.tsx            первый экран: текст слева, сцена справа, панель диспетчера снизу слева
    EnergyScene.tsx     монтирует three.js и подписи над объектами
    DispatcherPanel.tsx панель «AI battery dispatcher»
    DayChart.tsx        график цены за день с зонами зарядки/продажи (используется 3 раза)
    Reveal.tsx          плавное появление блоков при прокрутке
    LogoMarquee.tsx     бегущая лента производителей под первым экраном (simple-icons + текстовые марки)
    AiLogos.tsx         знаки OpenAI / Claude / Gemini в бейдже первого экрана
    Flag.tsx            маленькие SVG-флаги (GB / CZ / PL / UA) — переключатель языков и карточки цен
    LangSwitch.tsx      переключатель языков (EN · CZ · PL · UA с флагами) — ссылки на адрес каждого языка (/uk/), клик
                        меняет адрес без перезагрузки; выделение — линза из «жидкого стекла», как карточки AI note
                        на сцене, скользит к выбранному языку с пружиной
    sections/           Strip, Problem, HowItWorks, LiveDashboard, Features, Diagnostics (AI-диагностика),
                        AiChat, Tech (донглы, шлюз, протоколы), Results, Turnkey (+ карточка «приедем на объект»),
                        Contact (карточка с контактами, без формы), Footer
  Иконки — lucide-react (import { Zap } from 'lucide-react'), обёртка .ico / .ico.g в styles.css
  i18n/                 словари en / cs / pl / uk (en.ts задаёт форму), LangProvider, useT(), <Rich> для **жирного**,
                        pathFor()/langInPath(): язык берётся из пути (/uk/), смена языка меняет адрес (pushState)
  styles.css            токены и стили страницы
sources/                исходные макеты и промпты (Claude Design экспорт, распакованная сцена, первая HTML-версия)
```

## Где что менять

- Цифры и логика дня — `src/sim/day.ts` (кривая цены, пороги покупки/продажи, ёмкость батареи, мощность присоединения `GRID`). Темп: `DAY_SECONDS` и `NIGHT_SECONDS` там же. Сводка дня `DAY` (время продажи, пик, выручка, прирост к продаже «как есть») считается один раз при загрузке — журнал, чат и плитка результата берут цифры из неё, поэтому совпадают со сценой после любых правок модели.
- Превью ссылки — `public/og.png` (1200×627) и OG-теги в `index.html`; сборка подставляет заголовок и описание языка в каждую копию. Шрифт Inter лежит в бандле (`@fontsource-variable/inter`), внешних запросов за шрифтами нет.
- Поисковики — `dist/<lang>/index.html` содержит готовый текст страницы: `src/entry-server.tsx` рендерит React в строку, `scripts/prerender.mjs` вписывает её в `#root`, браузер гидратирует (`src/main.tsx`). Canonical, hreflang и JSON-LD (Organization + SoftwareApplication) — `index.html` и плагин `languagePages`. `public/robots.txt`, `public/sitemap.xml`. 3D-сцена грузится отдельным чанком после текста (`EnergyScene.tsx`).
- Тексты — в словарях `src/i18n/{en,cs,pl,uk}.ts` (компоненты берут строки через `useT()`). Заголовок и описание страницы для ссылки — `meta` в каждом словаре.
- Языковые адреса — `src/i18n/index.tsx` (`pathFor`, `langInPath`). Язык из адреса главнее сохранённого; корень `/` без языка берёт localStorage, затем язык браузера. Сборка кладёт копию `index.html` в `dist/<lang>/` с локализованными `<html lang>`, `<title>` и description — плагин `languagePages` в `vite.config.ts`.
- Цвета и шрифты — токены в начале `src/styles.css`.
- Вернуть вращение сцены мышью — `interactive` в `src/scene/Stage.ts` (метод `enableOrbit`).

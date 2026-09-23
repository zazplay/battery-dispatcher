# Battery Dispatcher — landing

React 19 + Vite + TypeScript + three.js. Презентация-визитка системы управления батареями солнечных станций «под ключ» — страница, которую отправляют клиентам (не основной сайт компании). Первый экран — 3D-макет станции (панели, накопители, ЛЭП, ИИ-контроллер) с живой симуляцией одного дня: цикл начинается с восхода, светлое время идёт 64 секунды, ночь прокручивается за 6.

## Запуск

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # проверка типов + сборка в dist/
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
    sections/           Strip, Problem, HowItWorks, LiveDashboard, Features, Diagnostics (AI-диагностика),
                        AiChat, Tech (донглы, шлюз, протоколы), Results, Turnkey (+ карточка «приедем на объект»),
                        Contact (карточка с контактами, без формы), Footer
  Иконки — lucide-react (import { Zap } from 'lucide-react'), обёртка .ico / .ico.g в styles.css
  i18n/                 словари en / cs / pl / uk (en.ts задаёт форму), LangProvider, useT(), <Rich> для **жирного**, LangSwitch
  styles.css            токены и стили страницы
sources/                исходные макеты и промпты (Claude Design экспорт, распакованная сцена, первая HTML-версия)
```

## Где что менять

- Цифры и логика дня — `src/sim/day.ts` (кривая цены, пороги покупки/продажи, ёмкость батареи). Темп: `DAY_SECONDS` и `NIGHT_SECONDS` там же.
- Тексты — в словарях `src/i18n/{en,cs,pl,uk}.ts` (компоненты берут строки через `useT()`). Язык определяется по браузеру, выбор запоминается в localStorage.
- Цвета и шрифты — токены в начале `src/styles.css`.
- Вернуть вращение сцены мышью — `interactive` в `src/scene/Stage.ts` (метод `enableOrbit`).

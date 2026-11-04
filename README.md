# NomberProjects.github.io

Хаб всех проектов NOMBER — https://nomberprojects.github.io/

Статический сайт без сборки (HTML/CSS/JS), готов для GitHub Pages.

## Структура
- `index.html` — разметка
- `assets/style.css` — стили
- `assets/main.js` — эффекты (туман, частицы, параллакс, 3D-наклон карточек) и рендер карточек
- `assets/data.js` — **все проекты здесь**: `projects`, `wip`, `communities`, `archive`
- `assets/i18n.js` — переводы интерфейса RU/EN и автоопределение языка
- `404.html`, `.nojekyll`

## Как добавить проект
Откройте `assets/data.js` и добавьте объект в нужный массив:
```js
{ id: "myproj", title: "Название",
  tagline: { ru: "Кратко", en: "Short" }, description: { ru: "Подробно", en: "Details" },
  status: { ru: "Архив", en: "Archived" }, image: "assets/my.png", url: "https://...",
  links: [{ label: { ru: "Канал", en: "Channel" }, url: "https://t.me/...", icon: "tg" }] }
```
Иконки ссылок: `tg`, `bot`, `web`, `gh`, `mail`. Первые два из `projects` стоят слева/справа от персонажа, остальные — под ним.

## Локально
`python3 -m http.server 8000` → http://localhost:8000

## Языки (RU / EN)
Язык выбирается автоматически: сначала сохранённый выбор (`localStorage.lang`), затем языки браузера — `ru`, `be`, `uk`, `kk` → русский, всё остальное → английский. Переключатель RU | EN в шапке запоминает выбор.

- Тексты карточек — в `assets/data.js`: любое текстовое поле может быть объектом `{ ru: "...", en: "..." }` или обычной строкой (одинаково на обоих языках).
- Тексты интерфейса — в `assets/i18n.js` (словари `ru` и `en`). В HTML элемент получает перевод через `data-i18n="ключ"` (текст) или `data-i18n-attr="aria-label:ключ"` (атрибуты). Новый ключ добавляйте в оба словаря.
- Новый язык: добавьте словарь в `I18N`, переводы в `data.js`, кнопку в `.lang` в `index.html` и правило в `detectLang()`.

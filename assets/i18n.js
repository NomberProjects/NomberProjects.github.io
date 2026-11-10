/* NomberProjects — переводы интерфейса / UI translations.
   Ключи используются в index.html через data-i18n="key" (текст),
   data-i18n-html="key" (HTML), data-i18n-attr="attr:key;attr2:key2". */
window.I18N = {
  ru: {
    "meta.title": "NOMBER — NomberProjects · Автор, разработчик, создатель экосистем",
    "meta.desc": "NomberProjects — хаб всех проектов NOMBER: DownGrab, KotoClicker, плагины для Obsidian, сообщество Критики Steam и проекты в разработке.",
    "og.desc": "Автор · Разработчик · Создатель экосистем. Хаб всех проектов NOMBER.",
    "skip": "Перейти к проектам", "a.top": "NomberProjects — наверх", "a.sections": "Разделы", "a.lang": "Язык сайта",
    "nav.projects": "Проекты", "nav.wip": "В разработке", "nav.com": "Сообщества", "nav.arc": "Архив", "nav.contact": "Связь",
    "donate": "Поддержать",
    "hero.kicker": "// nomberprojects.github.io — хаб экосистемы",
    "hero.sub": "Автор · Разработчик · Создатель экосистем",
    "hero.alt": "Персонаж NOMBER: синий пушистый детектив в шляпе и костюме, загадочно разводит руками",
    "a.scroll": "Листать ниже",
    "wip.t": "В разработке", "wip.p": "Лаборатория. Часть материалов засекречена.",
    "com.t": "Сообщества", "com.p": "Не проекты — люди. Отдел сообществ.",
    "arc.t": "Архив", "arc.p": "Проекты, которые остаются в памяти.",
    "sup.t": "Нравится то, что я делаю?", "sup.p": "Донатики донатики — каждый помогает котикам кликать, а боту качать.",
    "contact.t": "Связь", "contact.tg": "написать в Telegram", "contact.mail": "нажми, чтобы скопировать", "contact.copied": "Почта скопирована ✓",
    "soc.t": "Соцсети", "soc.gh": "код и опенсорс", "soc.life": "личный блог · Telegram", "soc.steam": "профиль Steam", "soc.kino": "Кинориум", "soc.kinosub": "мои оценки фильмов",
    "aside": "Также:", "aside.link": "амбассадорское портфолио",
    "hub": "Хаб всех проектов —",
    "card.site": "сайт проекта", "secret.aria": "Засекреченный проект", "secret.grif": "Гриф: СС", "secret.stamp": "СЕКРЕТНО", "secret.denied": "ДОСТУП ЗАПРЕЩЁН", "secret.obj": "Объект №",
    "com.tgbadge": "Telegram-канал",
    "vault.t": "Хранилище запечатано", "vault.p": "Скоро здесь появятся архивные проекты — для памяти.",
    "404.p": "Детектив обыскал весь город — такой страницы нет.", "404.a": "На главную"
  },
  en: {
    "meta.title": "NOMBER — NomberProjects · Author, developer, ecosystem builder",
    "meta.desc": "NomberProjects — the hub of all NOMBER projects: DownGrab, KotoClicker, Obsidian plugins, the Critics Steam community and projects in development.",
    "og.desc": "Author · Developer · Ecosystem builder. The hub of all NOMBER projects.",
    "skip": "Skip to projects", "a.top": "NomberProjects — back to top", "a.sections": "Sections", "a.lang": "Site language",
    "nav.projects": "Projects", "nav.wip": "In development", "nav.com": "Communities", "nav.arc": "Archive", "nav.contact": "Contact",
    "donate": "Support",
    "hero.kicker": "// nomberprojects.github.io — ecosystem hub",
    "hero.sub": "Author · Developer · Ecosystem builder",
    "hero.alt": "NOMBER character: a fluffy blue detective in a hat and suit, mysteriously spreading his arms",
    "a.scroll": "Scroll down",
    "wip.t": "In development", "wip.p": "The lab. Some files are classified.",
    "com.t": "Communities", "com.p": "Not projects — people. The community department.",
    "arc.t": "Archive", "arc.p": "Projects that stay in memory.",
    "sup.t": "Like what I do?", "sup.p": "Every donation helps the cats click and the bot download.",
    "contact.t": "Contact", "contact.tg": "message on Telegram", "contact.mail": "click to copy", "contact.copied": "Email copied ✓",
    "soc.t": "Socials", "soc.gh": "code & open source", "soc.life": "personal blog · Telegram", "soc.steam": "Steam profile", "soc.kino": "Kinorium", "soc.kinosub": "my movie ratings",
    "aside": "Also:", "aside.link": "ambassador portfolio",
    "hub": "Hub of all projects —",
    "card.site": "project website", "secret.aria": "Classified project", "secret.grif": "Top secret", "secret.stamp": "CLASSIFIED", "secret.denied": "ACCESS DENIED", "secret.obj": "Object #",
    "com.tgbadge": "Telegram channel",
    "vault.t": "The vault is sealed", "vault.p": "Archived projects will appear here soon — for the memories.",
    "404.p": "The detective searched the whole city — this page doesn't exist.", "404.a": "Back home"
  }
};
/* Определение языка: сохранённый выбор → языки браузера (ru/be/uk/kk → RU) → EN */
window.detectLang = function () {
  try { const s = localStorage.getItem("lang"); if (s === "ru" || s === "en") return s; } catch (e) {}
  const L = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"]);
  for (const l of L) { const b = String(l).toLowerCase().slice(0, 2); if (["ru", "be", "uk", "kk"].includes(b)) return "ru"; if (b === "en") return "en"; }
  return "en";
};
window.applyI18n = function (lang, root) {
  const d = window.I18N[lang] || window.I18N.en; root = root || document;
  document.documentElement.lang = lang;
  root.querySelectorAll("[data-i18n]").forEach(el => { const v = d[el.dataset.i18n]; if (v != null) el.textContent = v; });
  root.querySelectorAll("[data-i18n-attr]").forEach(el => el.dataset.i18nAttr.split(";").forEach(p => { const [a, k] = p.split(":"); if (d[k] != null) el.setAttribute(a, d[k]); }));
  if (d["meta.title"] && document.querySelector('meta[name="description"]')) {
    document.title = d["meta.title"];
    document.querySelector('meta[name="description"]').content = d["meta.desc"];
    const og = document.querySelector('meta[property="og:description"]'); if (og) og.content = d["og.desc"];
    const ol = document.querySelector('meta[property="og:locale"]'); if (ol) ol.content = lang === "ru" ? "ru_RU" : "en_US";
  }
};
document.documentElement.lang = window.detectLang();

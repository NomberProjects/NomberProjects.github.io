/* ============================================================
   NomberProjects — данные сайта / site data.
   Текстовые поля — объекты { ru: "...", en: "..." } (можно и просто строку — тогда одинаково на обоих языках).
   Поля: id, title, tagline, description, status, image, url, accent, links[{label,url,icon}]
   icon: tg | web | gh | bot | mail
   ============================================================ */
window.NOMBER_DATA = {
  projects: [
    {
      id: "downgrab",
      title: "DownGrab",
      tagline: { ru: "Ведущий проект · Telegram-бот", en: "Flagship project · Telegram bot" },
      description: {
        ru: "Telegram-бот для скачивания видео с YouTube, Twitter/X и других платформ. Кинул ссылку — забрал видео. Флагман экосистемы DownGrab.",
        en: "A Telegram bot that downloads videos from YouTube, Twitter/X and other platforms. Drop a link — grab the video. The flagship of the DownGrab ecosystem."
      },
      status: { ru: "Работает", en: "Live" },
      image: "assets/downgrab-256.jpg",
      url: "https://downgrab.github.io/",
      accent: "#ff8a2a",
      links: [
        { label: { ru: "Бот", en: "Bot" }, url: "https://t.me/DownGrabBot", icon: "bot" },
        { label: { ru: "Канал", en: "Channel" }, url: "https://t.me/DownGrab", icon: "tg" },
        { label: { ru: "Сайт", en: "Website" }, url: "https://downgrab.github.io/", icon: "web" }
      ]
    },
    {
      id: "kotoclicker",
      title: "KotoClicker",
      tagline: { ru: "Экосистема DownGrab · личная разработка", en: "DownGrab ecosystem · personal project" },
      description: {
        ru: "КотоКлик — передовой в мире опенсорс автокликер для Windows, где котик кликает за тебя.",
        en: "KotoClick — the world's most advanced open-source autoclicker for Windows, where a cat does the clicking for you."
      },
      status: "Open Source",
      image: "assets/kotoclicker.webp",
      url: "https://kotoclick.github.io/",
      accent: "#f5b82e",
      links: [
        { label: { ru: "Сайт", en: "Website" }, url: "https://kotoclick.github.io/", icon: "web" },
        { label: "GitHub", url: "https://github.com/NOMBER/KotoClicker", icon: "gh" }
      ]
    },
    {
      id: "obsidian",
      title: "Obsidian Plugins",
      tagline: { ru: "Каталог плагинов для Obsidian", en: "Catalog of Obsidian plugins" },
      description: {
        ru: "Сайт-каталог со всеми моими плагинами для Obsidian: описания, установка, обновления — в одном месте. Сайт скоро откроется, а пока — GitHub.",
        en: "A catalog site with all my Obsidian plugins: descriptions, installation and updates in one place. The site opens soon — GitHub for now."
      },
      status: { ru: "Скоро", en: "Soon" },
      image: "assets/obsidian.svg",
      url: "https://github.com/NOMBER",
      accent: "#a77bff",
      links: [ { label: "GitHub", url: "https://github.com/NOMBER", icon: "gh" } ]
    }
  ],

  /* В разработке. redacted:true — полностью засекреченная карточка */
  wip: [
    { id: "gamestudio", title: { ru: "Игровая студия", en: "Game studio" }, tagline: { ru: "Прототипы игр уже готовятся", en: "Game prototypes in the works" }, status: { ru: "В разработке", en: "In development" } },
    { id: "mempalace", title: { ru: "Дворец памяти", en: "Memory Palace" }, tagline: { ru: "Проект в разработке", en: "Project in development" }, status: { ru: "В разработке", en: "In development" } },
    { id: "x1", redacted: true },
    { id: "x2", redacted: true },
    { id: "x3", redacted: true }
  ],

  communities: [
    {
      id: "criticssteam",
      title: { ru: "Критики Steam", en: "Critics Steam" },
      tagline: { ru: "Пост-ироничное сообщество", en: "Post-ironic community" },
      description: {
        ru: "Передовое по контенту пост-ироничное сообщество с мемами и всем про экосистему Steam. Сейчас — канал в Telegram, сайт в разработке.",
        en: "A content-first post-ironic community with memes and everything about the Steam ecosystem. Currently a Telegram channel; the website is in development."
      },
      badge: { ru: "CIS · на русском языке", en: "CIS · Russian-language" },
      status: { ru: "Сайт в разработке", en: "Website in development" },
      image: "assets/criticssteam.webp",
      links: [ { label: { ru: "Канал", en: "Channel" }, url: "https://t.me/criticssteam", icon: "tg" } ]
    }
  ],

  /* Архив — пока пусто. Добавляйте объекты как в projects. */
  archive: []
};

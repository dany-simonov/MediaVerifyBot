/* i18n.js — Internationalization for Источник platform (v0.4.0) */
(function () {
  'use strict';

  var STORAGE_KEY = 'istochnik_lang';

  var translations = {
    ru: {
      /* ── Navigation ── */
      'nav.features': 'Возможности',
      'nav.check': 'Проверка',
      'nav.pricing': 'Тарифы',
      'nav.roadmap': 'Roadmap',
      'nav.login': 'Вход',

      /* ── Hero ── */
      'hero.title': 'Проверяй подлинность медиа<br>за секунды',
      'hero.subtitle': 'Система верификации фото, видео, аудио и текста<br>на основе специализированных моделей ИИ',
      'hero.cta': 'Попробовать бесплатно',
      'hero.demo': 'Смотреть демо',
      'hero.stat.photo': 'Точность фото',
      'hero.stat.audio': 'Точность аудио',
      'hero.stat.video': 'Точность видео',

      /* ── Features ── */
      'features.title': 'Возможности',
      'features.photo.title': 'Фото',
      'features.photo.desc': 'Детекция AI-генерации<br>Sightengine genai, точность 94.4%',
      'features.audio.title': 'Аудио',
      'features.audio.desc': 'Синтетическая речь и voice cloning<br>Resemble Detect, точность 99.5%',
      'features.video.title': 'Видео',
      'features.video.desc': 'Покадровый анализ<br>FFmpeg + Sightengine pipeline, 81%',
      'features.text.title': 'Текст',
      'features.text.desc': 'Написан ли ChatGPT?<br>Sapling AI, точность 98%',
      'features.link.title': 'Проверка по ссылке',
      'features.link.desc': 'Вставь ссылку на пост в Telegram, видео YouTube или картинку — бот скачает и проверит',
      'features.heatmap.title': 'Тепловые карты',
      'features.heatmap.desc': 'Explainable AI — визуализация зон, где ИИ «спалился» на сгенерированном фото',

      /* ── Big Check ── */
      'bigcheck.title': 'Попробуй прямо сейчас',

      /* ── Pricing ── */
      'pricing.title': 'Тарифы',
      'pricing.free.name': 'FREE',
      'pricing.free.price': '0 ₽',
      'pricing.free.f1': '3 проверки/день',
      'pricing.free.f2': 'Все форматы',
      'pricing.free.f3': 'Базовый вердикт',
      'pricing.free.btn': 'Открыть в Telegram',
      'pricing.premium.badge': 'СКОРО',
      'pricing.premium.name': 'PREMIUM',
      'pricing.premium.price': '199 ₽/мес',
      'pricing.premium.f1': '100 проверок/мес',
      'pricing.premium.f2': 'Приоритетная обработка',
      'pricing.premium.f3': 'История 30 дней',
      'pricing.premium.f4': 'Экспорт отчётов PDF',
      'pricing.premium.f5': 'Поделиться результатом',
      'pricing.premium.btn': '🔔 Встать в лист ожидания',
      'pricing.enterprise.badge': 'B2B',
      'pricing.enterprise.name': 'ENTERPRISE',
      'pricing.enterprise.price': 'По запросу',
      'pricing.enterprise.f1': 'REST API доступ',
      'pricing.enterprise.f2': 'Безлимитные проверки',
      'pricing.enterprise.f3': 'SLA и поддержка',
      'pricing.enterprise.f4': 'Для СМИ, пабликов и форумов',
      'pricing.enterprise.f5': 'Кастомные модели',
      'pricing.enterprise.btn': '💼 Связаться',

      /* ── Roadmap ── */
      'roadmap.title': 'История версий',
      'roadmap.v01.tag': 'Выпущено',
      'roadmap.v01.title': 'v0.1.0 — Альфа-версия',
      'roadmap.v01.desc': 'Базовый Telegram-бот, интеграция первых моделей детекции для фото и текста.',
      'roadmap.v02.tag': 'Выпущено',
      'roadmap.v02.title': 'v0.2.0 — «Источник»',
      'roadmap.v02.desc': 'Полный ребрендинг проекта и запуск функциональной веб-платформы. Внедрён интуитивный «Индекс подлинности», добавлена генерация детализированных PDF-отчётов.',
      'roadmap.v03.tag': 'Выпущено',
      'roadmap.v03.title': 'v0.3.0 — Масштабирование',
      'roadmap.v03.desc': 'Big Check (пакетный кросс-анализ), Drag&Drop загрузчик, тариф Enterprise (B2B API) и тепловые карты (Explainable AI).',
      'roadmap.v04.tag': 'Текущая',
      'roadmap.v04.title': 'v0.4.0 — Глобальное обновление',
      'roadmap.v04.desc': 'Внедрение системы авторизации (Telegram + Email), полная локализация платформы (RU/EN), редизайн системы карточек с кастомными SVG-иконками и переработка архитектуры страниц.',
      'roadmap.v05.tag': 'Скоро',
      'roadmap.v05.title': 'v0.5.0 — B2B & API',
      'roadmap.v05.desc': 'Полноценный релиз личного кабинета, запуск публичного REST API для интеграции с медиа-платформами и релиз расширения для браузера.',

      /* ── Auth ── */
      'auth.title': 'Вход в Источник',
      'auth.tab.telegram': 'Telegram',
      'auth.tab.email': 'Email',
      'auth.telegram.desc': 'Быстрый и безопасный вход через ваш аккаунт Telegram',
      'auth.telegram.btn': 'Войти через Telegram',
      'auth.email.label': 'Email',
      'auth.password.label': 'Пароль',
      'auth.submit': 'Войти / Создать аккаунт',

      /* ── Footer ── */
      'footer.desc': 'Система верификации медиа на основе ИИ',
      'footer.nav.title': 'Навигация',
      'footer.legal.title': 'Документы',
      'footer.about': 'О проекте',
      'footer.privacy': 'Политика конфиденциальности',
      'footer.terms': 'Условия использования',
      'footer.rights': 'Все права защищены.',
    },

    en: {
      /* ── Navigation ── */
      'nav.features': 'Features',
      'nav.check': 'Check',
      'nav.pricing': 'Pricing',
      'nav.roadmap': 'Roadmap',
      'nav.login': 'Sign In',

      /* ── Hero ── */
      'hero.title': 'Verify media authenticity<br>in seconds',
      'hero.subtitle': 'Photo, video, audio and text verification system<br>powered by specialized AI models',
      'hero.cta': 'Try for free',
      'hero.demo': 'Watch demo',
      'hero.stat.photo': 'Photo accuracy',
      'hero.stat.audio': 'Audio accuracy',
      'hero.stat.video': 'Video accuracy',

      /* ── Features ── */
      'features.title': 'Features',
      'features.photo.title': 'Photo',
      'features.photo.desc': 'AI generation detection<br>Sightengine genai, 94.4% accuracy',
      'features.audio.title': 'Audio',
      'features.audio.desc': 'Synthetic speech &amp; voice cloning<br>Resemble Detect, 99.5% accuracy',
      'features.video.title': 'Video',
      'features.video.desc': 'Frame-by-frame analysis<br>FFmpeg + Sightengine pipeline, 81%',
      'features.text.title': 'Text',
      'features.text.desc': 'Written by ChatGPT?<br>Sapling AI, 98% accuracy',
      'features.link.title': 'Check by URL',
      'features.link.desc': 'Paste a link to a Telegram post, YouTube video or image — the bot will download and verify',
      'features.heatmap.title': 'Heat Maps',
      'features.heatmap.desc': 'Explainable AI — visualization of zones where AI artifacts were detected',

      /* ── Big Check ── */
      'bigcheck.title': 'Try it now',

      /* ── Pricing ── */
      'pricing.title': 'Pricing',
      'pricing.free.name': 'FREE',
      'pricing.free.price': '$0',
      'pricing.free.f1': '3 checks/day',
      'pricing.free.f2': 'All formats',
      'pricing.free.f3': 'Basic verdict',
      'pricing.free.btn': 'Open in Telegram',
      'pricing.premium.badge': 'SOON',
      'pricing.premium.name': 'PREMIUM',
      'pricing.premium.price': '$2.99/mo',
      'pricing.premium.f1': '100 checks/month',
      'pricing.premium.f2': 'Priority processing',
      'pricing.premium.f3': '30-day history',
      'pricing.premium.f4': 'PDF report export',
      'pricing.premium.f5': 'Share results',
      'pricing.premium.btn': '🔔 Join waitlist',
      'pricing.enterprise.badge': 'B2B',
      'pricing.enterprise.name': 'ENTERPRISE',
      'pricing.enterprise.price': 'Custom',
      'pricing.enterprise.f1': 'REST API access',
      'pricing.enterprise.f2': 'Unlimited checks',
      'pricing.enterprise.f3': 'SLA &amp; support',
      'pricing.enterprise.f4': 'For media &amp; publishers',
      'pricing.enterprise.f5': 'Custom models',
      'pricing.enterprise.btn': '💼 Contact us',

      /* ── Roadmap ── */
      'roadmap.title': 'Version History',
      'roadmap.v01.tag': 'Released',
      'roadmap.v01.title': 'v0.1.0 — Alpha',
      'roadmap.v01.desc': 'Basic Telegram bot, integration of first detection models for photo and text.',
      'roadmap.v02.tag': 'Released',
      'roadmap.v02.title': 'v0.2.0 — Istochnik',
      'roadmap.v02.desc': 'Full project rebranding and launch of functional web platform. Intuitive Authenticity Index and detailed PDF report generation.',
      'roadmap.v03.tag': 'Released',
      'roadmap.v03.title': 'v0.3.0 — Scaling',
      'roadmap.v03.desc': 'Big Check (batch cross-analysis), Drag&amp;Drop uploader, Enterprise tier (B2B API) and heat maps (Explainable AI).',
      'roadmap.v04.tag': 'Current',
      'roadmap.v04.title': 'v0.4.0 — Global Update',
      'roadmap.v04.desc': 'Authentication system (Telegram + Email), full platform localization (RU/EN), redesigned feature cards with custom SVG icons and page architecture overhaul.',
      'roadmap.v05.tag': 'Soon',
      'roadmap.v05.title': 'v0.5.0 — B2B &amp; API',
      'roadmap.v05.desc': 'Full personal dashboard release, public REST API launch for media platform integration and browser extension release.',

      /* ── Auth ── */
      'auth.title': 'Sign in to Istochnik',
      'auth.tab.telegram': 'Telegram',
      'auth.tab.email': 'Email',
      'auth.telegram.desc': 'Fast and secure login via your Telegram account',
      'auth.telegram.btn': 'Sign in with Telegram',
      'auth.email.label': 'Email',
      'auth.password.label': 'Password',
      'auth.submit': 'Sign In / Create Account',

      /* ── Footer ── */
      'footer.desc': 'AI-powered media verification system',
      'footer.nav.title': 'Navigation',
      'footer.legal.title': 'Legal',
      'footer.about': 'About',
      'footer.privacy': 'Privacy Policy',
      'footer.terms': 'Terms of Service',
      'footer.rights': 'All rights reserved.',
    },
  };

  var currentLang = localStorage.getItem(STORAGE_KEY) || 'ru';

  function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;

    /* Update all elements with data-i18n (supports innerHTML for <br> etc.) */
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = translations[lang][key];
      if (val !== undefined) el.innerHTML = val;
    });

    /* Update placeholders */
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      var val = translations[lang][key];
      if (val !== undefined) el.placeholder = val;
    });

    /* Highlight active lang button */
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
  }

  function initI18n() {
    /* Bind all lang-switcher buttons (desktop + mobile) */
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setLanguage(this.getAttribute('data-lang'));
      });
    });

    /* Apply saved/default language */
    setLanguage(currentLang);
  }

  /* Public API */
  window.IstochnikI18n = {
    setLanguage: setLanguage,
    getCurrentLang: function () {
      return currentLang;
    },
    t: function (key) {
      return (translations[currentLang] && translations[currentLang][key]) || key;
    },
    init: initI18n,
  };

  /* Auto-init */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
  } else {
    initI18n();
  }
})();

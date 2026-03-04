/* i18n.js — Internationalization for Источник platform (v0.4.0) */
(function () {
  'use strict';

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
      'roadmap.v04.desc': 'Внедрение системы авторизации (Telegram + Email), редизайн системы карточек с кастомными SVG-иконками и переработка архитектуры страниц.',
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
  };

  function applyTranslations() {
    /* Update all elements with data-i18n (supports innerHTML for <br> etc.) */
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = translations.ru[key];
      if (val !== undefined) el.innerHTML = val;
    });

    /* Update placeholders */
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      var val = translations.ru[key];
      if (val !== undefined) el.placeholder = val;
    });
  }

  function initI18n() {
    document.documentElement.lang = 'ru';
    applyTranslations();
  }

  /* Public API */
  window.IstochnikI18n = {
    t: function (key) {
      return translations.ru[key] || key;
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

/* dashboard.js — Источник Dashboard SPA */
(function () {
  'use strict';

  var MEDIA_ICONS = { image: '📷', audio: '🎵', video: '🎬', text: '📝' };
  var MEDIA_LABELS_RU = { image: 'Изображение', audio: 'Аудио', video: 'Видео', text: 'Текст' };
  var VERDICT_TEXT = { REAL: 'Человеческий контент', FAKE: 'Сгенерировано ИИ', UNCERTAIN: 'Не определено' };
  var VERDICT_EMOJI = { REAL: '✅', FAKE: '🚫', UNCERTAIN: '⚠️' };
  var MODEL_NAMES = {
    sightengine: 'Sightengine (фото)',
    sightengine_video_pipeline: 'Sightengine (видео)',
    resemble_detect: 'Resemble Detect (аудио)',
    sapling: 'Sapling AI (текст)',
    hf_image_inference: 'HuggingFace (фото)',
    hf_audio_inference: 'HuggingFace (аудио)',
    fallback_uncertain: 'Резервная система',
  };

  // Get user_id from URL param ?uid=
  var urlParams = new URLSearchParams(window.location.search);
  var userId = urlParams.get('uid');
  var currentPage = 'dashboard';
  var checks = [];
  var stats = null;
  var filters = { media_type: null, verdict: null, sort: 'newest' };

  function calculateAuthenticityIndex(verdict, confidence) {
    if (verdict === 'FAKE') return Math.round((1 - confidence) * 100);
    return Math.round(confidence * 100);
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  // ──────── INIT ────────
  function init() {
    if (!userId) {
      showPlaceholder();
      return;
    }
    document.getElementById('user-name').textContent = 'ID: ' + userId;
    setupNavigation();
    navigateTo(window.location.hash.replace('#', '') || 'dashboard');
  }

  function showPlaceholder() {
    var content = document.getElementById('dashboard-content');
    content.innerHTML =
      '<div class="dashboard-placeholder">' +
        '<h2>Откройте через Telegram-бот</h2>' +
        '<p>Для доступа к личному кабинету откройте ссылку через <a href="https://t.me/MediaVerifyBot" style="color:var(--color-accent)">@MediaVerifyBot</a></p>' +
        '<a href="https://t.me/MediaVerifyBot" class="btn-primary" target="_blank">Открыть бот</a>' +
      '</div>';
  }

  function setupNavigation() {
    document.querySelectorAll('[data-page]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        navigateTo(this.getAttribute('data-page'));
      });
    });

    window.addEventListener('hashchange', function () {
      navigateTo(window.location.hash.replace('#', '') || 'dashboard');
    });
  }

  function navigateTo(page) {
    currentPage = page;
    window.location.hash = page;

    // Update active nav
    document.querySelectorAll('[data-page]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-page') === page);
    });

    switch (page) {
      case 'dashboard': renderDashboard(); break;
      case 'history': renderHistory(); break;
      case 'pricing': renderPricing(); break;
      case 'about': renderAbout(); break;
      default: renderDashboard();
    }
  }

  // ──────── DASHBOARD PAGE ────────
  async function renderDashboard() {
    var content = document.getElementById('dashboard-content');
    content.innerHTML = '<p style="color:var(--color-text-secondary)">Загрузка...</p>';

    try {
      if (window.IstochnikAPI) {
        stats = await window.IstochnikAPI.getUserStats(userId);
      }
    } catch (e) {
      console.error(e);
    }

    if (!stats) {
      stats = { checks_today: 0, daily_limit: 3, total_checks: 0, is_premium: false, created_at: new Date().toISOString() };
    }

    var checksProgress = Math.min((stats.checks_today / stats.daily_limit) * 100, 100);
    var limitReached = stats.checks_today >= stats.daily_limit;

    content.innerHTML =
      '<h2 style="font-size:24px;font-weight:600;margin-bottom:24px;">Главная</h2>' +
      '<div class="dash-stats-grid">' +
        '<div class="dash-stat-card"><div class="stat-label">Тариф</div><div class="stat-value">' + (stats.is_premium ? 'Premium' : 'Free') + '</div></div>' +
        '<div class="dash-stat-card"><div class="stat-label">Всего проверок</div><div class="stat-value">' + stats.total_checks + '</div></div>' +
        '<div class="dash-stat-card"><div class="stat-label">Сегодня</div><div class="stat-value" style="color:' + (limitReached ? 'var(--color-fake)' : 'inherit') + '">' + stats.checks_today + ' / ' + stats.daily_limit + '</div></div>' +
      '</div>' +
      '<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:20px;margin-bottom:24px;">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;">' +
          '<span style="color:var(--color-text-secondary)">Лимит проверок</span>' +
          '<span style="color:' + (limitReached ? 'var(--color-fake)' : 'var(--color-text-primary)') + '">' + stats.checks_today + ' / ' + stats.daily_limit + '</span>' +
        '</div>' +
        '<div style="height:6px;background:var(--color-border);border-radius:3px;overflow:hidden;">' +
          '<div style="height:100%;width:' + checksProgress + '%;background:' + (limitReached ? 'var(--color-fake)' : 'var(--color-accent)') + ';border-radius:3px;transition:width 0.5s ease;"></div>' +
        '</div>' +
      '</div>' +
      '<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:20px;">' +
        '<h3 style="font-weight:500;margin-bottom:16px;">Как использовать</h3>' +
        '<div style="display:flex;flex-direction:column;gap:12px;">' +
          '<div style="display:flex;align-items:center;gap:12px;"><span style="font-size:20px">📷</span><span style="color:var(--color-text-secondary);font-size:14px">Фото — детекция AI-генерации (94.4%)</span></div>' +
          '<div style="display:flex;align-items:center;gap:12px;"><span style="font-size:20px">🎵</span><span style="color:var(--color-text-secondary);font-size:14px">Аудио — синтетическая речь (99.5%)</span></div>' +
          '<div style="display:flex;align-items:center;gap:12px;"><span style="font-size:20px">🎬</span><span style="color:var(--color-text-secondary);font-size:14px">Видео — покадровый анализ (81%)</span></div>' +
          '<div style="display:flex;align-items:center;gap:12px;"><span style="font-size:20px">📝</span><span style="color:var(--color-text-secondary);font-size:14px">Текст — написан ИИ (98%)</span></div>' +
        '</div>' +
      '</div>';
  }

  // ──────── HISTORY PAGE ────────
  async function renderHistory() {
    var content = document.getElementById('dashboard-content');
    content.innerHTML = '<p style="color:var(--color-text-secondary)">Загрузка...</p>';

    try {
      if (window.IstochnikAPI) {
        checks = await window.IstochnikAPI.getUserChecks(userId, { limit: 100 });
      }
    } catch (e) {
      console.error(e);
    }

    content.innerHTML = '';

    // Title
    var h2 = document.createElement('h2');
    h2.style.cssText = 'font-size:24px;font-weight:600;margin-bottom:20px;';
    h2.textContent = 'История проверок';
    content.appendChild(h2);

    // Filters
    var filtersBar = document.createElement('div');
    filtersBar.className = 'filters-bar';

    // Type filters
    var typeFilters = [
      { value: null, label: 'Все' },
      { value: 'image', label: 'Фото' },
      { value: 'audio', label: 'Аудио' },
      { value: 'video', label: 'Видео' },
      { value: 'text', label: 'Текст' },
    ];

    typeFilters.forEach(function (f) {
      var pill = document.createElement('button');
      pill.className = 'filter-pill' + (filters.media_type === f.value ? ' active' : '');
      pill.textContent = f.label;
      pill.addEventListener('click', function () {
        filters.media_type = f.value;
        renderHistory();
      });
      filtersBar.appendChild(pill);
    });

    // Separator
    var sep = document.createElement('span');
    sep.style.cssText = 'width:1px;height:24px;background:var(--color-border);margin:0 4px;';
    filtersBar.appendChild(sep);

    // Verdict filters
    var verdictFilters = [
      { value: null, label: 'Все вердикты' },
      { value: 'REAL', label: '✅ Подлинные' },
      { value: 'FAKE', label: '🚫 Сгенерированные' },
      { value: 'UNCERTAIN', label: '⚠️ Неопределённые' },
    ];

    verdictFilters.forEach(function (f) {
      var pill = document.createElement('button');
      pill.className = 'filter-pill' + (filters.verdict === f.value ? ' active' : '');
      pill.textContent = f.label;
      pill.addEventListener('click', function () {
        filters.verdict = f.value;
        renderHistory();
      });
      filtersBar.appendChild(pill);
    });

    // Sort select
    var sortSelect = document.createElement('select');
    sortSelect.className = 'sort-select';
    [
      { value: 'newest', label: 'Сначала новые' },
      { value: 'oldest', label: 'Сначала старые' },
      { value: 'type', label: 'По типу' },
      { value: 'verdict', label: 'По результату' },
    ].forEach(function (opt) {
      var o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      if (filters.sort === opt.value) o.selected = true;
      sortSelect.appendChild(o);
    });
    sortSelect.addEventListener('change', function () {
      filters.sort = this.value;
      renderHistory();
    });
    filtersBar.appendChild(sortSelect);

    content.appendChild(filtersBar);

    // Filter & sort data
    var filtered = checks.slice();
    if (filters.media_type) {
      filtered = filtered.filter(function (c) { return c.media_type === filters.media_type; });
    }
    if (filters.verdict) {
      filtered = filtered.filter(function (c) { return c.verdict === filters.verdict; });
    }

    switch (filters.sort) {
      case 'oldest':
        filtered.sort(function (a, b) { return new Date(a.created_at) - new Date(b.created_at); });
        break;
      case 'type':
        filtered.sort(function (a, b) { return a.media_type.localeCompare(b.media_type); });
        break;
      case 'verdict':
        filtered.sort(function (a, b) { return a.verdict.localeCompare(b.verdict); });
        break;
      default: // newest
        filtered.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
    }

    // Render cards
    if (filtered.length === 0) {
      content.innerHTML +=
        '<div style="text-align:center;padding:80px 0;">' +
          '<div style="font-size:48px;margin-bottom:16px;">📭</div>' +
          '<h3 style="font-weight:500;margin-bottom:8px;">Проверок пока нет</h3>' +
          '<p style="color:var(--color-text-secondary);font-size:14px;">Отправьте файл боту для анализа</p>' +
        '</div>';
      return;
    }

    var list = document.createElement('div');
    filtered.forEach(function (check) {
      list.appendChild(createCheckCard(check));
    });
    content.appendChild(list);
  }

  function createCheckCard(check) {
    var card = document.createElement('div');
    card.className = 'check-card';

    var icon = MEDIA_ICONS[check.media_type] || '📄';
    var label = MEDIA_LABELS_RU[check.media_type] || check.media_type;
    var verdClass = check.verdict === 'REAL' ? 'real' : check.verdict === 'FAKE' ? 'fake' : 'uncertain';
    var verdText = VERDICT_TEXT[check.verdict] || check.verdict;
    var ai = calculateAuthenticityIndex(check.verdict, check.confidence);
    var modelName = MODEL_NAMES[check.model_used] || check.model_used;

    card.innerHTML =
      '<div class="check-card-header">' +
        '<div class="check-card-left">' +
          '<span class="check-card-icon">' + icon + '</span>' +
          '<div class="check-card-info">' +
            '<h4>' + label + '</h4>' +
            '<span>' + formatDate(check.created_at) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="check-card-right">' +
          '<span class="verdict-badge ' + verdClass + '">' + verdText + '</span>' +
          '<span class="auth-pct">Подлинность ' + ai + '%</span>' +
          '<span style="color:var(--color-text-muted);font-size:12px;">▼</span>' +
        '</div>' +
      '</div>' +
      '<div class="check-card-expand" id="expand-' + check.id + '">' +
        '<p class="explanation">' + (check.explanation || '') + '</p>' +
        '<div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">' +
          '<span style="font-size:13px;color:var(--color-text-secondary);">' + modelName + ' · ' + check.processing_ms + ' мс</span>' +
        '</div>' +
        '<div class="check-card-actions">' +
          '<button onclick="window._copyCheck(\'' + check.id + '\')">📋 Копировать результат</button>' +
          '<button onclick="window._downloadPDF(\'' + check.id + '\')">📄 Скачать PDF</button>' +
        '</div>' +
      '</div>';

    card.querySelector('.check-card-header').addEventListener('click', function () {
      var expand = document.getElementById('expand-' + check.id);
      expand.classList.toggle('open');
    });

    // Store check data for copy/pdf
    card.dataset.check = JSON.stringify(check);
    window._checkData = window._checkData || {};
    window._checkData[check.id] = check;

    return card;
  }

  // Copy check result
  window._copyCheck = function (checkId) {
    var check = window._checkData && window._checkData[checkId];
    if (!check) return;
    var ai = calculateAuthenticityIndex(check.verdict, check.confidence);
    var text = [
      'Источник — Результат проверки',
      '──────────────────────────────',
      'Тип: ' + (MEDIA_LABELS_RU[check.media_type] || check.media_type),
      'Вердикт: ' + (VERDICT_TEXT[check.verdict] || check.verdict),
      'Индекс подлинности: ' + ai + '%',
      'Модель: ' + (MODEL_NAMES[check.model_used] || check.model_used),
      'Дата: ' + formatDate(check.created_at),
      '',
      check.explanation || '',
      '',
      'Проверено: Источник (istochnik.app)',
    ].join('\n').trim();

    navigator.clipboard.writeText(text).then(function () {
      // Find button and show feedback
      var btns = document.querySelectorAll('.check-card-actions button');
      btns.forEach(function (btn) {
        if (btn.textContent.indexOf('Копировать') > -1 && btn.closest('.check-card-expand.open')) {
          var orig = btn.textContent;
          btn.textContent = '✓ Скопировано';
          setTimeout(function () { btn.textContent = orig; }, 2000);
        }
      });
    });
  };

  // Download PDF
  window._downloadPDF = function (checkId) {
    if (window.IstochnikAPI) {
      window.IstochnikAPI.downloadReport(userId, checkId).catch(function (e) {
        console.error('PDF download error:', e);
        alert('Не удалось скачать отчёт. Попробуйте позже.');
      });
    } else {
      alert('API не настроен. Укажите apiBase в config.js');
    }
  };

  // ──────── PRICING PAGE ────────
  function renderPricing() {
    var content = document.getElementById('dashboard-content');
    content.innerHTML =
      '<h2 style="font-size:24px;font-weight:600;margin-bottom:24px;">Тарифы</h2>' +
      '<div class="pricing-grid" style="max-width:560px;">' +
        '<div class="pricing-card">' +
          '<h3>FREE</h3>' +
          '<div class="pricing-price">0 ₽</div>' +
          '<ul class="pricing-features">' +
            '<li><span class="check">✓</span> 3 проверки/день</li>' +
            '<li><span class="check">✓</span> Все форматы</li>' +
            '<li><span class="check">✓</span> Базовый вердикт</li>' +
          '</ul>' +
          '<span class="pricing-btn disabled">Текущий тариф</span>' +
        '</div>' +
        '<div class="pricing-card premium">' +
          '<span class="pricing-badge">СКОРО</span>' +
          '<h3>PREMIUM</h3>' +
          '<div class="pricing-price">199 ₽/мес</div>' +
          '<ul class="pricing-features">' +
            '<li><span class="check">✓</span> 100 проверок/мес</li>' +
            '<li><span class="check">✓</span> Приоритетная обработка</li>' +
            '<li><span class="check">✓</span> История 30 дней</li>' +
            '<li><span class="check">✓</span> Экспорт отчётов PDF</li>' +
            '<li><span class="check">✓</span> Поделиться результатом</li>' +
          '</ul>' +
          '<span class="pricing-btn disabled">Скоро</span>' +
        '</div>' +
      '</div>';
  }

  // ──────── ABOUT PAGE ────────
  function renderAbout() {
    var content = document.getElementById('dashboard-content');
    content.innerHTML =
      '<h2 style="font-size:24px;font-weight:600;margin-bottom:24px;">О проекте</h2>' +
      '<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:24px;margin-bottom:20px;">' +
        '<h3 style="font-weight:500;margin-bottom:16px;">Источник</h3>' +
        '<p style="color:var(--color-text-secondary);font-size:14px;line-height:1.6;">Система верификации медиаконтента на основе специализированных моделей ИИ. Проверяет фото, видео, аудио и текст на подлинность.</p>' +
      '</div>' +
      '<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:24px;margin-bottom:20px;">' +
        '<h3 style="font-weight:500;margin-bottom:16px;">Точность моделей</h3>' +
        '<div style="display:flex;flex-direction:column;gap:16px;">' +
          makeStatBar('Фото (Sightengine)', 94.4) +
          makeStatBar('Аудио (Resemble)', 99.5) +
          makeStatBar('Видео (pipeline)', 81) +
          makeStatBar('Текст (Sapling)', 98) +
        '</div>' +
      '</div>' +
      '<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:24px;">' +
        '<h3 style="font-weight:500;margin-bottom:12px;">Приватность</h3>' +
        '<p style="color:var(--color-text-secondary);font-size:14px;line-height:1.6;">Файлы обрабатываются исключительно в оперативной памяти сервера и не сохраняются на диске. Персональные данные не передаются третьим лицам.</p>' +
      '</div>' +
      '<p style="text-align:center;color:var(--color-text-muted);font-size:12px;margin-top:24px;">v0.2.0 · Источник</p>';
  }

  function makeStatBar(label, value) {
    return '<div>' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:14px;">' +
        '<span style="color:var(--color-text-secondary)">' + label + '</span>' +
        '<span>' + value + '%</span>' +
      '</div>' +
      '<div style="height:6px;background:var(--color-border);border-radius:3px;overflow:hidden;">' +
        '<div style="height:100%;width:' + value + '%;background:var(--color-accent);border-radius:3px;"></div>' +
      '</div>' +
    '</div>';
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

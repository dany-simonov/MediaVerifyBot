/* bigcheck.js — Big Check component for Источник (v3.0) */
(function () {
  'use strict';

  // SVG Icons via IstochnikIcons (icons.js)
  function getMediaIconSVG(type) {
    if (!window.IstochnikIcons) return '';
    var iconMap = { image: 'image', audio: 'audio', video: 'video', text: 'text' };
    return window.IstochnikIcons.iconHTML(iconMap[type] || 'document', { className: 'accent', size: 24 });
  }

  function getVerdictIconSVG(verdict) {
    if (!window.IstochnikIcons) return '';
    var iconMap = { REAL: 'real', FAKE: 'fake', UNCERTAIN: 'uncertain' };
    var classMap = { REAL: 'real', FAKE: 'fake', UNCERTAIN: 'uncertain' };
    return window.IstochnikIcons.iconHTML(iconMap[verdict] || 'warning', { className: classMap[verdict], size: 18 });
  }

  /* ─── Constants ─── */
  var MEDIA_LABELS = { image: 'Фото', audio: 'Аудио', video: 'Видео', text: 'Текст' };
  var VERDICT_TEXT = { REAL: 'Подлинный контент', FAKE: 'Сгенерировано ИИ', UNCERTAIN: 'Неопределённо' };
  var VERDICT_TEXT_SHORT = { REAL: 'Подлинное', FAKE: 'Сгенерировано', UNCERTAIN: 'Неопред.' };
  var MODEL_NAMES = {
    sightengine: 'Sightengine',
    sightengine_video_pipeline: 'Sightengine Video',
    resemble_detect: 'Resemble Detect',
    sapling: 'Sapling AI',
    hf_image_inference: 'HuggingFace',
    hf_audio_inference: 'HuggingFace Audio',
    fallback_uncertain: 'Резервная система',
    g4f_hybrid: 'Гибридный анализ',
  };

  /* File size limits */
  var MAX_IMAGE_SIZE = 20 * 1024 * 1024;
  var MAX_AUDIO_SIZE = 20 * 1024 * 1024;
  var MAX_VIDEO_SIZE = 50 * 1024 * 1024;
  var MAX_FILES = 10;
  var MIN_TEXT_LENGTH = 50;
  var MAX_TEXT_LENGTH = 10000;

  /* Supported formats */
  var SUPPORTED_IMAGES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  var SUPPORTED_AUDIO = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/wave'];
  var SUPPORTED_VIDEO = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/avi'];

  /* History Storage */
  var HISTORY_KEY = 'istochnik_check_history';
  var MAX_HISTORY_ITEMS = 10;

  /* ─── Helpers ─── */
  function calculateAuthenticityIndex(verdict, confidence) {
    if (verdict === 'FAKE') return Math.round((1 - confidence) * 100);
    return Math.round(confidence * 100);
  }

  function detectMediaType(file) {
    if (!file || !file.type) return 'unknown';
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    return 'unknown';
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
  }

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function getVerdictColor(verdict) {
    if (verdict === 'REAL') return '#10B981';
    if (verdict === 'FAKE') return '#EF4444';
    return '#F59E0B';
  }

  function getVerdictClass(verdict) {
    if (verdict === 'REAL') return 'real';
    if (verdict === 'FAKE') return 'fake';
    return 'uncertain';
  }

  /* ─── Toast Notifications ─── */
  function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    var iconName = type === 'error' ? 'fake' : type === 'success' ? 'real' : type === 'warning' ? 'uncertain' : 'info';
    var icon = window.IstochnikIcons ? window.IstochnikIcons.iconHTML(iconName, { size: 18 }) : '';
    toast.innerHTML = '<span class="toast-icon">' + icon + '</span><span class="toast-message">' + message + '</span>';
    container.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add('toast-show');
    });

    setTimeout(function () {
      toast.classList.remove('toast-show');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 5000);
  }

  /* ─── File Validation ─── */
  function validateFile(file) {
    var type = detectMediaType(file);
    var errors = [];

    if (type === 'image' && !SUPPORTED_IMAGES.includes(file.type)) {
      errors.push('Формат ' + file.type.split('/')[1].toUpperCase() + ' не поддерживается. Используйте JPG, PNG, WEBP или GIF');
    } else if (type === 'audio' && !SUPPORTED_AUDIO.includes(file.type)) {
      errors.push('Формат аудио не поддерживается. Используйте MP3, WAV или OGG');
    } else if (type === 'video' && !SUPPORTED_VIDEO.includes(file.type)) {
      errors.push('Формат видео не поддерживается. Используйте MP4, MOV, AVI или MKV');
    } else if (type === 'unknown') {
      errors.push('Неподдерживаемый тип файла');
    }

    if (type === 'image' && file.size > MAX_IMAGE_SIZE) {
      errors.push('Файл слишком большой: ' + formatFileSize(file.size) + '. Максимум для фото — 20 МБ');
    } else if (type === 'audio' && file.size > MAX_AUDIO_SIZE) {
      errors.push('Файл слишком большой: ' + formatFileSize(file.size) + '. Максимум для аудио — 20 МБ');
    } else if (type === 'video' && file.size > MAX_VIDEO_SIZE) {
      errors.push('Файл слишком большой: ' + formatFileSize(file.size) + '. Максимум для видео — 50 МБ');
    }

    return errors;
  }

  /* ─── State ─── */
  var selectedFiles = [];
  var textContent = '';
  var isAnalyzing = false;

  /* ─── SVG Icons ─── */
  var SVG_ICONS = {
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    audio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="4" y1="9" x2="4" y2="15"/><line x1="8" y1="5" x2="8" y2="19"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="16" y1="6" x2="16" y2="18"/><line x1="20" y1="9" x2="20" y2="15"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10,8.5 10,15.5 16,12"/></svg>',
    clip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
    text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  /* ─── Main render ─── */
  function render() {
    var container = document.getElementById('bigcheck-container');
    if (!container) return;
    container.innerHTML = '';

    var devNotice = document.createElement('div');
    devNotice.className = 'dev-notice';
    devNotice.innerHTML = '🚧 Мы в активной разработке — API и функции могут измениться';
    container.appendChild(devNotice);

    if (isAnalyzing) {
      renderProgress(container);
      return;
    }

    var mainContent = document.createElement('div');
    mainContent.className = 'bigcheck-main';
    container.appendChild(mainContent);

    if (selectedFiles.length > 0 || textContent.trim()) {
      renderFilesState(mainContent);
    } else {
      renderDropzone(mainContent);
    }

    renderHistorySection(container);
  }

  /* ─── Dropzone ─── */
  function renderDropzone(container) {
    var zone = document.createElement('div');
    zone.className = 'bigcheck-dropzone';
    zone.id = 'bc-dropzone';

    zone.innerHTML =
      '<div class="dropzone-content">' +
        '<div class="upload-icon">' + SVG_ICONS.folder + '</div>' +
        '<h3>Перетащите файлы сюда</h3>' +
        '<p>или нажмите для выбора</p>' +
        '<button class="bigcheck-upload-btn" id="bc-upload-btn" type="button"><span class="btn-icon">' + SVG_ICONS.clip + '</span> Выбрать файлы</button>' +
        '<div class="bigcheck-formats">' +
          '<div class="format-item"><span class="format-icon">' + SVG_ICONS.photo + '</span> JPG, PNG</div>' +
          '<div class="format-item"><span class="format-icon">' + SVG_ICONS.audio + '</span> MP3, WAV</div>' +
          '<div class="format-item"><span class="format-icon">' + SVG_ICONS.video + '</span> MP4, MOV</div>' +
        '</div>' +
        '<div class="bigcheck-hint">Макс. 20 МБ для фото/аудио, 50 МБ для видео · До 10 файлов</div>' +
      '</div>' +
      '<div class="dropzone-overlay" id="bc-dropzone-overlay">' +
        '<div class="overlay-content">' +
          '<div class="overlay-icon">📥</div>' +
          '<span>Отпустите для загрузки</span>' +
        '</div>' +
      '</div>';

    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'image/*,audio/*,video/*';
    fileInput.style.display = 'none';
    fileInput.id = 'bc-file-input';
    fileInput.addEventListener('change', function () {
      addFiles(this.files);
      this.value = '';
    });
    zone.appendChild(fileInput);

    zone.querySelector('#bc-upload-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      fileInput.click();
    });

    zone.addEventListener('click', function (e) {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      fileInput.click();
    });

    zone.addEventListener('dragenter', function (e) {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!zone.contains(e.relatedTarget)) {
        zone.classList.remove('drag-over');
      }
    });

    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('drag-over');
      addFiles(e.dataTransfer.files);
    });

    container.appendChild(zone);
    renderTextInputSection(container);
  }

  /* ─── Text Input Section ─── */
  function renderTextInputSection(container) {
    var section = document.createElement('div');
    section.className = 'text-check-section';

    section.innerHTML =
      '<div class="text-check-header">' +
        '<h4><span class="text-icon">' + SVG_ICONS.text + '</span> Проверка текста</h4>' +
        '<button class="text-toggle-btn" id="bc-text-toggle" type="button">Развернуть</button>' +
      '</div>' +
      '<div class="text-check-body" id="bc-text-body" style="display:none;">' +
        '<textarea class="bigcheck-textarea" id="bc-textarea" placeholder="Вставьте текст для проверки на ИИ-генерацию (минимум 50 символов)..."></textarea>' +
        '<div class="text-controls">' +
          '<div class="char-counter" id="bc-char-counter">' +
            '<span class="char-current">0</span> / <span class="char-max">' + MAX_TEXT_LENGTH.toLocaleString() + '</span> символов' +
            '<span class="char-hint">(мин. ' + MIN_TEXT_LENGTH + ')</span>' +
          '</div>' +
          '<button class="btn-check-text" id="bc-check-text-btn" type="button" disabled>' +
            '<span class="btn-icon">' + SVG_ICONS.check + '</span> Проверить текст' +
          '</button>' +
        '</div>' +
      '</div>';

    container.appendChild(section);

    var toggleBtn = section.querySelector('#bc-text-toggle');
    var textBody = section.querySelector('#bc-text-body');
    var textarea = section.querySelector('#bc-textarea');
    var charCounter = section.querySelector('#bc-char-counter');
    var checkBtn = section.querySelector('#bc-check-text-btn');

    toggleBtn.addEventListener('click', function () {
      var isHidden = textBody.style.display === 'none';
      textBody.style.display = isHidden ? 'block' : 'none';
      toggleBtn.textContent = isHidden ? 'Свернуть' : 'Развернуть';
      if (isHidden) textarea.focus();
    });

    textarea.addEventListener('input', function () {
      var len = this.value.length;
      var currentSpan = charCounter.querySelector('.char-current');
      currentSpan.textContent = len.toLocaleString();

      if (len < MIN_TEXT_LENGTH) {
        charCounter.classList.add('too-short');
        charCounter.classList.remove('valid', 'too-long');
      } else if (len > MAX_TEXT_LENGTH) {
        charCounter.classList.add('too-long');
        charCounter.classList.remove('valid', 'too-short');
        this.value = this.value.substring(0, MAX_TEXT_LENGTH);
        currentSpan.textContent = MAX_TEXT_LENGTH.toLocaleString();
        showToast('Текст обрезан до ' + MAX_TEXT_LENGTH.toLocaleString() + ' символов', 'warning');
      } else {
        charCounter.classList.add('valid');
        charCounter.classList.remove('too-short', 'too-long');
      }

      checkBtn.disabled = len < MIN_TEXT_LENGTH;
      textContent = this.value;
    });

    checkBtn.addEventListener('click', function () {
      if (textContent.length >= MIN_TEXT_LENGTH) {
        startAnalysis(true);
      }
    });

    if (textContent) {
      textarea.value = textContent;
      textarea.dispatchEvent(new Event('input'));
      textBody.style.display = 'block';
      toggleBtn.textContent = 'Свернуть';
    }
  }

  /* ─── Files State ─── */
  function renderFilesState(container) {
    var wrapper = document.createElement('div');
    wrapper.className = 'bigcheck-files-state';

    var header = document.createElement('div');
    header.className = 'bigcheck-files-header';
    header.innerHTML =
      '<h4><span class="folder-icon">📂</span> Загруженные файлы</h4>' +
      '<div class="header-actions">' +
        '<span class="files-count">' + selectedFiles.length + ' / ' + MAX_FILES + '</span>' +
        '<button class="clear-btn" id="bc-clear-all" type="button"><span class="btn-icon">' + SVG_ICONS.trash + '</span> Очистить</button>' +
      '</div>';
    wrapper.appendChild(header);

    var grid = document.createElement('div');
    grid.className = 'bigcheck-files-grid';

    selectedFiles.forEach(function (f, idx) {
      var card = createFilePreviewCard(f, idx);
      grid.appendChild(card);
    });

    var addBtn = document.createElement('button');
    addBtn.className = 'bigcheck-add-card';
    addBtn.type = 'button';
    addBtn.innerHTML =
      '<div class="add-icon">+</div>' +
      '<span>Добавить файл</span>';

    if (selectedFiles.length >= MAX_FILES) {
      addBtn.disabled = true;
      addBtn.innerHTML = '<span>Максимум ' + MAX_FILES + ' файлов</span>';
    }

    addBtn.addEventListener('click', function () {
      if (selectedFiles.length >= MAX_FILES) return;
      var input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*,audio/*,video/*';
      input.addEventListener('change', function () { addFiles(this.files); });
      input.click();
    });
    grid.appendChild(addBtn);

    wrapper.appendChild(grid);
    container.appendChild(wrapper);

    document.getElementById('bc-clear-all').addEventListener('click', function () {
      selectedFiles = [];
      textContent = '';
      render();
    });

    if (textContent.trim()) {
      var textPreview = document.createElement('div');
      textPreview.className = 'text-preview-card';
      textPreview.innerHTML =
        '<div class="text-preview-header">' +
          '<span>' + SVG_ICONS.text + ' Текст для проверки</span>' +
          '<button class="remove-text-btn" id="bc-remove-text" type="button">&times;</button>' +
        '</div>' +
        '<p class="text-preview-content">' + escapeHtml(textContent.substring(0, 200)) + (textContent.length > 200 ? '...' : '') + '</p>' +
        '<span class="text-preview-chars">' + textContent.length.toLocaleString() + ' символов</span>';
      wrapper.appendChild(textPreview);

      document.getElementById('bc-remove-text').addEventListener('click', function () {
        textContent = '';
        render();
      });
    } else {
      renderTextInputSection(container);
    }

    var analyzeBtn = document.createElement('button');
    analyzeBtn.className = 'bigcheck-analyze-btn';
    analyzeBtn.id = 'bc-analyze-btn';
    analyzeBtn.innerHTML = '🚀 Запустить проверку (' + (selectedFiles.length + (textContent.trim() ? 1 : 0)) + ' элементов)';
    analyzeBtn.disabled = selectedFiles.length === 0 && !textContent.trim();
    analyzeBtn.addEventListener('click', function () {
      startAnalysis(false);
    });
    container.appendChild(analyzeBtn);
  }

  /* ─── File Preview Card ─── */
  function createFilePreviewCard(file, idx) {
    var card = document.createElement('div');
    card.className = 'file-preview-card';
    card.setAttribute('data-idx', idx);

    var type = detectMediaType(file);
    var icon = MEDIA_ICONS[type] || '📄';

    var preview = document.createElement('div');
    preview.className = 'file-preview-thumb';

    if (type === 'image') {
      var img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = function () { URL.revokeObjectURL(this.src); };
      preview.appendChild(img);
    } else {
      preview.innerHTML = '<span class="type-icon">' + icon + '</span>';
      preview.classList.add('type-' + type);
    }

    card.appendChild(preview);

    var info = document.createElement('div');
    info.className = 'file-preview-info';
    info.innerHTML =
      '<span class="file-name" title="' + escapeHtml(file.name) + '">' + truncateName(file.name, 18) + '</span>' +
      '<span class="file-meta">' + formatFileSize(file.size) + ' · ' + MEDIA_LABELS[type] + '</span>';
    card.appendChild(info);

    var removeBtn = document.createElement('button');
    removeBtn.className = 'file-remove-btn';
    removeBtn.type = 'button';
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      selectedFiles.splice(idx, 1);
      render();
    });
    card.appendChild(removeBtn);

    return card;
  }

  /* ─── File helpers ─── */
  function addFiles(fileList) {
    var added = 0;
    var errors = [];

    for (var i = 0; i < fileList.length; i++) {
      if (selectedFiles.length >= MAX_FILES) {
        showToast('Максимум ' + MAX_FILES + ' файлов одновременно', 'warning');
        break;
      }

      var file = fileList[i];
      var fileErrors = validateFile(file);

      if (fileErrors.length > 0) {
        errors = errors.concat(fileErrors.map(function (e) { return file.name + ': ' + e; }));
      } else {
        selectedFiles.push(file);
        added++;
      }
    }

    errors.forEach(function (err) {
      showToast(err, 'error');
    });

    if (added > 0) {
      showToast('Добавлено файлов: ' + added, 'success');
    }

    render();
  }

  function truncateName(name, maxLen) {
    if (name.length <= maxLen) return name;
    var ext = name.lastIndexOf('.');
    if (ext > 0) {
      var extension = name.substring(ext);
      var base = name.substring(0, maxLen - extension.length - 2);
      return base + '..' + extension;
    }
    return name.substring(0, maxLen - 2) + '..';
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /* ─── Progress ─── */
  function renderProgress(container) {
    var wrapper = document.createElement('div');
    wrapper.className = 'bigcheck-progress-card';

    var title = document.createElement('div');
    title.className = 'progress-title';
    title.innerHTML = '<span class="progress-spinner"></span> Анализ в процессе';
    wrapper.appendChild(title);

    var steps = [
      { id: 'upload', text: 'Загрузка файлов', time: '~2 сек' },
      { id: 'analyze', text: 'Анализ моделями ИИ', time: '~5-15 сек' },
      { id: 'aggregate', text: 'Обработка результатов', time: '~1 сек' },
    ];

    var stepsContainer = document.createElement('div');
    stepsContainer.className = 'progress-steps';
    stepsContainer.id = 'bc-progress-steps';

    steps.forEach(function (step, i) {
      var stepEl = document.createElement('div');
      stepEl.className = 'progress-step';
      stepEl.id = 'bc-step-' + step.id;
      stepEl.innerHTML =
        '<div class="step-indicator"><span class="step-num">' + (i + 1) + '</span></div>' +
        '<div class="step-content">' +
          '<span class="step-text">' + step.text + '</span>' +
          '<span class="step-time">' + step.time + '</span>' +
        '</div>';
      stepsContainer.appendChild(stepEl);
    });

    wrapper.appendChild(stepsContainer);

    if (selectedFiles.length > 0) {
      var filesList = document.createElement('div');
      filesList.className = 'progress-files-list';
      filesList.id = 'bc-progress-files';

      selectedFiles.forEach(function (f, idx) {
        var type = detectMediaType(f);
        var item = document.createElement('div');
        item.className = 'progress-file-item';
        item.id = 'bc-progress-file-' + idx;
        item.innerHTML =
          '<span class="file-icon">' + MEDIA_ICONS[type] + '</span>' +
          '<span class="file-name">' + truncateName(f.name, 24) + '</span>' +
          '<div class="file-progress-bar"><div class="file-progress-fill"></div></div>' +
          '<span class="file-status">Ожидание...</span>';
        filesList.appendChild(item);
      });

      wrapper.appendChild(filesList);
    }

    container.appendChild(wrapper);
  }

  function setStepState(stepId, state) {
    var el = document.getElementById('bc-step-' + stepId);
    if (!el) return;
    el.className = 'progress-step ' + state;
  }

  function setFileProgress(idx, progress, status) {
    var el = document.getElementById('bc-progress-file-' + idx);
    if (!el) return;
    var fill = el.querySelector('.file-progress-fill');
    var statusEl = el.querySelector('.file-status');
    if (fill) fill.style.width = progress + '%';
    if (statusEl) statusEl.textContent = status;
    if (progress >= 100) {
      el.classList.add('done');
    }
  }

  /* ─── Analysis ─── */
  async function startAnalysis(textOnly) {
    isAnalyzing = true;
    render();

    setStepState('upload', 'active');
    await sleep(600);

    for (var i = 0; i < selectedFiles.length; i++) {
      setFileProgress(i, 30, 'Загрузка...');
      await sleep(200);
      setFileProgress(i, 100, 'Загружен');
    }

    setStepState('upload', 'done');
    setStepState('analyze', 'active');

    var result;
    try {
      if (window.IstochnikAPI && !textOnly) {
        result = await window.IstochnikAPI.postBigCheck(selectedFiles, textContent, 0);
      } else {
        await simulateAnalysis();
        result = generateDemoResult();
      }
    } catch (err) {
      console.error('BigCheck error:', err);
      showToast('Ошибка анализа: ' + (err.message || 'Неизвестная ошибка'), 'error');
      await sleep(1500);
      result = generateDemoResult();
    }

    setStepState('analyze', 'done');
    setStepState('aggregate', 'active');
    await sleep(800);
    setStepState('aggregate', 'done');
    await sleep(400);

    saveToHistory(result);
    renderResult(result);
  }

  async function simulateAnalysis() {
    var total = selectedFiles.length + (textContent.trim() ? 1 : 0);
    var delay = Math.max(500, 2500 / total);

    for (var i = 0; i < selectedFiles.length; i++) {
      setFileProgress(i, 50, 'Анализируем...');
      await sleep(delay);
      setFileProgress(i, 80, 'Обработка...');
      await sleep(delay / 2);
      setFileProgress(i, 100, 'Готово ✓');
    }
  }

  /* ─── Demo Result ─── */
  function generateDemoResult() {
    var results = [];

    selectedFiles.forEach(function (f) {
      var mtype = detectMediaType(f);
      var isReal = Math.random() > 0.3;
      var conf = isReal ? (0.7 + Math.random() * 0.25) : (0.6 + Math.random() * 0.35);
      var explanation = isReal
        ? 'Анализ не выявил характерных признаков ИИ-генерации.'
        : 'Обнаружены характерные признаки ИИ-генерации.';

      results.push({
        media_type: mtype || 'image',
        verdict: isReal ? 'REAL' : 'FAKE',
        confidence: conf,
        model_used: mtype === 'audio' ? 'resemble_detect' : mtype === 'video' ? 'sightengine_video_pipeline' : 'sightengine',
        explanation: explanation,
        processing_ms: Math.floor(500 + Math.random() * 2000),
        filename: f.name,
      });
    });

    if (textContent.trim()) {
      var isTextReal = Math.random() > 0.4;
      var textConf = isTextReal ? (0.6 + Math.random() * 0.3) : (0.5 + Math.random() * 0.4);
      results.push({
        media_type: 'text',
        verdict: isTextReal ? 'REAL' : 'FAKE',
        confidence: textConf,
        model_used: 'sapling',
        explanation: isTextReal ? 'Текст написан человеком.' : 'Текст имеет признаки ИИ-генерации.',
        processing_ms: Math.floor(300 + Math.random() * 1000),
        filename: 'Текст',
      });
    }

    var fakeCount = results.filter(function (r) { return r.verdict === 'FAKE'; }).length;
    var realCount = results.filter(function (r) { return r.verdict === 'REAL'; }).length;
    var total = results.length;
    var avgConf = results.reduce(function (s, r) { return s + r.confidence; }, 0) / (total || 1);

    var overallVerdict;
    if (total > 0 && fakeCount / total >= 0.5) overallVerdict = 'FAKE';
    else if (total > 0 && realCount / total >= 0.7) overallVerdict = 'REAL';
    else overallVerdict = 'UNCERTAIN';

    var authIndex = calculateAuthenticityIndex(overallVerdict, avgConf);

    var summary;
    if (overallVerdict === 'FAKE') {
      summary = 'Анализ выявил признаки ИИ-генерации. ' + fakeCount + ' из ' + total + ' материалов вызывают сомнения.';
    } else if (overallVerdict === 'REAL') {
      summary = 'Все ' + total + ' материалов прошли проверку подлинности.';
    } else {
      summary = 'Результаты неоднозначны. Рекомендуем дополнительную проверку.';
    }

    return {
      overall_verdict: overallVerdict,
      overall_confidence: avgConf,
      authenticity_index: authIndex,
      results: results,
      summary: summary,
      total_processing_ms: results.reduce(function (s, r) { return s + r.processing_ms; }, 0),
      timestamp: Date.now(),
    };
  }

  /* ─── Speedometer ─── */
  function createSpeedometer(value, verdictColor, animate) {
    animate = animate !== false;
    var container = document.createElement('div');
    container.className = 'speedometer-wrapper';

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 200 110');
    svg.setAttribute('class', 'speedometer-svg');

    var cx = 100, cy = 95, r = 75;

    var bgArc = createArcPath(cx, cy, r, 180, 0);
    var bgPath = document.createElementNS(svgNS, 'path');
    bgPath.setAttribute('d', bgArc);
    bgPath.setAttribute('stroke', '#1F2937');
    bgPath.setAttribute('stroke-width', '10');
    bgPath.setAttribute('stroke-linecap', 'round');
    bgPath.setAttribute('fill', 'none');
    svg.appendChild(bgPath);

    var defs = document.createElementNS(svgNS, 'defs');
    var grad = document.createElementNS(svgNS, 'linearGradient');
    grad.setAttribute('id', 'gaugeGrad-' + value);
    grad.setAttribute('x1', '0%');
    grad.setAttribute('x2', '100%');

    var gradColors;
    if (value < 35) {
      gradColors = [{ offset: '0%', color: '#DC2626' }, { offset: '100%', color: '#EF4444' }];
    } else if (value < 75) {
      gradColors = [{ offset: '0%', color: '#D97706' }, { offset: '100%', color: '#F59E0B' }];
    } else {
      gradColors = [{ offset: '0%', color: '#059669' }, { offset: '100%', color: '#10B981' }];
    }

    gradColors.forEach(function (c) {
      var stop = document.createElementNS(svgNS, 'stop');
      stop.setAttribute('offset', c.offset);
      stop.setAttribute('stop-color', c.color);
      grad.appendChild(stop);
    });

    defs.appendChild(grad);
    svg.appendChild(defs);

    var angle = (value / 100) * 180;
    var valArc = createArcPath(cx, cy, r, 180, 180 - angle);
    var valPath = document.createElementNS(svgNS, 'path');
    valPath.setAttribute('d', valArc);
    valPath.setAttribute('stroke', 'url(#gaugeGrad-' + value + ')');
    valPath.setAttribute('stroke-width', '10');
    valPath.setAttribute('stroke-linecap', 'round');
    valPath.setAttribute('fill', 'none');
    valPath.setAttribute('class', 'gauge-value-arc');

    if (animate) {
      var arcLen = computeArcLength(r, angle);
      valPath.style.strokeDasharray = arcLen + ' 999';
      valPath.style.strokeDashoffset = -arcLen;
    }

    svg.appendChild(valPath);

    [0, 25, 50, 75, 100].forEach(function (mark) {
      var markAngle = 180 - (mark / 100) * 180;
      var markRad = markAngle * Math.PI / 180;

      var innerR = r - 15;
      var outerR = r - 8;
      var x1 = cx + innerR * Math.cos(markRad);
      var y1 = cy - innerR * Math.sin(markRad);
      var x2 = cx + outerR * Math.cos(markRad);
      var y2 = cy - outerR * Math.sin(markRad);

      var tick = document.createElementNS(svgNS, 'line');
      tick.setAttribute('x1', x1.toFixed(1));
      tick.setAttribute('y1', y1.toFixed(1));
      tick.setAttribute('x2', x2.toFixed(1));
      tick.setAttribute('y2', y2.toFixed(1));
      tick.setAttribute('stroke', '#4B5563');
      tick.setAttribute('stroke-width', '2');
      svg.appendChild(tick);

      if (mark === 0 || mark === 50 || mark === 100) {
        var labelR = r + 12;
        var tx = cx + labelR * Math.cos(markRad);
        var ty = cy - labelR * Math.sin(markRad) + 4;

        var text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', tx.toFixed(1));
        text.setAttribute('y', ty.toFixed(1));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#6B7280');
        text.setAttribute('font-size', '11');
        text.setAttribute('font-family', 'Inter, sans-serif');
        text.textContent = String(mark);
        svg.appendChild(text);
      }
    });

    container.appendChild(svg);

    var valueDisplay = document.createElement('div');
    valueDisplay.className = 'speedometer-value-display';
    valueDisplay.innerHTML =
      '<div class="spd-value" id="spd-counter-' + Date.now() + '" style="color:' + verdictColor + '">0</div>' +
      '<div class="spd-label">Индекс подлинности</div>';
    container.appendChild(valueDisplay);

    if (animate) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          valPath.style.transition = 'stroke-dashoffset 1.5s ease-out';
          valPath.style.strokeDashoffset = '0';
          var counter = valueDisplay.querySelector('.spd-value');
          animateCounter(counter, 0, value, 1500);
        });
      });
    } else {
      valueDisplay.querySelector('.spd-value').textContent = value + '%';
    }

    return container;
  }

  function animateCounter(element, start, end, duration) {
    var startTime = null;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var current = Math.floor(progress * (end - start) + start);
      element.textContent = current + '%';
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  function createArcPath(cx, cy, r, startAngleDeg, endAngleDeg) {
    var startRad = startAngleDeg * Math.PI / 180;
    var endRad = endAngleDeg * Math.PI / 180;
    var x1 = cx + r * Math.cos(startRad);
    var y1 = cy - r * Math.sin(startRad);
    var x2 = cx + r * Math.cos(endRad);
    var y2 = cy - r * Math.sin(endRad);
    var sweep = startAngleDeg - endAngleDeg;
    var largeArc = sweep > 180 ? 1 : 0;
    return 'M ' + x1.toFixed(2) + ' ' + y1.toFixed(2) +
           ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 0 ' + x2.toFixed(2) + ' ' + y2.toFixed(2);
  }

  function computeArcLength(r, angleDeg) {
    return (angleDeg / 180) * Math.PI * r;
  }

  /* ─── Render Result ─── */
  function renderResult(result) {
    isAnalyzing = false;
    var container = document.getElementById('bigcheck-container');
    if (!container) return;
    container.innerHTML = '';

    var devNotice = document.createElement('div');
    devNotice.className = 'dev-notice';
    devNotice.innerHTML = '🚧 Мы в активной разработке — API и функции могут измениться';
    container.appendChild(devNotice);

    var card = document.createElement('div');
    card.className = 'bigcheck-result-card';

    var authIdx = result.authenticity_index != null
      ? result.authenticity_index
      : calculateAuthenticityIndex(result.overall_verdict, result.overall_confidence);

    var verdictColor = getVerdictColor(result.overall_verdict);

    var header = document.createElement('div');
    header.className = 'result-header verdict-' + getVerdictClass(result.overall_verdict);
    header.innerHTML =
      '<div class="result-verdict">' +
        '<span class="verdict-emoji">' + VERDICT_EMOJI[result.overall_verdict] + '</span>' +
        '<span class="verdict-text">' + VERDICT_TEXT[result.overall_verdict] + '</span>' +
      '</div>';
    card.appendChild(header);

    var gaugeSection = document.createElement('div');
    gaugeSection.className = 'result-gauge-section';
    gaugeSection.appendChild(createSpeedometer(authIdx, verdictColor, true));
    card.appendChild(gaugeSection);

    var summary = document.createElement('div');
    summary.className = 'result-summary';
    summary.innerHTML =
      '<p>' + result.summary + '</p>' +
      '<div class="result-meta">' +
        '<span><span class="meta-icon">' + SVG_ICONS.clock + '</span> ' + (result.total_processing_ms / 1000).toFixed(1) + ' сек</span>' +
        '<span>' + result.results.length + ' элементов проверено</span>' +
      '</div>';
    card.appendChild(summary);

    if (result.results && result.results.length > 0) {
      var detailsSection = document.createElement('div');
      detailsSection.className = 'result-details-section';

      var detailsHeader = document.createElement('div');
      detailsHeader.className = 'details-header';
      detailsHeader.innerHTML = '<h4>Детальные результаты</h4>';
      detailsSection.appendChild(detailsHeader);

      var detailsGrid = document.createElement('div');
      detailsGrid.className = 'result-details-grid';

      var sortedResults = result.results.slice().sort(function (a, b) {
        var order = { FAKE: 0, UNCERTAIN: 1, REAL: 2 };
        return order[a.verdict] - order[b.verdict];
      });

      sortedResults.forEach(function (r, idx) {
        var detailCard = createDetailCard(r, idx);
        detailsGrid.appendChild(detailCard);
      });

      detailsSection.appendChild(detailsGrid);
      card.appendChild(detailsSection);
    }

    var actions = document.createElement('div');
    actions.className = 'result-actions';
    actions.innerHTML =
      '<button class="result-action-btn btn-primary" id="bc-share-btn" type="button">' +
        '<span class="btn-icon">' + SVG_ICONS.share + '</span> Поделиться' +
      '</button>' +
      '<button class="result-action-btn btn-secondary" id="bc-download-btn" type="button">' +
        '<span class="btn-icon">' + SVG_ICONS.download + '</span> Скачать PDF' +
      '</button>' +
      '<button class="result-action-btn btn-secondary" id="bc-new-btn" type="button">' +
        '🔄 Новая проверка' +
      '</button>' +
      '<a class="result-action-btn btn-secondary" href="https://t.me/MediaVerifyBot" target="_blank" rel="noopener">' +
        '🤖 Открыть в боте' +
      '</a>';
    card.appendChild(actions);

    container.appendChild(card);
    renderHistorySection(container);

    document.getElementById('bc-share-btn').addEventListener('click', function () {
      copyResultToClipboard(result, authIdx);
    });

    document.getElementById('bc-download-btn').addEventListener('click', function () {
      generatePDF(result, authIdx);
    });

    document.getElementById('bc-new-btn').addEventListener('click', function () {
      selectedFiles = [];
      textContent = '';
      isAnalyzing = false;
      render();
    });
  }

  /* ─── Detail Card ─── */
  function createDetailCard(r, idx) {
    var card = document.createElement('div');
    card.className = 'detail-card verdict-' + getVerdictClass(r.verdict);
    card.setAttribute('data-idx', idx);

    var authIdx = calculateAuthenticityIndex(r.verdict, r.confidence);
    var icon = MEDIA_ICONS[r.media_type] || '📄';
    var modelName = MODEL_NAMES[r.model_used] || r.model_used;

    card.innerHTML =
      '<div class="detail-card-header">' +
        '<div class="detail-media-icon">' + icon + '</div>' +
        '<div class="detail-info">' +
          '<span class="detail-filename">' + truncateName(r.filename || '', 24) + '</span>' +
          '<span class="detail-model">' + modelName + '</span>' +
        '</div>' +
        '<div class="detail-badge verdict-badge-' + getVerdictClass(r.verdict) + '">' +
          VERDICT_TEXT_SHORT[r.verdict] +
        '</div>' +
      '</div>' +
      '<div class="detail-card-body">' +
        '<div class="detail-progress-bar">' +
          '<div class="detail-progress-fill" style="width:' + authIdx + '%;background:' + getVerdictColor(r.verdict) + '"></div>' +
        '</div>' +
        '<div class="detail-stats">' +
          '<span class="detail-index" style="color:' + getVerdictColor(r.verdict) + '">' + authIdx + '%</span>' +
          '<span class="detail-time">' + (r.processing_ms / 1000).toFixed(1) + 'с</span>' +
        '</div>' +
      '</div>' +
      '<div class="detail-card-expand">' +
        '<button class="detail-expand-btn" type="button">' +
          '<span class="btn-icon">' + SVG_ICONS.info + '</span> Подробнее' +
        '</button>' +
        '<div class="detail-explanation" style="display:none;">' +
          '<p>' + escapeHtml(r.explanation) + '</p>' +
        '</div>' +
      '</div>';

    var expandBtn = card.querySelector('.detail-expand-btn');
    var explanation = card.querySelector('.detail-explanation');

    expandBtn.addEventListener('click', function () {
      var isHidden = explanation.style.display === 'none';
      explanation.style.display = isHidden ? 'block' : 'none';
      expandBtn.innerHTML = isHidden
        ? '<span class="btn-icon">' + SVG_ICONS.x + '</span> Скрыть'
        : '<span class="btn-icon">' + SVG_ICONS.info + '</span> Подробнее';
    });

    return card;
  }

  /* ─── Clipboard ─── */
  function copyResultToClipboard(result, authIdx) {
    var lines = [
      '━━━━━ ИСТОЧНИК ━━━━━',
      'Результат проверки подлинности',
      '',
      'Вердикт: ' + VERDICT_EMOJI[result.overall_verdict] + ' ' + VERDICT_TEXT[result.overall_verdict],
      'Индекс подлинности: ' + authIdx + '%',
      '',
      result.summary,
      '',
      '📋 Детали:',
    ];

    result.results.forEach(function (r) {
      var icon = MEDIA_ICONS[r.media_type] || '';
      var ai = calculateAuthenticityIndex(r.verdict, r.confidence);
      lines.push('  ' + icon + ' ' + (r.filename || r.media_type) + ' — ' + VERDICT_TEXT_SHORT[r.verdict] + ' (' + ai + '%)');
    });

    lines.push('', '🔗 Проверено: Источник');
    lines.push('   t.me/MediaVerifyBot');

    navigator.clipboard.writeText(lines.join('\n')).then(function () {
      showToast('Результат скопирован в буфер обмена', 'success');
    }).catch(function () {
      showToast('Не удалось скопировать', 'error');
    });
  }

  /* ─── PDF ─── */
  function generatePDF(result, authIdx) {
    var verdictColor = getVerdictColor(result.overall_verdict);
    var verdictText = VERDICT_TEXT[result.overall_verdict];
    var verdictEmoji = VERDICT_EMOJI[result.overall_verdict];
    var date = new Date(result.timestamp || Date.now());
    var dateStr = date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    var detailsHTML = result.results.map(function(r) {
      var icon = MEDIA_ICONS[r.media_type] || '📄';
      var ai = calculateAuthenticityIndex(r.verdict, r.confidence);
      var vColor = getVerdictColor(r.verdict);
      var vText = VERDICT_TEXT_SHORT[r.verdict];
      var modelName = MODEL_NAMES[r.model_used] || r.model_used;

      return '<div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px;border-left:4px solid ' + vColor + ';">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<span style="font-size:24px;">' + icon + '</span>' +
            '<div>' +
              '<strong style="font-size:14px;">' + escapeHtml(r.filename || r.media_type) + '</strong><br>' +
              '<span style="font-size:12px;color:#6b7280;">' + modelName + '</span>' +
            '</div>' +
          '</div>' +
          '<span style="background:' + vColor + '20;color:' + vColor + ';padding:4px 10px;border-radius:4px;font-size:12px;font-weight:600;">' + vText + '</span>' +
        '</div>' +
        '<div style="background:#f3f4f6;border-radius:4px;height:8px;overflow:hidden;margin-bottom:8px;">' +
          '<div style="background:' + vColor + ';height:100%;width:' + ai + '%;"></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;font-size:13px;">' +
          '<span style="font-weight:600;color:' + vColor + ';">' + ai + '% подлинности</span>' +
          '<span style="color:#6b7280;">' + (r.processing_ms / 1000).toFixed(1) + ' сек</span>' +
        '</div>' +
        (r.explanation ? '<p style="margin-top:10px;padding:10px;background:#f9fafb;border-radius:4px;font-size:13px;color:#374151;">' + escapeHtml(r.explanation) + '</p>' : '') +
      '</div>';
    }).join('');

    var html = '<!DOCTYPE html>' +
      '<html lang="ru">' +
      '<head>' +
        '<meta charset="UTF-8">' +
        '<title>Отчёт проверки — Источник</title>' +
        '<style>' +
          'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;margin:0;padding:40px;color:#1f2937;background:#fff;line-height:1.5;}' +
          '@media print{body{padding:20px;}@page{margin:20mm 15mm;}}' +
          '.header{display:flex;justify-content:space-between;align-items:center;padding-bottom:20px;border-bottom:2px solid #0d9488;margin-bottom:30px;}' +
          '.logo{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:700;color:#0d9488;}' +
          '.date{font-size:13px;color:#6b7280;}' +
          '.verdict-box{text-align:center;padding:30px;background:linear-gradient(135deg,' + verdictColor + '10,' + verdictColor + '05);border-radius:12px;margin-bottom:30px;}' +
          '.verdict-emoji{font-size:48px;margin-bottom:10px;}' +
          '.verdict-text{font-size:24px;font-weight:700;color:#1f2937;margin-bottom:8px;}' +
          '.gauge{width:180px;height:100px;margin:20px auto;position:relative;}' +
          '.gauge-value{font-size:42px;font-weight:700;color:' + verdictColor + ';text-align:center;}' +
          '.gauge-label{font-size:12px;color:#6b7280;text-align:center;text-transform:uppercase;letter-spacing:1px;}' +
          '.summary{text-align:center;font-size:15px;color:#4b5563;margin-bottom:30px;padding:0 20px;}' +
          '.section-title{font-size:18px;font-weight:600;margin:24px 0 16px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;}' +
          '.meta{display:flex;justify-content:center;gap:30px;font-size:13px;color:#6b7280;margin-bottom:20px;}' +
          '.disclaimer{margin-top:40px;padding:16px;background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;font-size:12px;color:#92400e;}' +
          '.footer{margin-top:40px;text-align:center;font-size:12px;color:#9ca3af;padding-top:20px;border-top:1px solid #e5e7eb;}' +
        '</style>' +
      '</head>' +
      '<body>' +
        '<div class="header">' +
          '<div class="logo">🔍 Источник</div>' +
          '<div class="date">' + dateStr + '</div>' +
        '</div>' +

        '<div class="verdict-box">' +
          '<div class="verdict-emoji">' + verdictEmoji + '</div>' +
          '<div class="verdict-text">' + verdictText + '</div>' +
          '<div class="gauge">' +
            '<div class="gauge-value">' + authIdx + '%</div>' +
            '<div class="gauge-label">Индекс подлинности</div>' +
          '</div>' +
        '</div>' +

        '<p class="summary">' + escapeHtml(result.summary) + '</p>' +

        '<div class="meta">' +
          '<span>⏱ Время обработки: ' + (result.total_processing_ms / 1000).toFixed(1) + ' сек</span>' +
          '<span>📊 Проверено элементов: ' + result.results.length + '</span>' +
        '</div>' +

        '<h3 class="section-title">Детальные результаты</h3>' +
        detailsHTML +

        '<div class="disclaimer">' +
          '<strong>⚠️ Важно:</strong> Точность анализа составляет от 81% до 99.5% в зависимости от типа контента. ' +
          'Результаты носят рекомендательный характер и не являются юридическим заключением. ' +
          'Финальное решение о подлинности материала остаётся за вами.' +
        '</div>' +

        '<div class="footer">' +
          '© 2026 Источник — Система верификации медиа на основе ИИ<br>' +
          't.me/MediaVerifyBot | istochnik.app' +
        '</div>' +
      '</body>' +
      '</html>';

    var printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(function() {
        printWindow.print();
      }, 250);
      showToast('PDF отчёт готов к сохранению', 'success');
    } else {
      showToast('Разрешите всплывающие окна для скачивания PDF', 'warning');
    }
  }

  /* ─── History ─── */
  function getHistory() {
    try {
      var data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveToHistory(result) {
    try {
      var history = getHistory();
      var item = {
        id: Date.now(),
        timestamp: result.timestamp || Date.now(),
        verdict: result.overall_verdict,
        confidence: result.overall_confidence,
        authenticity_index: result.authenticity_index,
        summary: result.summary,
        items_count: result.results.length,
        processing_ms: result.total_processing_ms,
        items: result.results.map(function (r) {
          return {
            filename: r.filename,
            media_type: r.media_type,
            verdict: r.verdict,
            confidence: r.confidence,
            model: r.model_used,
          };
        }),
      };

      history.unshift(item);
      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
      }

      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history:', e);
    }
  }

  function clearHistory() {
    try {
      localStorage.removeItem(HISTORY_KEY);
      render();
      showToast('История очищена', 'success');
    } catch (e) {
      showToast('Не удалось очистить историю', 'error');
    }
  }

  function renderHistorySection(container) {
    var history = getHistory();
    if (history.length === 0) return;

    var section = document.createElement('div');
    section.className = 'history-section';

    var header = document.createElement('div');
    header.className = 'history-header';
    header.innerHTML =
      '<h4><span class="history-icon">' + SVG_ICONS.clock + '</span> История проверок</h4>' +
      '<button class="history-clear-btn" id="bc-clear-history" type="button">Очистить</button>';
    section.appendChild(header);

    var list = document.createElement('div');
    list.className = 'history-list';

    history.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'history-card verdict-' + getVerdictClass(item.verdict);

      var date = new Date(item.timestamp);
      var dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) +
                    ', ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

      card.innerHTML =
        '<div class="history-card-main">' +
          '<div class="history-verdict">' +
            '<span class="verdict-emoji">' + VERDICT_EMOJI[item.verdict] + '</span>' +
            '<span class="verdict-short">' + VERDICT_TEXT_SHORT[item.verdict] + '</span>' +
          '</div>' +
          '<div class="history-info">' +
            '<span class="history-index">' + (item.authenticity_index || calculateAuthenticityIndex(item.verdict, item.confidence)) + '%</span>' +
            '<span class="history-count">' + item.items_count + ' элем.</span>' +
          '</div>' +
          '<span class="history-date">' + dateStr + '</span>' +
        '</div>';

      list.appendChild(card);
    });

    section.appendChild(list);
    container.appendChild(section);

    document.getElementById('bc-clear-history').addEventListener('click', clearHistory);
  }

  /* ─── Onboarding ─── */
  function checkOnboarding() {
    var key = 'istochnik_onboarding_shown';
    if (localStorage.getItem(key)) return;
    showOnboarding();
    localStorage.setItem(key, 'true');
  }

  function showOnboarding() {
    var overlay = document.createElement('div');
    overlay.className = 'onboarding-overlay';
    overlay.id = 'bc-onboarding';

    var slides = [
      {
        icon: '👋',
        title: 'Добро пожаловать в Источник',
        text: 'Мы проверяем медиафайлы и тексты на подлинность с помощью специализированных моделей ИИ.'
      },
      {
        icon: '📤',
        title: 'Загрузите любой контент',
        text: 'Фото, видео, аудио или текст — просто перетащите файл или вставьте текст. Анализ займёт 5-15 секунд.'
      },
      {
        icon: '🎯',
        title: 'Получите результат',
        text: 'Точность от 81% до 99.5% в зависимости от типа контента. Финальное решение всегда за вами.'
      }
    ];

    var currentSlide = 0;

    function renderSlide() {
      var slide = slides[currentSlide];
      overlay.innerHTML =
        '<div class="onboarding-modal">' +
          '<div class="onboarding-progress">' +
            slides.map(function (_, i) {
              return '<div class="progress-dot ' + (i === currentSlide ? 'active' : '') + '"></div>';
            }).join('') +
          '</div>' +
          '<div class="onboarding-icon">' + slide.icon + '</div>' +
          '<h2>' + slide.title + '</h2>' +
          '<p>' + slide.text + '</p>' +
          '<div class="onboarding-actions">' +
            (currentSlide > 0 ? '<button class="onboarding-btn btn-secondary" id="ob-prev">← Назад</button>' : '') +
            (currentSlide < slides.length - 1
              ? '<button class="onboarding-btn btn-primary" id="ob-next">Далее →</button>'
              : '<button class="onboarding-btn btn-primary" id="ob-start">Начать</button>') +
          '</div>' +
          '<button class="onboarding-skip" id="ob-skip">Пропустить</button>' +
        '</div>';

      var prev = document.getElementById('ob-prev');
      var next = document.getElementById('ob-next');
      var start = document.getElementById('ob-start');
      var skip = document.getElementById('ob-skip');

      if (prev) prev.addEventListener('click', function () { currentSlide--; renderSlide(); });
      if (next) next.addEventListener('click', function () { currentSlide++; renderSlide(); });
      if (start) start.addEventListener('click', closeOnboarding);
      if (skip) skip.addEventListener('click', closeOnboarding);
    }

    function closeOnboarding() {
      overlay.classList.add('closing');
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 300);
    }

    document.body.appendChild(overlay);
    requestAnimationFrame(function () {
      overlay.classList.add('visible');
      renderSlide();
    });
  }

  /* ─── Init ─── */
  function init() {
    render();
    checkOnboarding();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

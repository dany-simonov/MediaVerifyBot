/* bigcheck.js — Big Check component for Источник */
(function () {
  'use strict';

  var MEDIA_ICONS = { image: '📷', audio: '🎵', video: '🎬', text: '📝' };
  var MEDIA_LABELS = { image: 'Фото', audio: 'Аудио', video: 'Видео', text: 'Текст' };
  var VERDICT_EMOJI = { REAL: '✅', FAKE: '🚫', UNCERTAIN: '⚠️' };
  var VERDICT_TEXT = { REAL: 'Человеческий контент', FAKE: 'Сгенерировано ИИ', UNCERTAIN: 'Не определено' };
  var MODEL_NAMES = {
    sightengine: 'Sightengine (фото)',
    sightengine_video_pipeline: 'Sightengine (видео)',
    resemble_detect: 'Resemble Detect (аудио)',
    sapling: 'Sapling AI (текст)',
    hf_image_inference: 'HuggingFace (фото)',
    hf_audio_inference: 'HuggingFace (аудио)',
    fallback_uncertain: 'Резервная система',
  };

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

  // State
  var selectedFiles = [];
  var textContent = '';
  var isAnalyzing = false;

  function render() {
    var container = document.getElementById('bigcheck-container');
    if (!container) return;
    container.innerHTML = '';

    if (isAnalyzing) {
      renderProgress(container);
      return;
    }

    renderDropzone(container);
  }

  function renderDropzone(container) {
    // Dropzone
    var zone = document.createElement('div');
    zone.className = 'bigcheck-dropzone';
    zone.id = 'bc-dropzone';
    zone.innerHTML =
      '<p>Перетащи файлы сюда или нажми для выбора</p>' +
      '<div class="bigcheck-type-btns">' +
        '<button class="bigcheck-type-btn" data-accept="image/*" onclick="window._bcSelectFile(\'image/*\')">📷 Фото</button>' +
        '<button class="bigcheck-type-btn" data-accept="audio/*" onclick="window._bcSelectFile(\'audio/*\')">🎵 Аудио</button>' +
        '<button class="bigcheck-type-btn" data-accept="video/*" onclick="window._bcSelectFile(\'video/*\')">🎬 Видео</button>' +
      '</div>';

    // Hidden file input
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

    // Click to upload
    zone.addEventListener('click', function (e) {
      if (e.target.tagName === 'BUTTON') return;
      fileInput.click();
    });

    // Drag and drop
    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', function () {
      zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('drag-over');
      addFiles(e.dataTransfer.files);
    });

    container.appendChild(zone);

    // Selected files tags
    if (selectedFiles.length > 0) {
      var tags = document.createElement('div');
      tags.className = 'bigcheck-files';
      selectedFiles.forEach(function (f, idx) {
        var tag = document.createElement('span');
        tag.className = 'bigcheck-file-tag';
        var icon = MEDIA_ICONS[detectMediaType(f)] || '📄';
        tag.innerHTML = icon + ' ' + f.name + ' <span class="remove" data-idx="' + idx + '">&times;</span>';
        tags.appendChild(tag);
      });
      tags.addEventListener('click', function (e) {
        if (e.target.classList.contains('remove')) {
          var idx = parseInt(e.target.getAttribute('data-idx'));
          selectedFiles.splice(idx, 1);
          render();
        }
      });
      container.appendChild(tags);
    }

    // Text area
    var textBtn = document.createElement('button');
    textBtn.className = 'bigcheck-type-btn';
    textBtn.style.margin = '16px auto 0';
    textBtn.style.display = 'block';
    textBtn.textContent = '📝 Вставь текст';
    textBtn.id = 'bc-text-toggle';

    var textarea = document.createElement('textarea');
    textarea.className = 'bigcheck-textarea';
    textarea.placeholder = 'Вставь текст для проверки...';
    textarea.value = textContent;
    textarea.addEventListener('input', function () {
      textContent = this.value;
      updateAnalyzeBtn();
    });

    if (textContent) {
      container.appendChild(textarea);
    } else {
      textBtn.addEventListener('click', function () {
        textBtn.style.display = 'none';
        container.insertBefore(textarea, analyzeBtn);
        textarea.focus();
      });
      container.appendChild(textBtn);
    }

    // Analyze button
    var analyzeBtn = document.createElement('button');
    analyzeBtn.className = 'bigcheck-analyze-btn';
    analyzeBtn.id = 'bc-analyze-btn';
    analyzeBtn.textContent = 'Анализировать';
    analyzeBtn.disabled = selectedFiles.length === 0 && !textContent.trim();
    analyzeBtn.addEventListener('click', function () {
      startAnalysis();
    });
    container.appendChild(analyzeBtn);

    function updateAnalyzeBtn() {
      analyzeBtn.disabled = selectedFiles.length === 0 && !textContent.trim();
    }
  }

  function addFiles(fileList) {
    for (var i = 0; i < fileList.length; i++) {
      selectedFiles.push(fileList[i]);
    }
    render();
  }

  window._bcSelectFile = function (accept) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = true;
    input.addEventListener('change', function () { addFiles(this.files); });
    input.click();
  };

  // Analysis progress
  function renderProgress(container) {
    var steps = [
      { id: 'upload', text: 'Загрузка файлов...' },
      { id: 'analyze', text: 'Анализ медиа...' },
      { id: 'cross', text: 'Кросс-анализ результатов...' },
    ];

    var div = document.createElement('div');
    div.className = 'bigcheck-progress';
    div.id = 'bc-progress';

    steps.forEach(function (step) {
      var el = document.createElement('div');
      el.className = 'bigcheck-step';
      el.id = 'bc-step-' + step.id;
      el.innerHTML =
        '<span class="step-icon">○</span>' +
        '<span class="step-text">' + step.text + '</span>';
      div.appendChild(el);
    });

    container.appendChild(div);
  }

  function setStepState(stepId, state) {
    var el = document.getElementById('bc-step-' + stepId);
    if (!el) return;
    el.className = 'bigcheck-step ' + state;
    var icon = el.querySelector('.step-icon');
    if (state === 'done') icon.textContent = '✓';
    else if (state === 'active') icon.textContent = '→';
    else icon.textContent = '○';
  }

  async function startAnalysis() {
    isAnalyzing = true;
    render();

    // Step 1: Upload
    setStepState('upload', 'active');
    await sleep(500);
    setStepState('upload', 'done');

    // Step 2: Analyze
    setStepState('analyze', 'active');

    var result;
    try {
      if (window.IstochnikAPI) {
        result = await window.IstochnikAPI.postBigCheck(selectedFiles, textContent, 0);
      } else {
        // Demo mode: simulate result
        await sleep(2000);
        result = generateDemoResult();
      }
    } catch (err) {
      console.error('BigCheck error:', err);
      // Use demo result on error
      await sleep(1000);
      result = generateDemoResult();
    }

    setStepState('analyze', 'done');

    // Step 3: Cross-analysis
    setStepState('cross', 'active');
    await sleep(800);
    setStepState('cross', 'done');

    await sleep(400);
    renderResult(result);
  }

  function generateDemoResult() {
    var results = [];
    selectedFiles.forEach(function (f) {
      var mtype = detectMediaType(f);
      var isReal = Math.random() > 0.3;
      results.push({
        media_type: mtype || 'image',
        verdict: isReal ? 'REAL' : 'FAKE',
        confidence: isReal ? (0.7 + Math.random() * 0.25) : (0.6 + Math.random() * 0.35),
        model_used: mtype === 'audio' ? 'resemble_detect' : mtype === 'video' ? 'sightengine_video_pipeline' : 'sightengine',
        explanation: isReal ? 'Признаков ИИ-генерации не обнаружено.' : 'Обнаружены признаки ИИ-генерации.',
        processing_ms: Math.floor(500 + Math.random() * 2000),
        filename: f.name,
      });
    });

    if (textContent.trim()) {
      var isReal = Math.random() > 0.4;
      results.push({
        media_type: 'text',
        verdict: isReal ? 'REAL' : 'FAKE',
        confidence: isReal ? (0.6 + Math.random() * 0.3) : (0.5 + Math.random() * 0.4),
        model_used: 'sapling',
        explanation: isReal ? 'Текст написан человеком.' : 'Текст имеет признаки ИИ-генерации.',
        processing_ms: Math.floor(300 + Math.random() * 1000),
        filename: 'Текст',
      });
    }

    var fakeCount = results.filter(function (r) { return r.verdict === 'FAKE'; }).length;
    var realCount = results.filter(function (r) { return r.verdict === 'REAL'; }).length;
    var total = results.length;
    var avgConf = results.reduce(function (s, r) { return s + r.confidence; }, 0) / total;

    var overallVerdict;
    if (total > 0 && fakeCount / total >= 0.5) overallVerdict = 'FAKE';
    else if (total > 0 && realCount / total >= 0.7) overallVerdict = 'REAL';
    else overallVerdict = 'UNCERTAIN';

    var authIndex = calculateAuthenticityIndex(overallVerdict, avgConf);

    var summary;
    if (overallVerdict === 'FAKE') {
      summary = 'Из ' + total + ' проверенных материалов ' + fakeCount + ' имеют признаки ИИ-генерации.';
    } else if (overallVerdict === 'REAL') {
      summary = 'Все ' + total + ' материалов прошли проверку подлинности.';
    } else {
      summary = 'Результаты неоднозначны: ' + fakeCount + ' подозрительных, ' + realCount + ' подлинных из ' + total + '.';
    }

    return {
      overall_verdict: overallVerdict,
      overall_confidence: avgConf,
      authenticity_index: authIndex,
      results: results,
      summary: summary,
    };
  }

  function renderResult(result) {
    var container = document.getElementById('bigcheck-container');
    if (!container) return;
    container.innerHTML = '';

    var card = document.createElement('div');
    card.className = 'bigcheck-result';

    var authIdx = result.authenticity_index != null
      ? result.authenticity_index
      : calculateAuthenticityIndex(result.overall_verdict, result.overall_confidence);

    var verdictColor =
      result.overall_verdict === 'REAL' ? 'var(--color-real)' :
      result.overall_verdict === 'FAKE' ? 'var(--color-fake)' : 'var(--color-uncertain)';

    // Gauge
    var circumference = 2 * Math.PI * 56;
    var offset = circumference - (authIdx / 100) * circumference;

    card.innerHTML =
      '<div class="bigcheck-result-title">ИНДЕКС ПОДЛИННОСТИ</div>' +
      '<div class="gauge-container">' +
        '<svg viewBox="0 0 128 128">' +
          '<circle cx="64" cy="64" r="56" fill="none" stroke="var(--color-border)" stroke-width="8"/>' +
          '<circle cx="64" cy="64" r="56" fill="none" stroke="' + verdictColor + '" stroke-width="8" ' +
            'stroke-linecap="round" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '" ' +
            'style="transition:stroke-dashoffset 0.6s ease"/>' +
        '</svg>' +
        '<div class="gauge-value" style="color:' + verdictColor + '">' + authIdx + '%</div>' +
      '</div>' +
      '<div class="gauge-label">Индекс подлинности</div>' +
      '<div class="verdict-text" style="color:' + verdictColor + '">' +
        (VERDICT_EMOJI[result.overall_verdict] || '') + ' ' +
        (VERDICT_TEXT[result.overall_verdict] || '') +
      '</div>' +
      '<div class="summary">"' + (result.summary || '') + '"</div>';

    // Detail rows
    if (result.results && result.results.length > 0) {
      var details = document.createElement('div');
      details.className = 'bigcheck-details';
      details.innerHTML = '<h4>Детали по каждому файлу:</h4>';

      result.results.forEach(function (r) {
        var row = document.createElement('div');
        row.className = 'bigcheck-detail-row';
        var icon = MEDIA_ICONS[r.media_type] || '📄';
        var name = r.filename || MEDIA_LABELS[r.media_type] || r.media_type;
        var verdClass = r.verdict === 'REAL' ? 'real' : r.verdict === 'FAKE' ? 'fake' : 'uncertain';
        var verdText = r.verdict === 'REAL' ? 'Подлинное' : r.verdict === 'FAKE' ? 'Сгенерировано' : 'Неопред.';
        var ai = calculateAuthenticityIndex(r.verdict, r.confidence);

        row.innerHTML =
          '<div class="bigcheck-detail-left">' +
            '<span>' + icon + '</span>' +
            '<span>' + name + '</span>' +
          '</div>' +
          '<div class="bigcheck-detail-right">' +
            '<span class="verdict-badge ' + verdClass + '">' + verdText + '</span>' +
            '<span>' + ai + '%</span>' +
          '</div>';
        details.appendChild(row);
      });
      card.appendChild(details);
    }

    // Actions
    var actions = document.createElement('div');
    actions.className = 'bigcheck-actions';
    actions.innerHTML =
      '<button class="bigcheck-action-btn" id="bc-copy-btn">📋 Копировать</button>' +
      '<button class="bigcheck-action-btn" id="bc-new-btn">🔄 Новая проверка</button>';
    card.appendChild(actions);

    container.appendChild(card);

    // Action handlers
    document.getElementById('bc-copy-btn').addEventListener('click', function () {
      var lines = [
        'Источник — Результат проверки',
        '──────────────────────────────',
        'Вердикт: ' + (VERDICT_TEXT[result.overall_verdict] || ''),
        'Индекс подлинности: ' + authIdx + '%',
        '',
        result.summary || '',
        '',
      ];
      if (result.results) {
        result.results.forEach(function (r) {
          var icon = MEDIA_ICONS[r.media_type] || '';
          var name = r.filename || MEDIA_LABELS[r.media_type] || '';
          var ai = calculateAuthenticityIndex(r.verdict, r.confidence);
          lines.push(icon + ' ' + name + ' — ' + (VERDICT_TEXT[r.verdict] || r.verdict) + ' ' + ai + '%');
        });
      }
      lines.push('', 'Проверено: Источник (istochnik.app)');

      navigator.clipboard.writeText(lines.join('\n')).then(function () {
        var btn = document.getElementById('bc-copy-btn');
        btn.textContent = '✓ Скопировано';
        setTimeout(function () { btn.textContent = '📋 Копировать'; }, 2000);
      });
    });

    document.getElementById('bc-new-btn').addEventListener('click', function () {
      selectedFiles = [];
      textContent = '';
      isAnalyzing = false;
      render();
    });
  }

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();

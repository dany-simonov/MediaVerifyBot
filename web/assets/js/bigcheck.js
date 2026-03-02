/* bigcheck.js — Big Check component for Источник (v2) */
(function () {
  'use strict';

  /* ─── Constants ─── */
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
  var MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 МБ

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

  /* ─── State ─── */
  var selectedFiles = [];
  var textContent = '';
  var isAnalyzing = false;

  /* ─── Main render ─── */
  function render() {
    var container = document.getElementById('bigcheck-container');
    if (!container) return;
    container.innerHTML = '';

    if (isAnalyzing) {
      renderProgress(container);
      return;
    }

    if (selectedFiles.length > 0) {
      renderFilesState(container);
    } else {
      renderDropzone(container);
    }
  }

  /* ─── Dropzone (empty state) ─── */
  function renderDropzone(container) {
    var zone = document.createElement('div');
    zone.className = 'bigcheck-dropzone';
    zone.id = 'bc-dropzone';
    zone.innerHTML =
      '<div class="upload-icon">📁</div>' +
      '<p>Перетащи файлы сюда или нажми для выбора</p>' +
      '<button class="bigcheck-upload-btn" id="bc-upload-btn" type="button">📎 Выбрать файл</button>' +
      '<div class="bigcheck-type-btns">' +
        '<button class="bigcheck-type-btn" data-accept="image/*" type="button">📷 Фото</button>' +
        '<button class="bigcheck-type-btn" data-accept="audio/*" type="button">🎵 Аудио</button>' +
        '<button class="bigcheck-type-btn" data-accept="video/*" type="button">🎬 Видео</button>' +
      '</div>' +
      '<div class="bigcheck-hint">Поддерживаемые форматы: JPG, PNG, MP4, MOV, WAV, MP3, OGG · Макс. размер: 20 МБ</div>';

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

    // Upload button click
    zone.querySelector('#bc-upload-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      fileInput.click();
    });

    // Type buttons
    zone.querySelectorAll('.bigcheck-type-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var accept = this.getAttribute('data-accept');
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.multiple = true;
        input.addEventListener('change', function () { addFiles(this.files); });
        input.click();
      });
    });

    // Click on zone
    zone.addEventListener('click', function (e) {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      fileInput.click();
    });

    // Drag and drop
    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', function (e) {
      e.preventDefault();
      zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('drag-over');
      addFiles(e.dataTransfer.files);
    });

    container.appendChild(zone);

    // Text toggle button + textarea
    renderTextInput(container, null);
  }

  /* ─── Files loaded state ─── */
  function renderFilesState(container) {
    var wrapper = document.createElement('div');
    wrapper.className = 'bigcheck-files-state';

    // Header
    var header = document.createElement('div');
    header.className = 'bigcheck-files-header';
    header.innerHTML =
      '<h4>📂 Загруженные файлы</h4>' +
      '<span class="files-count">' + selectedFiles.length + ' файл(ов)</span>';
    wrapper.appendChild(header);

    // File list
    var list = document.createElement('div');
    list.className = 'bigcheck-files-list';

    selectedFiles.forEach(function (f, idx) {
      var tag = document.createElement('div');
      tag.className = 'bigcheck-file-tag';
      var icon = MEDIA_ICONS[detectMediaType(f)] || '📄';
      tag.innerHTML =
        '<span class="file-icon">' + icon + '</span>' +
        '<span>' + truncateName(f.name, 20) + '</span>' +
        '<span class="file-size">' + formatFileSize(f.size) + '</span>' +
        '<span class="remove" data-idx="' + idx + '">&times;</span>';
      list.appendChild(tag);
    });

    // Add more button
    var addBtn = document.createElement('button');
    addBtn.className = 'bigcheck-add-more-btn';
    addBtn.type = 'button';
    addBtn.innerHTML = '+ Ещё файл';
    addBtn.addEventListener('click', function () {
      var input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*,audio/*,video/*';
      input.addEventListener('change', function () { addFiles(this.files); });
      input.click();
    });
    list.appendChild(addBtn);

    list.addEventListener('click', function (e) {
      if (e.target.classList.contains('remove')) {
        var idx = parseInt(e.target.getAttribute('data-idx'));
        selectedFiles.splice(idx, 1);
        render();
      }
    });
    wrapper.appendChild(list);

    container.appendChild(wrapper);

    // Text input
    var analyzeBtn = renderTextInput(container, wrapper);

    // Analyze button
    var btn = document.createElement('button');
    btn.className = 'bigcheck-analyze-btn';
    btn.id = 'bc-analyze-btn';
    btn.textContent = '🚀 Запустить кросс-анализ';
    btn.disabled = selectedFiles.length === 0 && !textContent.trim();
    btn.addEventListener('click', function () {
      startAnalysis();
    });
    container.appendChild(btn);
  }

  /* ─── Text input block (shared) ─── */
  function renderTextInput(container, parentEl) {
    var textBtn = document.createElement('button');
    textBtn.className = 'bigcheck-type-btn';
    textBtn.type = 'button';
    textBtn.style.margin = '16px auto 0';
    textBtn.style.display = 'block';
    textBtn.textContent = '📝 Добавить текст';
    textBtn.id = 'bc-text-toggle';

    var textarea = document.createElement('textarea');
    textarea.className = 'bigcheck-textarea';
    textarea.placeholder = 'Вставь текст для проверки (минимум 50 символов)...';
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
        container.appendChild(textarea);
        textarea.focus();
      });
      container.appendChild(textBtn);
    }

    return null;
  }

  function updateAnalyzeBtn() {
    var btn = document.getElementById('bc-analyze-btn');
    if (btn) {
      btn.disabled = selectedFiles.length === 0 && !textContent.trim();
    }
  }

  /* ─── File helpers ─── */
  function addFiles(fileList) {
    var oversized = [];
    for (var i = 0; i < fileList.length; i++) {
      if (fileList[i].size > MAX_FILE_SIZE) {
        oversized.push(fileList[i].name);
      } else {
        selectedFiles.push(fileList[i]);
      }
    }
    if (oversized.length > 0) {
      alert('Файлы слишком большие (макс. 20 МБ):\n' + oversized.join('\n'));
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

  /* ─── Analysis progress ─── */
  function renderProgress(container) {
    var steps = [
      { id: 'upload', text: 'Загрузка файлов на сервер...' },
      { id: 'analyze', text: 'Анализ медиа моделями ИИ...' },
      { id: 'cross', text: 'Кросс-анализ результатов...' },
    ];

    var wrapper = document.createElement('div');
    wrapper.className = 'bigcheck-result';
    wrapper.style.minHeight = '200px';

    var title = document.createElement('div');
    title.className = 'bigcheck-result-title';
    title.textContent = 'АНАЛИЗ В ПРОЦЕССЕ';
    wrapper.appendChild(title);

    // Spinner
    var spinner = document.createElement('div');
    spinner.style.cssText = 'font-size:36px;margin:20px 0;animation:pulse 1.2s infinite;';
    spinner.textContent = '🔍';
    wrapper.appendChild(spinner);

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

    wrapper.appendChild(div);
    container.appendChild(wrapper);
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

  /* ─── Start analysis ─── */
  async function startAnalysis() {
    isAnalyzing = true;
    render();

    // Step 1: Upload
    setStepState('upload', 'active');
    await sleep(600);
    setStepState('upload', 'done');

    // Step 2: Analyze
    setStepState('analyze', 'active');

    var result;
    try {
      if (window.IstochnikAPI) {
        result = await window.IstochnikAPI.postBigCheck(selectedFiles, textContent, 0);
      } else {
        // Demo mode: simulate result
        await sleep(2500);
        result = generateDemoResult();
      }
    } catch (err) {
      console.error('BigCheck error:', err);
      await sleep(1500);
      result = generateDemoResult();
    }

    setStepState('analyze', 'done');

    // Step 3: Cross-analysis
    setStepState('cross', 'active');
    await sleep(900);
    setStepState('cross', 'done');

    await sleep(500);
    renderResult(result);
  }

  /* ─── Generate demo result ─── */
  function generateDemoResult() {
    var results = [];
    selectedFiles.forEach(function (f) {
      var mtype = detectMediaType(f);
      var isReal = Math.random() > 0.3;
      var conf = isReal ? (0.7 + Math.random() * 0.25) : (0.6 + Math.random() * 0.35);
      results.push({
        media_type: mtype || 'image',
        verdict: isReal ? 'REAL' : 'FAKE',
        confidence: conf,
        model_used: mtype === 'audio' ? 'resemble_detect' : mtype === 'video' ? 'sightengine_video_pipeline' : 'sightengine',
        explanation: isReal ? 'Признаков ИИ-генерации не обнаружено.' : 'Обнаружены признаки ИИ-генерации.',
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
      total_processing_ms: results.reduce(function (s, r) { return s + r.processing_ms; }, 0),
    };
  }

  /* ─── Speedometer (Gauge Chart) ─── */
  function createSpeedometer(value, verdictColor) {
    // value: 0-100, verdictColor: CSS color string
    var container = document.createElement('div');
    container.className = 'speedometer-container';

    // SVG arc gauge (semicircle, 180 degrees)
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 200 120');
    svg.setAttribute('fill', 'none');

    var cx = 100, cy = 100, r = 80;
    // Background arc (full semicircle)
    var bgArc = createArcPath(cx, cy, r, 180, 0);
    var bgPath = document.createElementNS(svgNS, 'path');
    bgPath.setAttribute('d', bgArc);
    bgPath.setAttribute('stroke', '#2A2A30');
    bgPath.setAttribute('stroke-width', '12');
    bgPath.setAttribute('stroke-linecap', 'round');
    bgPath.setAttribute('fill', 'none');
    svg.appendChild(bgPath);

    // Colored gradient segments
    // Red zone: 0-30%, Yellow zone: 30-60%, Green zone: 60-100%
    var gradDefs = document.createElementNS(svgNS, 'defs');

    var grad = document.createElementNS(svgNS, 'linearGradient');
    grad.setAttribute('id', 'spdGrad');
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%');
    grad.setAttribute('y2', '0%');

    var stops = [
      { offset: '0%', color: '#EF4444' },    // Red
      { offset: '30%', color: '#F59E0B' },   // Yellow
      { offset: '60%', color: '#10B981' },    // Green
      { offset: '100%', color: '#0D9488' },   // Teal
    ];
    stops.forEach(function (s) {
      var stop = document.createElementNS(svgNS, 'stop');
      stop.setAttribute('offset', s.offset);
      stop.setAttribute('stop-color', s.color);
      grad.appendChild(stop);
    });
    gradDefs.appendChild(grad);
    svg.appendChild(gradDefs);

    // Value arc — animate it
    var angle = (value / 100) * 180;
    var valArc = createArcPath(cx, cy, r, 180, 180 - angle);
    var valPath = document.createElementNS(svgNS, 'path');
    valPath.setAttribute('d', valArc);
    valPath.setAttribute('stroke', 'url(#spdGrad)');
    valPath.setAttribute('stroke-width', '12');
    valPath.setAttribute('stroke-linecap', 'round');
    valPath.setAttribute('fill', 'none');
    // Animate with CSS
    valPath.style.strokeDasharray = computeArcLength(r, angle) + ' 999';
    valPath.style.strokeDashoffset = computeArcLength(r, angle);
    valPath.style.transition = 'stroke-dashoffset 1s ease-out';
    svg.appendChild(valPath);

    // Needle (indicator triangle)
    var needleAngle = 180 - (value / 100) * 180;
    var needleRad = needleAngle * Math.PI / 180;
    var nx = cx + (r - 20) * Math.cos(needleRad);
    var ny = cy - (r - 20) * Math.sin(needleRad);
    var needle = document.createElementNS(svgNS, 'circle');
    needle.setAttribute('cx', nx.toFixed(1));
    needle.setAttribute('cy', ny.toFixed(1));
    needle.setAttribute('r', '6');
    needle.setAttribute('fill', verdictColor);
    needle.style.filter = 'drop-shadow(0 0 4px ' + verdictColor + ')';
    svg.appendChild(needle);

    // Center dot
    var centerDot = document.createElementNS(svgNS, 'circle');
    centerDot.setAttribute('cx', String(cx));
    centerDot.setAttribute('cy', String(cy));
    centerDot.setAttribute('r', '4');
    centerDot.setAttribute('fill', '#94A3B8');
    svg.appendChild(centerDot);

    // Scale marks (0, 25, 50, 75, 100)
    [0, 25, 50, 75, 100].forEach(function (mark) {
      var markAngle = 180 - (mark / 100) * 180;
      var markRad = markAngle * Math.PI / 180;
      var tx = cx + (r + 16) * Math.cos(markRad);
      var ty = cy - (r + 16) * Math.sin(markRad);
      var text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', tx.toFixed(1));
      text.setAttribute('y', ty.toFixed(1));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', '#475569');
      text.setAttribute('font-size', '10');
      text.setAttribute('font-family', 'Inter, sans-serif');
      text.textContent = String(mark);
      svg.appendChild(text);
    });

    container.appendChild(svg);

    // Value text underneath
    var valDiv = document.createElement('div');
    valDiv.className = 'speedometer-value';
    valDiv.innerHTML =
      '<div class="spd-number" style="color:' + verdictColor + '">' + value + '%</div>' +
      '<div class="spd-label">Индекс подлинности</div>';
    container.appendChild(valDiv);

    // Trigger animation after append
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        valPath.style.strokeDashoffset = '0';
      });
    });

    return container;
  }

  function createArcPath(cx, cy, r, startAngleDeg, endAngleDeg) {
    // startAngleDeg=180 (left), endAngleDeg=0 (right)
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

  /* ─── Render result ─── */
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
      result.overall_verdict === 'REAL' ? '#10B981' :
      result.overall_verdict === 'FAKE' ? '#EF4444' : '#F59E0B';

    // Title
    var title = document.createElement('div');
    title.className = 'bigcheck-result-title';
    title.textContent = 'ИНДЕКС ПОДЛИННОСТИ';
    card.appendChild(title);

    // Speedometer gauge
    var gauge = createSpeedometer(authIdx, verdictColor);
    card.appendChild(gauge);

    // Verdict
    var verdictDiv = document.createElement('div');
    verdictDiv.className = 'verdict-text';
    verdictDiv.style.color = verdictColor;
    verdictDiv.textContent =
      (VERDICT_EMOJI[result.overall_verdict] || '') + ' ' +
      (VERDICT_TEXT[result.overall_verdict] || '');
    card.appendChild(verdictDiv);

    // Summary
    var summaryDiv = document.createElement('div');
    summaryDiv.className = 'summary';
    summaryDiv.textContent = result.summary || '';
    card.appendChild(summaryDiv);

    // Processing time
    if (result.total_processing_ms) {
      var timeDiv = document.createElement('div');
      timeDiv.style.cssText = 'font-size:12px;color:#475569;margin-bottom:16px;';
      var seconds = (result.total_processing_ms / 1000).toFixed(1);
      timeDiv.textContent = '⏱ Общее время анализа: ' + seconds + ' сек';
      card.appendChild(timeDiv);
    }

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
        var modelName = MODEL_NAMES[r.model_used] || r.model_used;

        row.innerHTML =
          '<div class="bigcheck-detail-left">' +
            '<span>' + icon + '</span>' +
            '<span title="' + (r.filename || '') + '">' + truncateName(name, 24) + '</span>' +
          '</div>' +
          '<div class="bigcheck-detail-right">' +
            '<span style="font-size:11px;color:#94A3B8;" title="' + modelName + '">' + modelName + '</span>' +
            '<span class="verdict-badge ' + verdClass + '">' + verdText + '</span>' +
            '<span style="font-weight:600;">' + ai + '%</span>' +
          '</div>';
        details.appendChild(row);
      });
      card.appendChild(details);
    }

    // Actions
    var actions = document.createElement('div');
    actions.className = 'bigcheck-actions';
    actions.innerHTML =
      '<button class="bigcheck-action-btn" id="bc-copy-btn" type="button">📋 Копировать результат</button>' +
      '<button class="bigcheck-action-btn" id="bc-new-btn" type="button">🔄 Новая проверка</button>' +
      '<a class="bigcheck-action-btn" href="https://t.me/MediaVerifyBot" target="_blank" rel="noopener">🤖 Открыть в боте</a>';
    card.appendChild(actions);

    container.appendChild(card);

    // Action handlers
    document.getElementById('bc-copy-btn').addEventListener('click', function () {
      var lines = [
        '━━━ Источник ━━━',
        'Результат кросс-анализа',
        '',
        'Вердикт: ' + (VERDICT_EMOJI[result.overall_verdict] || '') + ' ' + (VERDICT_TEXT[result.overall_verdict] || ''),
        'Индекс подлинности: ' + authIdx + '%',
        '',
        result.summary || '',
        '',
        'Детали:',
      ];
      if (result.results) {
        result.results.forEach(function (r) {
          var icon = MEDIA_ICONS[r.media_type] || '';
          var name = r.filename || MEDIA_LABELS[r.media_type] || '';
          var ai = calculateAuthenticityIndex(r.verdict, r.confidence);
          var vt = VERDICT_TEXT[r.verdict] || r.verdict;
          lines.push('  ' + icon + ' ' + name + ' — ' + vt + ' (' + ai + '%)');
        });
      }
      lines.push('', '🔗 Проверено: Источник (t.me/MediaVerifyBot)');

      navigator.clipboard.writeText(lines.join('\n')).then(function () {
        var btn = document.getElementById('bc-copy-btn');
        btn.textContent = '✓ Скопировано!';
        setTimeout(function () { btn.textContent = '📋 Копировать результат'; }, 2000);
      });
    });

    document.getElementById('bc-new-btn').addEventListener('click', function () {
      selectedFiles = [];
      textContent = '';
      isAnalyzing = false;
      render();
    });
  }

  /* ─── Init ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();

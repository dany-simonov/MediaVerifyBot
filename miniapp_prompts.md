# Промты для Claude Opus — Mini App + Audio fix + Bot redesign

---

## ПРОМТ A — Фикс аудио + рефакторинг текстов бота

```
У нас есть рабочий Telegram-бот MediaVerifyBot. Фото, видео и текст работают.
Аудио не работает. Нужно исправить аудио и улучшить все тексты бота.

Прочитай все файлы в bot/ и adapters/resemble.py и adapters/hf_audio.py.

ЗАДАЧА 1 — ИСПРАВИТЬ АУДИО:

Проблема скорее всего в одном из этих мест — найди и исправь все:

1. bot/handlers/media.py — хендлер handle_audio / handle_voice:
   - Telegram voice сообщения приходят как F.voice с mime_type audio/ogg
   - Telegram audio файлы приходят как F.audio
   - file_id для voice: message.voice.file_id
   - file_id для audio: message.audio.file_id
   - content_type для voice должен быть "audio/ogg"
   - Убедись что хендлер зарегистрирован: @router.message(F.voice) отдельно от @router.message(F.audio)
   - Убедись что файл скачивается корректно через bot.download(file) в BytesIO

2. adapters/resemble.py:
   - OGG файлы ОБЯЗАТЕЛЬНО конвертировать в WAV перед отправкой
   - Конвертация через subprocess ffmpeg: ["ffmpeg", "-i", "pipe:0", "-f", "wav", "pipe:1"]
   - input=ogg_bytes, capture_output=True
   - wav_bytes = proc.stdout
   - Если returncode != 0 — логировать stderr и выбрасывать ExternalAPIError
   - После конвертации отправлять wav_bytes в multipart как ("audio.wav", wav_bytes, "audio/wav")
   - Поле multipart должно называться именно "audio_file" — проверь документацию: POST https://detect.resemble.ai/api/v1/detect

3. adapters/hf_audio.py:
   - Аналогично — принимает только WAV
   - Если на вход пришёл OGG — сконвертировать так же через ffmpeg pipe
   - Эндпоинт: POST https://api-inference.huggingface.co/models/mo-gg/wav2vec2-large-xlsr-deepfake-detection
   - Content-Type: application/octet-stream (raw bytes WAV)

4. router/media_router.py:
   - Убедись что MediaType.AUDIO корректно маршрутизируется
   - MIME типы audio/ogg, audio/mpeg, audio/wav, audio/x-wav, audio/mp4 — все должны давать AUDIO
   - "audio/ogg; codecs=opus" (Telegram часто добавляет codecs) — тоже должен быть AUDIO
   - detect_type должен обрабатывать MIME с параметрами: брать только часть до ";"

ЗАДАЧА 2 — РЕФАКТОРИНГ ТЕКСТОВ БОТА:

Перепиши все тексты в bot/ — команды, ответы, сообщения об ошибках.
Стиль: профессиональный, лаконичный, доверие к технологии. Без дешёвых emoji-спама.
Максимум 1-2 emoji на сообщение, только по смыслу.

Новые тексты:

/start:
```
MediaVerify — система верификации медиаконтента.

Отправь файл для анализа:
· Фото — детекция AI-генерации (точность 94.4%)
· Аудио / голосовое — синтетическая речь (99.5%)  
· Видео — покадровый анализ (81%)
· /check + текст — написан ли ИИ

Бесплатно: 3 проверки в день
```

/help:
```
Как пользоваться MediaVerify:

Для фото, видео, аудио — просто отправь файл в чат.
Для текста — /check [текст, минимум 50 символов]

Поддерживаемые форматы:
Фото: JPG, PNG, WEBP
Аудио: MP3, OGG, WAV, голосовые сообщения
Видео: MP4, MOV, AVI (до 60 сек)

Результат содержит вердикт, уровень уверенности и объяснение.
Точность варьируется от 81% до 99.5% в зависимости от типа файла.
```

/about:
```
MediaVerify использует специализированные модели:

Фото → Sightengine genai (primary) + HuggingFace deepfake-vs-real (fallback)
Аудио → Resemble Detect (primary) + wav2vec2-xlsr (fallback)  
Видео → FFmpeg frame extraction + Sightengine pipeline
Текст → Sapling AI Detector

Точность на тестовых датасетах:
· Изображения: 94.4%
· Аудио: 99.5%
· Видео: 81%

Все файлы обрабатываются в оперативной памяти и не сохраняются.
```

/status:
```
Ваш статус: Free

Проверок сегодня: {used} из {limit}
Осталось: {remaining}

Лимит обновляется ежедневно в 00:00 МСК.
```

Сообщение при превышении лимита:
```
⛔ Дневной лимит исчерпан ({limit}/день)

Обновится завтра в 00:00 МСК.

Premium: 100 проверок в месяц — 199₽
Подробнее: /premium
```

Прогресс-сообщение во время анализа:
```
Анализирую {media_type}...
```
где media_type = "изображение" / "аудио" / "видео" / "текст"

Форматирование результата (bot/utils/formatters.py) — переписать полностью:
```
{emoji} {verdict_text}

Уверенность: {confidence}%
Модель: {model_used}
Время: {processing_ms} мс

{explanation}

Точность модели {accuracy_range}. Результат носит рекомендательный характер.
```

VERDICT_EMOJI: REAL=✅  FAKE=🚫  UNCERTAIN=⚠️
VERDICT_TEXT: REAL="Подлинное"  FAKE="Сгенерировано ИИ"  UNCERTAIN="Не определено"

Accuracy range по модели:
- sightengine / hf_image → "94.4%"
- resemble / hf_audio → "99.5%"  
- sightengine_video_pipeline → "81%"
- sapling → "98%"

Сообщения об ошибках — без технических деталей:
- FileTooLarge → "Файл слишком большой. Максимум: фото/аудио 20 МБ, видео 50 МБ."
- VideoTooLong → "Видео слишком длинное. Максимум: 60 секунд."
- UnsupportedMediaType → "Неподдерживаемый формат файла."
- ExternalAPIError → "Сервис анализа временно недоступен. Попробуйте позже."
- Текст < 50 символов → "Текст слишком короткий. Минимум 50 символов для анализа."

После всех изменений запусти:
pytest tests/unit/ -v
ruff check . --fix

Выведи отчёт: что изменено, результаты тестов.
```

---

## ПРОМТ B — Telegram Mini App (React)

```
Создай Telegram Mini App для MediaVerifyBot.
Стек: React 18 + Vite + TypeScript + @telegram-apps/telegram-ui + Tailwind CSS.

Разместить в папке: miniapp/ в корне репозитория.

СТРУКТУРА ПРОЕКТА:
```
miniapp/
├── public/
│   └── logo.svg          # уже лежит в репозитории — скопировать сюда
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/
│   │   └── client.ts     # httpx к FastAPI бэкенду
│   ├── hooks/
│   │   └── useTelegramUser.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── History.tsx
│   │   ├── Pricing.tsx
│   │   └── About.tsx
│   ├── components/
│   │   ├── BottomNav.tsx
│   │   ├── ConfidenceGauge.tsx
│   │   ├── CheckCard.tsx
│   │   ├── VerdictBadge.tsx
│   │   └── StatBar.tsx
│   └── types/
│       └── index.ts
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

ЗАВИСИМОСТИ (package.json):
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@telegram-apps/telegram-ui": "^2.0.0",
    "@twa-dev/sdk": "^0.7.6",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

ДИЗАЙН-СИСТЕМА:
Тёмный фон: #0F0F10
Карточки: #1A1A1E
Акцент: #6C63FF (фиолетовый — цвет бренда MediaVerify)
Текст primary: #F0F0F5
Текст secondary: #8888A0
FAKE: #FF4B4B
REAL: #00C48C
UNCERTAIN: #FFB800
Border radius карточек: 16px
Шрифт: system-ui (встроенный Telegram)

Все цвета читать через Telegram.WebApp.themeParams — если доступны, использовать их.
Fallback — цвета выше.

ФАЙЛ src/hooks/useTelegramUser.ts:
```typescript
import WebApp from '@twa-dev/sdk'

export function useTelegramUser() {
  const user = WebApp.initDataUnsafe?.user
  return {
    id: user?.id,
    firstName: user?.first_name ?? 'Пользователь',
    username: user?.username,
    photoUrl: user?.photo_url,
  }
}
```

ФАЙЛ src/api/client.ts:
```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL
const API_SECRET = import.meta.env.VITE_API_SECRET_KEY

export async function getUserStats(userId: number) {
  const res = await fetch(`${API_BASE}/user/${userId}/stats`, {
    headers: { 'x-api-secret': API_SECRET }
  })
  return res.json()
}

export async function getUserChecks(userId: number, limit = 10) {
  const res = await fetch(`${API_BASE}/user/${userId}/checks?limit=${limit}`, {
    headers: { 'x-api-secret': API_SECRET }
  })
  return res.json()
}
```

Добавить в FastAPI (api/routers/) два новых эндпоинта:

GET /user/{user_id}/stats → возвращает:
{
  "user_id": int,
  "is_premium": bool,
  "checks_today": int,
  "daily_limit": int,
  "total_checks": int,
  "created_at": str
}

GET /user/{user_id}/checks?limit=10 → возвращает список последних N записей из таблицы checks:
[{
  "id": str,
  "media_type": str,
  "verdict": str,
  "confidence": float,
  "model_used": str,
  "explanation": str,
  "processing_ms": int,
  "created_at": str
}]

Оба защищены x-api-secret заголовком.

ФАЙЛ src/types/index.ts:
```typescript
export type Verdict = 'REAL' | 'FAKE' | 'UNCERTAIN'
export type MediaType = 'image' | 'audio' | 'video' | 'text'

export interface Check {
  id: string
  media_type: MediaType
  verdict: Verdict
  confidence: number
  model_used: string
  explanation: string
  processing_ms: number
  created_at: string
}

export interface UserStats {
  user_id: number
  is_premium: boolean
  checks_today: number
  daily_limit: number
  total_checks: number
  created_at: string
}
```

КОМПОНЕНТ src/components/ConfidenceGauge.tsx:
SVG круговой индикатор. Props: value (0-100), verdict (REAL/FAKE/UNCERTAIN).
Цвет дуги зависит от verdict. Число внутри крупным шрифтом. Размер: 120x120px.

КОМПОНЕНТ src/components/VerdictBadge.tsx:
Маленький badge с цветным фоном. REAL=зелёный, FAKE=красный, UNCERTAIN=жёлтый.
Текст: "Подлинное" / "Сгенерировано ИИ" / "Не определено".

КОМПОНЕНТ src/components/CheckCard.tsx:
Карточка проверки. Показывает: иконка типа медиа + VerdictBadge + дата.
При нажатии раскрывается (accordion): ConfidenceGauge + модель + время + explanation.
Анимация раскрытия через CSS transition height.

КОМПОНЕНТ src/components/BottomNav.tsx:
Нижняя навигация. 4 пункта: Главная (🏠) / История (📋) / Тарифы (💎) / О нас (ℹ️).
Активный пункт подсвечивается акцентным цветом #6C63FF.
Фиксированный, bottom: 0, учитывает safe area (padding-bottom: env(safe-area-inset-bottom)).

КОМПОНЕНТ src/components/StatBar.tsx:
Горизонтальный прогресс-бар с лейблом и значением.
Используется в странице About для точности моделей.
Props: label, value (0-100), color.

СТРАНИЦА src/pages/Dashboard.tsx:
Сверху: логотип logo.svg (высота 32px) справа username/аватар.
Карточка пользователя: тариф, количество проверок сегодня, прогресс-бар (checks_today / daily_limit).
Если checks_today >= daily_limit → прогресс-бар красный, текст "Лимит исчерпан".
Блок "Как использовать": 4 строки с иконками типов медиа.
Кнопка внизу "Открыть бот" → Telegram.WebApp.close().
При загрузке данных — skeleton placeholder (серые анимированные блоки).

СТРАНИЦА src/pages/History.tsx:
Заголовок "История проверок".
Если checks пустой → пустой стейт: иллюстрация + текст "Проверок пока нет. Отправьте файл боту."
Список CheckCard компонентов.
Фильтр вверху: ALL / FAKE / REAL / UNCERTAIN — pill-кнопки.

СТРАНИЦА src/pages/Pricing.tsx:
Заголовок "Тарифы".
Две карточки рядом:

FREE карточка:
- "Free" крупно
- "0 ₽"
- Список: ✓ 3 проверки в день, ✓ Фото, аудио, видео, текст, ✓ Все базовые модели
- Кнопка "Текущий тариф" (задизейблена, серая)

PREMIUM карточка (с акцентной рамкой #6C63FF):
- "Premium" крупно  
- "199 ₽ / мес"
- Список: ✓ 100 проверок в месяц, ✓ Приоритетная обработка, ✓ История проверок (30 дней), ✓ Поделиться результатом
- Кнопка "Скоро" (задизейблена, но с акцентным цветом)
- Значок "СКОРО" в правом верхнем углу карточки

СТРАНИЦА src/pages/About.tsx:
Логотип крупно по центру.
"MediaVerify" h1, "Верификация медиаконтента" subtitle.

Секция "Точность моделей":
StatBar label="Фото (Sightengine)" value=94.4 color="#6C63FF"
StatBar label="Аудио (Resemble)" value=99.5 color="#00C48C"
StatBar label="Видео (CLIP pipeline)" value=81 color="#FFB800"
StatBar label="Текст (Sapling)" value=98 color="#6C63FF"

Секция "Как это работает":
3 шага с номерами в кружочках:
1. Вы отправляете файл боту
2. Файл анализируется специализированной моделью в памяти сервера
3. Вы получаете вердикт с уровнем уверенности

Секция "Приватность":
Текст: "Файлы обрабатываются исключительно в оперативной памяти сервера и не сохраняются на диске. Персональные данные не передаются третьим лицам."

Версия: "v0.1.0 · MediaVerify" мелко внизу.

ФАЙЛ src/App.tsx:
React Router с 4 маршрутами. BottomNav всегда внизу.
При старте: WebApp.ready(), WebApp.expand() для полноэкранного режима.
Загрузка темы из WebApp.themeParams.

ФАЙЛ miniapp/.env.example:
```
VITE_API_BASE_URL=https://your-domain.com
VITE_API_SECRET_KEY=your_api_secret_key
```

ФАЙЛ miniapp/README.md:
Инструкция запуска:
1. cd miniapp
2. npm install
3. cp .env.example .env → заполнить переменные
4. npm run dev → для разработки
5. npm run build → собрать в miniapp/dist/
6. Разместить dist/ на Vercel/Netlify/любой статик-хостинг с HTTPS
7. В BotFather: /mybots → бот → Bot Settings → Menu Button → вставить URL

После создания всех файлов:
cd miniapp && npm install && npm run build

Если build прошёл без ошибок — вывести "✅ Mini App build успешен".
Если ошибки — исправить и пересобрать.
```

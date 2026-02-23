# MediaVerifyBot — Sprint 1: Полная техническая спецификация MVP
**Версия:** 1.0 | **Исполнитель читает полностью перед началом работы**

---

## ⚠️ ОБЯЗАТЕЛЬНО ПЕРЕД СТАРТОМ

Исполнитель обязан:
- Прочитать спецификацию **целиком** до написания первой строки кода
- Не пропускать ни один пункт, не менять порядок этапов
- После каждого раздела —  результата в чат cо мной
- Все секреты и ключи — **только в `.env`**, никогда не в коде
- Коммиты после каждого завершённого пункта уровня X.X

---

## 0. Стек технологий

| Слой | Технология | Версия |
|---|---|---|
| Язык | Python | 3.11+ |
| Telegram Bot | aiogram | 3.7+ |
| Backend framework | FastAPI | 0.111+ |
| ASGI сервер | Uvicorn | 0.29+ |
| HTTP клиент | httpx | 0.27+ |
| Валидация | Pydantic v2 | 2.7+ |
| База данных | PostgreSQL | 15+ |
| ORM | SQLAlchemy (async) | 2.0+ |
| Миграции | Alembic | 1.13+ |
| Медиа обработка | ffmpeg-python | 0.2+ |
| Переменные окружения | pydantic-settings | 2.x |
| Контейнеризация | Docker + Docker Compose | latest |
| Тесты | pytest + pytest-asyncio | latest |
| Линтер | ruff | latest |

---

## 1. Структура репозитория

### 1.1 Инициализация репозитория

```
mediaverifybot/
├── bot/
│   ├── __init__.py
│   ├── main.py               # Точка входа бота
│   ├── handlers/
│   │   ├── __init__.py
│   │   ├── media.py          # Хендлеры фото/видео/аудио/голос/документ
│   │   └── text_check.py     # Хендлер текстовых сообщений на проверку
│   ├── middlewares/
│   │   ├── __init__.py
│   │   └── rate_limit.py     # Rate limiting по user_id
│   ├── keyboards/
│   │   ├── __init__.py
│   │   └── inline.py         # Inline-кнопки (поделиться результатом)
│   └── utils/
│       ├── __init__.py
│       └── formatters.py     # Форматирование ответа пользователю
│
├── api/
│   ├── __init__.py
│   ├── main.py               # FastAPI app, роутеры
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── analyze.py        # POST /analyze
│   │   └── health.py         # GET /health
│   ├── dependencies.py       # DI: сессия БД, настройки
│   └── schemas.py            # Pydantic-схемы запросов/ответов
│
├── core/
│   ├── __init__.py
│   ├── config.py             # pydantic-settings, все переменные окружения
│   ├── enums.py              # Verdict, MediaType, ModelUsed
│   └── exceptions.py         # Кастомные исключения
│
├── adapters/
│   ├── __init__.py
│   ├── base.py               # Абстрактный BaseAdapter
│   ├── sightengine.py        # Фото + кадры видео
│   ├── resemble.py           # Аудио deepfake
│   ├── sapling.py            # Текст AI detection
│   ├── hf_image.py           # HuggingFace Inference API (фото, fallback)
│   ├── hf_audio.py           # HuggingFace Inference API (аудио, fallback)
│   └── video_pipeline.py     # FFmpeg + SightEngine aggregation
│
├── router/
│   ├── __init__.py
│   └── media_router.py       # Определение типа файла -> выбор адаптера
│
├── db/
│   ├── __init__.py
│   ├── engine.py             # Async engine SQLAlchemy
│   ├── models.py             # ORM-модели
│   └── repository.py         # CRUD-функции
│
├── migrations/
│   └── (alembic auto-generated)
│
├── tests/
│   ├── __init__.py
│   ├── unit/
│   │   ├── test_adapters.py
│   │   ├── test_router.py
│   │   └── test_formatters.py
│   └── integration/
│       └── test_pipeline.py
│
├── media_samples/            # Тестовые файлы (НЕ в git, в .gitignore)
│   ├── real/
│   └── fake/
│
├── .env.example
├── .env                      # В .gitignore
├── .gitignore
├── docker-compose.yml
├── Dockerfile.bot
├── Dockerfile.api
├── alembic.ini
├── pyproject.toml
└── README.md
```

### 1.2 pyproject.toml

Создать файл с зависимостями:

```toml
[project]
name = "mediaverifybot"
version = "0.1.0"
requires-python = ">=3.11"

dependencies = [
    "aiogram==3.7.0",
    "fastapi==0.111.0",
    "uvicorn[standard]==0.29.0",
    "httpx==0.27.0",
    "pydantic==2.7.0",
    "pydantic-settings==2.3.0",
    "sqlalchemy[asyncio]==2.0.30",
    "asyncpg==0.29.0",
    "alembic==1.13.1",
    "ffmpeg-python==0.2.0",
    "python-multipart==0.0.9",
    "aiofiles==23.2.1",
]

[tool.ruff]
line-length = 88
select = ["E", "F", "I"]
```

### 1.3 .env.example

```env
# Telegram
BOT_TOKEN=your_telegram_bot_token_here
WEBHOOK_URL=https://your-domain.com/webhook  # пусто при polling

# FastAPI
API_BASE_URL=http://api:8000
API_SECRET_KEY=random_32_char_string_here

# Database
DATABASE_URL=postgresql+asyncpg://user:password@db:5432/mediaverifybot

# Sightengine (https://sightengine.com)
SIGHTENGINE_API_USER=your_api_user
SIGHTENGINE_API_SECRET=your_api_secret

# Sapling (https://sapling.ai/docs/api/overview)
SAPLING_API_KEY=your_sapling_api_key

# Resemble AI (https://detect.resemble.ai)
RESEMBLE_API_KEY=your_resemble_api_key

# HuggingFace (https://huggingface.co/settings/tokens)
HF_API_TOKEN=your_hf_token

# Rate limits
FREE_DAILY_LIMIT=3
PREMIUM_MONTHLY_LIMIT=100

# FFmpeg
MAX_VIDEO_DURATION_SECONDS=60
VIDEO_FRAME_SAMPLE_RATE=1
```

---

## 2. База данных

### 2.1 Схема БД

Исполнитель создаёт следующие таблицы через SQLAlchemy ORM в `db/models.py`.

**Таблица `users`:**
```
id                  BIGINT PRIMARY KEY          -- Telegram user_id
username            VARCHAR(255) NULLABLE
first_name          VARCHAR(255) NULLABLE
is_premium          BOOLEAN DEFAULT FALSE
daily_checks_count  INTEGER DEFAULT 0
daily_checks_reset  TIMESTAMP                   -- дата последнего сброса счётчика
total_checks        INTEGER DEFAULT 0
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
```

**Таблица `checks`:**
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         BIGINT FK -> users.id
media_type      VARCHAR(20)     -- image | audio | video | text
verdict         VARCHAR(20)     -- REAL | FAKE | UNCERTAIN
confidence      FLOAT           -- 0.0 – 1.0
model_used      VARCHAR(50)     -- sightengine | resemble | sapling | hf_image | hf_audio | video_pipeline
explanation     TEXT
file_size_bytes INTEGER NULLABLE
processing_ms   INTEGER         -- время обработки в миллисекундах
created_at      TIMESTAMP DEFAULT NOW()
```

**Таблица `rate_limits`** (для дополнительного персистентного контроля):
```
user_id     BIGINT PK FK -> users.id
date        DATE
count       INTEGER DEFAULT 0
```

### 2.2 Настройка Alembic

После создания моделей:
```bash
alembic init migrations
# Настроить migrations/env.py для async-движка и автодетекции моделей
alembic revision --autogenerate -m "initial_schema"
alembic upgrade head
```

Исполнитель проверяет: все 3 таблицы созданы через `\dt` в psql.

### 2.3 Repository-слой (db/repository.py)

Реализовать следующие async-функции:

```python
async def get_or_create_user(session, telegram_id: int, username: str, first_name: str) -> User
async def increment_daily_check(session, user_id: int) -> int  # возвращает текущий счётчик
async def reset_daily_check_if_needed(session, user_id: int) -> None
async def check_rate_limit(session, user_id: int, limit: int) -> bool  # True = разрешено
async def save_check(session, user_id: int, result: AnalysisResult) -> Check
async def get_user_checks_today(session, user_id: int) -> int
```

---

## 3. Core-слой

### 3.1 Enums (core/enums.py)

```python
from enum import Enum

class Verdict(str, Enum):
    REAL = "REAL"
    FAKE = "FAKE"
    UNCERTAIN = "UNCERTAIN"

class MediaType(str, Enum):
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    TEXT = "text"

class ModelUsed(str, Enum):
    SIGHTENGINE = "sightengine"
    SIGHTENGINE_VIDEO = "sightengine_video_pipeline"
    RESEMBLE = "resemble_detect"
    SAPLING = "sapling"
    HF_IMAGE = "hf_image_inference"
    HF_AUDIO = "hf_audio_inference"
    FALLBACK_UNCERTAIN = "fallback_uncertain"
```

### 3.2 Config (core/config.py)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    bot_token: str
    api_base_url: str
    api_secret_key: str
    database_url: str
    sightengine_api_user: str
    sightengine_api_secret: str
    sapling_api_key: str
    resemble_api_key: str
    hf_api_token: str
    free_daily_limit: int = 3
    premium_monthly_limit: int = 100
    max_video_duration_seconds: int = 60
    video_frame_sample_rate: int = 1

    class Config:
        env_file = ".env"

settings = Settings()
```

### 3.3 Exceptions (core/exceptions.py)

```python
class RateLimitExceeded(Exception): pass
class UnsupportedMediaType(Exception): pass
class ExternalAPIError(Exception):
    def __init__(self, service: str, detail: str):
        self.service = service
        self.detail = detail
class FileTooLarge(Exception): pass
class VideoTooLong(Exception): pass
```

---

## 4. Адаптеры внешних API

> Каждый адаптер — это класс с единственным публичным методом `async def analyze(...) -> AnalysisResult`. Все HTTP-вызовы через `httpx.AsyncClient`. Таймаут на каждый запрос — **15 секунд**.

### 4.1 Базовый класс (adapters/base.py)

```python
from abc import ABC, abstractmethod
from api.schemas import AnalysisResult

class BaseAdapter(ABC):
    TIMEOUT = 15.0

    @abstractmethod
    async def analyze(self, data: bytes) -> AnalysisResult:
        ...
    
    def _build_uncertain(self, reason: str, model: str) -> AnalysisResult:
        # Возвращает UNCERTAIN с объяснением причины
        ...
```

### 4.2 Sightengine — изображения (adapters/sightengine.py)

**Сервис:** https://sightengine.com  
**Документация:** https://sightengine.com/docs/investigate-images-fake-generation  
**Регистрация:** https://dashboard.sightengine.com/signup  
**Free tier:** 2,000 операций/месяц  
**Эндпоинт:** `POST https://api.sightengine.com/1.0/check.json`

**Параметры запроса:**
```
api_user    = SIGHTENGINE_API_USER
api_secret  = SIGHTENGINE_API_SECRET
models      = genai                     # AI-generated detection
media       = <multipart file upload>
```

**Парсинг ответа:**
```json
{
  "status": "success",
  "type": {
    "ai_generated": 0.97
  }
}
```

**Логика вердикта:**
- `ai_generated >= 0.75` → `FAKE`
- `ai_generated <= 0.35` → `REAL`
- иначе → `UNCERTAIN`

**Обязательно обрабатывать:**
- HTTP 429 (rate limit) → `ExternalAPIError("sightengine", "rate_limit")`
- HTTP 5xx → `ExternalAPIError("sightengine", "server_error")`
- `status != "success"` → `ExternalAPIError`
- Timeout → возвращать `UNCERTAIN` с пояснением

**Объяснение для пользователя:**
```
f"Sightengine: вероятность ИИ-генерации {round(score * 100)}%"
```

### 4.3 HuggingFace Image — фото fallback (adapters/hf_image.py)

**Сервис:** https://huggingface.co/inference-api  
**Документация:** https://huggingface.co/docs/api-inference/quicktour  
**Модель:** `dima806/deepfake-vs-real-image-detection`  
**URL модели:** https://huggingface.co/dima806/deepfake-vs-real-image-detection  
**Free tier:** ~1,000 запросов/день (serverless, при наличии токена)  
**Эндпоинт:** `POST https://api-inference.huggingface.co/models/dima806/deepfake-vs-real-image-detection`

**Заголовки:**
```
Authorization: Bearer {HF_API_TOKEN}
Content-Type: application/octet-stream
```

**Тело запроса:** raw bytes изображения

**Парсинг ответа:**
```json
[
  {"label": "FAKE", "score": 0.94},
  {"label": "REAL", "score": 0.06}
]
```

**Обработка cold start:** если `{"error": "Model is loading"}` — повторить запрос через 10 секунд (максимум 2 retry). Если не загрузилась — вернуть `UNCERTAIN`.

**Логика вердикта:** взять запись с наибольшим score, если score > 0.7 → использовать её label, иначе → `UNCERTAIN`.

### 4.4 Resemble Detect — аудио (adapters/resemble.py)

**Сервис:** https://detect.resemble.ai  
**Документация:** https://detect.resemble.ai/docs  
**Регистрация:** https://app.resemble.ai/auth/sign_up  
**Free tier:** 1,000 запросов/месяц  
**Эндпоинт:** `POST https://detect.resemble.ai/api/v1/detect`

**Заголовки:**
```
Authorization: Token {RESEMBLE_API_KEY}
Content-Type: multipart/form-data
```

**Тело запроса:**
```
audio_file: <file upload>  # WAV или MP3
```

**Парсинг ответа:**
```json
{
  "success": true,
  "score": 0.89,
  "tampered": true
}
```

**Логика вердикта:**
- `score >= 0.75` → `FAKE`
- `score <= 0.30` → `REAL`
- иначе → `UNCERTAIN`

**Предобработка аудио:**
- Максимальный размер файла: 10 MB
- Поддерживаемые форматы: WAV, MP3, OGG (OGG — сконвертировать через ffmpeg в WAV перед отправкой)
- Telegram voice messages приходят в `.ogg` — конвертация обязательна

**Конвертация OGG → WAV в памяти:**
```python
import subprocess
# ffmpeg из bytes OGG -> bytes WAV без записи на диск
proc = subprocess.run(
    ["ffmpeg", "-i", "pipe:0", "-f", "wav", "pipe:1"],
    input=ogg_bytes, capture_output=True
)
wav_bytes = proc.stdout
```

### 4.5 HuggingFace Audio — аудио fallback (adapters/hf_audio.py)

**Модель:** `mo-gg/wav2vec2-large-xlsr-deepfake-detection`  
**URL:** https://huggingface.co/mo-gg/wav2vec2-large-xlsr-deepfake-detection  
**Эндпоинт:** `POST https://api-inference.huggingface.co/models/mo-gg/wav2vec2-large-xlsr-deepfake-detection`

**Заголовки:** те же, что в 4.3

**Тело запроса:** raw bytes WAV-файла (не OGG)

**Парсинг:** аналогично HF Image — список label/score. Ожидаемые метки: `"spoof"` / `"bonafide"`. `spoof` → FAKE, `bonafide` → REAL.

**Логика fallback для аудио:**
1. Основной — `ResembleAdapter`
2. Если `ExternalAPIError` или `UNCERTAIN` от Resemble → вызвать `HFAudioAdapter`
3. Если оба вернули `UNCERTAIN` → итоговый вердикт `UNCERTAIN`, explanation содержит оба результата

### 4.6 Sapling — текст (adapters/sapling.py)

**Сервис:** https://sapling.ai  
**Документация:** https://sapling.ai/docs/api/ai-detect  
**Регистрация:** https://sapling.ai/user/register  
**Free tier:** 2,000 запросов/месяц  
**Эндпоинт:** `POST https://api.sapling.ai/api/v1/aidetect`

**Заголовки:**
```
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "key": "{SAPLING_API_KEY}",
  "text": "текст для проверки"
}
```

**Парсинг ответа:**
```json
{
  "score": 0.92,
  "sentence_scores": [
    ["Первое предложение.", 0.89],
    ["Второе предложение.", 0.95]
  ]
}
```

**Логика вердикта:**
- `score >= 0.80` → `FAKE` (AI-generated text)
- `score <= 0.25` → `REAL`
- иначе → `UNCERTAIN`

**Минимальная длина текста:** 50 символов. Если текст короче — вернуть ошибку пользователю "Текст слишком короткий для анализа (минимум 50 символов)".

**Максимальная длина:** 10,000 символов. Если длиннее — обрезать до 10,000 с предупреждением.

**Объяснение для пользователя:**
```
f"Sapling AI: вероятность написан ИИ {round(score * 100)}%. "
f"Наиболее подозрительное предложение: «{top_sentence}» ({round(top_score * 100)}%)"
```

### 4.7 Video Pipeline (adapters/video_pipeline.py)

Это не внешний API, а внутренний модуль. Цепочка:

```
video_bytes
    ↓
[1] Получить длительность через ffprobe
    ↓ если > MAX_VIDEO_DURATION_SECONDS → VideoTooLong
[2] Извлечь keyframes через ffmpeg (1 кадр/сек)
    ↓ результат: List[bytes] — каждый кадр как JPEG bytes
[3] Отправить каждый кадр в SightengineAdapter
    ↓ параллельно через asyncio.gather (не более 5 одновременных)
[4] Собрать результаты: List[float] — score каждого кадра
[5] Агрегация:
    - fake_frames   = count(score >= 0.75)
    - real_frames   = count(score <= 0.35)
    - total_frames  = len(results)
    - fake_ratio    = fake_frames / total_frames
    Если fake_ratio >= 0.40 → FAKE, confidence = avg(fake_scores)
    Если fake_ratio <= 0.10 → REAL, confidence = avg(real_scores)
    Иначе → UNCERTAIN
[6] Вернуть AnalysisResult
```

**ffprobe для длительности:**
```python
probe = ffmpeg.probe(input_path)
duration = float(probe['format']['duration'])
```

**ffmpeg для кадров (в память, без диска):**
```python
out, _ = (
    ffmpeg
    .input('pipe:0')
    .filter('fps', fps=1)
    .output('pipe:1', format='image2', vcodec='mjpeg')
    .run(input=video_bytes, capture_stdout=True, capture_stderr=True)
)
# Разбить out на отдельные JPEG: ищем маркеры SOI (FF D8) и EOI (FF D9)
```

**Ограничения:**
- Максимальный размер видеофайла: 50 MB
- Максимальная длительность: 60 секунд
- При превышении лимитов Sightengine (2000 ops/month) — использовать HFImageAdapter для кадров

---

## 5. Media Router (router/media_router.py)

### 5.1 Определение типа медиа

```python
MIME_TYPE_MAP = {
    # Images
    "image/jpeg": MediaType.IMAGE,
    "image/png": MediaType.IMAGE,
    "image/webp": MediaType.IMAGE,
    "image/gif": MediaType.IMAGE,
    # Audio
    "audio/ogg": MediaType.AUDIO,
    "audio/mpeg": MediaType.AUDIO,
    "audio/mp3": MediaType.AUDIO,
    "audio/wav": MediaType.AUDIO,
    "audio/x-wav": MediaType.AUDIO,
    # Video
    "video/mp4": MediaType.VIDEO,
    "video/avi": MediaType.VIDEO,
    "video/quicktime": MediaType.VIDEO,
    "video/x-matroska": MediaType.VIDEO,
}

EXTENSION_MAP = {
    ".jpg": MediaType.IMAGE, ".jpeg": MediaType.IMAGE,
    ".png": MediaType.IMAGE, ".webp": MediaType.IMAGE,
    ".mp3": MediaType.AUDIO, ".ogg": MediaType.AUDIO,
    ".wav": MediaType.AUDIO, ".m4a": MediaType.AUDIO,
    ".mp4": MediaType.VIDEO, ".avi": MediaType.VIDEO,
    ".mov": MediaType.VIDEO, ".mkv": MediaType.VIDEO,
}
```

### 5.2 Логика маршрутизации

```python
async def route(media_type: MediaType, file_bytes: bytes) -> AnalysisResult:
    match media_type:
        case MediaType.IMAGE:
            try:
                return await SightengineAdapter().analyze(file_bytes)
            except ExternalAPIError:
                return await HFImageAdapter().analyze(file_bytes)
        
        case MediaType.AUDIO:
            try:
                result = await ResembleAdapter().analyze(file_bytes)
                if result.verdict == Verdict.UNCERTAIN:
                    fallback = await HFAudioAdapter().analyze(file_bytes)
                    return _merge_results(result, fallback)
                return result
            except ExternalAPIError:
                return await HFAudioAdapter().analyze(file_bytes)
        
        case MediaType.VIDEO:
            return await VideoPipeline().analyze(file_bytes)
        
        case MediaType.TEXT:
            return await SaplingAdapter().analyze(file_bytes)
        
        case _:
            raise UnsupportedMediaType()
```

---

## 6. API (FastAPI)

### 6.1 Схемы (api/schemas.py)

```python
from pydantic import BaseModel
from core.enums import Verdict, MediaType, ModelUsed

class AnalysisResult(BaseModel):
    verdict: Verdict
    confidence: float           # 0.0 – 1.0
    model_used: ModelUsed
    explanation: str
    media_type: MediaType
    processing_ms: int

class AnalysisRequest(BaseModel):
    user_id: int
    username: str | None
    first_name: str | None
    # file передаётся как multipart, не в JSON

class HealthResponse(BaseModel):
    status: str
    version: str
    db: str
```

### 6.2 Роутер /analyze (api/routers/analyze.py)

**Эндпоинт:** `POST /analyze`  
**Формат:** `multipart/form-data`  
**Поля:**
- `file`: UploadFile — медиафайл
- `user_id`: int
- `username`: str (optional)
- `first_name`: str (optional)
- `text_content`: str (optional) — только для текстовых проверок
- `x-api-secret`: Header — внутренний токен для защиты от прямых вызовов

**Логика:**
```
1. Проверить x-api-secret == settings.api_secret_key (иначе 403)
2. get_or_create_user(session, user_id, ...)
3. reset_daily_check_if_needed(session, user_id)
4. check_rate_limit(session, user_id) — если превышен → HTTP 429 + кастомный body
5. Считать file_bytes = await file.read()
6. Определить media_type через MediaRouter.detect_type(file.content_type, file.filename)
7. start_time = time.monotonic()
8. result = await MediaRouter.route(media_type, file_bytes)
9. result.processing_ms = int((time.monotonic() - start_time) * 1000)
10. await save_check(session, user_id, result)
11. await increment_daily_check(session, user_id)
12. return result
```

**HTTP коды ответа:**
- 200 — успех
- 400 — UnsupportedMediaType, FileTooLarge, VideoTooLong, текст слишком короткий
- 403 — неверный api secret
- 429 — rate limit
- 503 — все внешние API недоступны

### 6.3 Роутер /health (api/routers/health.py)

`GET /health` — проверяет:
- Доступность БД (простой SELECT 1)
- Возвращает `{"status": "ok", "version": "0.1.0", "db": "ok"}`

### 6.4 Middleware и настройки FastAPI

```python
# api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="MediaVerifyBot API",
    version="0.1.0",
    docs_url="/docs",       # только для dev, в prod отключить
    redoc_url=None,
)

# CORS — только для локальной разработки
app.add_middleware(CORSMiddleware, allow_origins=["*"])

app.include_router(analyze_router, prefix="/analyze")
app.include_router(health_router)
```

---

## 7. Telegram Bot

### 7.1 Инициализация (bot/main.py)

Режим работы для MVP — **polling** (не webhook). Webhook настраивается на этапе деплоя.

```python
import asyncio
from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from bot.handlers import media, text_check
from bot.middlewares.rate_limit import RateLimitMiddleware
from core.config import settings

async def main():
    bot = Bot(
        token=settings.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )
    dp = Dispatcher()
    
    dp.message.middleware(RateLimitMiddleware())
    dp.include_router(media.router)
    dp.include_router(text_check.router)
    
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
```

### 7.2 Хендлеры медиа (bot/handlers/media.py)

Создать отдельные хендлеры для каждого типа:

```python
from aiogram import Router, F, Bot
from aiogram.types import Message
import httpx

router = Router()

@router.message(F.photo)
async def handle_photo(message: Message, bot: Bot): ...

@router.message(F.video)
async def handle_video(message: Message, bot: Bot): ...

@router.message(F.audio | F.voice)
async def handle_audio(message: Message, bot: Bot): ...

@router.message(F.document)
async def handle_document(message: Message, bot: Bot):
    # Определить тип по MIME и направить в нужный хендлер
    ...
```

**Общая логика каждого хендлера:**
```
1. Отправить "typing" action (bot.send_chat_action)
2. Получить file_id из message
3. Скачать файл: file = await bot.get_file(file_id); bytes = await bot.download(file)
4. Проверить размер: фото/аудио/текст ≤ 20 MB, видео ≤ 50 MB
5. Отправить progress-сообщение: "🔍 Анализирую файл..."
6. POST к API /analyze (multipart/form-data)
   Headers: {"x-api-secret": settings.api_secret_key}
   Data: {"user_id": message.from_user.id, "username": ..., "first_name": ...}
   Files: {"file": (filename, file_bytes, content_type)}
7. Получить AnalysisResult
8. Отредактировать progress-сообщение на финальный ответ
9. При ошибках — отправить понятное сообщение пользователю (не traceback)
```

### 7.3 Хендлер текста (bot/handlers/text_check.py)

Текст на проверку должен начинаться с команды `/check` или быть отправлен в ответ на команду бота. **Обычные текстовые сообщения НЕ анализировать** — это создаст путаницу.

```python
@router.message(Command("check"))
async def handle_text_check(message: Message, bot: Bot):
    text = message.text.replace("/check", "").strip()
    if not text:
        await message.reply("Использование: /check <текст для проверки>")
        return
    # Далее — аналогично медиа-хендлерам, но передаём text_content
```

### 7.4 Форматирование ответа (bot/utils/formatters.py)

```python
VERDICT_EMOJI = {
    "REAL": "✅",
    "FAKE": "🚨",
    "UNCERTAIN": "⚠️",
}

VERDICT_TEXT = {
    "REAL": "Подлинное",
    "FAKE": "Подозрительно — возможен дипфейк",
    "UNCERTAIN": "Неопределённо",
}

def format_result(result: AnalysisResult) -> str:
    emoji = VERDICT_EMOJI[result.verdict]
    verdict_text = VERDICT_TEXT[result.verdict]
    confidence_pct = round(result.confidence * 100)
    
    return (
        f"{emoji} <b>{verdict_text}</b>\n\n"
        f"📊 Уверенность: <b>{confidence_pct}%</b>\n"
        f"🤖 Модель: {result.model_used}\n"
        f"⏱ Время анализа: {result.processing_ms} мс\n\n"
        f"💬 {result.explanation}\n\n"
        f"<i>ℹ️ Точность от 81% до 99.5% — финальное решение за вами</i>"
    )
```

### 7.5 Rate Limit Middleware (bot/middlewares/rate_limit.py)

Реализовать **двухуровневую** защиту:

**Уровень 1 — in-memory (быстрый):** словарь `{user_id: {date: count}}`. Сбрасывается при рестарте бота, нужен для первичной быстрой блокировки.

**Уровень 2 — БД (персистентный):** проверка через API /analyze (API сам проверяет через repository). При ответе 429 от API — показать пользователю сообщение с остатком лимита.

Сообщение при превышении лимита:
```
⛔ Вы исчерпали дневной лимит бесплатных проверок (3/день).

Лимит обновится завтра в 00:00 МСК.

💎 Premium-доступ: 100 проверок/месяц — 199₽
Написать: @your_support_username
```

### 7.6 Команды бота

```python
# Зарегистрировать через bot.set_my_commands([...])
/start   — Приветствие и инструкция
/help    — Как пользоваться ботом
/check   — Проверить текст на AI-генерацию
/status  — Сколько проверок осталось сегодня
/about   — О боте и точности моделей
```

**Текст /start:**
```
👋 Привет! Я MediaVerifyBot — проверяю медиафайлы на подлинность.

Что умею:
🖼 Фото — детекция AI-генерации
🎵 Аудио и голосовые — детекция синтетической речи  
🎬 Видео — покадровый анализ
📝 Текст — детекция написан ли ChatGPT/ИИ

Просто отправь файл или /check <текст>

Бесплатно: 3 проверки в день
```

---

## 8. Docker и инфраструктура

### 8.1 Dockerfile.api

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pyproject.toml .
RUN pip install -e .

COPY . .
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 8.2 Dockerfile.bot

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pyproject.toml .
RUN pip install -e .

COPY . .
CMD ["python", "-m", "bot.main"]
```

### 8.3 docker-compose.yml

```yaml
version: "3.9"

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mediaverifybot
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    env_file: .env
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  bot:
    build:
      context: .
      dockerfile: Dockerfile.bot
    env_file: .env
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## 9. Тестирование

### 9.1 Подготовка тестовых файлов

Исполнитель собирает тестовый датасет — минимум по **5 файлов** в каждой категории:

**Изображения:**
- 5 реальных фото (обычные фотографии людей, пейзажи)
- 5 сгенерированных (Midjourney, DALL-E, Stable Diffusion) — можно взять с https://thispersondoesnotexist.com

**Аудио:**
- 5 реальных голосовых (записать самостоятельно или из открытых источников)
- 5 синтетических (ElevenLabs demo, Resemble AI demo samples)

**Видео:**
- 3 реальных коротких видео (≤30 секунд)
- 3 deepfake видео (FaceSwap примеры из открытых датасетов, например FaceForensics++)

**Текст:**
- 5 реальных текстов (новостные статьи, живые посты)
- 5 сгенерированных ChatGPT (попросить ChatGPT написать текст и сохранить)

Все файлы в `media_samples/real/` и `media_samples/fake/`, НЕ коммитить в git.

### 9.2 Unit-тесты (tests/unit/test_adapters.py)

Каждый адаптер тестируется с **mock httpx** (без реальных API-вызовов):

```python
import pytest
from unittest.mock import AsyncMock, patch
from adapters.sightengine import SightengineAdapter
from core.enums import Verdict

@pytest.mark.asyncio
async def test_sightengine_fake_verdict():
    mock_response = {"status": "success", "type": {"ai_generated": 0.95}}
    with patch("httpx.AsyncClient.post", return_value=AsyncMock(json=lambda: mock_response)):
        adapter = SightengineAdapter()
        result = await adapter.analyze(b"fake_image_bytes")
        assert result.verdict == Verdict.FAKE
        assert result.confidence >= 0.75

@pytest.mark.asyncio
async def test_sightengine_timeout_returns_uncertain():
    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("timeout")):
        adapter = SightengineAdapter()
        result = await adapter.analyze(b"some_bytes")
        assert result.verdict == Verdict.UNCERTAIN
```

Покрыть аналогично: `ResembleAdapter`, `SaplingAdapter`, `HFImageAdapter`, `HFAudioAdapter`. Минимум 3 теста на каждый адаптер (fake, real, error case).

### 9.3 Интеграционные тесты (tests/integration/test_pipeline.py)

**Запускать только при наличии реальных API ключей и реального доступа к интернету.**

```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_real_image_sightengine():
    with open("media_samples/real/photo1.jpg", "rb") as f:
        result = await SightengineAdapter().analyze(f.read())
    assert result.verdict in [Verdict.REAL, Verdict.UNCERTAIN]
    assert 0 <= result.confidence <= 1

@pytest.mark.integration  
@pytest.mark.asyncio
async def test_fake_image_sightengine():
    with open("media_samples/fake/ai_generated1.jpg", "rb") as f:
        result = await SightengineAdapter().analyze(f.read())
    # Не ассертим конкретный вердикт — модель может ошибаться
    # Ассертируем что ответ структурно корректен
    assert result.confidence >= 0
    assert result.model_used == ModelUsed.SIGHTENGINE
```

**Фиксировать результаты интеграционных тестов в таблицу** (файл `tests/integration/results.md`):

| Файл | Ожидание | Факт (verdict) | Confidence | Latency |
|---|---|---|---|---|
| photo_real_1.jpg | REAL | REAL | 0.91 | 1240ms |
| ai_gen_1.jpg | FAKE | FAKE | 0.97 | 980ms |

### 9.4 End-to-end тест пайплайна

Написать скрипт `tests/e2e_test.py` который:
1. Запускает `docker-compose up`
2. Отправляет тестовые файлы напрямую на `POST /analyze`
3. Проверяет структуру ответа
4. Выводит сводную таблицу результатов

---

## 10. Деплой

### 10.1 VPS требования (для Sprint 1)

- 2 CPU, 2 GB RAM (минимум для FFmpeg)
- Ubuntu 22.04 LTS
- Docker + Docker Compose установлены
- Открытые порты: 80, 443 (для будущего webhook), 8000 (только локально)

### 10.2 Последовательность деплоя

```bash
git clone <repo> /opt/mediaverifybot
cd /opt/mediaverifybot
cp .env.example .env
nano .env  # Заполнить все ключи

docker-compose build
docker-compose up -d db
sleep 5
docker-compose run --rm api alembic upgrade head
docker-compose up -d api bot

docker-compose logs -f  # Проверить отсутствие ошибок
```

### 10.3 Мониторинг (минимальный для MVP)

- `docker-compose logs --tail=100 api` — проверка ошибок API
- `GET /health` — периодический пинг (можно настроить UptimeRobot бесплатно)
- Логировать в stdout через `logging.basicConfig(level=logging.INFO)` во всех модулях

---

## 11. Чек-лист приёмки Sprint 1

Исполнитель проходит перед сдачей. Каждый пункт — демонстрация тимлиду.

### 11.1 Инфраструктура
- [ ] Репозиторий создан, структура папок соответствует спецификации
- [ ] `.env.example` заполнен всеми переменными
- [ ] `docker-compose up` поднимает все 3 сервиса без ошибок
- [ ] `GET /health` возвращает `{"status": "ok", "db": "ok"}`
- [ ] БД содержит 3 таблицы: users, checks, rate_limits
- [ ] Alembic миграции применены

### 11.2 Адаптеры
- [ ] Sightengine: реальный запрос с реальным изображением возвращает корректный ответ
- [ ] Resemble: реальный запрос с аудио возвращает корректный ответ
- [ ] Sapling: реальный запрос с текстом ≥50 символов возвращает корректный ответ
- [ ] HF Image: запрос возвращает ответ (или UNCERTAIN при cold start)
- [ ] HF Audio: запрос возвращает ответ (или UNCERTAIN при cold start)
- [ ] Video Pipeline: 30-секундное видео обрабатывается без ошибок, кадры извлекаются

### 11.3 API
- [ ] `POST /analyze` с изображением → корректный JSON с verdict/confidence/model_used
- [ ] `POST /analyze` с аудио → корректный JSON
- [ ] `POST /analyze` с видео → корректный JSON (время < 60s)
- [ ] `POST /analyze` с текстом → корректный JSON
- [ ] `POST /analyze` без x-api-secret → 403
- [ ] Превышение rate limit → 429 с понятным сообщением
- [ ] Неподдерживаемый тип файла → 400

### 11.4 Бот
- [ ] `/start` — показывает приветственное сообщение
- [ ] `/help` — показывает инструкцию
- [ ] `/status` — показывает количество оставшихся проверок
- [ ] Отправка фото → результат с вердиктом за ≤15 секунд
- [ ] Отправка аудио/голоса → результат с вердиктом
- [ ] Отправка видео ≤60 секунд → результат с вердиктом
- [ ] `/check <текст>` → результат с вердиктом
- [ ] 4-я проверка за день → сообщение о лимите, а не ошибка
- [ ] Прогресс-сообщение "Анализирую..." показывается пока идёт обработка

### 11.5 Тесты
- [ ] `pytest tests/unit/` — все проходят без реальных API
- [ ] `pytest tests/integration/ -m integration` — ≥80% корректных вердиктов на тестовом датасете
- [ ] Таблица результатов `tests/integration/results.md` заполнена

### 11.6 Документация
- [ ] `README.md` содержит: описание, требования, инструкцию запуска, описание .env
- [ ] Все API ключи зарегистрированы и работоспособны (задокументировать в личном .env)

---

## 12. Ограничения и важные замечания

### 12.1 Лимиты внешних API — контроль расхода

| API | Free Limit | При исчерпании |
|---|---|---|
| Sightengine | 2,000 ops/month | Fallback → HF Image |
| Resemble Detect | 1,000 req/month | Fallback → HF Audio |
| Sapling | 2,000 req/month | Вернуть UNCERTAIN + сообщение |
| HuggingFace | ~1,000 req/day | Вернуть UNCERTAIN |

Исполнитель отслеживает расход в дашбордах API сервисов и **не допускает превышения** на этапе тестирования.

### 12.2 Безопасность
- Файлы хранятся **только в памяти** (bytes), на диск не пишем
- `x-api-secret` в заголовке — обязательная защита внутреннего API от прямых вызовов
- Не логировать содержимое файлов и тексты пользователей
- PostgreSQL — только внутри Docker сети, порт не пробрасывать наружу

### 12.3 Что намеренно НЕ входит в Sprint 1
- Celery / Redis (добавляются в Sprint 2 при росте нагрузки)
- Webhook (используется polling)
- Premium оплата и Stripe
- Self-hosted модели (WavLM, CLIP, HF локально)
- Админ-панель
- Алерты и сложный мониторинг

---

**Готово к разработке. Исполнитель начинает с раздела 1, двигается строго по порядку, демонстрирует результат каждого раздела перед переходом к следующему.**

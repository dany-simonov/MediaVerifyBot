# Источник

Система верификации медиаконтента — детекция deepfake, AI-генерации и синтетической речи.
Telegram-бот + веб-платформа.

---

## Возможности

| Тип | Что проверяется | Модели |
|---|---|---|
| 🖼 **Фото** | AI-генерация (Midjourney, DALL-E, SD) | SightEngine → HuggingFace fallback |
| 🎵 **Аудио / Голос** | Синтетическая речь (TTS, voice cloning) | Resemble Detect → HuggingFace fallback |
| 🎬 **Видео** | Покадровый анализ, deepfake | FFmpeg + SightEngine pipeline |
| 📝 **Текст** | AI-генерация (ChatGPT, GPT-4 и т.д.) | Sapling AI |

**Лимиты:** 3 бесплатные проверки в день. Premium: 100/месяц.

---

## Требования

- **Docker** ≥ 24 + **Docker Compose** ≥ 2.20
- **Python 3.11+** (только для локальной разработки без Docker)
- Зарегистрированные API-ключи (см. раздел ниже)
- FFmpeg (автоматически устанавливается в Docker-образах)

---

## Быстрый старт (Docker)

```bash
# 1. Клонировать репозиторий
git clone https://github.com/dany-simonov/MediaVerifyBot.git
cd MediaVerifyBot

# 2. Заполнить переменные окружения
cp .env.example .env
nano .env   # заполнить все ключи

# 3. Собрать образы
docker-compose build

# 4. Запустить БД и применить миграции
docker-compose up -d db
sleep 5
docker-compose run --rm api alembic upgrade head

# 5. Запустить API и бот
docker-compose up -d api bot

# 6. Проверить работоспособность
curl http://localhost:8000/health
docker-compose logs -f
```

Успешный ответ `/health`:
```json
{"status": "ok", "version": "0.2.0", "db": "ok"}
```

---

## Локальная разработка (без Docker)

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac

pip install -e ".[dev]"

# PostgreSQL через Docker (только БД):
docker-compose up -d db

alembic upgrade head
uvicorn api.main:app --reload --port 8000

# В отдельном терминале:
python -m bot.main
```

---

## Переменные окружения (.env)

| Переменная | Описание | Где получить |
|---|---|---|
| `BOT_TOKEN` | Telegram Bot Token | [@BotFather](https://t.me/BotFather) → `/newbot` |
| `API_BASE_URL` | URL внутреннего API | `http://api:8000` в Docker, `http://localhost:8000` локально |
| `API_SECRET_KEY` | Секрет для защиты внутреннего API | `openssl rand -hex 32` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://user:password@db/mediaverifybot` |
| `SIGHTENGINE_API_USER` | SightEngine API User | [dashboard.sightengine.com/signup](https://dashboard.sightengine.com/signup) |
| `SIGHTENGINE_API_SECRET` | SightEngine API Secret | то же |
| `SAPLING_API_KEY` | Sapling AI API Key | [sapling.ai/user/register](https://sapling.ai/user/register) |
| `RESEMBLE_API_KEY` | Resemble Detect API Key | [app.resemble.ai/auth/sign_up](https://app.resemble.ai/auth/sign_up) |
| `HF_API_TOKEN` | HuggingFace Inference API Token | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| `FREE_DAILY_LIMIT` | Бесплатный лимит/день | По умолчанию `3` |
| `PREMIUM_MONTHLY_LIMIT` | Premium лимит/месяц | По умолчанию `100` |

### Лимиты бесплатных планов внешних API

| Сервис | Бесплатный лимит | Fallback |
|---|---|---|
| SightEngine | 2 000 ops/месяц | HuggingFace Image |
| Resemble Detect | 1 000 req/месяц | HuggingFace Audio |
| Sapling AI | 2 000 req/месяц | UNCERTAIN |
| HuggingFace | ~1 000 req/день | UNCERTAIN |

---

## Структура проекта

```
MediaVerifyBot/
├── bot/                  # Telegram-бот (aiogram 3)
│   ├── handlers/         # Хендлеры фото/видео/аудио/текст
│   ├── middlewares/      # Rate-limit middleware (in-memory)
│   ├── keyboards/        # Inline-кнопки
│   └── utils/            # Форматирование ответов
├── api/                  # FastAPI backend
│   ├── routers/          # POST /analyze, GET /health
│   └── schemas.py        # Pydantic-схемы
├── core/                 # Config, enums, exceptions
├── adapters/             # Адаптеры внешних API
│   ├── sightengine.py    # Изображения (primary)
│   ├── hf_image.py       # Изображения (fallback)
│   ├── resemble.py       # Аудио (primary)
│   ├── hf_audio.py       # Аудио (fallback)
│   ├── sapling.py        # Текст
│   └── video_pipeline.py # Видео (ffmpeg + sightengine)
├── router/               # Маршрутизация по типу медиа
├── db/                   # SQLAlchemy модели, репозиторий
├── migrations/           # Alembic миграции
├── tests/
│   ├── conftest.py       # Mock env vars для unit-тестов
│   ├── unit/             # Unit-тесты (без реальных API)
│   ├── integration/      # Интеграционные тесты
│   └── e2e_test.py       # E2E тест через HTTP
├── Dockerfile.api
├── Dockerfile.bot
├── docker-compose.yml
└── pyproject.toml
```

---

## Тестирование

### Unit-тесты (нет сети, нет реальных ключей)

```bash
pytest tests/unit/ -v
```

### Интеграционные тесты (нужны реальные API-ключи)

```bash
# Убедитесь, что .env заполнен
# Подготовьте media_samples/ (см. ниже)
pytest tests/integration/ -m integration -v
```

Тестовый датасет (`media_samples/` — **не коммитить в git**, уже в `.gitignore`):

```
media_samples/
├── real/   photo1-5.jpg, voice1-5.wav, clip1-3.mp4, article1-5.txt
└── fake/   ai_generated1-5.jpg, tts1-5.wav, deepfake1-3.mp4, ai_text1-5.txt
```

Результаты: `tests/integration/results.md`

### End-to-end тест

```bash
docker-compose up -d
python tests/e2e_test.py
```

---

## Команды бота

| Команда | Описание |
|---|---|
| `/start` | Приветствие и инструкция |
| `/help` | Как пользоваться ботом |
| `/check <текст>` | Проверить текст на AI-генерацию (мин. 50 символов) |
| `/status` | Лимит проверок |
| `/about` | О боте и моделях |

Или просто **отправьте файл** — бот определит тип автоматически.

---

## Линтинг

```bash
ruff check .          # проверить
ruff check . --fix    # автоисправление
```

---

## Деплой на VPS

```bash
# Ubuntu 22.04, Docker, Docker Compose
git clone <repo> /opt/mediaverifybot
cd /opt/mediaverifybot
cp .env.example .env && nano .env

docker-compose build
docker-compose up -d db
sleep 5
docker-compose run --rm api alembic upgrade head
docker-compose up -d api bot
docker-compose logs -f
```

---

## Версия

**0.2.0** — Источник: ребрендинг, веб-платформа, Big Check, UX-фиксы


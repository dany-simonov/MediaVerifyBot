# Источник

**Платформа верификации медиаконтента на основе ИИ.**

Источник определяет, создан ли контент человеком или сгенерирован искусственным интеллектом. Поддерживает фото, аудио, видео и текст, давая вероятностный вердикт, индекс подлинности и объяснение результата.

🌐 **Сайт:** [istochnik.appwrite.network](https://istochnik.appwrite.network)  
📧 **Связаться:** [istochnik-media@yandex.com](mailto:istochnik-media@yandex.com)

---

## Что умеет

| Тип контента | Что определяет | Точность (ориентир) |
| --- | --- | --- |
| **Фото** | AI-генерация (Midjourney, DALL-E, SD, Firefly) | 94.4% |
| **Аудио** | Синтетическая речь и voice cloning | 99.5% |
| **Видео** | Покадровый анализ (pipeline) | 81% |
| **Текст** | AI-генерация + фактчек текста | 98% |

### Индекс подлинности

Каждая проверка возвращает индекс подлинности от 0 до 100. Чем выше значение, тем вероятнее, что контент создан человеком. Для AI-контента индекс автоматически инвертируется, чтобы шкала оставалась интуитивной.

### Big Check

Пакетная проверка файлов: система анализирует каждый элемент отдельно и выдает общий вывод по результатам кросс-анализа.

---

## Архитектура

Сервис состоит из веб-платформы, API и подсистем анализа:

- **Web** — React 18 + TypeScript + Tailwind CSS + Zustand + React Router (Vite)
- **API** — FastAPI + SQLAlchemy (async) + PostgreSQL + Alembic
- **Анализ** — адаптеры внешних моделей + fallback-цепочки
- **Хранилище/логика** — Appwrite SDK для клиентской части (auth, storage, функции)

### Модели и fallback-цепочки

```text
Фото:   Sightengine  →  HuggingFace (fallback)
Аудио:  Resemble      →  HuggingFace (fallback)
Текст:  Sapling AI    →  g4f hybrid fact-check
```

Если основная модель недоступна или вернула неопределенность, подключается резервная.

---

## Структура проекта

```text
├── api/                      # FastAPI API
├── adapters/                 # Интеграции с ML-сервисами
├── bot/                      # Telegram-бот (опциональный канал)
├── core/                     # Анализ, конфиги, исключения
├── db/                       # SQLAlchemy модели и репозиторий
├── router/                   # MediaRouter для выбора адаптера
├── tests/                    # Unit + integration
├── web/                      # React веб-платформа (Vite + TS + Tailwind)
├── miniapp/                  # Telegram Mini App (отдельный фронт)
└── migrations/               # Alembic
```

---

## API (основные эндпоинты)

- `POST /analyze` — анализ файла (multipart), поддержка текста через `text_content`
- `POST /analyze/text/hybrid` — гибридный анализ текста (AI + фактчек)
- `GET /health` — статус сервиса

API ожидает заголовок `x-api-secret` и использует лимиты из настроек.

---

## Переменные окружения

Создайте `.env` в корне проекта (или задайте переменные окружения):

```env
# FastAPI
API_BASE_URL=http://api:8000
API_SECRET_KEY=change_me

# Database
DATABASE_URL=postgresql+asyncpg://user:password@db:5432/mediaverifybot

# External APIs
SIGHTENGINE_API_USER=
SIGHTENGINE_API_SECRET=
SAPLING_API_KEY=
RESEMBLE_API_KEY=
HF_API_TOKEN=

# Limits
FREE_DAILY_LIMIT=3
PREMIUM_MONTHLY_LIMIT=100

# Video
MAX_VIDEO_DURATION_SECONDS=60
VIDEO_FRAME_SAMPLE_RATE=1

# Bot (если используете)
BOT_TOKEN=
WEBHOOK_URL=
```

---

## Локальная разработка

### Web

```bash
cd web
npm install
npm run dev   # http://localhost:3001
```

### API

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

### Бот (опционально)

```bash
python -m bot.main
```

### Mini App (опционально)

```bash
cd miniapp
npm install
npm run dev
```

---

## Тесты

```bash
pytest
```

---

## Лицензия

© 2026 Источник. Все права защищены.


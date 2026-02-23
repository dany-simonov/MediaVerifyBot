# MediaVerifyBot

Telegram-бот для проверки медиафайлов на подлинность (детекция deepfake, AI-генерации).

## Возможности

- 🖼 **Фото** — детекция AI-генерированных изображений (SightEngine + HuggingFace fallback)
- 🎵 **Аудио/голосовые** — детекция синтетической речи (Resemble Detect + HF fallback)
- 🎬 **Видео** — покадровый анализ (FFmpeg + SightEngine)
- 📝 **Текст** — детекция AI-текстов (Sapling AI)

## Требования

- Python 3.11+
- Docker + Docker Compose
- FFmpeg (устанавливается в Docker-образах)

## Быстрый старт

```bash
# 1. Клонируем
git clone <repo_url>
cd MediaVerifyBot

# 2. Настраиваем окружение
cp .env.example .env
# Заполнить .env реальными ключами (см. раздел ниже)

# 3. Запускаем
docker-compose build
docker-compose up -d db
sleep 5
docker-compose run --rm api alembic upgrade head
docker-compose up -d api bot

# 4. Проверяем
curl http://localhost:8000/health
docker-compose logs -f
```

## Переменные окружения (.env)

| Переменная | Описание | Где получить |
|---|---|---|
| `BOT_TOKEN` | Telegram Bot Token | [@BotFather](https://t.me/BotFather) |
| `API_SECRET_KEY` | Внутренний ключ API | Сгенерировать: `openssl rand -hex 16` |
| `DATABASE_URL` | PostgreSQL connection string | Автоматически в Docker |
| `SIGHTENGINE_API_USER` | SightEngine API User | [sightengine.com](https://dashboard.sightengine.com/signup) |
| `SIGHTENGINE_API_SECRET` | SightEngine API Secret | [sightengine.com](https://dashboard.sightengine.com/signup) |
| `SAPLING_API_KEY` | Sapling AI API Key | [sapling.ai](https://sapling.ai/user/register) |
| `RESEMBLE_API_KEY` | Resemble Detect API Key | [resemble.ai](https://app.resemble.ai/auth/sign_up) |
| `HF_API_TOKEN` | HuggingFace Token | [huggingface.co](https://huggingface.co/settings/tokens) |

## Структура проекта

```
bot/          — Telegram-бот (aiogram 3)
api/          — FastAPI backend
core/         — Конфигурация, enums, исключения
adapters/     — Адаптеры внешних API
router/       — Маршрутизация по типу медиа
db/           — SQLAlchemy модели и репозиторий
migrations/   — Alembic миграции
tests/        — Unit и интеграционные тесты
```

## Тестирование

```bash
# Unit-тесты (без реальных API)
pytest tests/unit/

# Интеграционные тесты (нужны реальные ключи)
pytest tests/integration/ -m integration
```

## Версия

0.1.0 (Sprint 1 MVP)

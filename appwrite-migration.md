# Источник — Полная инструкция по новой архитектуре на Appwrite

**Читать полностью перед началом работы**

---

## Что произошло и почему

Проект «Источник» (MediaVerifyBot) переехал с локальной архитектуры (FastAPI + PostgreSQL + Docker) на **Appwrite Cloud**.

**Причины:**
- Нет возможности использовать платные VPS (нет подходящей карты)
- Appwrite Pro доступен бесплатно через GitHub Education (стоимость $15/мес — покрывается студенческой подпиской)
- Appwrite даёт всё необходимое: хостинг сайта, БД, авторизацию, serverless-функции, хранилище файлов
- Автодеплой при каждом `git push` в ветку `main` — без ручных действий

---

## Что такое Appwrite

Appwrite — это Backend-as-a-Service (BaaS). Это значит, что не нужно поднимать и поддерживать сервер вручную. Appwrite предоставляет готовые сервисы через REST API и SDK:

| Сервис Appwrite | Что заменяет в старой архитектуре |
|---|---|
| **Sites** | GitHub Pages / Nginx для статики |
| **Database** | PostgreSQL + SQLAlchemy + Alembic |
| **Auth** | Самописная авторизация |
| **Functions** | FastAPI роутеры + адаптеры |
| **Storage** | Временное хранение файлов |

---

## Новая архитектура — полная схема

```
Пользователь (браузер)
        ↓
Appwrite Sites
(сайт из папки web/ репозитория, автодеплой с GitHub)
        ↓
Appwrite JS SDK (в браузере, файл web/appwrite.js)
        ↓
        ├── Appwrite Auth → авторизация пользователя
        ├── Appwrite Storage → загрузка файла (фото/аудио)
        ├── Appwrite Functions → анализ файла
        │       ↓
        │   Python функция вызывает внешние ML API:
        │   - Sightengine (фото)
        │   - Sapling AI (текст)
        │   - Resemble Detect (аудио)
        │   - HuggingFace (fallback)
        │       ↓
        │   Возвращает результат: verdict / confidence / explanation
        │
        └── Appwrite Database → сохранить результат проверки
```

---

## Что осталось в репозитории — и что теперь не используется

### Папки которые БОЛЬШЕ НЕ ИСПОЛЬЗУЮТСЯ сайтом:
```
api/          ← FastAPI сервер — не нужен, заменён Appwrite Functions
bot/          ← Telegram бот — временно убран из скоупа
core/         ← конфиг, enums — не нужен для веба
db/           ← SQLAlchemy модели — не нужны, БД теперь Appwrite
migrations/   ← Alembic — не нужны
router/       ← медиа-роутер — логика переезжает в Functions
adapters/     ← адаптеры ML API — переезжают в Functions (Python)
Dockerfile.*  ← не нужны для деплоя сайта
docker-compose.yml ← не нужен
```

### Папки которые АКТИВНО ИСПОЛЬЗУЮТСЯ:
```
web/          ← весь сайт, деплоится на Appwrite Sites
adapters/     ← логика адаптеров ПЕРЕНОСИТСЯ в Appwrite Functions
```

> ⚠️ Старые папки можно не удалять — они просто не участвуют в работе сайта. Удалить можно позже при рефакторинге.

---

## Appwrite проект — данные для подключения

**Проект:** Источник  
**Project ID:** `69a9d60e00230f1aceb2`  
**API Endpoint:** `https://cloud.appwrite.io/v1`  
**Сайт:** `https://istochnik.appwrite.network`

Эти данные нужны при инициализации Appwrite SDK в JS.

---

## База данных

**Database ID:** `istochnik`

### Коллекция `checks` — история проверок

| Колонка | Тип | Описание |
|---|---|---|
| `$id` | String | Авто-генерируется Appwrite |
| `verdict` | Enum | REAL / FAKE / UNCERTAIN |
| `confidenceScore` | Float | 0.0 – 1.0 |
| `modelUsed` | String | sightengine / sapling / resemble / hf_image / hf_audio |
| `mediaType` | Enum | image / audio / text |
| `explanation` | String | Текстовое объяснение результата |
| `processingTime` | Integer | Время обработки в мс |
| `userId` | Varchar(255) | ID пользователя из Appwrite Auth |
| `$createdAt` | Datetime | Авто-генерируется Appwrite |

---

## Appwrite Functions — главная логика анализа

### Что это такое
Appwrite Functions — это serverless Python-функции. Они запускаются по HTTP-запросу с сайта и умирают после выполнения. Не нужен постоянно работающий сервер.

### Какую функцию нужно создать

**Функция:** `analyze`  
**Runtime:** Python 3.11  
**Триггер:** HTTP (вызов с сайта через SDK)  
**Таймаут:** 30 секунд

### Что делает функция `analyze`

```
1. Получает из запроса:
   - fileId (ID файла в Appwrite Storage) ИЛИ text (строка)
   - mediaType (image / audio / text)
   - userId

2. Если mediaType = image:
   - Скачивает файл из Storage по fileId
   - Отправляет в Sightengine API
   - Если ошибка — отправляет в HuggingFace (fallback)

3. Если mediaType = audio:
   - Скачивает файл из Storage
   - Отправляет в Resemble Detect API
   - Если ошибка или UNCERTAIN — отправляет в HuggingFace Audio (fallback)

4. Если mediaType = text:
   - Отправляет текст в Sapling AI API

5. Сохраняет результат в Appwrite Database (коллекция checks)

6. Возвращает JSON:
   {
     "verdict": "FAKE",
     "confidence": 0.94,
     "model_used": "sightengine",
     "explanation": "Sightengine: вероятность ИИ-генерации 94%",
     "processing_ms": 1240
   }
```

### ⚠️ Важно: видео НЕ поддерживается
FFmpeg не работает в Appwrite Functions. Видеоанализ исключён из скоупа MVP. На сайте кнопка видео должна быть помечена "Скоро" или скрыта.

---

## Appwrite Storage — загрузка файлов

**Bucket:** `uploads`

Файлы загружаются с сайта через Appwrite JS SDK напрямую в Storage. После анализа файл можно удалять (он временный).

Ограничения bucket:
- Максимальный размер файла: **20 MB**
- Разрешённые типы: `image/jpeg`, `image/png`, `image/webp`, `audio/ogg`, `audio/mpeg`, `audio/wav`

---

## Appwrite Auth — авторизация

Включить в консоли Appwrite → Auth → Settings:
- **Email/Password** — основной метод
- **Google OAuth** — дополнительный (нужно создать OAuth app в Google Console)

На сайте (`web/`) уже есть форма входа — нужно подключить к Appwrite Auth SDK.

---

## Как подключить Appwrite SDK к сайту

В папке `web/` нужно создать файл `appwrite.js` (или добавить в существующий JS):

```javascript
import { Client, Account, Databases, Storage, Functions } from "https://cdn.jsdelivr.net/npm/appwrite@16/dist/esm/sdk.js";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('69a9d60e00230f1aceb2');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
```

### Пример: загрузить файл и вызвать анализ

```javascript
import { storage, functions } from './appwrite.js';
import { ID } from "https://cdn.jsdelivr.net/npm/appwrite@16/dist/esm/sdk.js";

async function analyzeFile(file) {
    // 1. Загрузить файл в Storage
    const uploaded = await storage.createFile(
        'uploads',      // bucket ID
        ID.unique(),    // уникальный ID файла
        file            // File object из input[type=file]
    );

    // 2. Вызвать Function analyze
    const result = await functions.createExecution(
        'analyze',  // function ID
        JSON.stringify({
            fileId: uploaded.$id,
            mediaType: 'image',
            userId: currentUserId
        })
    );

    // 3. Получить результат
    const data = JSON.parse(result.responseBody);
    return data; // { verdict, confidence, model_used, explanation, processing_ms }
}
```

---

## Переменные окружения для Appwrite Functions

В консоли Appwrite → Functions → analyze → Settings → Environment variables добавить:

```
SIGHTENGINE_API_USER=your_api_user
SIGHTENGINE_API_SECRET=your_api_secret
SAPLING_API_KEY=your_sapling_key
RESEMBLE_API_KEY=your_resemble_key
HF_API_TOKEN=your_hf_token
APPWRITE_PROJECT_ID=69a9d60e00230f1aceb2
APPWRITE_API_KEY=your_server_api_key  # создать в Appwrite → Settings → API Keys
APPWRITE_DATABASE_ID=istochnik
APPWRITE_COLLECTION_ID=checks
APPWRITE_BUCKET_ID=uploads
```

> ⚠️ `APPWRITE_API_KEY` — это серверный ключ с полными правами. Создать в Appwrite Console → Settings → API Keys. Никогда не публиковать в коде или git.

---

## Автодеплой сайта

Сайт (`web/`) уже задеплоен на Appwrite Sites и подключён к GitHub репозиторию.

**Как работает автодеплой:**
1. Разработчик вносит изменения в папку `web/`
2. Делает `git commit` и `git push origin main`
3. Appwrite автоматически обнаруживает изменения и запускает новый деплой
4. Через ~30 секунд сайт обновлён на `https://istochnik.appwrite.network`

Никаких дополнительных действий не требуется. Пересоздавать проект не нужно.

---

## Что нужно удалить из репозитория

```bash
# Удалить мусорные файлы с ngrok-туннелями
git rm api_tunnel.txt
git rm miniapp_tunnel.txt
git commit -m "remove ngrok tunnel files"
git push origin main
```

---

## Приоритеты задач для разработчика

### Задача 1 — Appwrite Function `analyze` (Python)
Создать функцию в Appwrite Console → Functions → Create Function:
- Runtime: Python 3.11
- Взять логику из `adapters/sightengine.py`, `adapters/sapling.py`, `adapters/resemble.py`, `adapters/hf_image.py`, `adapters/hf_audio.py`
- Адаптировать под serverless: убрать классы, оставить чистые функции
- Прописать все env-переменные

### Задача 2 — Подключить SDK к сайту (`web/`)
- Добавить инициализацию Appwrite SDK
- Форма загрузки файла → Storage → Functions → показать результат
- Авторизация через Appwrite Auth

### Задача 3 — Убрать видео с сайта
- Кнопку/раздел видео пометить "Скоро" или скрыть через CSS `display: none`
- Видеоанализ вернётся в будущей версии когда будет VPS

### Задача 4 — Подключить Auth на сайте
- Форма входа через email/password через Appwrite Auth SDK
- Опционально: Google OAuth

---

## Итог

Старая архитектура (FastAPI + PostgreSQL + Docker) полностью заменена на Appwrite Cloud. Сайт уже живёт на `https://istochnik.appwrite.network`. Следующий шаг — написать Appwrite Function на Python с логикой анализа и подключить её к сайту через JS SDK.

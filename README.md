# Источник

**Система верификации медиаконтента на основе ИИ.**

Определяет, создан ли контент человеком или сгенерирован искусственным интеллектом. Работает с фото, аудио и текстом. Доступна через Telegram-бота и веб-платформу.

🌐 **Сайт:** [istochnik.appwrite.network](https://istochnik.appwrite.network)  
📱 **Telegram-бот:** [@MediaVerifyBot](https://t.me/MediaVerifyBot)  
📧 **Связаться:** [istochnik-media@yandex.com](mailto:istochnik-media@yandex.com)

---

## Зачем это нужно

Генеративный ИИ создаёт всё более реалистичный контент — от фото до голосовых сообщений. Источник помогает за секунды проверить подлинность любого медиафайла и получить понятный вердикт с индексом подлинности.

---

## Что умеет

| Тип контента | Что обнаруживает | Точность |
| --- | --- | --- |
| **Фото** | Midjourney, DALL-E, Stable Diffusion, Adobe Firefly | 94.4% |
| **Аудио / голос** | Синтетическая речь, клонирование голоса (ElevenLabs, XTTS) | 99.5% |
| **Текст** | ChatGPT, GPT-4, Claude и другие LLM | 98% |

### Индекс подлинности

Каждая проверка выдаёт **индекс подлинности** от 0% до 100%. Чем выше значение — тем вероятнее, что контент создан человеком. Для сгенерированного ИИ контента индекс автоматически инвертируется, чтобы шкала всегда была интуитивно понятной.

### Big Check (кросс-анализ)

Загрузите до 10 файлов разных типов за раз — система проанализирует каждый по отдельности и вынесет общий вердикт, используя кросс-анализ результатов.

---

## Как пользоваться

### Telegram-бот

Откройте бота [@MediaVerifyBot](https://t.me/MediaVerifyBot) и отправьте файл — фото, аудио или документ. Результат придёт в чат за несколько секунд.

Текст можно проверить командой `/check` или просто отправив сообщение.

**Команды:**

| Команда | Что делает |
| --- | --- |
| `/start` | Приветствие и краткая инструкция |
| `/help` | Подробнее о работе бота |
| `/check <текст>` | Проверить текст (от 50 символов) |
| `/status` | Остаток проверок на сегодня |
| `/about` | Точность моделей и информация о системе |

### Веб-платформа

Перейдите на [istochnik.appwrite.network](https://istochnik.appwrite.network) — лендинг с описанием продукта, Big Check для пакетной проверки файлов и личный кабинет с историей проверок.

---

## Тарифы

| | **Free** | **Premium** |
| --- | --- | --- |
| Стоимость | Бесплатно | 199 ₽/мес |
| Лимит | 3 проверки/день | 100 проверок/мес |
| Форматы | Все | Все |
| История проверок | В боте | В боте + веб-кабинет |
| PDF-отчёты | — | Да |

---

## Архитектура

Система построена на облачной инфраструктуре Appwrite Cloud:

- **Веб-платформа** — React 18 + TypeScript + Tailwind CSS + Zustand + React Router, хостинг на Appwrite Sites
- **Telegram-бот** — Python + aiogram 3.7
- **Бэкенд** — Appwrite Functions (serverless Python)
- **База данных** — Appwrite Database
- **Хранилище файлов** — Appwrite Storage (временное хранение для анализа)
- **Авторизация** — Appwrite Auth (Email/Password, JWT)

### Модели и fallback-цепочки

```text
Фото:   Sightengine  →  HuggingFace (fallback)
Аудио:  Resemble      →  HuggingFace (fallback)
Текст:  Sapling AI
```

Если основная модель недоступна или возвращает неуверенный результат — автоматически подключается резервная.

---

## Структура проекта

```text
├── web/                      # React веб-платформа (Vite + TypeScript + Tailwind)
│   ├── src/
│   │   ├── components/       # UI компоненты
│   │   │   ├── ui/           # Базовые UI (Button, Input, Card, Alert, Spinner)
│   │   │   ├── layout/       # Layout (DashboardLayout, Sidebar)
│   │   │   ├── forms/        # Формы (LoginForm, RegisterForm)
│   │   │   ├── router/       # ProtectedRoute, PublicOnlyRoute
│   │   │   └── upload/       # FileDropzone, TextInput
│   │   ├── pages/            # Страницы
│   │   │   ├── auth/         # LoginPage, RegisterPage
│   │   │   └── dashboard/    # DashboardOverview, NewCheckPage, HistoryPage, ApiSettingsPage
│   │   ├── store/            # Zustand stores (authStore)
│   │   ├── hooks/            # React хуки
│   │   ├── lib/              # Appwrite SDK, утилиты
│   │   └── types/            # TypeScript типы
│   └── assets/               # Статические ресурсы (изображения)
├── bot/                      # Telegram-бот (aiogram 3.7)
│   ├── handlers/             # Обработчики медиа и текста
│   ├── middlewares/          # Rate-limiting
│   └── keyboards/            # Inline-кнопки
├── adapters/                 # Интеграции с ML-сервисами
├── miniapp/                  # Telegram Mini App (React + TypeScript)
└── tests/                    # Unit + integration тесты
```

---

## Стек

| Компонент | Технология |
| --- | --- |
| Веб | React 18, TypeScript, Tailwind CSS, Zustand, React Router, Vite |
| Бот | Python 3.11+, aiogram 3.7 |
| Бэкенд | Appwrite Cloud (Functions, Database, Storage, Auth) |
| Mini App | React 18, TypeScript, Tailwind, Vite |
| Деплой | Appwrite Sites (автодеплой при git push) |

---

## Локальная разработка

```bash
# Веб-платформа
cd web
npm install
npm run dev     # http://localhost:3001

# Сборка для продакшена
npm run build   # dist/
```

---

## Версия

**v0.7.0** — «Enterprise Dashboard»

- Полный рефакторинг веб-платформы с enterprise-grade архитектурой
- Zustand для state management
- Новые страницы: Login, Register, Dashboard с Sidebar
- Drag & Drop загрузка файлов (react-dropzone)
- Защищённые маршруты (ProtectedRoute)
- UI Kit: Button, Input, Card, Alert, Spinner с поддержкой темы
- Удалены legacy HTML/CSS/JS файлы
- Верификация через Telegram — скоро

**Планы на v0.8.0:**
- Интеграция анализа с бэкендом
- История проверок из Appwrite Database
- Публичный REST API с полной документацией
- Личный кабинет с историей проверок и статистикой  
- Браузерное расширение для быстрой проверки

---

## Связаться

📧 **Email:** [istochnik-media@yandex.com](mailto:istochnik-media@yandex.com)  
📱 **Telegram:** [@MediaVerifyBot](https://t.me/MediaVerifyBot)  
🌐 **Сайт:** [istochnik.appwrite.network](https://istochnik.appwrite.network)

---

## Лицензия

© 2026 Источник. Все права защищены.


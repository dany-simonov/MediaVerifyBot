# MediaVerify Mini App

Telegram Mini App для MediaVerifyBot.

## Технологии

- React 18 + TypeScript
- Vite
- Tailwind CSS
- @twa-dev/sdk

## Запуск

1. Установите зависимости:
```bash
cd miniapp
npm install
```

2. Создайте `.env` файл:
```bash
cp .env.example .env
```

3. Заполните переменные окружения в `.env`:
- `VITE_API_BASE_URL` — URL вашего FastAPI бэкенда
- `VITE_API_SECRET_KEY` — секретный ключ API

4. Запустите в режиме разработки:
```bash
npm run dev
```

5. Соберите для продакшена:
```bash
npm run build
```

## Деплой

1. Выполните `npm run build`
2. Загрузите содержимое `dist/` на статик-хостинг (Vercel, Netlify, GitHub Pages)
3. В BotFather: `/mybots` → выберите бота → Bot Settings → Menu Button → вставьте URL

## Структура

```
src/
├── main.tsx          # Entry point
├── App.tsx           # Routes & layout
├── api/
│   └── client.ts     # API client
├── hooks/
│   └── useTelegramUser.ts
├── pages/
│   ├── Dashboard.tsx
│   ├── History.tsx
│   ├── Pricing.tsx
│   └── About.tsx
├── components/
│   ├── BottomNav.tsx
│   ├── ConfidenceGauge.tsx
│   ├── CheckCard.tsx
│   ├── VerdictBadge.tsx
│   └── StatBar.tsx
└── types/
    └── index.ts
```

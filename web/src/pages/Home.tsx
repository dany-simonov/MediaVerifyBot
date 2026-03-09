import { FeatureCard, PricingCard, TimelineItem, BigCheck } from '../components';

// Feature icons as SVG
const PhotoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const AudioIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <line x1="4" y1="9" x2="4" y2="15"/>
    <line x1="8" y1="5" x2="8" y2="19"/>
    <line x1="12" y1="2" x2="12" y2="22"/>
    <line x1="16" y1="6" x2="16" y2="18"/>
    <line x1="20" y1="9" x2="20" y2="15"/>
  </svg>
);

const VideoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <polygon points="10,8.5 10,15.5 16,12" fill="currentColor" opacity="0.3"/>
  </svg>
);

const TextIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="13" y2="17"/>
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const HeatmapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="3" y1="15" x2="21" y2="15"/>
    <line x1="9" y1="3" x2="9" y2="21"/>
    <line x1="15" y1="3" x2="15" y2="21"/>
  </svg>
);

const features = [
  {
    icon: <PhotoIcon />,
    title: 'Фото',
    description: 'Детекция AI-генерации\nSightengine genai, точность 94.4%',
  },
  {
    icon: <AudioIcon />,
    title: 'Аудио',
    description: 'Синтетическая речь и voice cloning\nResemble Detect, точность 99.5%',
  },
  {
    icon: <VideoIcon />,
    title: 'Видео',
    description: 'Покадровый анализ\nFFmpeg + Sightengine pipeline, 81%',
    badge: 'Скоро',
  },
  {
    icon: <TextIcon />,
    title: 'Текст',
    description: 'Написан ли ChatGPT?\nSapling AI, точность 98%',
  },
  {
    icon: <LinkIcon />,
    title: 'Проверка по ссылке',
    description: 'Вставь ссылку на пост в Telegram, видео YouTube или картинку — бот скачает и проверит',
  },
  {
    icon: <HeatmapIcon />,
    title: 'Тепловые карты',
    description: 'Explainable AI — визуализация зон, где ИИ «спалился» на сгенерированном фото',
  },
];

const pricingPlans = [
  {
    name: 'FREE',
    price: '0 ₽',
    features: ['3 проверки/день', 'Все форматы', 'Базовый вердикт'],
    buttonText: 'Открыть в Telegram',
    buttonLink: 'https://t.me/MediaVerifyBot',
    highlighted: true,
  },
  {
    name: 'PREMIUM',
    price: '199 ₽/мес',
    features: [
      '100 проверок/мес',
      'Приоритетная обработка',
      'История 30 дней',
      'Экспорт отчётов PDF',
      'Поделиться результатом',
    ],
    buttonText: '🔔 Встать в лист ожидания',
    buttonLink: 'https://t.me/MediaVerifyBot?start=waitlist_premium',
    badge: 'СКОРО',
  },
  {
    name: 'ENTERPRISE',
    price: 'По запросу',
    features: [
      'REST API доступ',
      'Безлимитные проверки',
      'SLA и поддержка',
      'Для СМИ, пабликов и форумов',
      'Кастомные модели',
    ],
    buttonText: '💼 Связаться',
    buttonLink: 'https://t.me/MediaVerifyBot?start=enterprise_inquiry',
    badge: 'B2B',
  },
];

const roadmapItems = [
  {
    version: 'v0.1.0',
    title: 'Альфа-версия',
    description: 'Базовый Telegram-бот, интеграция первых моделей детекции для фото и текста.',
    status: 'released' as const,
  },
  {
    version: 'v0.2.0',
    title: '«Источник»',
    description: 'Полный ребрендинг проекта и запуск функциональной веб-платформы. Внедрён интуитивный «Индекс подлинности», добавлена генерация детализированных PDF-отчётов.',
    status: 'released' as const,
  },
  {
    version: 'v0.3.0',
    title: 'Масштабирование',
    description: 'Big Check (пакетный кросс-анализ), Drag&Drop загрузчик, тариф Enterprise (B2B API) и тепловые карты (Explainable AI).',
    status: 'released' as const,
  },
  {
    version: 'v0.4.0',
    title: 'Глобальное обновление',
    description: 'Внедрение системы авторизации (Telegram + Email), редизайн системы карточек и переработка архитектуры страниц.',
    status: 'released' as const,
  },
  {
    version: 'v0.5.0',
    title: 'Фирменный стиль',
    description: 'Полностью переработанная система SVG-иконок в фирменном стиле, исправление анимации спидометра, обновление навигации и футера.',
    status: 'released' as const,
  },
  {
    version: 'v0.6.0',
    title: 'React + Appwrite',
    description: 'Полная миграция на React 18 + TypeScript + Tailwind. Переход на Appwrite Cloud для бэкенда. Новый дизайн интерфейса.',
    status: 'current' as const,
  },
  {
    version: 'v0.7.0',
    title: 'B2B & API',
    description: 'Полноценный релиз личного кабинета, запуск публичного REST API для интеграции с медиа-платформами и релиз расширения для браузера.',
    status: 'upcoming' as const,
  },
];

export function Home() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-mv-text leading-tight mb-6">
            Проверяй подлинность медиа<br />за секунды
          </h1>
          <p className="text-lg md:text-xl text-mv-text-secondary max-w-2xl mx-auto mb-8">
            Система верификации фото, видео, аудио и текста<br />
            на основе специализированных моделей ИИ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="https://t.me/MediaVerifyBot"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-mv-accent text-white rounded-lg font-semibold hover:bg-mv-accent-hover transition-colors"
            >
              Попробовать бесплатно
            </a>
            <a
              href="#bigcheck"
              className="px-8 py-3 bg-mv-surface border border-mv-border text-mv-text rounded-lg font-semibold hover:border-mv-accent transition-colors"
            >
              Смотреть демо
            </a>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            <div>
              <div className="text-3xl font-bold text-mv-accent">94.4%</div>
              <div className="text-sm text-mv-text-secondary">Точность фото</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-mv-accent">99.5%</div>
              <div className="text-sm text-mv-text-secondary">Точность аудио</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-mv-accent">81%</div>
              <div className="text-sm text-mv-text-secondary">Точность видео</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 bg-mv-surface/50">
        <div className="container">
          <h2 className="text-3xl font-bold text-mv-text text-center mb-12">Возможности</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Big Check */}
      <section id="bigcheck" className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-mv-text text-center mb-12">Попробуй прямо сейчас</h2>
          <div className="max-w-3xl mx-auto">
            <BigCheck />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-mv-surface/50">
        <div className="container">
          <h2 className="text-3xl font-bold text-mv-text text-center mb-12">Тарифы</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <PricingCard key={index} {...plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-mv-text text-center mb-12">История версий</h2>
          <div className="max-w-2xl mx-auto">
            {roadmapItems.map((item, index) => (
              <TimelineItem key={index} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* Floating Telegram Button */}
      <a
        href="https://t.me/MediaVerifyBot"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-[#229ED9] text-white rounded-full shadow-lg hover:bg-[#1E8BC3] transition-all z-40"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        <span className="hidden sm:inline font-medium">Открыть бот</span>
      </a>
    </div>
  );
}

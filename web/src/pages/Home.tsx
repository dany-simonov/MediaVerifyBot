import { FeatureCard, PricingCard, TimelineItem, BigCheck } from '../components';
import { Image, AudioWaveform, Video, FileText, Link as LinkIconLucide, Grid, Send } from 'lucide-react';

const features = [
  {
    icon: <Image />,
    title: 'Фото',
    description: 'Детекция AI-генерации\nSightengine genai, точность 94.4%',
  },
  {
    icon: <AudioWaveform />,
    title: 'Аудио',
    description: 'Синтетическая речь и voice cloning\nResemble Detect, точность 99.5%',
  },
  {
    icon: <Video />,
    title: 'Видео',
    description: 'Покадровый анализ\nFFmpeg + Sightengine pipeline, 81%',
    badge: 'Скоро',
  },
  {
    icon: <FileText />,
    title: 'Текст',
    description: 'Написан ли ChatGPT?\nSapling AI, точность 98%',
  },
  {
    icon: <LinkIconLucide />,
    title: 'Проверка по ссылке',
    description: 'Вставь ссылку на пост в Telegram, видео YouTube или картинку — бот скачает и проверит',
  },
  {
    icon: <Grid />,
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
        <Send className="w-5 h-5" />
        <span className="hidden sm:inline font-medium">Открыть бот</span>
      </a>
    </div>
  );
}

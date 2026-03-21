import { Link } from 'react-router-dom';
import { FeatureCard, PricingCard, BigCheck } from '../components';
import { Image, AudioWaveform, FileText, Layers } from 'lucide-react';

const CONTACT_EMAIL = 'istochnik-media@yandex.com';

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
    icon: <FileText />,
    title: 'Текст',
    description: 'Написан ли ChatGPT?\nSapling AI, точность 98%',
  },
  {
    icon: <Layers />,
    title: 'Большая проверка',
    description: 'Двойная проверка текста: детекция ИИ + фактчек/заимствования с пословной подсветкой',
  },
];

const pricingPlans = [
  {
    name: 'FREE',
    price: '0 ₽',
    features: ['3 проверки/день', 'Все форматы', 'Базовый вердикт'],
    buttonText: 'Начать бесплатно',
    buttonLink: '/register',
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
    buttonLink: `mailto:${CONTACT_EMAIL}?subject=%D0%92%D1%81%D1%82%D0%B0%D1%82%D1%8C%20%D0%B2%20%D0%BB%D0%B8%D1%81%D1%82%20%D0%BE%D0%B6%D0%B8%D0%B4%D0%B0%D0%BD%D0%B8%D1%8F`,
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
    buttonLink: `mailto:${CONTACT_EMAIL}?subject=Enterprise%20inquiry`,
    badge: 'B2B',
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
            <Link
              to="/register"
              className="px-8 py-3 bg-mv-accent text-white rounded-lg font-semibold hover:bg-mv-accent-hover transition-colors"
            >
              Попробовать бесплатно
            </Link>
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
        <div className="mx-auto max-w-[1400px] px-6 md:px-8">
          <h2 className="text-3xl font-bold text-mv-text text-center mb-12">Возможности</h2>
          <div className="flex gap-5 overflow-x-auto px-2 pt-2 pb-3 md:px-3 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {features.map((feature, index) => (
              <div key={index} className="w-[290px] md:w-[300px] lg:w-[320px] snap-start flex-shrink-0">
                <FeatureCard {...feature} />
              </div>
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

    </div>
  );
}

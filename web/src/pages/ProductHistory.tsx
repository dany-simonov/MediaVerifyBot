import { TimelineItem } from '../components';

const roadmapItems = [
  {
    version: 'v0.1.0',
    title: 'Альфа-версия',
    description: 'Первая публичная версия, интеграция базовых моделей детекции для фото и текста.',
    status: 'released' as const,
  },
  {
    version: 'v0.2.0',
    title: '«Источник»',
    description: 'Полный ребрендинг проекта и запуск функциональной веб-платформы. Внедрен интуитивный «Индекс подлинности», добавлена генерация детализированных PDF-отчетов.',
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
    description: 'Внедрение системы авторизации по email, редизайн системы карточек и переработка архитектуры страниц.',
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

export function ProductHistory() {
  return (
    <div className="pt-24 pb-16">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-mv-text mb-4">История нашего продукта</h1>
          <p className="text-lg text-mv-text-secondary max-w-2xl mx-auto">
            Как развивался Источник: ключевые этапы, релизы и фокус на качестве детекции.
          </p>
        </div>

        <section className="bg-mv-surface border border-mv-border rounded-xl p-6 md:p-10">
          <div className="max-w-2xl mx-auto">
            {roadmapItems.map((item, index) => (
              <TimelineItem key={index} {...item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

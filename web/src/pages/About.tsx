import { Shield, Lock, Bot, Unlock, Rocket, Handshake, Plus } from 'lucide-react';

const CONTACT_EMAIL = 'istochnik-media@yandex.com';

const values = [
  { icon: Shield, title: 'Борьба с фейками', description: 'Мы создаём инструменты, которые помогают людям отличать настоящий контент от сгенерированного ИИ.' },
  { icon: Lock, title: 'Защита от манипуляций', description: 'Противодействие социальной инженерии и дипфейкам — наш вклад в безопасность цифровой среды.' },
  { icon: Bot, title: 'ИИ на страже правды', description: 'Используем передовые модели машинного обучения для анализа медиа с точностью свыше 94%.' },
  { icon: Unlock, title: 'Открытость', description: 'Прозрачность методов анализа и открытая архитектура — фундамент доверия к нашим результатам.' },
  { icon: Rocket, title: 'Инновации', description: 'Постоянное обновление моделей и технологий для опережения генеративных инструментов.' },
  { icon: Handshake, title: 'Доступность', description: 'Бесплатный доступ к базовым проверкам — каждый человек заслуживает инструмент верификации.' },
];

const badges = [
  'Версия v0.6.0',
  'Грантовая поддержка',
  'Хакатоны',
  'Акселераторы',
  'Open Source',
];

export function About() {
  return (
    <div className="pt-24 pb-16">
      <div className="container">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-mv-text mb-4">О проекте «Источник»</h1>
          <p className="text-lg text-mv-text-secondary max-w-2xl mx-auto">
            Мы строим инфраструктуру доверия к цифровому контенту — так, чтобы каждый мог отличить подлинное от поддельного
          </p>
        </div>

        {/* Mission */}
        <section className="mb-16">
          <div className="bg-mv-surface border border-mv-border rounded-xl p-8 md:p-12">
            <blockquote className="text-xl md:text-2xl text-mv-text font-medium leading-relaxed border-l-4 border-mv-accent pl-6 italic">
              «В мире, где ИИ генерирует неотличимый от реальности контент за секунды, возможность верифицировать подлинность медиа — это не роскошь, а необходимость. Мы создаём Источник, чтобы вернуть людям контроль над информацией.»
            </blockquote>
          </div>
        </section>

        {/* What we do */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-mv-accent mb-6">Что мы делаем</h2>
          <p className="text-mv-text-secondary leading-relaxed mb-4">
            <strong className="text-mv-text">Источник</strong> — это платформа верификации медиаконтента, которая использует специализированные модели машинного обучения для детекции AI-генерации в фотографиях, аудиозаписях, видео и текстах. Мы предоставляем не просто бинарный ответ «реально/фейк», а развёрнутый анализ с Индексом подлинности, детализацией по моделям и экспортируемыми отчётами.
          </p>
          <p className="text-mv-text-secondary leading-relaxed">
            Проект доступен как веб-платформа и REST API для интеграции. Наша архитектура построена на React + Appwrite Cloud с асинхронной обработкой, что обеспечивает обработку запросов за 1-3 секунды.
          </p>
        </section>

        {/* Status */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-mv-accent mb-6">Статус проекта</h2>
          <p className="text-mv-text-secondary leading-relaxed mb-6">
            Источник активно развивается. Проект поддерживается грантами, участвует в крупных хакатонах и акселераторах. Мы регулярно обновляем модели детекции и расширяем поддерживаемые форматы.
          </p>
          <div className="flex flex-wrap gap-3">
            {badges.map((badge, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-4 py-2 bg-mv-surface border border-mv-border rounded-full text-sm text-mv-text-secondary"
              >
                <span className="w-2 h-2 rounded-full bg-mv-accent" />
                {badge}
              </span>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-mv-accent mb-6">Наши ценности</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-mv-surface border border-mv-border rounded-xl p-6 text-center hover:border-mv-accent/50 hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-mv-accent/10 flex items-center justify-center text-mv-accent">
                  <value.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-mv-text mb-2">{value.title}</h3>
                <p className="text-sm text-mv-text-secondary">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Join Team */}
        <section>
          <h2 className="text-2xl font-bold text-mv-accent mb-6">Присоединяйся к команде</h2>
          <div className="max-w-xl mx-auto">
            <div className="bg-mv-surface border border-mv-border rounded-xl p-8 text-center hover:border-mv-accent transition-all">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-mv-surface-2 border-2 border-dashed border-mv-border flex items-center justify-center text-mv-text-muted">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-mv-text mb-2">Открытые позиции</h3>
              <p className="text-mv-accent mb-4">ML-инженеры • Фронтенд-разработчики • Дизайнеры</p>
              <p className="text-sm text-mv-text-secondary mb-6">
                Мы ищем единомышленников, которые хотят вместе с нами бороться с фейками и дезинформацией.
              </p>
              
              <div className="bg-mv-surface-2 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-mv-text-secondary mb-2">
                  <strong className="text-mv-text">Как откликнуться:</strong>
                </p>
                <p className="text-sm text-mv-text-secondary mb-3">
                  Напишите нам на почту с темой <span className="text-mv-accent font-mono">#ХОЧУ_В_КОМАНДУ</span>
                </p>
                <p className="text-sm text-mv-text-secondary">
                  Пишите сразу с резюме — рассмотрим в течение недели.
                </p>
              </div>

              <a
                href={`mailto:${CONTACT_EMAIL}?subject=%23ХОЧУ_В_КОМАНДУ`}
                className="inline-block px-6 py-3 bg-mv-accent text-white rounded-lg font-medium hover:bg-mv-accent-hover transition-colors"
              >
                Написать на {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

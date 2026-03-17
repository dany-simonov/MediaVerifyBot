const CONTACT_EMAIL = 'istochnik-media@yandex.com';

export function Terms() {
  return (
    <div className="pt-24 pb-16">
      <div className="container max-w-3xl">
        <h1 className="text-4xl font-bold text-mv-text mb-4">Условия использования</h1>
        <p className="text-mv-text-secondary mb-8">Последнее обновление: 10 марта 2026 г.</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">1. Принятие условий</h2>
            <p className="text-mv-text-secondary leading-relaxed">
              Используя сервис «Источник» (веб-сайт и API), вы соглашаетесь с настоящими Условиями использования. Если вы не согласны с этими условиями, пожалуйста, прекратите использование сервиса.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">2. Описание сервиса</h2>
            <p className="text-mv-text-secondary leading-relaxed">
              Источник предоставляет услуги по верификации медиаконтента (фото, аудио, текст) с использованием моделей машинного обучения. Сервис выдаёт вероятностную оценку подлинности контента, а не абсолютное заключение.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">3. Ограничения использования</h2>
            <p className="text-mv-text-secondary leading-relaxed mb-4">
              При использовании сервиса запрещается:
            </p>
            <ul className="list-disc list-inside text-mv-text-secondary space-y-2">
              <li>Загружать незаконный или оскорбительный контент</li>
              <li>Использовать сервис для нарушения прав третьих лиц</li>
              <li>Намеренно перегружать сервис автоматическими запросами</li>
              <li>Пытаться обойти лимиты или систему защиты</li>
              <li>Перепродавать доступ к сервису без разрешения</li>
              <li>Использовать результаты как юридические доказательства без консультации специалиста</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">4. Лимиты и тарифы</h2>
            <ul className="list-disc list-inside text-mv-text-secondary space-y-2">
              <li><strong className="text-mv-text">FREE:</strong> 3 проверки в день, все форматы</li>
              <li><strong className="text-mv-text">PREMIUM:</strong> 100 проверок в месяц, история, PDF-отчёты (в разработке)</li>
              <li><strong className="text-mv-text">ENTERPRISE:</strong> индивидуальные условия по запросу</li>
            </ul>
            <p className="text-mv-text-secondary leading-relaxed mt-4">
              Мы оставляем за собой право изменять тарифы и лимиты с предварительным уведомлением.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">5. Точность результатов</h2>
            <div className="bg-mv-surface border border-mv-border rounded-lg p-4">
              <p className="text-mv-uncertain font-medium mb-2">Внимание</p>
              <p className="text-mv-text-secondary">
                Результаты анализа носят <strong className="text-mv-text">вероятностный характер</strong>. Мы не гарантируем 100% точность. Результаты не являются юридическим заключением и не могут служить единственным основанием для принятия важных решений.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">6. Интеллектуальная собственность</h2>
            <p className="text-mv-text-secondary leading-relaxed">
              Все права на сервис, его дизайн, код и контент принадлежат команде Источник. Вы сохраняете права на загружаемые вами файлы.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">7. Ограничение ответственности</h2>
            <p className="text-mv-text-secondary leading-relaxed">
              Сервис предоставляется «как есть». Мы не несём ответственности за убытки, связанные с использованием или невозможностью использования сервиса, неточностью результатов или потерей данных.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">8. Изменение условий</h2>
            <p className="text-mv-text-secondary leading-relaxed">
              Мы можем изменять настоящие Условия. О существенных изменениях будем уведомлять через сайт или email. Продолжая использовать сервис после изменений, вы принимаете новые условия.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">9. Прекращение доступа</h2>
            <p className="text-mv-text-secondary leading-relaxed">
              Мы оставляем за собой право заблокировать доступ к сервису при нарушении настоящих Условий.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">10. Контакты</h2>
            <p className="text-mv-text-secondary">
              По вопросам использования сервиса обращайтесь:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-mv-accent hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

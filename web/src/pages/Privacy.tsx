const CONTACT_EMAIL = 'istochnik-media@yandex.com';

export function Privacy() {
  return (
    <div className="pt-24 pb-16">
      <div className="container max-w-3xl">
        <h1 className="text-4xl font-bold text-mv-text mb-4">Политика конфиденциальности</h1>
        <p className="text-mv-text-secondary mb-8">Последнее обновление: 10 марта 2026 г.</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">1. Общие положения</h2>
            <p className="text-mv-text-secondary leading-relaxed">
              Настоящая Политика конфиденциальности описывает, как платформа «Источник» (далее — «Сервис», «мы») собирает, использует и защищает информацию пользователей при использовании веб-сайта, Telegram-бота и API.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">2. Какие данные мы собираем</h2>
            <ul className="list-disc list-inside text-mv-text-secondary space-y-2">
              <li><strong className="text-mv-text">Данные аккаунта:</strong> email, имя пользователя (при регистрации через email)</li>
              <li><strong className="text-mv-text">Telegram ID:</strong> при авторизации через Telegram</li>
              <li><strong className="text-mv-text">История проверок:</strong> тип файла, вердикт, время проверки</li>
              <li><strong className="text-mv-text">Техническая информация:</strong> IP-адрес, тип браузера, время доступа</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">3. Обработка медиафайлов</h2>
            <div className="bg-mv-surface border border-mv-border rounded-lg p-4">
              <p className="text-mv-text font-medium mb-2">Важно:</p>
              <p className="text-mv-text-secondary">
                Загруженные файлы (фото, аудио) обрабатываются only во время анализа и <strong className="text-mv-real">немедленно удаляются</strong> после получения результата. Мы не храним ваши медиафайлы на постоянной основе.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">4. Как мы используем данные</h2>
            <ul className="list-disc list-inside text-mv-text-secondary space-y-2">
              <li>Предоставление сервиса верификации медиа</li>
              <li>Ведение истории проверок (для авторизованных пользователей)</li>
              <li>Улучшение качества моделей детекции</li>
              <li>Техническая поддержка и связь с пользователями</li>
              <li>Предотвращение злоупотреблений и соблюдение лимитов</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">5. Передача данных третьим лицам</h2>
            <p className="text-mv-text-secondary leading-relaxed mb-4">
              Мы передаём данные следующим сервисам для выполнения анализа:
            </p>
            <ul className="list-disc list-inside text-mv-text-secondary space-y-2">
              <li><strong className="text-mv-text">Sightengine</strong> — анализ изображений</li>
              <li><strong className="text-mv-text">Resemble AI</strong> — анализ аудио</li>
              <li><strong className="text-mv-text">Sapling</strong> — анализ текста</li>
              <li><strong className="text-mv-text">Appwrite Cloud</strong> — хостинг и база данных</li>
            </ul>
            <p className="text-mv-text-secondary leading-relaxed mt-4">
              Мы не продаём и не передаём ваши данные рекламным или маркетинговым компаниям.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">6. Хранение данных</h2>
            <ul className="list-disc list-inside text-mv-text-secondary space-y-2">
              <li>Данные аккаунта хранятся до удаления аккаунта</li>
              <li>История проверок хранится 30 дней (Premium) или до конца сессии (Free)</li>
              <li>Медиафайлы не хранятся (удаляются сразу после анализа)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">7. Ваши права</h2>
            <p className="text-mv-text-secondary leading-relaxed">
              Вы имеете право запросить доступ к своим данным, их исправление или удаление. Для этого свяжитесь с нами по email.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">8. Безопасность</h2>
            <p className="text-mv-text-secondary leading-relaxed">
              Мы используем шифрование HTTPS для всех соединений, безопасное хранение паролей и регулярные проверки безопасности. Однако абсолютная безопасность в интернете невозможна.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-mv-accent mb-4">9. Контакты</h2>
            <p className="text-mv-text-secondary">
              По вопросам конфиденциальности обращайтесь:{' '}
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

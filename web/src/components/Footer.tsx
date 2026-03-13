import { Link } from 'react-router-dom';

const CONTACT_EMAIL = 'istochnik-media@yandex.com';

export function Footer() {
  return (
    <footer className="mt-20 py-12 bg-mv-surface border-t border-mv-border">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src="/assets/img/logo.png" alt="" className="w-8 h-8" />
              <span className="font-semibold text-mv-text">Источник</span>
            </Link>
            <p className="text-sm text-mv-text-secondary leading-relaxed">
              Система верификации медиа на основе ИИ
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-4 inline-block text-sm text-mv-accent hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-mv-text mb-4">Навигация</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/#features" className="text-sm text-mv-text-secondary hover:text-mv-accent transition-colors">
                Возможности
              </Link>
              <Link to="/#pricing" className="text-sm text-mv-text-secondary hover:text-mv-accent transition-colors">
                Тарифы
              </Link>
              <Link to="/faq" className="text-sm text-mv-text-secondary hover:text-mv-accent transition-colors">
                FAQ
              </Link>
              <a
                href="https://t.me/MediaVerifyBot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-mv-text-secondary hover:text-mv-accent transition-colors"
              >
                Telegram-бот
              </a>
            </nav>
          </div>

          {/* Documentation */}
          <div>
            <h4 className="font-semibold text-mv-text mb-4">Документы</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/about" className="text-sm text-mv-text-secondary hover:text-mv-accent transition-colors">
                О проекте
              </Link>
              <Link to="/docs" className="text-sm text-mv-text-secondary hover:text-mv-accent transition-colors">
                API Docs
              </Link>
              <Link to="/privacy" className="text-sm text-mv-text-secondary hover:text-mv-accent transition-colors">
                Политика конфиденциальности
              </Link>
              <Link to="/terms" className="text-sm text-mv-text-secondary hover:text-mv-accent transition-colors">
                Условия использования
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-mv-text mb-4">Связаться</h4>
            <nav className="flex flex-col gap-2">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-sm text-mv-text-secondary hover:text-mv-accent transition-colors"
              >
                Написать на почту
              </a>
              <a
                href="https://t.me/MediaVerifyBot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-mv-text-secondary hover:text-mv-accent transition-colors"
              >
                Telegram
              </a>
            </nav>
          </div>
        </div>

        <hr className="border-mv-border mb-6" />

        <div className="text-center text-sm text-mv-text-muted">
          © 2026 Источник. Все права защищены.
        </div>
      </div>
    </footer>
  );
}

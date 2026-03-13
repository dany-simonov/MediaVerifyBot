import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onLoginClick: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

export function Header({ onLoginClick, isLoggedIn, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-mv-bg/80 backdrop-blur-lg border-b border-mv-border">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/assets/img/logo.png" alt="Источник" className="w-8 h-8" />
            <span className="font-semibold text-lg text-mv-text">Источник</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/#features"
              className="text-mv-text-secondary hover:text-mv-accent transition-colors"
            >
              Возможности
            </Link>
            <Link
              to="/#bigcheck"
              className="text-mv-text-secondary hover:text-mv-accent transition-colors"
            >
              Проверка
            </Link>
            <Link
              to="/faq"
              className={`transition-colors ${isActive('/faq') ? 'text-mv-accent' : 'text-mv-text-secondary hover:text-mv-accent'}`}
            >
              FAQ
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-sm text-mv-text-secondary hover:text-mv-accent transition-colors"
                >
                  Кабинет
                </Link>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 text-sm text-mv-text-secondary hover:text-mv-fake transition-colors"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-5 py-2 bg-mv-surface border border-mv-border rounded-lg text-sm font-medium text-mv-text hover:border-mv-accent transition-all"
              >
                Вход
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Меню"
          >
            <span className={`w-6 h-0.5 bg-mv-text transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-6 h-0.5 bg-mv-text transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`w-6 h-0.5 bg-mv-text transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-mv-surface border-t border-mv-border">
          <div className="container py-4 flex flex-col gap-4">
            <Link
              to="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-mv-text-secondary hover:text-mv-accent py-2"
            >
              Возможности
            </Link>
            <Link
              to="/#bigcheck"
              onClick={() => setMobileMenuOpen(false)}
              className="text-mv-text-secondary hover:text-mv-accent py-2"
            >
              Проверка
            </Link>
            <Link
              to="/faq"
              onClick={() => setMobileMenuOpen(false)}
              className="text-mv-text-secondary hover:text-mv-accent py-2"
            >
              FAQ
            </Link>
            <hr className="border-mv-border" />
            {isLoggedIn ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-mv-accent py-2"
                >
                  Личный кабинет
                </Link>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-mv-fake py-2"
                >
                  Выйти
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onLoginClick();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3 bg-mv-accent text-white rounded-lg font-medium"
              >
                Вход
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

import { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

export function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'telegram' | 'email'>('telegram');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await onLogin(email, password);
    
    if (result.success) {
      onClose();
      setEmail('');
      setPassword('');
    } else {
      setError(result.error || 'Ошибка входа');
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-mv-surface border border-mv-border rounded-xl p-6 animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-mv-text-muted hover:text-mv-text text-2xl leading-none"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold text-mv-text mb-6">Вход в Источник</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('telegram')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'telegram'
                ? 'bg-mv-accent text-white'
                : 'bg-mv-surface-2 text-mv-text-secondary hover:text-mv-text'
            }`}
          >
            Telegram
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'email'
                ? 'bg-mv-accent text-white'
                : 'bg-mv-surface-2 text-mv-text-secondary hover:text-mv-text'
            }`}
          >
            Email
          </button>
        </div>

        {/* Telegram Tab */}
        {activeTab === 'telegram' && (
          <div className="text-center">
            <p className="text-mv-text-secondary mb-6">
              Быстрый и безопасный вход через ваш аккаунт Telegram
            </p>
            <div className="bg-mv-surface-2 rounded-xl p-8 border border-mv-border">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#229ED9] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              <a
                href="https://t.me/MediaVerifyBot?start=auth"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full py-3 bg-[#229ED9] text-white rounded-lg font-medium hover:bg-[#1E8BC3] transition-colors"
              >
                Войти через Telegram
              </a>
            </div>
          </div>
        )}

        {/* Email Tab */}
        {activeTab === 'email' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-mv-fake/10 border border-mv-fake/20 rounded-lg text-sm text-mv-fake">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-mv-text-secondary mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-mv-surface-2 border border-mv-border rounded-lg text-mv-text placeholder:text-mv-text-muted focus:border-mv-accent focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-mv-text-secondary mb-2">
                Пароль
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-mv-surface-2 border border-mv-border rounded-lg text-mv-text placeholder:text-mv-text-muted focus:border-mv-accent focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-mv-accent text-white rounded-lg font-medium hover:bg-mv-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Вход...' : 'Войти / Создать аккаунт'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

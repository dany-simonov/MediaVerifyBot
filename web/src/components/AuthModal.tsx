/**
 * Auth Modal Component
 * ====================
 * Модальное окно авторизации с переключением между входом и регистрацией.
 * Использует useAuthStore напрямую для вызова login/register.
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  // ============================================================================
  // Store Integration
  // ============================================================================
  const { login, register, error, isActionLoading, clearError } = useAuthStore();

  // ============================================================================
  // Local State
  // ============================================================================
  const [activeTab, setActiveTab] = useState<'telegram' | 'email'>('telegram');
  /** true = Login mode, false = Register mode */
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ============================================================================
  // Effects
  // ============================================================================
  
  // Clear form and errors when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setEmail('');
      setPassword('');
      clearError();
      setIsLoginMode(true);
      setActiveTab('telegram');
    }
  }, [isOpen, clearError]);

  // ============================================================================
  // Handlers
  // ============================================================================

  /** Toggle between login and register modes */
  const handleToggleMode = () => {
    setIsLoginMode((prev) => !prev);
    clearError(); // Always clear errors when switching modes
    setName('');
    setPassword('');
  };

  /** Handle form submission */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let result: { success: boolean; error?: string };

    if (isLoginMode) {
      // Login mode: call login(email, password)
      result = await login(email, password);
    } else {
      // Register mode: call register(name, email, password)
      result = await register(name.trim(), email, password);
    }

    if (result.success) {
      // Success - close modal and reset form
      onClose();
      setName('');
      setEmail('');
      setPassword('');
    }
    // If failed, error is automatically set in store and displayed
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (!isOpen) return null;

  const modalTitle = isLoginMode ? 'Вход в Источник' : 'Регистрация в Источнике';
  const submitButtonText = isLoginMode ? 'Войти' : 'Создать аккаунт';
  const loadingText = isLoginMode ? 'Вход...' : 'Создание...';
  const toggleText = isLoginMode 
    ? 'Нет аккаунта? Зарегистрироваться' 
    : 'Уже есть аккаунт? Войти';

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
          aria-label="Закрыть"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold text-mv-text mb-6">{modalTitle}</h2>

        {/* Tabs: Telegram / Email */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('telegram');
              clearError();
            }}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'telegram'
                ? 'bg-mv-accent text-white'
                : 'bg-mv-surface-2 text-mv-text-secondary hover:text-mv-text'
            }`}
          >
            Telegram
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('email');
              clearError();
            }}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'email'
                ? 'bg-mv-accent text-white'
                : 'bg-mv-surface-2 text-mv-text-secondary hover:text-mv-text'
            }`}
          >
            Email
          </button>
        </div>

        {/* ================================================================== */}
        {/* Telegram Tab */}
        {/* ================================================================== */}
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
              <p className="mt-3 text-xs text-mv-text-muted">Скоро</p>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* Email Tab - Login / Register Form */}
        {/* ================================================================== */}
        {activeTab === 'email' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="p-3 bg-mv-fake/10 border border-mv-fake/20 rounded-lg text-sm text-mv-fake flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            
            {/* Name field - only in Register mode */}
            {!isLoginMode && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-mv-text-secondary mb-2">
                  Имя
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLoginMode}
                  minLength={2}
                  maxLength={50}
                  placeholder="Ваше имя"
                  disabled={isActionLoading}
                  className="w-full px-4 py-3 bg-mv-surface-2 border border-mv-border rounded-lg text-mv-text placeholder:text-mv-text-muted focus:border-mv-accent focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>
            )}

            {/* Email field */}
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
                disabled={isActionLoading}
                className="w-full px-4 py-3 bg-mv-surface-2 border border-mv-border rounded-lg text-mv-text placeholder:text-mv-text-muted focus:border-mv-accent focus:outline-none transition-colors disabled:opacity-50"
              />
            </div>

            {/* Password field */}
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
                minLength={8}
                placeholder="Минимум 8 символов"
                disabled={isActionLoading}
                className="w-full px-4 py-3 bg-mv-surface-2 border border-mv-border rounded-lg text-mv-text placeholder:text-mv-text-muted focus:border-mv-accent focus:outline-none transition-colors disabled:opacity-50"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isActionLoading}
              className="w-full py-3 bg-mv-accent text-white rounded-lg font-medium hover:bg-mv-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isActionLoading ? (
                <>
                  {/* Spinner */}
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>{loadingText}</span>
                </>
              ) : (
                submitButtonText
              )}
            </button>

            {/* Toggle Login/Register Mode */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleToggleMode}
                disabled={isActionLoading}
                className="text-sm text-mv-accent hover:text-mv-accent-hover transition-colors disabled:opacity-50"
              >
                {toggleText}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

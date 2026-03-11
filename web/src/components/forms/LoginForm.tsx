/**
 * Login Form Component
 * ====================
 * Форма входа с валидацией и интеграцией с Appwrite.
 */

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { Button, Input, Alert, Card } from '../ui';
import { useAuthStore } from '../../store';
import { isValidEmail } from '../../lib/utils';

interface LoginFormProps {
  onSuccess?: () => void;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, isActionLoading, error, clearError } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  // Validation
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!email) {
      newErrors.email = 'Email обязателен';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Некорректный формат email';
    }
    
    if (!password) {
      newErrors.password = 'Пароль обязателен';
    } else if (password.length < 8) {
      newErrors.password = 'Минимум 8 символов';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validate()) return;
    
    const result = await login(email, password);
    
    if (result.success) {
      onSuccess?.();
    }
  };

  return (
    <Card variant="elevated" padding="lg" className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-mv-accent to-teal-400 flex items-center justify-center">
          <LogIn className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-mv-text">Вход в Источник</h1>
        <p className="mt-2 text-mv-text-secondary">
          Войдите, чтобы получить доступ к проверкам
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" className="mb-6" onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={errors.email}
          leftIcon={<Mail className="w-5 h-5" />}
          autoComplete="email"
          disabled={isActionLoading}
        />

        <Input
          label="Пароль"
          type="password"
          placeholder="Минимум 8 символов"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password}
          leftIcon={<Lock className="w-5 h-5" />}
          autoComplete="current-password"
          disabled={isActionLoading}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isActionLoading}
        >
          Войти
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-mv-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 text-sm text-mv-text-muted bg-mv-surface">
            или
          </span>
        </div>
      </div>

      {/* Telegram Login */}
      <div className="text-center">
        <a
          href="https://t.me/MediaVerifyBot?start=auth"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#229ED9] text-white rounded-lg font-medium hover:bg-[#1E8BC3] transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          Войти через Telegram
          <span className="text-xs opacity-75">(скоро)</span>
        </a>
      </div>

      {/* Footer Links */}
      <div className="mt-8 text-center text-sm">
        <span className="text-mv-text-secondary">Нет аккаунта? </span>
        <Link
          to="/register"
          className="text-mv-accent hover:text-mv-accent-hover font-medium transition-colors"
        >
          Зарегистрироваться
        </Link>
      </div>
    </Card>
  );
}

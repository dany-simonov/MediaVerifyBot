/**
 * Login Form Component
 * ====================
 * Форма входа с валидацией и интеграцией с Appwrite.
 */

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, LogIn, Send } from 'lucide-react';
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
          <Send className="w-5 h-5" />
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

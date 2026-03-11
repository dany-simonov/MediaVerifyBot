/**
 * Dashboard Overview Page
 * =======================
 * Главная страница личного кабинета с обзором статистики.
 */

import { Link } from 'react-router-dom';
import { Plus, ArrowRight, ArrowUp, Shield, Clock, CheckCircle } from 'lucide-react';
import { Card, CardHeader, Button } from '../../components/ui';
import { useAuthStore } from '../../store';

export function DashboardOverview() {
  const { user } = useAuthStore();

  // Mock stats (replace with real data later)
  const stats = {
    checksToday: 0,
    dailyLimit: 3,
    totalChecks: 0,
    averageIndex: null as number | null,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mv-text">
            Добро пожаловать, {user?.name?.split(' ')[0] || 'Пользователь'}! 👋
          </h1>
          <p className="mt-1 text-mv-text-secondary">
            Вот обзор вашей активности за сегодня
          </p>
        </div>
        
        <Link to="/dashboard/check">
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Новая проверка
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Checks Today */}
        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-mv-text-secondary">Проверок сегодня</p>
              <p className="text-3xl font-bold text-mv-text mt-1">
                {stats.checksToday} / {stats.dailyLimit}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-mv-accent/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-mv-accent" />
            </div>
          </div>
          <div className="mt-4 h-2 bg-mv-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-mv-accent rounded-full transition-all duration-500"
              style={{ width: `${(stats.checksToday / stats.dailyLimit) * 100}%` }}
            />
          </div>
        </Card>

        {/* Total Checks */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-mv-text-secondary">Всего проверок</p>
              <p className="text-3xl font-bold text-mv-text mt-1">{stats.totalChecks}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-mv-accent/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-mv-accent" />
            </div>
          </div>
          {stats.totalChecks > 0 && (
            <p className="mt-4 text-sm text-mv-real flex items-center gap-1">
              <ArrowUp className="w-4 h-4" />
              +3 на этой неделе
            </p>
          )}
        </Card>

        {/* Average Index */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-mv-text-secondary">Средний индекс</p>
              <p className="text-3xl font-bold text-mv-real mt-1">
                {stats.averageIndex !== null ? `${stats.averageIndex}%` : '—'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-mv-real/10 flex items-center justify-center">
              <ArrowUp className="w-5 h-5 text-mv-real" />
            </div>
          </div>
          <p className="mt-4 text-sm text-mv-text-muted">
            Индекс подлинности
          </p>
        </Card>

        {/* Plan */}
        <Card className="bg-gradient-to-br from-mv-accent/10 to-teal-500/10 border-mv-accent/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-mv-text-secondary">Ваш план</p>
              <p className="text-xl font-bold text-mv-accent mt-1">Free</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-mv-accent/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-mv-accent" />
            </div>
          </div>
          <Link
            to="/dashboard/api"
            className="mt-4 text-sm text-mv-accent font-medium flex items-center gap-1 hover:underline"
          >
            Увеличить лимит
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader
          title="Быстрые действия"
          description="Начните работу с проверки медиаконтента"
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/dashboard/check"
            className="p-4 rounded-lg bg-mv-surface-2 border border-mv-border hover:border-mv-accent hover:bg-mv-accent/5 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-mv-accent/10 flex items-center justify-center mb-3 group-hover:bg-mv-accent/20 transition-colors">
              <Shield className="w-5 h-5 text-mv-accent" />
            </div>
            <h3 className="font-medium text-mv-text">Проверить медиа</h3>
            <p className="text-sm text-mv-text-muted mt-1">
              Загрузите фото, аудио или видео
            </p>
          </Link>

          <Link
            to="/dashboard/check?tab=text"
            className="p-4 rounded-lg bg-mv-surface-2 border border-mv-border hover:border-mv-accent hover:bg-mv-accent/5 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-mv-accent/10 flex items-center justify-center mb-3 group-hover:bg-mv-accent/20 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-mv-accent">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="8" y1="13" x2="16" y2="13"/>
                <line x1="8" y1="17" x2="13" y2="17"/>
              </svg>
            </div>
            <h3 className="font-medium text-mv-text">Проверить текст</h3>
            <p className="text-sm text-mv-text-muted mt-1">
              Определить ChatGPT и другие LLM
            </p>
          </Link>

          <Link
            to="/dashboard/history"
            className="p-4 rounded-lg bg-mv-surface-2 border border-mv-border hover:border-mv-accent hover:bg-mv-accent/5 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-mv-accent/10 flex items-center justify-center mb-3 group-hover:bg-mv-accent/20 transition-colors">
              <Clock className="w-5 h-5 text-mv-accent" />
            </div>
            <h3 className="font-medium text-mv-text">История</h3>
            <p className="text-sm text-mv-text-muted mt-1">
              Посмотреть прошлые проверки
            </p>
          </Link>
        </div>
      </Card>

      {/* Model Accuracy Table */}
      <Card>
        <CardHeader
          title="Точность моделей"
          description="Актуальные показатели наших ИИ-детекторов"
        />
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-mv-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-mv-text-secondary">Тип контента</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-mv-text-secondary">Модель</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-mv-text-secondary">Точность</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-mv-border">
                <td className="py-3 px-4">
                  <span className="flex items-center gap-2">
                    <span>🖼️</span>
                    <span className="text-mv-text">Фото</span>
                  </span>
                </td>
                <td className="py-3 px-4 text-mv-text-secondary">Sightengine</td>
                <td className="py-3 px-4 text-right">
                  <span className="text-mv-real font-semibold">94.4%</span>
                </td>
              </tr>
              <tr className="border-b border-mv-border">
                <td className="py-3 px-4">
                  <span className="flex items-center gap-2">
                    <span>🎵</span>
                    <span className="text-mv-text">Аудио</span>
                  </span>
                </td>
                <td className="py-3 px-4 text-mv-text-secondary">Resemble Detect</td>
                <td className="py-3 px-4 text-right">
                  <span className="text-mv-real font-semibold">99.5%</span>
                </td>
              </tr>
              <tr className="border-b border-mv-border">
                <td className="py-3 px-4">
                  <span className="flex items-center gap-2">
                    <span>🎬</span>
                    <span className="text-mv-text">Видео</span>
                  </span>
                </td>
                <td className="py-3 px-4 text-mv-text-secondary">FFmpeg + CLIP</td>
                <td className="py-3 px-4 text-right">
                  <span className="text-mv-uncertain font-semibold">81%</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">
                  <span className="flex items-center gap-2">
                    <span>📄</span>
                    <span className="text-mv-text">Текст</span>
                  </span>
                </td>
                <td className="py-3 px-4 text-mv-text-secondary">Sapling AI</td>
                <td className="py-3 px-4 text-right">
                  <span className="text-mv-real font-semibold">98%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

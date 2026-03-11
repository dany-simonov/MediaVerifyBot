/**
 * Alert Component
 * ===============
 * Компонент для отображения уведомлений и ошибок.
 */

import { type HTMLAttributes } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  onClose?: () => void;
}

const variantConfig = {
  info: {
    icon: Info,
    bgClass: 'bg-mv-accent/10',
    borderClass: 'border-mv-accent/20',
    textClass: 'text-mv-accent',
  },
  success: {
    icon: CheckCircle,
    bgClass: 'bg-mv-real/10',
    borderClass: 'border-mv-real/20',
    textClass: 'text-mv-real',
  },
  warning: {
    icon: AlertCircle,
    bgClass: 'bg-mv-uncertain/10',
    borderClass: 'border-mv-uncertain/20',
    textClass: 'text-mv-uncertain',
  },
  error: {
    icon: XCircle,
    bgClass: 'bg-mv-fake/10',
    borderClass: 'border-mv-fake/20',
    textClass: 'text-mv-fake',
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className,
  ...props
}: AlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border',
        config.bgClass,
        config.borderClass,
        className
      )}
      {...props}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.textClass)} />
      
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn('font-medium text-sm', config.textClass)}>
            {title}
          </p>
        )}
        {children && (
          <p className={cn('text-sm', title ? 'mt-1' : '', 'text-mv-text-secondary')}>
            {children}
          </p>
        )}
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className={cn(
            'flex-shrink-0 p-1 rounded-md transition-colors',
            'hover:bg-black/10',
            config.textClass
          )}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

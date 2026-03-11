/**
 * Spinner Component
 * =================
 * Анимированный индикатор загрузки.
 */

import { cn } from '../../lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'border-mv-accent border-t-transparent rounded-full animate-spin',
        sizeClasses[size],
        className
      )}
    />
  );
}

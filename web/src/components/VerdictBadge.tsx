import type { Verdict } from '../types';

interface VerdictBadgeProps {
  verdict: Verdict;
  size?: 'sm' | 'md' | 'lg';
}

const config: Record<Verdict, { bg: string; text: string; label: string }> = {
  REAL: { bg: 'bg-mv-real/20', text: 'text-mv-real', label: 'Подлинный' },
  FAKE: { bg: 'bg-mv-fake/20', text: 'text-mv-fake', label: 'Сгенерирован ИИ' },
  UNCERTAIN: { bg: 'bg-mv-uncertain/20', text: 'text-mv-uncertain', label: 'Неопределённо' },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function VerdictBadge({ verdict, size = 'md' }: VerdictBadgeProps) {
  const { bg, text, label } = config[verdict];

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${bg} ${text} ${sizeClasses[size]}`}>
      {label}
    </span>
  );
}

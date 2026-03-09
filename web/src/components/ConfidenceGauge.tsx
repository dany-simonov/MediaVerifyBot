import type { Verdict } from '../types';

interface ConfidenceGaugeProps {
  value: number; // 0 to 1
  verdict: Verdict;
  size?: number;
}

export function ConfidenceGauge({ value, verdict, size = 120 }: ConfidenceGaugeProps) {
  // For FAKE verdict, show authenticity index (inverse)
  const displayValue = verdict === 'FAKE' ? 1 - value : value;
  const percentage = Math.round(displayValue * 100);
  
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - displayValue);

  const colors: Record<Verdict, string> = {
    REAL: '#10B981',
    FAKE: '#EF4444',
    UNCERTAIN: '#F59E0B',
  };

  const color = colors[verdict];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2A2A30"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {percentage}%
        </span>
        <span className="text-xs text-mv-text-secondary">Индекс</span>
      </div>
    </div>
  );
}

import { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  badge?: string;
}

export function FeatureCard({ icon, title, description, badge }: FeatureCardProps) {
  return (
    <div className="relative bg-mv-surface border border-mv-border rounded-xl p-6 hover:border-mv-accent/50 hover:-translate-y-1 transition-all duration-300">
      {badge && (
        <span className="absolute top-4 right-4 px-2 py-1 text-xs font-medium bg-mv-uncertain/20 text-mv-uncertain rounded-md">
          {badge}
        </span>
      )}
      <div className="w-12 h-12 mb-4 rounded-lg bg-mv-accent/10 flex items-center justify-center text-mv-accent">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-mv-text mb-2">{title}</h3>
      <p className="text-sm text-mv-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}

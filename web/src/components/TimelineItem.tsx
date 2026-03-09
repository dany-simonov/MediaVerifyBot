interface TimelineItemProps {
  version: string;
  title: string;
  description: string;
  status: 'released' | 'current' | 'upcoming';
}

export function TimelineItem({ version, title, description, status }: TimelineItemProps) {
  const statusConfig = {
    released: {
      markerClass: 'bg-mv-real',
      badgeClass: 'bg-mv-real/20 text-mv-real',
      badgeText: 'Выпущено',
    },
    current: {
      markerClass: 'bg-mv-accent animate-pulse',
      badgeClass: 'bg-mv-accent/20 text-mv-accent',
      badgeText: 'Текущая',
    },
    upcoming: {
      markerClass: 'bg-mv-surface-2 border-2 border-mv-border',
      badgeClass: 'bg-mv-surface-2 text-mv-text-secondary',
      badgeText: 'Скоро',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="relative flex gap-6 pb-8 last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-mv-border last:hidden" />
      
      {/* Marker */}
      <div className={`relative shrink-0 w-6 h-6 rounded-full ${config.markerClass}`} />
      
      {/* Content */}
      <div className="flex-1">
        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${config.badgeClass} mb-2`}>
          {config.badgeText}
        </span>
        <h3 className="text-lg font-semibold text-mv-text mb-1">
          {version} — {title}
        </h3>
        <p className="text-sm text-mv-text-secondary leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

interface StatBarProps {
  label: string
  value: number
  color?: string
}

export function StatBar({ label, value, color = '#6C63FF' }: StatBarProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-mv-text">{label}</span>
        <span className="text-sm font-medium text-mv-text">{value}%</span>
      </div>
      <div className="h-2 bg-mv-card rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

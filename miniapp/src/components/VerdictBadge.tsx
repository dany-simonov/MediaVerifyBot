import type { Verdict } from '../types'

interface VerdictBadgeProps {
  verdict: Verdict
}

const VERDICT_CONFIG: Record<Verdict, { text: string; bgColor: string }> = {
  REAL: { text: 'Человеческий контент', bgColor: 'bg-mv-real' },
  FAKE: { text: 'Сгенерировано ИИ', bgColor: 'bg-mv-fake' },
  UNCERTAIN: { text: 'Не определено', bgColor: 'bg-mv-uncertain' },
}

export function VerdictBadge({ verdict }: VerdictBadgeProps) {
  const config = VERDICT_CONFIG[verdict]

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white ${config.bgColor}`}
    >
      {config.text}
    </span>
  )
}

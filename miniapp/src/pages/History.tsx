import { useEffect, useState } from 'react'
import { useTelegramUser } from '../hooks/useTelegramUser'
import { getUserChecks } from '../api/client'
import { CheckCard } from '../components/CheckCard'
import type { Check, Verdict } from '../types'

type Filter = 'ALL' | Verdict

export function History() {
  const { id } = useTelegramUser()
  const [checks, setChecks] = useState<Check[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('ALL')

  useEffect(() => {
    if (id) {
      getUserChecks(id, 50)
        .then(setChecks)
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [id])

  const filteredChecks =
    filter === 'ALL' ? checks : checks.filter((c) => c.verdict === filter)

  const filters: { value: Filter; label: string }[] = [
    { value: 'ALL', label: 'Все' },
    { value: 'FAKE', label: 'Фейк' },
    { value: 'REAL', label: 'Реальные' },
    { value: 'UNCERTAIN', label: 'Неопред.' },
  ]

  return (
    <div className="min-h-screen bg-mv-bg p-4 pb-24">
      <h1 className="text-xl font-semibold text-mv-text mb-4">История проверок</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              filter === f.value
                ? 'bg-mv-accent text-white'
                : 'bg-mv-card text-mv-text-secondary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-mv-card rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-white/10 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredChecks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-mv-text font-medium mb-2">Проверок пока нет</h3>
          <p className="text-mv-text-secondary text-sm">
            Отправьте файл боту для анализа
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChecks.map((check) => (
            <CheckCard key={check.id} check={check} />
          ))}
        </div>
      )}
    </div>
  )
}

export function Pricing() {
  return (
    <div className="min-h-screen bg-mv-bg p-4 pb-24">
      <h1 className="text-xl font-semibold text-mv-text mb-6">Тарифы</h1>

      <div className="grid gap-4">
        {/* Free Plan */}
        <div className="bg-mv-card rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-mv-text mb-1">Free</h3>
          <p className="text-2xl font-bold text-mv-text mb-4">0 ₽</p>
          <ul className="space-y-2 mb-6">
            {[
              '3 проверки в день',
              'Фото, аудио, видео, текст',
              'Все базовые модели',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-mv-text-secondary text-sm">
                <span className="text-mv-real">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <button
            disabled
            className="w-full py-3 rounded-xl bg-white/10 text-mv-text-secondary font-medium"
          >
            Текущий тариф
          </button>
        </div>

        {/* Premium Plan */}
        <div className="bg-mv-card rounded-2xl p-5 border-2 border-mv-accent relative overflow-hidden">
          <div className="absolute top-3 right-3 bg-mv-accent text-white text-xs px-2 py-1 rounded-full font-medium">
            СКОРО
          </div>
          <h3 className="text-lg font-semibold text-mv-text mb-1">Premium</h3>
          <p className="text-2xl font-bold text-mv-text mb-4">199 ₽ / мес</p>
          <ul className="space-y-2 mb-6">
            {[
              '100 проверок в месяц',
              'Приоритетная обработка',
              'История проверок (30 дней)',
              'Поделиться результатом',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-mv-text-secondary text-sm">
                <span className="text-mv-real">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <button
            disabled
            className="w-full py-3 rounded-xl bg-mv-accent/50 text-white font-medium"
          >
            Скоро
          </button>
        </div>
      </div>
    </div>
  )
}

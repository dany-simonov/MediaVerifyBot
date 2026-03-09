const CONTACT_EMAIL = 'istochnik-media@yandex.com';

const endpoints = [
  {
    method: 'POST',
    path: '/analyze',
    description: 'Анализ одного файла',
    params: [
      { name: 'file', type: 'File', description: 'Файл для анализа (image/audio)' },
      { name: 'mediaType', type: 'string', description: '"image" | "audio" | "text"' },
    ],
    response: `{
  "verdict": "FAKE",
  "confidence": 0.94,
  "model_used": "sightengine",
  "explanation": "Sightengine: вероятность ИИ-генерации 94%",
  "processing_ms": 1240
}`,
  },
  {
    method: 'POST',
    path: '/bigcheck',
    description: 'Пакетный анализ до 10 файлов с кросс-анализом',
    params: [
      { name: 'files', type: 'File[]', description: 'Массив файлов (до 10)' },
    ],
    response: `{
  "results": [...],
  "cross_analysis": {
    "overall_verdict": "FAKE",
    "confidence": 0.87
  }
}`,
  },
  {
    method: 'GET',
    path: '/health',
    description: 'Статус сервиса и БД',
    params: [],
    response: `{
  "status": "ok",
  "database": "connected",
  "version": "0.6.0"
}`,
  },
  {
    method: 'GET',
    path: '/user/{id}/stats',
    description: 'Статистика пользователя',
    params: [
      { name: 'id', type: 'string', description: 'ID пользователя' },
    ],
    response: `{
  "user_id": "abc123",
  "is_premium": false,
  "checks_today": 2,
  "daily_limit": 3,
  "total_checks": 47
}`,
  },
  {
    method: 'GET',
    path: '/user/{id}/checks',
    description: 'История проверок',
    params: [
      { name: 'id', type: 'string', description: 'ID пользователя' },
      { name: 'limit', type: 'number', description: 'Количество записей (default: 50)' },
      { name: 'offset', type: 'number', description: 'Смещение для пагинации' },
    ],
    response: `{
  "checks": [
    {
      "id": "check_123",
      "media_type": "image",
      "verdict": "REAL",
      "confidence": 0.92,
      "created_at": "2026-03-10T12:00:00Z"
    }
  ]
}`,
  },
];

export function Docs() {
  return (
    <div className="pt-24 pb-16">
      <div className="container">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-mv-text mb-4">API Документация</h1>
          <p className="text-lg text-mv-text-secondary">
            REST API для интеграции системы Источник в ваши проекты
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-mv-uncertain/20 text-mv-uncertain rounded-lg text-sm">
            ⚠️ API находится в разработке. Свяжитесь с нами для раннего доступа.
          </div>
        </div>

        {/* Base URL */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-mv-accent mb-4">Base URL</h2>
          <div className="bg-mv-surface border border-mv-border rounded-lg p-4">
            <code className="text-mv-text font-mono">https://cloud.appwrite.io/v1</code>
          </div>
        </section>

        {/* Authentication */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-mv-accent mb-4">Аутентификация</h2>
          <p className="text-mv-text-secondary mb-4">
            Все запросы к API требуют API-ключ в заголовке:
          </p>
          <div className="bg-mv-surface border border-mv-border rounded-lg p-4 overflow-x-auto">
            <pre className="text-mv-text font-mono text-sm">
{`curl -X POST https://api.istochnik.io/v1/analyze \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@photo.jpg" \\
  -F "mediaType=image"`}
            </pre>
          </div>
        </section>

        {/* Endpoints */}
        <section>
          <h2 className="text-2xl font-bold text-mv-accent mb-6">Endpoints</h2>
          <div className="space-y-8">
            {endpoints.map((endpoint, index) => (
              <div
                key={index}
                className="bg-mv-surface border border-mv-border rounded-xl overflow-hidden"
              >
                <div className="bg-mv-surface-2 px-6 py-4 border-b border-mv-border">
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded text-xs font-bold ${
                      endpoint.method === 'GET' 
                        ? 'bg-mv-real/20 text-mv-real' 
                        : 'bg-mv-accent/20 text-mv-accent'
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-mv-text font-mono">{endpoint.path}</code>
                  </div>
                  <p className="mt-2 text-sm text-mv-text-secondary">{endpoint.description}</p>
                </div>

                {endpoint.params.length > 0 && (
                  <div className="px-6 py-4 border-b border-mv-border">
                    <h4 className="text-sm font-semibold text-mv-text mb-3">Параметры</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-mv-text-secondary">
                          <th className="text-left pb-2">Имя</th>
                          <th className="text-left pb-2">Тип</th>
                          <th className="text-left pb-2">Описание</th>
                        </tr>
                      </thead>
                      <tbody>
                        {endpoint.params.map((param, pIndex) => (
                          <tr key={pIndex} className="border-t border-mv-border">
                            <td className="py-2 font-mono text-mv-accent">{param.name}</td>
                            <td className="py-2 text-mv-text-secondary">{param.type}</td>
                            <td className="py-2 text-mv-text-secondary">{param.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="px-6 py-4">
                  <h4 className="text-sm font-semibold text-mv-text mb-3">Ответ</h4>
                  <pre className="bg-mv-bg rounded-lg p-4 overflow-x-auto text-sm text-mv-text-secondary font-mono">
                    {endpoint.response}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <div className="mt-16 text-center">
          <p className="text-mv-text-secondary mb-4">
            Нужен доступ к API или помощь с интеграцией?
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=API%20Access%20Request`}
            className="inline-block px-6 py-3 bg-mv-accent text-white rounded-lg font-medium hover:bg-mv-accent-hover transition-colors"
          >
            Написать на {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}

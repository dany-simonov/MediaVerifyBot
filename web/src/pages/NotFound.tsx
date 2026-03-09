import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
      <div className="container text-center">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold text-mv-text mb-4">404</h1>
        <p className="text-xl text-mv-text-secondary mb-8">
          Страница не найдена
        </p>
        <Link
          to="/"
          className="inline-block px-8 py-3 bg-mv-accent text-white rounded-lg font-semibold hover:bg-mv-accent-hover transition-colors"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
}

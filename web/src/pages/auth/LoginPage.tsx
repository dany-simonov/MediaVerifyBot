/**
 * Login Page
 * ==========
 * Страница авторизации пользователя.
 */

import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../../components/forms';

export function LoginPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-mv-bg flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-mv-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative w-full max-w-md">
        <LoginForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}

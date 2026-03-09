import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header, Footer, AuthModal } from './components';
import { Home, About, FAQ, Docs, Privacy, Terms, Dashboard, NotFound } from './pages';
import { useAuth } from './hooks';

function AppContent() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mv-bg">
        <div className="w-8 h-8 border-2 border-mv-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mv-bg flex flex-col">
      <Header
        onLoginClick={() => setAuthModalOpen(true)}
        isLoggedIn={!!user}
        onLogout={logout}
      />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={login}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

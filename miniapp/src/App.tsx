import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { BottomNav } from './components/BottomNav'
import { Dashboard } from './pages/Dashboard'
import { History } from './pages/History'
import { Pricing } from './pages/Pricing'
import { About } from './pages/About'

export default function App() {
  useEffect(() => {
    WebApp.ready()
    WebApp.expand()
    
    // Apply theme
    if (WebApp.themeParams.bg_color) {
      document.documentElement.style.setProperty('--tg-bg', WebApp.themeParams.bg_color)
    }
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-mv-bg text-mv-text">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}

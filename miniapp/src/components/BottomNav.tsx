import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/', icon: '🏠', label: 'Главная' },
  { path: '/history', icon: '📋', label: 'История' },
  { path: '/pricing', icon: '💎', label: 'Тарифы' },
  { path: '/about', icon: 'ℹ️', label: 'О нас' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-mv-card border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                isActive ? 'text-mv-accent' : 'text-mv-text-secondary'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

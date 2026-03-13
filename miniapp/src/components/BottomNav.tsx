import { NavLink } from 'react-router-dom';
import { Home, History, Diamond, Info } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Главная' },
  { path: '/history', icon: History, label: 'История' },
  { path: '/pricing', icon: Diamond, label: 'Тарифы' },
  { path: '/about', icon: Info, label: 'О нас' },
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
            <item.icon className="w-6 h-6" />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

/**
 * Sidebar Component
 * =================
 * Боковое меню для Dashboard.
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  History, 
  Key, 
  LogOut, 
  User,
  ChevronLeft,
  LayoutDashboard
} from 'lucide-react';
import { useAuthStore } from '../../store';
import { cn } from '../../lib/utils';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    label: 'Обзор',
    end: true,
  },
  {
    to: '/dashboard/check',
    icon: <Plus className="w-5 h-5" />,
    label: 'Новая проверка',
  },
  {
    to: '/dashboard/history',
    icon: <History className="w-5 h-5" />,
    label: 'История',
  },
  {
    to: '/dashboard/api',
    icon: <Key className="w-5 h-5" />,
    label: 'Настройки API',
  },
];

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-mv-surface border-r border-mv-border z-40',
        'flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-mv-border">
        <NavLink to="/" className={cn('flex items-center gap-2', collapsed && 'mx-auto')}>
          <img
            src="/assets/img/logo.png"
            alt="Источник"
            className="w-8 h-8 rounded-lg object-cover"
          />
          {!collapsed && <span className="font-semibold text-mv-text">Источник</span>}
        </NavLink>
        <button 
          onClick={onToggle}
          className={cn(
            'p-2 rounded-lg text-mv-text-muted hover:text-mv-text hover:bg-mv-surface-2 transition-colors',
            collapsed && 'mx-auto'
          )}
        >
          <ChevronLeft className={cn('w-5 h-5 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
              'text-mv-text-secondary hover:text-mv-text hover:bg-mv-surface-2',
              isActive && 'bg-mv-accent/10 text-mv-accent hover:bg-mv-accent/15',
              collapsed && 'justify-center px-2'
            )}
          >
            {item.icon}
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-2 border-t border-mv-border">
        {/* User Info */}
        <div className={cn(
          'flex items-center gap-3 px-3 py-3 rounded-lg mb-2',
          collapsed && 'justify-center px-2'
        )}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-mv-accent to-teal-400 flex items-center justify-center flex-shrink-0">
            {user?.name ? (
              <span className="text-white font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-mv-text truncate">
                {user?.name || 'Пользователь'}
              </p>
              <p className="text-xs text-mv-text-muted truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors',
            'text-mv-text-muted hover:text-mv-fake hover:bg-mv-fake/10',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm">Выйти</span>}
        </button>
      </div>
    </aside>
  );
}

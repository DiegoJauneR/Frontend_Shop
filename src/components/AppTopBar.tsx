import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const soulGradient = 'linear-gradient(135deg, #3a5f94 0%, #1f477b 100%)'

type NavKey = 'inicio' | 'venta' | 'productos' | 'ventas'

interface AppTopBarProps {
  active: NavKey
}

const navItems: Array<{ key: NavKey; label: string; path: string; icon: string }> = [
  { key: 'inicio', label: 'Inicio', path: '/dashboard', icon: 'dashboard' },
  { key: 'venta', label: 'Venta', path: '/venta', icon: 'shopping_cart' },
  { key: 'productos', label: 'Productos', path: '/inventario', icon: 'inventory_2' },
  { key: 'ventas', label: 'Ventas', path: '/ventas', icon: 'analytics' },
]

export default function AppTopBar({ active }: AppTopBarProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="flex justify-between items-center px-4 sm:px-5 lg:px-6 py-4 max-w-screen-2xl mx-auto">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900 font-headline"
          >
            <div
              className="w-9 h-9 rounded-full shadow-sm flex items-center justify-center text-white font-bold text-xs"
              style={{ background: soulGradient }}
            >
              DO
            </div>
            <span>Don Oscar</span>
          </button>

          <div className="hidden md:flex items-center gap-8 font-headline text-sm font-semibold tracking-wide">
            {navItems.map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.path)}
                className={
                  item.key === active
                    ? 'text-primary border-b-2 border-primary pb-0.5'
                    : 'text-slate-500 hover:text-primary transition-colors'
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 text-slate-600 font-headline text-sm font-semibold tracking-wide">
                <span className="material-symbols-outlined text-primary">account_circle</span>
                <span className="hidden sm:inline">{user?.username ?? 'Perfil'}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors font-headline"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>logout</span>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 grid grid-cols-4 items-center px-3 pb-5 pt-3 bg-white/90 backdrop-blur-xl border-t border-slate-100">
        {navItems.map(item => {
          const isActive = item.key === active

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center rounded-full px-2 py-2 transition-colors ${
                isActive ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-headline text-[10px] font-bold uppercase tracking-widest mt-1">
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}

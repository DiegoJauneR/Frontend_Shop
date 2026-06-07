import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const soulGradient = 'linear-gradient(135deg, #3a5f94 0%, #1f477b 100%)'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="bg-white font-body text-on-surface min-h-screen overflow-x-hidden">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="flex justify-between items-center px-4 sm:px-5 lg:px-6 py-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900 font-headline">
            <div
              className="w-9 h-9 rounded-full shadow-sm flex items-center justify-center text-white font-bold text-xs"
              style={{ background: soulGradient }}
            >
              DO
            </div>
            <span>Don Oscar</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 font-headline text-sm font-semibold tracking-wide">
            <a className="text-slate-500 hover:text-primary transition-colors" href="#">Productos</a>
            <a className="text-slate-500 hover:text-primary transition-colors" href="#">Listado</a>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 text-slate-600 font-headline text-sm font-semibold tracking-wide">
                <span className="material-symbols-outlined text-primary">account_circle</span>
                <span className="hidden sm:inline">{user?.username ?? 'Perfil'}</span>
              </div>
              <button
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

      {/* Main Content Canvas */}
      <main className="pt-32 pb-32 px-6 max-w-7xl mx-auto min-h-screen">
        {/* Bento Grid Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Venta Card */}
          <div className="bg-white border border-slate-200 hover:border-primary rounded-3xl p-8 group cursor-pointer flex flex-col justify-between min-h-[320px] relative overflow-hidden transition-all duration-300 hover:shadow-[0_20px_25px_-5px_rgba(58,95,148,0.1),0_10px_10px_-5px_rgba(58,95,148,0.04)]">
            <div className="relative z-10">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
                style={{ background: soulGradient }}
              >
                <span className="material-symbols-outlined text-white" style={{ fontSize: 30 }}>shopping_cart</span>
              </div>
              <h2 className="text-2xl font-headline font-bold text-slate-900 mb-2">Venta</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Iniciar una nueva transacción rápida para clientes.</p>
            </div>
            <div className="mt-8 flex justify-end">
              <span className="material-symbols-outlined text-primary group-hover:translate-x-2 transition-transform">arrow_forward</span>
            </div>
          </div>

          {/* Productos Card */}
          <div onClick={() => navigate('/inventario')} className="bg-white border border-slate-200 hover:border-primary rounded-3xl p-8 group cursor-pointer flex flex-col justify-between min-h-[320px] relative overflow-hidden transition-all duration-300 hover:shadow-[0_20px_25px_-5px_rgba(58,95,148,0.1),0_10px_10px_-5px_rgba(58,95,148,0.04)]">
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-slate-600" style={{ fontSize: 30 }}>inventory_2</span>
              </div>
              <h2 className="text-2xl font-headline font-bold text-slate-900 mb-2">Productos</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Gestión de inventario, stock y nuevos ingresos.</p>
            </div>
            <div className="mt-8 flex justify-end">
              <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-2 transition-transform">arrow_forward</span>
            </div>
          </div>

          {/* Ventas Card */}
          <div className="bg-white border border-slate-200 hover:border-primary rounded-3xl p-8 group cursor-pointer flex flex-col justify-between min-h-[320px] relative overflow-hidden transition-all duration-300 hover:shadow-[0_20px_25px_-5px_rgba(58,95,148,0.1),0_10px_10px_-5px_rgba(58,95,148,0.04)]">
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-slate-600" style={{ fontSize: 30 }}>analytics</span>
              </div>
              <h2 className="text-2xl font-headline font-bold text-slate-900 mb-2">Ventas</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Reportes detallados e historial de transacciones realizadas.</p>
            </div>
            <div className="mt-8 flex justify-end">
              <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-2 transition-transform">arrow_forward</span>
            </div>
          </div>

          {/* Cerrar Caja Card */}
          <div className="bg-white border border-slate-200 hover:border-error rounded-3xl p-8 group cursor-pointer flex flex-col justify-between min-h-[320px] relative overflow-hidden transition-all duration-300 hover:shadow-[0_20px_25px_-5px_rgba(186,26,26,0.1),0_10px_10px_-5px_rgba(186,26,26,0.04)]">
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-error" style={{ fontSize: 30 }}>lock</span>
              </div>
              <h2 className="text-2xl font-headline font-bold text-slate-900 mb-2">Cerrar Caja</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Cierre de turno y conciliación de saldos diarios.</p>
            </div>
            <div className="mt-8 flex justify-end">
              <span className="material-symbols-outlined text-error group-hover:translate-x-2 transition-transform">arrow_forward</span>
            </div>
          </div>

        </div>

        {/* Secondary Info Section */}
        <section className="mt-16">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-4xl">
            <h3 className="text-xl font-headline font-bold text-slate-900 mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">trending_up</span>
              Actividad Reciente
            </h3>
            <div className="space-y-3">
            </div>
          </div>
        </section>
      </main>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-6 pt-3 bg-white/90 backdrop-blur-xl border-t border-slate-100">
        <button className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-full px-6 py-2">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-headline text-[10px] font-bold uppercase tracking-widest mt-1">Dashboard</span>
        </button>
        <button className="flex flex-col items-center justify-center text-slate-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined">inventory_2</span>
          <span className="font-headline text-[10px] font-bold uppercase tracking-widest mt-1">Productos</span>
        </button>
        <button className="flex flex-col items-center justify-center text-slate-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined">format_list_bulleted</span>
          <span className="font-headline text-[10px] font-bold uppercase tracking-widest mt-1">Listado</span>
        </button>
        <button className="flex flex-col items-center justify-center text-slate-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-headline text-[10px] font-bold uppercase tracking-widest mt-1">Ajustes</span>
        </button>
      </nav>
    </div>
  )
}

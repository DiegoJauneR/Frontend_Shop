import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppTopBar from '../components/AppTopBar'
import { getVentas } from '../services/ventas'
import { useAuthStore } from '../store/authStore'
import type { Venta } from '../types/venta'
import { isAdminUser } from '../utils/permissions'

const soulGradient = 'linear-gradient(135deg, #3a5f94 0%, #1f477b 100%)'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatActivityDate(date: string, time: string) {
  const activityDate = new Date(`${date}T${time || '00:00'}`)
  if (Number.isNaN(activityDate.getTime())) return `${date} ${time}`

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(activityDate)
}

function paymentTone(method: Venta['paymentMethod']) {
  if (method === 'Efectivo') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (method === 'Tarjeta') return 'bg-blue-50 text-blue-700 border-blue-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [recentSales, setRecentSales] = useState<Venta[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [activitiesError, setActivitiesError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadRecentActivities() {
      setLoadingActivities(true)
      setActivitiesError(null)
      try {
        const sales = await getVentas({ skip: 0, limit: 6 })
        if (mounted) setRecentSales(sales)
      } catch {
        if (mounted) setActivitiesError('No se pudo cargar la actividad reciente.')
      } finally {
        if (mounted) setLoadingActivities(false)
      }
    }

    loadRecentActivities()

    return () => {
      mounted = false
    }
  }, [])

  const totalRecentSales = useMemo(() => {
    return recentSales.reduce((sum, sale) => sum + sale.total, 0)
  }, [recentSales])
  const canManageWorkers = isAdminUser(user)
  const activityTitle = canManageWorkers ? 'Actividad reciente' : 'Mi actividad reciente'

  return (
    <div className="bg-white font-body text-on-surface min-h-screen overflow-x-hidden">
      <AppTopBar active="inicio" />

      {/* Main Content Canvas */}
      <main className="pt-32 pb-32 px-6 max-w-7xl mx-auto min-h-screen">
        {/* Bento Grid Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Venta Card */}
          <div onClick={() => navigate('/venta')} className="bg-white border border-slate-200 hover:border-primary rounded-3xl p-8 group cursor-pointer flex flex-col justify-between min-h-[320px] relative overflow-hidden transition-all duration-300 hover:shadow-[0_20px_25px_-5px_rgba(58,95,148,0.1),0_10px_10px_-5px_rgba(58,95,148,0.04)]">
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
              <p className="text-slate-500 text-sm leading-relaxed">Gestión de artículos, precios y categorías.</p>
            </div>
            <div className="mt-8 flex justify-end">
              <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-2 transition-transform">arrow_forward</span>
            </div>
          </div>

          {/* Ventas Card */}
          <div onClick={() => navigate('/ventas')} className="bg-white border border-slate-200 hover:border-primary rounded-3xl p-8 group cursor-pointer flex flex-col justify-between min-h-[320px] relative overflow-hidden transition-all duration-300 hover:shadow-[0_20px_25px_-5px_rgba(58,95,148,0.1),0_10px_10px_-5px_rgba(58,95,148,0.04)]">
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

          {canManageWorkers && (
            <div onClick={() => navigate('/trabajadores')} className="bg-white border border-slate-200 hover:border-primary rounded-3xl p-8 group cursor-pointer flex flex-col justify-between min-h-[320px] relative overflow-hidden transition-all duration-300 hover:shadow-[0_20px_25px_-5px_rgba(58,95,148,0.1),0_10px_10px_-5px_rgba(58,95,148,0.04)]">
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 30 }}>groups</span>
                </div>
                <h2 className="text-2xl font-headline font-bold text-slate-900 mb-2">Trabajadores</h2>
                <p className="text-slate-500 text-sm leading-relaxed">Alta, edición de roles y estado de los usuarios del negocio.</p>
              </div>
              <div className="mt-8 flex justify-end">
                <span className="material-symbols-outlined text-primary group-hover:translate-x-2 transition-transform">arrow_forward</span>
              </div>
            </div>
          )}

        </div>

        {/* Secondary Info Section */}
        <section className="mt-16">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <h3 className="text-xl font-headline font-bold text-slate-900 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">trending_up</span>
                {activityTitle}
              </h3>

              {!loadingActivities && recentSales.length > 0 && (
                <div className="text-sm text-slate-500">
                  Total reciente <span className="font-headline font-extrabold text-primary">{formatCurrency(totalRecentSales)}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {loadingActivities && (
                <div className="border border-dashed border-slate-200 rounded-2xl py-10 text-center text-slate-400 text-sm">
                  <span className="material-symbols-outlined animate-spin block mx-auto mb-2 text-primary">progress_activity</span>
                  Cargando actividad...
                </div>
              )}

              {!loadingActivities && activitiesError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-500">error</span>
                  {activitiesError}
                </div>
              )}

              {!loadingActivities && !activitiesError && recentSales.length === 0 && (
                <div className="border border-dashed border-slate-200 rounded-2xl py-10 text-center text-slate-400 text-sm">
                  No hay actividad registrada todavía.
                </div>
              )}

              {!loadingActivities && !activitiesError && recentSales.map(sale => (
                <div
                  key={sale.id}
                  className="border border-slate-100 rounded-2xl px-4 py-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined">receipt_long</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-headline font-extrabold text-slate-900">
                        Venta #{sale.id}{sale.boletaId ? ` · Boleta #${sale.boletaId}` : ''}
                      </h4>
                      <span className={`inline-flex items-center border rounded-full px-2.5 py-0.5 text-[11px] font-headline font-bold ${paymentTone(sale.paymentMethod)}`}>
                        {sale.paymentMethod}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {sale.employeeName} registró {sale.products} artículo{sale.products !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between gap-3 md:min-w-36">
                    <span className="text-sm font-headline font-extrabold text-primary">
                      {formatCurrency(sale.total)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatActivityDate(sale.date, sale.time)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

    </div>
  )
}

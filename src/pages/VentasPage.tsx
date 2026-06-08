import { useEffect, useMemo, useState } from 'react'
import AppTopBar from '../components/AppTopBar'
import { getVentas } from '../services/ventas'
import type { MetodoPago, Venta, VendedorStats } from '../types/venta'

const soulGradient = 'linear-gradient(135deg, #3a5f94 0%, #1f477b 100%)'

type PeriodFilter = 'day' | 'week' | 'month'
type EmployeeFilter = string | 'all'
type PaymentFilter = MetodoPago | 'all'

const periodOptions: Array<{ value: PeriodFilter; label: string; icon: string }> = [
  { value: 'day', label: 'Día', icon: 'today' },
  { value: 'week', label: 'Semana', icon: 'date_range' },
  { value: 'month', label: 'Mes', icon: 'calendar_month' },
]

const paymentOptions: Array<{ value: PaymentFilter; label: string }> = [
  { value: 'all', label: 'Todos los métodos' },
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Tarjeta', label: 'Tarjeta' },
  { value: 'Transferencia', label: 'Transferencia' },
]

function parseSaleDate(value: string) {
  return new Date(`${value}T00:00:00`)
}

function startOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function getPeriodStart(period: PeriodFilter, referenceDate: Date) {
  const start = startOfDay(referenceDate)
  if (period === 'week') start.setDate(start.getDate() - 6)
  if (period === 'month') start.setDate(start.getDate() - 29)
  return start
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string | Date) {
  const date = typeof value === 'string' ? parseSaleDate(value) : value
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getPaymentBadge(method: MetodoPago) {
  if (method === 'Efectivo') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (method === 'Tarjeta') return 'bg-blue-50 text-blue-700 border-blue-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`
}

function downloadSalesCsv(sales: Venta[], period: PeriodFilter) {
  const headers = ['ID', 'Fecha', 'Hora', 'Vendedor/a', 'Productos', 'Método de pago', 'Total']
  const rows = sales.map(sale => [
    sale.id,
    sale.date,
    sale.time,
    sale.employeeName,
    sale.products,
    sale.paymentMethod,
    sale.total,
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(csvCell).join(';'))
    .join('\n')
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `reporte-ventas-${period}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('day')
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeFilter>('all')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentFilter>('all')

  useEffect(() => {
    let mounted = true

    async function loadVentas() {
      setLoading(true)
      setError(null)
      try {
        const data = await getVentas()
        if (mounted) setVentas(data)
      } catch {
        if (mounted) setError('No se pudieron cargar las ventas.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadVentas()

    return () => {
      mounted = false
    }
  }, [])

  const sortedSales = useMemo(() => {
    return [...ventas].sort((a, b) => {
      const byDate = parseSaleDate(b.date).getTime() - parseSaleDate(a.date).getTime()
      if (byDate !== 0) return byDate
      return b.time.localeCompare(a.time)
    })
  }, [ventas])

  const referenceDate = useMemo(() => {
    if (!sortedSales.length) return startOfDay(new Date())
    return parseSaleDate(sortedSales[0].date)
  }, [sortedSales])

  const uniqueEmployees = useMemo(() => {
    return Array.from(new Set(ventas.map(sale => sale.employeeName))).sort()
  }, [ventas])

  const filteredSales = useMemo(() => {
    const periodStart = getPeriodStart(periodFilter, referenceDate)
    const periodEnd = startOfDay(referenceDate)
    periodEnd.setHours(23, 59, 59, 999)

    return sortedSales.filter(sale => {
      const saleDate = parseSaleDate(sale.date)
      const isInPeriod = saleDate >= periodStart && saleDate <= periodEnd
      const matchesEmployee = selectedEmployee === 'all' || sale.employeeName === selectedEmployee
      const matchesPayment = selectedPaymentMethod === 'all' || sale.paymentMethod === selectedPaymentMethod

      return isInPeriod && matchesEmployee && matchesPayment
    })
  }, [periodFilter, referenceDate, selectedEmployee, selectedPaymentMethod, sortedSales])

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
  const totalTransactions = filteredSales.length
  const totalProducts = filteredSales.reduce((sum, sale) => sum + sale.products, 0)
  const averageSale = totalTransactions > 0 ? totalSales / totalTransactions : 0

  const employeeStats = useMemo<VendedorStats[]>(() => {
    const stats = new Map<string, VendedorStats>()

    filteredSales.forEach(sale => {
      const current = stats.get(sale.employeeName) ?? {
        name: sale.employeeName,
        total: 0,
        transactions: 0,
        products: 0,
      }

      current.total += sale.total
      current.transactions += 1
      current.products += sale.products
      stats.set(sale.employeeName, current)
    })

    return Array.from(stats.values()).sort((a, b) => b.total - a.total)
  }, [filteredSales])

  const topEmployeeTotal = employeeStats[0]?.total ?? 0
  const selectedPeriodLabel = periodOptions.find(option => option.value === periodFilter)?.label ?? 'Periodo'
  const transactionLabel = filteredSales.length === 1 ? 'transacción' : 'transacciones'

  return (
    <div className="bg-white font-body text-on-surface min-h-screen overflow-x-hidden">
      <AppTopBar active="ventas" />

      <main className="pt-24 pb-24 px-4 sm:px-6 bg-[#f3f3f7] min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 text-primary font-headline font-bold text-xs uppercase tracking-widest mb-3">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>analytics</span>
                Reportes
              </div>
              <h1 className="text-[1.875rem] font-headline font-extrabold text-on-surface tracking-tight">
                Ventas
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {loading
                  ? 'Cargando ventas...'
                  : `${filteredSales.length} ${transactionLabel} en ${selectedPeriodLabel.toLowerCase()} · Corte ${formatDate(referenceDate)}`}
              </p>
            </div>

            <button
              onClick={() => downloadSalesCsv(filteredSales, periodFilter)}
              disabled={filteredSales.length === 0}
              className="w-full sm:w-auto text-white rounded-full px-6 py-3 font-headline font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: soulGradient }}
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Exportar CSV
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-6 py-4 text-sm flex items-center gap-3">
              <span className="material-symbols-outlined text-red-500">error</span>
              {error}
            </div>
          )}

          <section className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 mb-6">
            <div className="flex flex-col xl:flex-row xl:items-center gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 20 }}>calendar_today</span>
                <span className="text-sm font-headline font-bold text-slate-600 mr-1">Período</span>
                <div className="flex bg-slate-100 rounded-full p-1">
                  {periodOptions.map(option => {
                    const active = periodFilter === option.value

                    return (
                      <button
                        key={option.value}
                        onClick={() => setPeriodFilter(option.value)}
                        className={`h-10 px-4 rounded-full text-sm font-headline font-bold transition flex items-center gap-2 ${
                          active ? 'text-white shadow-sm' : 'text-slate-500 hover:text-primary'
                        }`}
                        style={active ? { background: soulGradient } : undefined}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{option.icon}</span>
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:ml-auto">
                <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-2">
                  <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 20 }}>badge</span>
                  <select
                    value={selectedEmployee}
                    onChange={event => setSelectedEmployee(event.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
                  >
                    <option value="all">Todo el equipo</option>
                    {uniqueEmployees.map(employee => (
                      <option key={employee} value={employee}>{employee}</option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-2">
                  <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 20 }}>payments</span>
                  <select
                    value={selectedPaymentMethod}
                    onChange={event => setSelectedPaymentMethod(event.target.value as PaymentFilter)}
                    className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
                  >
                    {paymentOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-500 font-medium">Ventas totales</span>
                <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 rounded-2xl p-2">paid</span>
              </div>
              <div className="text-2xl font-headline font-extrabold text-slate-900">
                {formatCurrency(totalSales)}
              </div>
              <p className="text-xs text-slate-400 mt-2">{selectedPeriodLabel} filtrado</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-500 font-medium">Transacciones</span>
                <span className="material-symbols-outlined text-primary bg-primary/10 rounded-2xl p-2">receipt_long</span>
              </div>
              <div className="text-2xl font-headline font-extrabold text-slate-900">
                {totalTransactions}
              </div>
              <p className="text-xs text-slate-400 mt-2">operaciones registradas</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-500 font-medium">Productos vendidos</span>
                <span className="material-symbols-outlined text-amber-600 bg-amber-50 rounded-2xl p-2">inventory_2</span>
              </div>
              <div className="text-2xl font-headline font-extrabold text-slate-900">
                {totalProducts}
              </div>
              <p className="text-xs text-slate-400 mt-2">unidades en ventas</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-500 font-medium">Ticket promedio</span>
                <span className="material-symbols-outlined text-slate-600 bg-slate-100 rounded-2xl p-2">trending_up</span>
              </div>
              <div className="text-2xl font-headline font-extrabold text-slate-900">
                {formatCurrency(averageSale)}
              </div>
              <p className="text-xs text-slate-400 mt-2">por transacción</p>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <h2 className="text-xl font-headline font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">groups</span>
                Ventas por vendedor/a
              </h2>
              {selectedEmployee !== 'all' && (
                <button
                  onClick={() => setSelectedEmployee('all')}
                  className="text-sm font-headline font-bold text-primary hover:text-primary/80"
                >
                  Ver todo el equipo
                </button>
              )}
            </div>

            {employeeStats.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-2xl py-10 text-center text-slate-400 text-sm">
                No hay ventas para los filtros seleccionados.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {employeeStats.map(employee => (
                  <button
                    key={employee.name}
                    onClick={() => setSelectedEmployee(employee.name)}
                    className={`text-left border rounded-2xl p-4 transition hover:shadow-md ${
                      selectedEmployee === employee.name ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-headline font-extrabold">
                        {getInitials(employee.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-headline font-bold text-slate-900 truncate">{employee.name}</p>
                        <p className="text-xs text-slate-400">{employee.transactions} venta{employee.transactions !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-xl font-headline font-extrabold text-primary mb-2">
                      {formatCurrency(employee.total)}
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${topEmployeeTotal ? (employee.total / topEmployeeTotal) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{employee.products} producto{employee.products !== 1 ? 's' : ''}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-xl font-headline font-bold text-slate-900">Detalle de transacciones</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {filteredSales.length} resultado{filteredSales.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-sm text-slate-500">
                Total <span className="font-headline font-extrabold text-primary">{formatCurrency(totalSales)}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-headline font-bold text-slate-500 uppercase tracking-widest">ID</th>
                    <th className="px-5 py-3 text-left text-xs font-headline font-bold text-slate-500 uppercase tracking-widest">Fecha</th>
                    <th className="px-5 py-3 text-left text-xs font-headline font-bold text-slate-500 uppercase tracking-widest">Hora</th>
                    <th className="px-5 py-3 text-left text-xs font-headline font-bold text-slate-500 uppercase tracking-widest">Vendedor/a</th>
                    <th className="px-5 py-3 text-left text-xs font-headline font-bold text-slate-500 uppercase tracking-widest">Productos</th>
                    <th className="px-5 py-3 text-left text-xs font-headline font-bold text-slate-500 uppercase tracking-widest">Pago</th>
                    <th className="px-5 py-3 text-right text-xs font-headline font-bold text-slate-500 uppercase tracking-widest">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">
                        No hay ventas registradas para este período.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map(sale => (
                      <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-headline font-bold text-primary">
                          {sale.id}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-700">
                          {formatDate(sale.date)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500">
                          {sale.time}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-700">
                          {sale.employeeName}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500">
                          {sale.products}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center border rounded-full px-3 py-1 text-xs font-headline font-bold ${getPaymentBadge(sale.paymentMethod)}`}>
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-headline font-extrabold text-slate-900">
                          {formatCurrency(sale.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

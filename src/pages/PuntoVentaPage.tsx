import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import AppTopBar from '../components/AppTopBar'
import { getProductosVenta, registrarVenta, validarTicketBalanza } from '../services/ventas'
import type { MetodoPago, ProductoVenta, TicketBalanzaInfo, VentaRegistrada } from '../types/venta'
import { useAuthStore } from '../store/authStore'

const soulGradient = 'linear-gradient(135deg, #3a5f94 0%, #1f477b 100%)'
const SCANNER_RESET_DELAY_MS = 100
const MIN_SCANNER_CODE_LENGTH = 5
const SCALE_TICKET_PREFIX = '29'

interface CarritoItem {
  product: ProductoVenta
  quantity: number
  weight?: number
  subtotal: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

function getSubtotal(product: ProductoVenta, quantity: number, weight?: number) {
  if (product.origen === 'BALANZA') return product.precio
  if (product.tipo_venta === 'peso') return product.precio * (weight ?? 0) * quantity
  return product.precio * quantity
}

function paymentIcon(method: MetodoPago) {
  if (method === 'Efectivo') return 'payments'
  if (method === 'Tarjeta') return 'credit_card'
  return 'account_balance'
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatLineQuantity(item: VentaRegistrada['items'][number]) {
  if (item.peso !== undefined) {
    const totalWeight = item.peso * item.cantidad
    return `${totalWeight.toFixed(3)} kg`
  }
  return String(item.cantidad)
}

function printSaleReceipt(sale: VentaRegistrada) {
  const printWindow = window.open('', '_blank', 'width=420,height=640')
  if (!printWindow) return false

  const rows = sale.items.map(item => `
    <tr>
      <td>
        <strong>${escapeHtml(item.nombre)}</strong>
        <span>${formatLineQuantity(item)} x ${formatCurrency(item.precioUnitario)}</span>
      </td>
      <td>${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('')

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Boleta ${escapeHtml(sale.boletaId ?? sale.id)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 0; padding: 24px; }
          .receipt { max-width: 320px; margin: 0 auto; }
          h1 { font-size: 20px; margin: 0 0 4px; text-align: center; }
          .meta { font-size: 12px; color: #4b5563; text-align: center; margin-bottom: 16px; }
          .row { display: flex; justify-content: space-between; gap: 16px; font-size: 12px; margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          td { border-top: 1px solid #e5e7eb; padding: 8px 0; vertical-align: top; font-size: 12px; }
          td:last-child { text-align: right; white-space: nowrap; }
          strong { display: block; font-size: 12px; }
          span { display: block; color: #6b7280; margin-top: 2px; }
          .total { border-top: 2px solid #111827; padding-top: 10px; font-size: 16px; font-weight: 700; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <h1>Boleta</h1>
          <div class="meta">Nro. ${escapeHtml(sale.boletaId ?? sale.id)}</div>
          <div class="row"><span>Venta</span><strong>${escapeHtml(sale.id)}</strong></div>
          <div class="row"><span>Fecha</span><strong>${escapeHtml(sale.date)} ${escapeHtml(sale.time)}</strong></div>
          <div class="row"><span>Trabajador</span><strong>${escapeHtml(sale.employeeName)}</strong></div>
          <div class="row"><span>Pago</span><strong>${escapeHtml(sale.paymentMethod)}</strong></div>
          <table><tbody>${rows}</tbody></table>
          <div class="row total"><span>Total</span><strong>${formatCurrency(sale.total)}</strong></div>
        </div>
        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
  return true
}

function buildScaleTicketProduct(ticket: TicketBalanzaInfo): ProductoVenta {
  const ticketNumber = String(ticket.numero_ticket)
  const total = Number(ticket.total)

  return {
    id: -(Number.parseInt(ticketNumber, 10) || Date.now()),
    cod_barra: ticket.codigo_barra,
    categoria: 'BALANZA',
    nombre: ticket.nombre_producto || `Productos pesados - Ticket ${ticketNumber}`,
    precio: total,
    costo: null,
    unidad: 'ticket',
    tipo_venta: 'balanza',
    origen: 'BALANZA',
    ticketBalanza: ticketNumber,
    codigoBalanza: ticket.codigo_barra,
  }
}

export default function PuntoVentaPage() {
  const scanInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const scannerBufferRef = useRef('')
  const scannerLastKeyAtRef = useRef(0)
  const { user } = useAuthStore()

  const [products, setProducts] = useState<ProductoVenta[]>([])
  const [cart, setCart] = useState<CarritoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [scanCode, setScanCode] = useState('')
  const [scanMessage, setScanMessage] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ProductoVenta | null>(null)
  const [weightInput, setWeightInput] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<MetodoPago>('Efectivo')
  const [savingSale, setSavingSale] = useState(false)
  const [lastSale, setLastSale] = useState<VentaRegistrada | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadProducts() {
      setLoading(true)
      setError(null)
      try {
        const data = await getProductosVenta()
        if (mounted) setProducts(data)
      } catch {
        if (mounted) setError('No se pudieron cargar los productos de venta.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProducts()
    scanInputRef.current?.focus()

    return () => {
      mounted = false
    }
  }, [])

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return products

    return products.filter(product => (
      product.nombre.toLowerCase().includes(query) ||
      product.cod_barra.includes(query) ||
      product.categoria.toLowerCase().includes(query)
    ))
  }, [products, searchTerm])

  const unitProducts = filteredProducts.filter(product => product.tipo_venta === 'unidad')
  const weightProducts = filteredProducts.filter(product => product.tipo_venta === 'peso')
  const total = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const employeeName = user?.full_name || user?.username || user?.email || 'Trabajador'

  const addToCart = useCallback((product: ProductoVenta, weight?: number) => {
    setScanMessage(null)
    setLastSale(null)
    setCart(current => {
      const existingIndex = current.findIndex(item => (
        item.product.id === product.id &&
        (product.tipo_venta === 'unidad' || item.weight === weight)
      ))

      if (existingIndex >= 0) {
        return current.map((item, index) => {
          if (index !== existingIndex) return item
          const quantity = item.quantity + 1

          return {
            ...item,
            quantity,
            subtotal: getSubtotal(item.product, quantity, item.weight),
          }
        })
      }

      return [
        ...current,
        {
          product,
          quantity: 1,
          weight,
          subtotal: getSubtotal(product, 1, weight),
        },
      ]
    })
  }, [])

  const addScaleTicketToCart = useCallback((ticket: TicketBalanzaInfo) => {
    const product = buildScaleTicketProduct(ticket)

    if (!Number.isFinite(product.precio) || product.precio <= 0) {
      setScanMessage('El total de la boleta de balanza no es valido.')
      return
    }

    const alreadyInCart = cart.some(item => (
      item.product.origen === 'BALANZA' &&
      item.product.ticketBalanza === product.ticketBalanza
    ))

    if (alreadyInCart) {
      setScanMessage(`El ticket ${product.ticketBalanza} ya esta en la boleta.`)
      return
    }

    setScanMessage(null)
    setLastSale(null)
    setCart(current => [
      ...current,
      {
        product,
        quantity: 1,
        subtotal: product.precio,
      },
    ])
  }, [cart])

  const submitScannedCode = useCallback(async (rawCode: string) => {
    const code = rawCode.trim()
    if (!code) return

    if (code.startsWith(SCALE_TICKET_PREFIX)) {
      try {
        const ticket = await validarTicketBalanza(code)
        addScaleTicketToCart(ticket)
      } catch (err) {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        setScanMessage(detail ?? 'No se pudo validar la boleta de balanza.')
      } finally {
        setScanCode('')
        setSearchTerm('')
        window.setTimeout(() => scanInputRef.current?.focus(), 0)
      }
      return
    }

    const product = products.find(item => item.cod_barra === code)

    if (!product) {
      setScanMessage('Producto no encontrado.')
      setScanCode('')
      return
    }

    if (product.tipo_venta === 'peso') {
      setSelectedProduct(product)
    } else {
      addToCart(product)
    }

    setScanCode('')
    setSearchTerm('')
    window.setTimeout(() => scanInputRef.current?.focus(), 0)
  }, [addScaleTicketToCart, addToCart, products])

  function handleScan(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return

    event.preventDefault()
    void submitScannedCode(event.currentTarget.value)
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return

    const code = event.currentTarget.value.trim()
    if (code.startsWith(SCALE_TICKET_PREFIX)) {
      event.preventDefault()
      void submitScannedCode(code)
      return
    }

    const product = products.find(item => item.cod_barra === code)
    if (!product) return

    event.preventDefault()
    void submitScannedCode(code)
  }

  useEffect(() => {
    function handleWindowScan(event: globalThis.KeyboardEvent) {
      if (checkoutOpen || selectedProduct) return

      const target = event.target as HTMLElement | null
      if (target === scanInputRef.current) return

      const isEditable = Boolean(
        target?.isContentEditable ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      )

      if (event.ctrlKey || event.altKey || event.metaKey) return
      if (isEditable) return

      const now = window.performance.now()
      if (now - scannerLastKeyAtRef.current > SCANNER_RESET_DELAY_MS) {
        scannerBufferRef.current = ''
      }
      scannerLastKeyAtRef.current = now

      if (event.key === 'Enter') {
        const code = scannerBufferRef.current
        scannerBufferRef.current = ''

        if (code.trim().length >= MIN_SCANNER_CODE_LENGTH) {
          event.preventDefault()
          void submitScannedCode(code)
        }
        return
      }

      if (event.key.length === 1) {
        scannerBufferRef.current += event.key
        event.preventDefault()
      }
    }

    window.addEventListener('keydown', handleWindowScan)
    return () => window.removeEventListener('keydown', handleWindowScan)
  }, [checkoutOpen, selectedProduct, submitScannedCode])

  function updateQuantity(index: number, delta: number) {
    setCart(current => {
      const next = current
        .map((item, itemIndex) => {
          if (itemIndex !== index) return item
          if (item.product.origen === 'BALANZA') return item

          const quantity = item.quantity + delta

          return {
            ...item,
            quantity,
            subtotal: getSubtotal(item.product, quantity, item.weight),
          }
        })
        .filter(item => item.quantity > 0)

      return next
    })
  }

  function removeItem(index: number) {
    setCart(current => current.filter((_, itemIndex) => itemIndex !== index))
  }

  function addWeightProduct() {
    if (!selectedProduct) return

    const weight = Number(weightInput)
    if (!Number.isFinite(weight) || weight <= 0) {
      setScanMessage('Ingresá un peso válido.')
      return
    }

    addToCart(selectedProduct, weight)
    setSelectedProduct(null)
    setWeightInput('')
    scanInputRef.current?.focus()
  }

  async function confirmSale() {
    if (cart.length === 0) return

    setSavingSale(true)
    setError(null)
    try {
      const sale = await registrarVenta({
        employeeName,
        paymentMethod,
        total,
        items: cart.map(item => ({
          productoId: item.product.origen === 'BALANZA' ? undefined : item.product.id,
          nombre: item.product.nombre,
          cantidad: item.quantity,
          peso: item.weight,
          precioUnitario: item.product.precio,
          subtotal: item.subtotal,
          origen: item.product.origen ?? 'PRODUCTO',
          ticketBalanza: item.product.ticketBalanza,
          codigoBalanza: item.product.codigoBalanza,
          totalBalanza: item.product.origen === 'BALANZA' ? item.subtotal : undefined,
        })),
      })

      setLastSale(sale)
      setCart([])
      setCheckoutOpen(false)
      setPaymentMethod('Efectivo')
      scanInputRef.current?.focus()
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'No se pudo registrar la venta.')
    } finally {
      setSavingSale(false)
    }
  }

  function resetSale() {
    setCart([])
    setScanCode('')
    setSearchTerm('')
    setSelectedProduct(null)
    setWeightInput('')
    setScanMessage(null)
    setLastSale(null)
    scanInputRef.current?.focus()
  }

  return (
    <div className="bg-white font-body text-on-surface min-h-screen overflow-x-hidden">
      <AppTopBar active="venta" />

      <main className="pt-24 pb-28 px-4 sm:px-6 bg-[#f3f3f7] min-h-screen">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 text-primary font-headline font-bold text-xs uppercase tracking-widest mb-3">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>point_of_sale</span>
                Caja
              </div>
              <h1 className="text-[1.875rem] font-headline font-extrabold text-on-surface tracking-tight">
                Venta
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {loading ? 'Cargando productos...' : `${products.length} productos disponibles`}
              </p>
            </div>

            <button
              type="button"
              onClick={resetSale}
              disabled={cart.length === 0 && !searchTerm && !scanCode}
              className="w-full sm:w-auto border border-slate-200 bg-white rounded-full px-6 py-3 font-headline font-bold text-xs tracking-widest uppercase text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
            >
              Limpiar venta
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-6 py-4 text-sm flex items-center gap-3">
              <span className="material-symbols-outlined text-red-500">error</span>
              {error}
            </div>
          )}

          {lastSale && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-6 py-4 text-sm flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <span className="flex-1">
                Venta {lastSale.id}{lastSale.boletaId ? ` · Boleta ${lastSale.boletaId}` : ''} registrada por {formatCurrency(lastSale.total)}.
              </span>
              <button
                type="button"
                onClick={() => {
                  if (!printSaleReceipt(lastSale)) {
                    setError('No se pudo abrir la ventana de impresión. Revisá los permisos del navegador.')
                  }
                }}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 py-2 text-xs font-headline font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
                Imprimir boleta
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
            <section className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <label className="relative block">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">barcode_scanner</span>
                    <input
                      ref={scanInputRef}
                      type="text"
                      value={scanCode}
                      onChange={event => {
                        setScanCode(event.target.value)
                        setScanMessage(null)
                      }}
                      onKeyDown={handleScan}
                      placeholder="Escanear código de barras"
                      className="w-full border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                    />
                  </label>

                  <label className="relative block">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={event => setSearchTerm(event.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Buscar producto"
                      className="w-full border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                    />
                  </label>
                </div>

                {scanMessage && (
                  <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                    {scanMessage}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <ProductGroup
                  title="Productos por unidad"
                  icon="inventory_2"
                  tone="primary"
                  products={unitProducts}
                  loading={loading}
                  onSelect={addToCart}
                />

                <ProductGroup
                  title="Productos por peso"
                  icon="scale"
                  tone="green"
                  products={weightProducts}
                  loading={loading}
                  onSelect={product => setSelectedProduct(product)}
                />
              </div>
            </section>

            <aside className="bg-white border border-slate-200 rounded-3xl overflow-hidden xl:sticky xl:top-24">
              <div className="p-5 border-b border-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-headline font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">receipt_long</span>
                    Boleta actual
                  </h2>
                  <span className="text-xs font-headline font-bold uppercase tracking-widest text-slate-400">
                    {totalItems} item{totalItems !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="p-4 min-h-[320px] max-h-[calc(100vh-360px)] overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="h-[280px] flex flex-col items-center justify-center text-center text-slate-400">
                    <span className="material-symbols-outlined mb-3" style={{ fontSize: 54 }}>shopping_cart</span>
                    <p className="text-sm font-medium">Sin productos</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item, index) => (
                      <div key={`${item.product.codigoBalanza ?? item.product.id}-${item.weight ?? 'unit'}`} className="border border-slate-200 rounded-2xl p-3">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            <h3 className="text-sm font-headline font-bold text-slate-900">{item.product.nombre}</h3>
                            <p className="text-xs text-slate-400 mt-1">
                              {item.product.origen === 'BALANZA'
                                ? `Ticket ${item.product.ticketBalanza} - BALANZA`
                                : item.product.tipo_venta === 'peso'
                                ? `${item.weight?.toFixed(3)} kg · ${formatCurrency(item.product.precio)}/kg`
                                : `${formatCurrency(item.product.precio)} c/u`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:bg-red-50 rounded-full p-1 transition"
                            aria-label="Eliminar producto"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          {item.product.origen === 'BALANZA' ? (
                            <span className="text-xs font-headline font-bold uppercase tracking-widest text-slate-400">
                              Cantidad 1
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateQuantity(index, -1)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition"
                                aria-label="Restar"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>remove</span>
                              </button>
                              <span className="w-8 text-center text-sm font-headline font-bold text-slate-700">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(index, 1)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition"
                                aria-label="Sumar"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                              </button>
                            </div>
                          )}
                          <div className="text-sm font-headline font-extrabold text-slate-900">
                            {formatCurrency(item.subtotal)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="font-headline font-bold text-slate-900">Total</span>
                    <span className="text-3xl font-headline font-extrabold text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCheckoutOpen(true)}
                  disabled={cart.length === 0}
                  className="w-full text-white rounded-full py-4 font-headline font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: soulGradient }}
                >
                  <span className="material-symbols-outlined">paid</span>
                  Cobrar
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h3 className="text-xl font-headline font-extrabold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">scale</span>
                Peso
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null)
                  setWeightInput('')
                }}
                className="text-slate-400 hover:text-slate-600 rounded-full p-1"
                aria-label="Cerrar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mb-4">
              <p className="font-headline font-bold text-slate-900">{selectedProduct.nombre}</p>
              <p className="text-sm text-slate-500 mt-1">{formatCurrency(selectedProduct.precio)} por kg</p>
            </div>

            <label className="block mb-4">
              <span className="block text-xs font-headline font-bold text-slate-500 uppercase tracking-widest mb-2">
                Peso en kg
              </span>
              <input
                type="number"
                value={weightInput}
                onChange={event => setWeightInput(event.target.value)}
                min="0"
                step="0.001"
                autoFocus
                placeholder="0.000"
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition"
              />
            </label>

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-5">
              <div className="flex justify-between text-sm text-emerald-800">
                <span>Total</span>
                <span className="font-headline font-extrabold">
                  {formatCurrency(selectedProduct.precio * Math.max(0, Number(weightInput) || 0))}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null)
                  setWeightInput('')
                }}
                className="flex-1 border border-slate-200 rounded-full py-3 text-sm font-headline font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={addWeightProduct}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full py-3 text-sm font-headline font-bold transition"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h3 className="text-xl font-headline font-extrabold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span>
                Pago
              </h3>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-full p-1"
                aria-label="Cerrar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-primary/10 rounded-2xl p-5 mb-5 text-center">
              <p className="text-xs font-headline font-bold uppercase tracking-widest text-primary mb-2">Total</p>
              <p className="text-4xl font-headline font-extrabold text-primary">{formatCurrency(total)}</p>
            </div>

            <div className="space-y-2 mb-5">
              {(['Efectivo', 'Tarjeta', 'Transferencia'] as MetodoPago[]).map(method => {
                const active = paymentMethod === method

                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`w-full border rounded-2xl p-3 flex items-center gap-3 transition ${
                      active ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined">{paymentIcon(method)}</span>
                    <span className="flex-1 text-left text-sm font-headline font-bold">{method}</span>
                    {active && <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span>}
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="flex-1 border border-slate-200 rounded-full py-3 text-sm font-headline font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmSale}
                disabled={savingSale}
                className="flex-1 text-white rounded-full py-3 text-sm font-headline font-bold transition disabled:opacity-60"
                style={{ background: soulGradient }}
              >
                {savingSale ? 'Registrando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface ProductGroupProps {
  title: string
  icon: string
  tone: 'primary' | 'green'
  products: ProductoVenta[]
  loading: boolean
  onSelect: (product: ProductoVenta) => void
}

function ProductGroup({ title, icon, tone, products, loading, onSelect }: ProductGroupProps) {
  const isGreen = tone === 'green'

  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className={`material-symbols-outlined ${isGreen ? 'text-emerald-600' : 'text-primary'}`}>{icon}</span>
        <h2 className="text-lg font-headline font-bold text-slate-900">{title}</h2>
        <span className="text-xs text-slate-400 font-headline font-bold">({products.length})</span>
      </div>

      {loading ? (
        <div className="border border-dashed border-slate-200 rounded-2xl py-10 text-center text-slate-400 text-sm">
          Cargando...
        </div>
      ) : products.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-2xl py-10 text-center text-slate-400 text-sm">
          Sin resultados
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
          {products.map(product => (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product)}
              className={`text-left border rounded-2xl p-4 transition hover:shadow-md ${
                isGreen ? 'border-emerald-100 hover:border-emerald-300' : 'border-slate-200 hover:border-primary/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isGreen ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                  <span className="material-symbols-outlined">{isGreen ? 'scale' : 'inventory_2'}</span>
                </div>
                <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-1">
                  {product.tipo_venta === 'peso' ? 'Por kg' : product.unidad}
                </span>
              </div>
              <h3 className="text-sm font-headline font-bold text-slate-900 min-h-[40px]">{product.nombre}</h3>
              <p className="text-xs text-slate-400 mt-2">
                {product.tipo_venta === 'unidad' && product.cod_barra ? product.cod_barra : product.categoria}
              </p>
              <div className="flex items-end justify-between gap-3 mt-4">
                <span className={`text-xl font-headline font-extrabold ${isGreen ? 'text-emerald-600' : 'text-primary'}`}>
                  {formatCurrency(product.precio)}
                </span>
                <span className="text-xs text-slate-400">
                  {product.tipo_venta === 'peso' ? '/kg' : product.unidad}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

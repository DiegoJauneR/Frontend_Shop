import { useState, useEffect, useMemo } from 'react'
import AppTopBar from '../components/AppTopBar'
import {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
} from '../services/productos'
import type { Producto, ProductoFormData } from '../types/producto'
import { emptyProductoForm } from '../types/producto'

const soulGradient = 'linear-gradient(135deg, #3a5f94 0%, #1f477b 100%)'
const PAGE_SIZE = 10

function formatCurrency(value: string | null | undefined): string {
  if (!value) return '—'
  const num = parseFloat(value)
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(num)
}

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & pagination
  const [selectedCategoria, setSelectedCategoria] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null)
  const [form, setForm] = useState<ProductoFormData>(emptyProductoForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Producto | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ---- Data loading ----
  async function loadProductos() {
    setLoading(true)
    setError(null)
    try {
      const data = await getProductos(0, 1000)
      setProductos(data)
    } catch {
      setError('No se pudo cargar el inventario. Verificá la conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProductos()
  }, [])

  // ---- Derived categories ----
  const categories = useMemo(() => {
    const cats = new Set<string>()
    for (const p of productos) {
      if (p.categoria) cats.add(p.categoria)
    }
    return Array.from(cats).sort()
  }, [productos])

  // ---- Filtered + paginated ----
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return productos.filter(p => {
      const matchesCat = !selectedCategoria || p.categoria === selectedCategoria
      const matchesSearch = !q ||
        p.nombre.toLowerCase().includes(q) ||
        String(p.id).includes(q)
      return matchesCat && matchesSearch
    })
  }, [productos, selectedCategoria, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleCategoryChange(cat: string) {
    setSelectedCategoria(cat)
    setCurrentPage(1)
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  // ---- Modal helpers ----
  function openCreate() {
    setEditingProduct(null)
    setForm(emptyProductoForm)
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(p: Producto) {
    setEditingProduct(p)
    setForm({
      codigo: p.codigo ?? '',
      cod_barra: p.cod_barra ?? '',
      categoria: p.categoria ?? '',
      nombre: p.nombre,
      costo: p.costo ?? '',
      precio: p.precio,
      unidad: p.unidad ?? 'unidad',
      tipo_venta: (p.tipo_venta === 'peso' ? 'peso' : 'unidad'),
    })
    setFormError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingProduct(null)
    setForm(emptyProductoForm)
    setFormError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { setFormError('El nombre es requerido.'); return }
    if (!form.precio.trim()) { setFormError('El precio es requerido.'); return }
    if (isNaN(parseFloat(form.precio)) || parseFloat(form.precio) < 0) {
      setFormError('El precio debe ser un número válido mayor o igual a 0.')
      return
    }
    if (form.costo && (isNaN(parseFloat(form.costo)) || parseFloat(form.costo) < 0)) {
      setFormError('El costo debe ser un número válido mayor o igual a 0.')
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      if (editingProduct) {
        await updateProducto(editingProduct.id, form)
      } else {
        await createProducto(form)
      }
      closeModal()
      await loadProductos()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFormError(msg ?? 'Ocurrió un error al guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  // ---- Delete ----
  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteProducto(deleteTarget.id)
      setDeleteTarget(null)
      await loadProductos()
    } catch {
      // keep dialog open, show nothing — simple approach
    } finally {
      setDeleting(false)
    }
  }

  // ---- Render ----
  return (
    <div className="bg-white font-body text-on-surface min-h-screen overflow-x-hidden">
      <AppTopBar active="productos" />

      <div className="pt-16 flex min-h-screen">
        {/* Sidebar — Category Filter */}
        <aside className="w-64 bg-white border-r border-slate-100 p-8 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto flex-shrink-0">
          <h2 className="text-primary font-headline font-bold text-xs tracking-widest uppercase mb-8">
            Filtrar por
          </h2>

          {/* Search */}
          <div className="mb-8">
            <h3 className="text-on-surface font-headline font-bold text-sm mb-3">Buscar</h3>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 18 }}>search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Nombre o ID..."
                className="w-full border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
              )}
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-on-surface font-headline font-bold text-sm mb-4">Categoría</h3>

            {loading ? (
              <p className="text-xs text-slate-400">Cargando...</p>
            ) : (
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="categoria"
                    className="w-4 h-4 text-primary border-outline-variant focus:ring-primary"
                    checked={selectedCategoria === ''}
                    onChange={() => handleCategoryChange('')}
                  />
                  <span className="text-sm text-on-surface-variant group-hover:text-primary transition-colors font-medium">
                    Todas
                  </span>
                </label>

                {categories.map(cat => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="categoria"
                      className="w-4 h-4 text-primary border-outline-variant focus:ring-primary"
                      checked={selectedCategoria === cat}
                      onChange={() => handleCategoryChange(cat)}
                    />
                    <span className="text-sm text-on-surface-variant group-hover:text-primary transition-colors">
                      {cat}
                    </span>
                  </label>
                ))}

                {categories.length === 0 && (
                  <p className="text-xs text-slate-400 italic">
                    Las categorías aparecerán al agregar productos.
                  </p>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-[#f3f3f7] p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-[1.875rem] font-headline font-extrabold text-on-surface tracking-tight">
                  Inventario
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  {loading ? 'Cargando...' : `${filtered.length} producto${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                onClick={openCreate}
                className="text-white rounded-full px-8 py-3 font-headline font-bold text-xs tracking-widest uppercase flex items-center gap-2 active:scale-95 transition-transform shadow-[0_20px_25px_-5px_rgba(58,95,148,0.1)]"
                style={{ background: soulGradient }}
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Agregar Producto
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-6 py-4 text-sm flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">error</span>
                {error}
                <button
                  onClick={loadProductos}
                  className="ml-auto text-red-600 underline font-semibold hover:text-red-800"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Product Table */}
            <div className="bg-white rounded-2xl shadow-[0_20px_25px_-5px_rgba(58,95,148,0.1)] overflow-hidden border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-headline font-extrabold text-slate-400 uppercase tracking-widest">ID</th>
                    <th className="px-6 py-4 text-[10px] font-headline font-extrabold text-slate-400 uppercase tracking-widest">Nombre</th>
                    <th className="px-6 py-4 text-[10px] font-headline font-extrabold text-slate-400 uppercase tracking-widest">Categoría</th>
                    <th className="px-6 py-4 text-[10px] font-headline font-extrabold text-slate-400 uppercase tracking-widest">Costo</th>
                    <th className="px-6 py-4 text-[10px] font-headline font-extrabold text-slate-400 uppercase tracking-widest">Precio</th>
                    <th className="px-6 py-4 text-[10px] font-headline font-extrabold text-slate-400 uppercase tracking-widest">Cód. Barras</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-slate-400 text-sm">
                        <span className="material-symbols-outlined animate-spin block mx-auto mb-2 text-primary">progress_activity</span>
                        Cargando inventario...
                      </td>
                    </tr>
                  )}
                  {!loading && paginated.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-slate-400 text-sm">
                        No hay productos{selectedCategoria ? ` en la categoría "${selectedCategoria}"` : ''}.
                      </td>
                    </tr>
                  )}
                  {!loading && paginated.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-medium text-slate-400">
                        #{String(p.id).padStart(3, '0')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-on-surface">{p.nombre}</span>
                        {p.codigo && (
                          <span className="block text-xs text-slate-400 font-mono">{p.codigo}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {p.categoria ? (
                          <span className="text-xs bg-[#d5e3ff] text-[#001b3c] px-3 py-1 rounded-full font-bold uppercase tracking-tighter">
                            {p.categoria}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatCurrency(p.costo)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">{formatCurrency(p.precio)}</td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">{p.cod_barra ?? '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-primary transition-colors"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="p-2 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                            title="Eliminar"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {!loading && filtered.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <span className="text-xs text-slate-500 font-medium">
                    Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length} productos
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 text-slate-400 hover:border-primary hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(n => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
                      .reduce<(number | 'ellipsis')[]>((acc, n, i, arr) => {
                        if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('ellipsis')
                        acc.push(n)
                        return acc
                      }, [])
                      .map((item, i) =>
                        item === 'ellipsis' ? (
                          <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-xs">…</span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => setCurrentPage(item as number)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              currentPage === item
                                ? 'bg-primary text-white shadow-[0_4px_12px_rgba(58,95,148,0.3)]'
                                : 'border border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 text-slate-400 hover:border-primary hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-headline font-extrabold text-on-surface">
                {editingProduct ? 'Editar Producto' : 'Agregar Producto'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
                  <span className="material-symbols-outlined text-red-500 mt-0.5" style={{ fontSize: 16 }}>error</span>
                  {formError}
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-xs font-headline font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  placeholder="Ej: Camisa Oxford Slim"
                  required
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-xs font-headline font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Categoría
                </label>
                <input
                  type="text"
                  list="categorias-list"
                  value={form.categoria}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  placeholder="Ej: Textil"
                />
                <datalist id="categorias-list">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                {categories.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">Podés escribir una nueva o elegir una existente.</p>
                )}
              </div>

              {/* Precio */}
              <div>
                <label className="block text-xs font-headline font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Precio <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precio}
                  onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Costo */}
              <div>
                <label className="block text-xs font-headline font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Costo
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costo}
                  onChange={e => setForm(f => ({ ...f, costo: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  placeholder="0.00"
                />
              </div>

              {/* Código */}
              <div>
                <label className="block text-xs font-headline font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Código Interno
                </label>
                <input
                  type="text"
                  value={form.codigo}
                  onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  placeholder="Ej: SKU-001"
                />
              </div>

              {/* Código de barras */}
              <div>
                <label className="block text-xs font-headline font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Código de Barras
                </label>
                <input
                  type="text"
                  value={form.cod_barra}
                  onChange={e => setForm(f => ({ ...f, cod_barra: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  placeholder="Ej: 779012345678"
                />
              </div>

              {/* Tipo de venta */}
              <div>
                <label className="block text-xs font-headline font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Tipo de venta
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, tipo_venta: 'unidad', unidad: 'unidad' }))}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-headline font-bold border transition ${
                      form.tipo_venta === 'unidad'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>inventory_2</span>
                    Por unidad
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, tipo_venta: 'peso', unidad: 'kg' }))}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-headline font-bold border transition ${
                      form.tipo_venta === 'peso'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>scale</span>
                    Por peso (kg)
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border border-slate-200 rounded-full py-3 text-sm font-headline font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 text-white rounded-full py-3 text-sm font-headline font-bold tracking-wide transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: soulGradient }}
                >
                  {saving && (
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>
                  )}
                  {editingProduct ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4 mx-auto">
              <span className="material-symbols-outlined text-red-500" style={{ fontSize: 28 }}>delete_forever</span>
            </div>
            <h3 className="text-center text-lg font-headline font-extrabold text-on-surface mb-2">
              ¿Eliminar producto?
            </h3>
            <p className="text-center text-sm text-slate-500 mb-6">
              <span className="font-semibold text-on-surface">{deleteTarget.nombre}</span> será eliminado permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-slate-200 rounded-full py-3 text-sm font-headline font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-full py-3 text-sm font-headline font-bold transition active:scale-95 disabled:opacity-60"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import AppTopBar from '../components/AppTopBar'
import {
  createTrabajador,
  deleteTrabajador,
  getTrabajadores,
  updateTrabajador,
} from '../services/trabajadores'
import type { User, UserRole, WorkerFormData } from '../types/user'
import { emptyWorkerForm } from '../types/user'

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
}

function getInitials(name: string | null, username: string) {
  const source = name?.trim() || username
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function roleBadge(role: UserRole) {
  return role === 'admin'
    ? 'bg-violet-50 text-violet-700 border-violet-100'
    : 'bg-blue-50 text-blue-700 border-blue-100'
}

function getErrorMessage(error: unknown) {
  const maybeAxiosError = error as { response?: { data?: { detail?: string } } }
  return maybeAxiosError.response?.data?.detail || 'No se pudo guardar el trabajador.'
}

export default function TrabajadoresPage() {
  const [workers, setWorkers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'todos' | UserRole>('todos')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activo' | 'inactivo'>('todos')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<User | null>(null)
  const [form, setForm] = useState<WorkerFormData>(emptyWorkerForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function loadWorkers() {
    setLoading(true)
    setError(null)
    try {
      const data = await getTrabajadores()
      setWorkers(data)
    } catch {
      setError('No se pudieron cargar los trabajadores.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkers()
  }, [])

  const filteredWorkers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return workers.filter(worker => {
      const matchesSearch = !query ||
        worker.full_name?.toLowerCase().includes(query) ||
        worker.username.toLowerCase().includes(query) ||
        worker.email.toLowerCase().includes(query)
      const matchesRole = roleFilter === 'todos' || worker.role === roleFilter
      const matchesStatus = statusFilter === 'todos' ||
        (statusFilter === 'activo' ? worker.is_active : !worker.is_active)

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [workers, search, roleFilter, statusFilter])

  const activeCount = workers.filter(worker => worker.is_active).length

  function openCreate() {
    setEditingWorker(null)
    setForm(emptyWorkerForm)
    setFormError(null)
    setShowPassword(false)
    setModalOpen(true)
  }

  function openEdit(worker: User) {
    setEditingWorker(worker)
    setForm({
      email: worker.email,
      username: worker.username,
      full_name: worker.full_name ?? '',
      password: '',
      role: worker.role,
      is_active: worker.is_active,
    })
    setFormError(null)
    setShowPassword(false)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingWorker(null)
    setForm(emptyWorkerForm)
    setFormError(null)
    setShowPassword(false)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.full_name.trim()) {
      setFormError('El nombre completo es requerido.')
      return
    }

    if (!form.username.trim()) {
      setFormError('El usuario es requerido.')
      return
    }

    if (!form.email.trim()) {
      setFormError('El email es requerido.')
      return
    }

    if (!editingWorker && form.password.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (editingWorker && form.password && form.password.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      if (editingWorker) {
        await updateTrabajador(editingWorker.id, form)
      } else {
        await createTrabajador(form)
      }

      await loadWorkers()
      closeModal()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      await deleteTrabajador(deleteTarget.id)
      await loadWorkers()
      setDeleteTarget(null)
    } catch {
      setError('No se pudo desactivar el trabajador.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-slate-50 font-body text-on-surface min-h-screen overflow-x-hidden">
      <AppTopBar active="trabajadores" />

      <main className="pt-28 pb-32 px-4 sm:px-6 max-w-screen-2xl mx-auto min-h-screen">
        <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-6">
          <div>
            <h1 className="text-2xl font-headline font-extrabold text-slate-900">Trabajadores</h1>
            <p className="text-sm text-slate-500 mt-1">
              {activeCount} activos de {workers.length} registrados
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 bg-primary text-white font-headline font-bold text-sm px-5 py-3 rounded-xl hover:bg-primary/90 transition disabled:opacity-60"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 19 }}>add</span>
            Nuevo trabajador
          </button>
        </section>

        <section className="flex flex-col md:flex-row gap-3 mb-6">
          <label className="relative md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 19 }}>search</span>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Buscar por nombre o email..."
            />
          </label>

          <select
            value={roleFilter}
            onChange={event => setRoleFilter(event.target.value as 'todos' | UserRole)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="todos">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="vendedor">Vendedores</option>
          </select>

          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value as 'todos' | 'activo' | 'inactivo')}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </section>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">error</span>
            {error}
          </div>
        )}

        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4 text-xs font-headline font-bold text-slate-500 uppercase tracking-widest">Trabajador</th>
                  <th className="px-5 py-4 text-xs font-headline font-bold text-slate-500 uppercase tracking-widest">Contacto</th>
                  <th className="px-5 py-4 text-xs font-headline font-bold text-slate-500 uppercase tracking-widest">Rol</th>
                  <th className="px-5 py-4 text-xs font-headline font-bold text-slate-500 uppercase tracking-widest">Estado</th>
                  <th className="px-5 py-4 text-xs font-headline font-bold text-slate-500 uppercase tracking-widest">Registrado</th>
                  <th className="px-5 py-4 text-right text-xs font-headline font-bold text-slate-500 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                      <span className="material-symbols-outlined animate-spin block mx-auto mb-2 text-primary">progress_activity</span>
                      Cargando trabajadores...
                    </td>
                  </tr>
                )}

                {!loading && filteredWorkers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                      No hay trabajadores para mostrar.
                    </td>
                  </tr>
                )}

                {!loading && filteredWorkers.map(worker => (
                  <tr key={worker.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-primary flex items-center justify-center font-headline font-bold text-sm">
                          {getInitials(worker.full_name, worker.username)}
                        </div>
                        <div>
                          <div className="font-headline font-bold text-slate-900">
                            {worker.full_name || worker.username}
                          </div>
                          <div className="text-xs text-slate-400">@{worker.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 18 }}>mail</span>
                        {worker.email}
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${roleBadge(worker.role)}`}>
                        {roleLabels[worker.role]}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${worker.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {worker.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-5 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 18 }}>schedule</span>
                        {formatDate(worker.created_at)}
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(worker)}
                          className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition"
                          aria-label="Editar trabajador"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(worker)}
                          className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          aria-label="Desactivar trabajador"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4 py-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-headline font-extrabold text-slate-900">
                {editingWorker ? 'Editar trabajador' : 'Nuevo trabajador'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                aria-label="Cerrar modal"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-headline font-bold text-slate-700 mb-2">Nombre completo</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 19 }}>person</span>
                  <input
                    value={form.full_name}
                    onChange={event => setForm(current => ({ ...current, full_name: event.target.value }))}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Ej: María García"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-headline font-bold text-slate-700 mb-2">Usuario</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 19 }}>badge</span>
                  <input
                    value={form.username}
                    onChange={event => setForm(current => ({ ...current, username: event.target.value }))}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Ej: maria"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-headline font-bold text-slate-700 mb-2">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 19 }}>mail</span>
                  <input
                    value={form.email}
                    onChange={event => setForm(current => ({ ...current, email: event.target.value }))}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="correo@negocio.cl"
                    type="email"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-headline font-bold text-slate-700 mb-2">Rol</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 19 }}>shield_person</span>
                  <select
                    value={form.role}
                    onChange={event => setForm(current => ({ ...current, role: event.target.value as UserRole }))}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white"
                  >
                    <option value="admin">Administrador</option>
                    <option value="vendedor">Vendedor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-headline font-bold text-slate-700 mb-2">Contraseña</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 19 }}>lock</span>
                  <input
                    value={form.password}
                    onChange={event => setForm(current => ({ ...current, password: event.target.value }))}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder={editingWorker ? 'Dejar en blanco para mantener' : 'Mínimo 8 caracteres'}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={editingWorker ? 'new-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(value => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-3 pt-2 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setForm(current => ({ ...current, is_active: !current.is_active }))}
                  className={`w-12 h-7 rounded-full p-1 transition ${form.is_active ? 'bg-primary' : 'bg-slate-300'}`}
                  aria-pressed={form.is_active}
                >
                  <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <span className="text-sm font-headline font-bold text-slate-700">Trabajador activo</span>
              </label>
            </div>

            <div className="px-6 py-5 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 border border-slate-200 rounded-xl py-3 text-sm font-headline font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-primary text-white rounded-xl py-3 text-sm font-headline font-bold hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : editingWorker ? 'Guardar cambios' : 'Crear trabajador'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-headline font-extrabold text-slate-900 mb-2">Desactivar trabajador</h2>
            <p className="text-sm text-slate-500 mb-6">
              {deleteTarget.full_name || deleteTarget.username} no podrá iniciar sesión, pero sus ventas quedarán en el historial.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-slate-200 rounded-xl py-3 text-sm font-headline font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white rounded-xl py-3 text-sm font-headline font-bold hover:bg-red-700 transition disabled:opacity-60"
              >
                {deleting ? 'Desactivando...' : 'Desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

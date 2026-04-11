import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import './App.css'
import { createCliente, getClientes } from './services/clientes'
import { emptyClienteForm, type ClienteFormData } from './types/cliente'

function App() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<ClienteFormData>(emptyClienteForm)

  const clientesQuery = useQuery({
    queryKey: ['clientes'],
    queryFn: () => getClientes(0, 100),
  })

  const createClienteMutation = useMutation({
    mutationFn: createCliente,
    onSuccess: () => {
      setFormData(emptyClienteForm)
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createClienteMutation.mutate(formData)
  }

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Clientes</p>
          <h1>Formulario conectado a tu backend</h1>
          <p className="hero-copy">
            Usa la variable <strong>VITE_API_URL</strong> para consultar y crear
            registros del modelo <strong>Cliente</strong> en el endpoint
            <strong> /cliente</strong>.
          </p>
        </div>

        <div className="api-badge">
          <span>API</span>
          <strong>{import.meta.env.VITE_API_URL || 'No configurada'}</strong>
        </div>
      </section>

      <section className="content-grid">
        <article className="card-panel">
          <div className="section-header">
            <div>
              <p className="section-label">Nuevo cliente</p>
              <h2>Crear registro</h2>
            </div>
          </div>

          <form className="cliente-form" onSubmit={handleSubmit}>
            <label>
              <span>RUT</span>
              <input
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                placeholder="12.345.678-9"
              />
            </label>

            <label>
              <span>Nombre</span>
              <input
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Nombre del cliente"
              />
            </label>

            <label>
              <span>Dirección</span>
              <input
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Av. Principal 123"
              />
            </label>

            <label>
              <span>Ciudad</span>
              <input
                name="ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                placeholder="Santiago"
              />
            </label>

            <label>
              <span>Teléfono</span>
              <input
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
              />
            </label>

            <label>
              <span>Correo</span>
              <input
                name="correo"
                type="email"
                value={formData.correo}
                onChange={handleChange}
                placeholder="cliente@correo.cl"
              />
            </label>

            <label className="full-width">
              <span>Giro</span>
              <textarea
                name="giro"
                value={formData.giro}
                onChange={handleChange}
                placeholder="Actividad comercial"
                rows={3}
              />
            </label>

            <div className="form-actions full-width">
              <button type="submit" disabled={createClienteMutation.isPending}>
                {createClienteMutation.isPending ? 'Guardando...' : 'Guardar cliente'}
              </button>

              {createClienteMutation.isError ? (
                <p className="feedback error">No se pudo crear el cliente.</p>
              ) : null}

              {createClienteMutation.isSuccess ? (
                <p className="feedback success">Cliente creado correctamente.</p>
              ) : null}
            </div>
          </form>
        </article>

        <article className="card-panel">
          <div className="section-header section-header-inline">
            <div>
              <p className="section-label">Listado</p>
              <h2>Clientes registrados</h2>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => clientesQuery.refetch()}
              disabled={clientesQuery.isFetching}
            >
              {clientesQuery.isFetching ? 'Actualizando...' : 'Recargar'}
            </button>
          </div>

          {clientesQuery.isLoading ? <p>Cargando clientes...</p> : null}

          {clientesQuery.isError ? (
            <p className="feedback error">
              No se pudieron obtener los clientes. Revisa la URL del backend y CORS.
            </p>
          ) : null}

          {!clientesQuery.isLoading && clientesQuery.data?.length === 0 ? (
            <p className="empty-state">Todavía no hay clientes cargados.</p>
          ) : null}

          {clientesQuery.data && clientesQuery.data.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>RUT</th>
                    <th>Nombre</th>
                    <th>Ciudad</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesQuery.data.map((cliente) => (
                    <tr key={cliente.id}>
                      <td>{cliente.id}</td>
                      <td>{cliente.rut || '-'}</td>
                      <td>{cliente.nombre || '-'}</td>
                      <td>{cliente.ciudad || '-'}</td>
                      <td>{cliente.correo || '-'}</td>
                      <td>{cliente.telefono || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>
      </section>
    </main>
  )
}

export default App

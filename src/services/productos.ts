import { api } from '../lib/axios'
import type { Producto, ProductoFormData } from '../types/producto'

export async function getProductos(skip = 0, limit = 100) {
  const response = await api.get<Producto[]>('/productos', {
    params: { skip, limit },
  })
  return response.data
}

export async function getProducto(id: number) {
  const response = await api.get<Producto>(`/productos/${id}`)
  return response.data
}

export async function createProducto(data: ProductoFormData) {
  const payload = {
    nombre: data.nombre,
    precio: data.precio,
    codigo: data.codigo || null,
    cod_barra: data.cod_barra || null,
    categoria: data.categoria || null,
    costo: data.costo || null,
  }
  const response = await api.post<Producto>('/productos', payload)
  return response.data
}

export async function updateProducto(id: number, data: Partial<ProductoFormData>) {
  const payload: Record<string, string | null | undefined> = {}
  if (data.nombre !== undefined) payload.nombre = data.nombre
  if (data.precio !== undefined) payload.precio = data.precio
  if (data.codigo !== undefined) payload.codigo = data.codigo || null
  if (data.cod_barra !== undefined) payload.cod_barra = data.cod_barra || null
  if (data.categoria !== undefined) payload.categoria = data.categoria || null
  if (data.costo !== undefined) payload.costo = data.costo || null

  const response = await api.put<Producto>(`/productos/${id}`, payload)
  return response.data
}

export async function deleteProducto(id: number) {
  await api.delete(`/productos/${id}`)
}

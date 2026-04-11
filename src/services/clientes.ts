import { api } from '../lib/axios'
import type { Cliente, ClienteFormData } from '../types/cliente'

export async function getClientes(skip = 0, limit = 100) {
  const response = await api.get<Cliente[]>('/cliente', {
    params: { skip, limit },
  })

  return response.data
}

export async function createCliente(data: ClienteFormData) {
  const response = await api.post<Cliente>('/cliente', data)
  return response.data
}
import { api } from '../lib/axios'
import type { User, WorkerFormData } from '../types/user'

export async function getTrabajadores(): Promise<User[]> {
  const response = await api.get<User[]>('/users', { params: { skip: 0, limit: 1000 } })
  return response.data
}

export async function createTrabajador(data: WorkerFormData): Promise<User> {
  const response = await api.post<User>('/users', {
    email: data.email.trim(),
    username: data.username.trim(),
    full_name: data.full_name.trim() || null,
    password: data.password,
    role: data.role,
    is_active: data.is_active,
  })
  return response.data
}

export async function updateTrabajador(id: number, data: WorkerFormData): Promise<User> {
  const payload: Partial<WorkerFormData> = {
    email: data.email.trim(),
    username: data.username.trim(),
    full_name: data.full_name.trim(),
    role: data.role,
    is_active: data.is_active,
  }

  if (data.password.trim()) {
    payload.password = data.password
  }

  const response = await api.put<User>(`/users/${id}`, payload)
  return response.data
}

export async function deleteTrabajador(id: number): Promise<void> {
  await api.delete(`/users/${id}`)
}

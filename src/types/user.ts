export type UserRole = 'admin' | 'vendedor'

export interface User {
  id: number
  email: string
  username: string
  full_name: string | null
  is_active: boolean
  is_superuser: boolean
  role: UserRole
  created_at: string
  updated_at: string | null
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface WorkerFormData {
  email: string
  username: string
  full_name: string
  password: string
  role: UserRole
  is_active: boolean
}

export const emptyWorkerForm: WorkerFormData = {
  email: '',
  username: '',
  full_name: '',
  password: '',
  role: 'vendedor',
  is_active: true,
}

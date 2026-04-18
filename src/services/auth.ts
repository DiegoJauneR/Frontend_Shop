import { api } from '../lib/axios'
import type { LoginCredentials, TokenResponse, User } from '../types/user'

export async function login(credentials: LoginCredentials): Promise<TokenResponse> {
  // FastAPI OAuth2 expects form-encoded data
  const formData = new URLSearchParams()
  formData.append('username', credentials.username)
  formData.append('password', credentials.password)

  const response = await api.post<TokenResponse>('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return response.data
}

export async function getMe(): Promise<User> {
  const response = await api.get<User>('/users/me')
  return response.data
}

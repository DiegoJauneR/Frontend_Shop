import { api, setAuthToken } from '../lib/axios'
import type { LoginCredentials, TokenResponse, User } from '../types/user'

export async function login(credentials: LoginCredentials): Promise<TokenResponse> {
  // FastAPI OAuth2 expects form-encoded data
  const formData = new URLSearchParams()
  formData.append('username', credentials.username)
  formData.append('password', credentials.password)

  const response = await api.post<TokenResponse>('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  // Set token immediately on the axios instance so every subsequent request has it
  setAuthToken(response.data.access_token)

  return response.data
}

export async function getMe(): Promise<User> {
  const response = await api.get<User>('/users/me')
  return response.data
}

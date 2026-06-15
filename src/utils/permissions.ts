import type { User } from '../types/user'

export function isAdminUser(user: User | null): boolean {
  return Boolean(user && (user.role === 'admin' || user.is_superuser))
}

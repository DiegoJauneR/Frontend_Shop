import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { isAdminUser } from '../utils/permissions'

export default function AdminRoute() {
  const { user } = useAuthStore()

  if (!isAdminUser(user)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import InventarioPage from './pages/InventarioPage'
import VentasPage from './pages/VentasPage'
import PuntoVentaPage from './pages/PuntoVentaPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import TrabajadoresPage from './pages/TrabajadoresPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/venta" element={<PuntoVentaPage />} />
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/ventas" element={<VentasPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/trabajadores" element={<TrabajadoresPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

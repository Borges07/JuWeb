// Definição central das rotas da aplicação.

import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute'
import Home from '../pages/Home/Home'
import Votacao from '../pages/Votacao/Votacao'
import Login from '../pages/Login/Login'
import AdminLayout from '../pages/Admin/AdminLayout'
import AdminDashboard from '../pages/Admin/AdminDashboard'
import AdminPlayers from '../pages/Admin/AdminPlayers'
import AdminCategories from '../pages/Admin/AdminCategories'
import AdminVoting from '../pages/Admin/AdminVoting'
import AdminResults from '../pages/Admin/AdminResults'

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Home />} />
      {/* Votação e resultados são a mesma página. */}
      <Route path={ROUTES.VOTE} element={<Votacao />} />
      <Route path={ROUTES.RESULTS} element={<Navigate to={ROUTES.VOTE} replace />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />

      {/* Painel admin: shell protegido + sub-telas (hub e responsabilidades). */}
      <Route
        path={ROUTES.ADMIN}
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="jogadores" element={<AdminPlayers />} />
        <Route path="categorias" element={<AdminCategories />} />
        <Route path="votacao" element={<AdminVoting />} />
        <Route path="resultados" element={<AdminResults />} />
      </Route>

      {/* Qualquer rota desconhecida volta para a Home. */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}

export default AppRoutes

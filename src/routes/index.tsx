// Definição central das rotas da aplicação.

import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute'
import Home from '../pages/Home/Home'
import Votacao from '../pages/Votacao/Votacao'
import Login from '../pages/Login/Login'
import Admin from '../pages/Admin/Admin'

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Home />} />
      {/* Votação e resultados são a mesma página. */}
      <Route path={ROUTES.VOTE} element={<Votacao />} />
      <Route path={ROUTES.RESULTS} element={<Navigate to={ROUTES.VOTE} replace />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route
        path={ROUTES.ADMIN}
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        }
      />
      {/* Qualquer rota desconhecida volta para a Home. */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}

export default AppRoutes

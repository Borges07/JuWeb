// Definição central das rotas da aplicação.

import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute'
import Home from '../pages/Home/Home'
import Vote from '../pages/Vote/Vote'
import Results from '../pages/Results/Results'
import Login from '../pages/Login/Login'
import Admin from '../pages/Admin/Admin'

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.VOTE} element={<Vote />} />
      <Route path={ROUTES.RESULTS} element={<Results />} />
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

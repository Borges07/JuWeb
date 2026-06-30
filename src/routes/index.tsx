// Definição central das rotas da aplicação.

import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute'
import Home from '../pages/Home/Home'
import VotacaoList from '../pages/Votacao/VotacaoList'
import VotacaoDetail from '../pages/Votacao/VotacaoDetail'
import Login from '../pages/Login/Login'
import AdminLayout from '../pages/Admin/AdminLayout'
import AdminDashboard from '../pages/Admin/AdminDashboard'
import AdminPlayers from '../pages/Admin/AdminPlayers'
import AdminVotings from '../pages/Admin/AdminVotings'
import AdminVotingManage from '../pages/Admin/AdminVotingManage'
import AdminCategories from '../pages/Admin/AdminCategories'

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Home />} />
      {/* Lista de votações + tela de votar dentro de uma votação. */}
      <Route path={ROUTES.VOTE} element={<VotacaoList />} />
      <Route path={ROUTES.VOTE_DETAIL} element={<VotacaoDetail />} />
      <Route path={ROUTES.RESULTS} element={<Navigate to={ROUTES.VOTE} replace />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />

      {/* Painel admin: shell protegido + sub-telas. */}
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
        <Route path="votacoes" element={<AdminVotings />} />
        <Route path="votacoes/:votingId" element={<AdminVotingManage />} />
        <Route path="categorias" element={<AdminCategories />} />
      </Route>

      {/* Qualquer rota desconhecida volta para a Home. */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}

export default AppRoutes

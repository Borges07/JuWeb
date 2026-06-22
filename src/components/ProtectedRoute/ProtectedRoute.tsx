// Protege rotas administrativas: redireciona para /login se não houver sessão.

import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants/routes'
import Loading from '../Loading/Loading'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <Loading label="Verificando acesso..." />
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />

  return <>{children}</>
}

export default ProtectedRoute

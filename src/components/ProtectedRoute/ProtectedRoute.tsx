// Protege rotas administrativas: exige sessão E permissão de admin (allowlist).
// Sem sessão -> manda para /login. Logado mas sem permissão (ex.: conta Google
// de votante) -> mostra aviso, sem redirecionar em loop.

import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants/routes'
import Loading from '../Loading/Loading'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin, logout } = useAuth()

  if (loading) return <Loading label="Verificando acesso..." />
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />

  if (!isAdmin) {
    return (
      <section className="page">
        <h1>Acesso restrito</h1>
        <p className="alert alert--error">
          Esta conta não tem permissão de administrador.
        </p>
        <button className="btn btn--ghost" type="button" onClick={() => logout()}>
          Sair
        </button>
      </section>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute

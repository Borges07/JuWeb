// Shell do painel administrativo: barra de identificação + logout, e a área de
// conteúdo das sub-telas via <Outlet>. Também exporta o cabeçalho reutilizável
// usado por cada sub-tela (voltar ao painel + título da seção).

import { Link, Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants/routes'
import Icon, { type IconName } from '../../components/Icon/Icon'
import './admin.css'

export function AdminLayout() {
  const { user, logout } = useAuth()

  return (
    <section className="admin">
      <header className="admin-bar">
        <div className="admin-bar__id">
          <span className="admin-bar__badge">
            <Icon name="shield" />
          </span>
          <div>
            <strong>Painel administrativo</strong>
            <span>ADEC Futsal</span>
          </div>
        </div>

        <div className="admin-bar__user">
          {user?.email && <span className="admin-bar__email">{user.email}</span>}
          <button
            className="btn btn--ghost btn--sm"
            type="button"
            onClick={() => logout()}
          >
            <Icon name="log-out" /> Sair
          </button>
        </div>
      </header>

      <Outlet />
    </section>
  )
}

interface AdminPageHeaderProps {
  icon: IconName
  title: string
  subtitle?: string
  /** Ações exibidas à direita do cabeçalho (ex.: botão Atualizar). */
  children?: ReactNode
}

/** Cabeçalho padrão das sub-telas: link de volta + ícone, título e subtítulo. */
export function AdminPageHeader({
  icon,
  title,
  subtitle,
  children,
}: AdminPageHeaderProps) {
  return (
    <div className="admin-page__head">
      <Link className="admin-back" to={ROUTES.ADMIN}>
        <Icon name="arrow-left" /> Painel
      </Link>
      <div className="section-head">
        <span className="section-head__icon">
          <Icon name={icon} />
        </span>
        <div className="section-head__text">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children && <div className="section-head__actions">{children}</div>}
      </div>
    </div>
  )
}

export default AdminLayout

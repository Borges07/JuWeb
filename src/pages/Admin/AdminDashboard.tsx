// Hub do painel: visão geral com métricas ao vivo + cards que levam a cada
// sub-tela (cadastro de jogadores, categorias, controle da votação e dash de
// votos). Cada card é responsável por uma área do sistema.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllPlayers } from '../../services/playerService'
import { getCategories } from '../../services/categoryService'
import { getSettings } from '../../services/settingsService'
import { getResults } from '../../services/voteService'
import { ROUTES } from '../../constants/routes'
import Icon, { type IconName } from '../../components/Icon/Icon'
import Loading from '../../components/Loading/Loading'

interface Overview {
  total: number
  active: number
  categories: number
  votes: number
  votingOpen: boolean
}

interface HubItem {
  to: string
  icon: IconName
  title: string
  description: string
  meta: () => string
}

export function AdminDashboard() {
  const [data, setData] = useState<Overview | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      const [players, categories, settings] = await Promise.all([
        getAllPlayers(),
        getCategories(),
        getSettings(),
      ])
      const results = await getResults(players)
      if (!active) return
      setData({
        total: players.length,
        active: players.filter((p) => p.active).length,
        categories: categories.length,
        votes: results.reduce((sum, r) => sum + r.votes, 0),
        votingOpen: settings.votingOpen,
      })
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const cards: HubItem[] = [
    {
      to: ROUTES.ADMIN_PLAYERS,
      icon: 'users',
      title: 'Jogadores',
      description: 'Cadastre, edite, ative ou remova os atletas da votação.',
      meta: () => `${data?.total ?? 0} cadastrados`,
    },
    {
      to: ROUTES.ADMIN_CATEGORIES,
      icon: 'layers',
      title: 'Categorias',
      description: 'Organize os atletas por categoria reutilizável.',
      meta: () => `${data?.categories ?? 0} categorias`,
    },
    {
      to: ROUTES.ADMIN_VOTING,
      icon: 'sliders',
      title: 'Votação',
      description: 'Abra ou encerre, defina campeonato e partida.',
      meta: () => (data?.votingOpen ? 'Aberta agora' : 'Encerrada'),
    },
    {
      to: ROUTES.ADMIN_RESULTS,
      icon: 'bar-chart',
      title: 'Resultados',
      description: 'Acompanhe a apuração dos votos em tempo real.',
      meta: () => `${data?.votes ?? 0} votos`,
    },
  ]

  return (
    <div className="hub">
      <div className="section-head">
        <span className="section-head__icon">
          <Icon name="trophy" />
        </span>
        <div className="section-head__text">
          <h1>Visão geral</h1>
          <p>Gerencie tudo da votação em um só lugar.</p>
        </div>
        <div className="section-head__actions">
          {data &&
            (data.votingOpen ? (
              <span className="badge badge--success">
                <span className="badge__dot" /> Votação aberta
              </span>
            ) : (
              <span className="badge badge--neutral">Votação encerrada</span>
            ))}
        </div>
      </div>

      {!data ? (
        <Loading label="Carregando painel..." />
      ) : (
        <div className="stat-strip">
          <div className="stat">
            <span className="stat__label">
              <Icon name="check-circle" /> Atletas ativos
            </span>
            <span className="stat__value">{data.active}</span>
          </div>
          <div className="stat">
            <span className="stat__label">
              <Icon name="users" /> Total de atletas
            </span>
            <span className="stat__value">{data.total}</span>
          </div>
          <div className="stat">
            <span className="stat__label">
              <Icon name="layers" /> Categorias
            </span>
            <span className="stat__value">{data.categories}</span>
          </div>
          <div className="stat">
            <span className="stat__label">
              <Icon name="bar-chart" /> Votos totais
            </span>
            <span className="stat__value">{data.votes}</span>
          </div>
        </div>
      )}

      <nav className="hub-grid" aria-label="Áreas do painel">
        {cards.map((card) => (
          <Link key={card.to} className="hub-card" to={card.to}>
            <span className="hub-card__icon">
              <Icon name={card.icon} />
            </span>
            <div className="hub-card__body">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <span className="hub-card__meta">
                <span className="badge badge--accent">{card.meta()}</span>
              </span>
            </div>
            <span className="hub-card__arrow" aria-hidden="true">
              <Icon name="arrow-right" />
            </span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default AdminDashboard

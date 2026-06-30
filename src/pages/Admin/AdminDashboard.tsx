// Hub do painel: visão geral com métricas + cards que levam às áreas
// (jogadores, categorias e votações). Os resultados ficam dentro de cada votação.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getVotings } from '../../services/votingService'
import { getAllPlayers } from '../../services/playerService'
import { getCategories } from '../../services/categoryService'
import { ROUTES } from '../../constants/routes'
import Icon, { type IconName } from '../../components/Icon/Icon'
import Loading from '../../components/Loading/Loading'

interface Overview {
  votings: number
  open: number
  players: number
  categories: number
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
      const [votings, players, categories] = await Promise.all([
        getVotings(),
        getAllPlayers(),
        getCategories(),
      ])
      if (!active) return
      setData({
        votings: votings.length,
        open: votings.filter((v) => v.status === 'aberta').length,
        players: players.length,
        categories: categories.length,
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
      description: 'Cadastre, edite e ative os atletas, vinculando cada um a uma votação.',
      meta: () => `${data?.players ?? 0} cadastrados`,
    },
    {
      to: ROUTES.ADMIN_CATEGORIES,
      icon: 'layers',
      title: 'Categorias',
      description: 'Categorias reutilizáveis no cadastro de atletas (ex.: Sub-10).',
      meta: () => `${data?.categories ?? 0} categorias`,
    },
    {
      to: ROUTES.ADMIN_VOTINGS,
      icon: 'trophy',
      title: 'Votações',
      description: 'Crie votações e controle abertura, pausa, encerramento e resultados.',
      meta: () => `${data?.votings ?? 0} no total`,
    },
  ]

  return (
    <div className="hub">
      <div className="section-head">
        <span className="section-head__icon">
          <Icon name="shield" />
        </span>
        <div className="section-head__text">
          <h1>Visão geral</h1>
          <p>Gerencie atletas, categorias e votações em um só lugar.</p>
        </div>
        <div className="section-head__actions">
          {data &&
            (data.open > 0 ? (
              <span className="badge badge--success">
                <span className="badge__dot" /> {data.open} aberta{data.open === 1 ? '' : 's'}
              </span>
            ) : (
              <span className="badge badge--neutral">Nenhuma aberta</span>
            ))}
        </div>
      </div>

      {!data ? (
        <Loading label="Carregando painel..." />
      ) : (
        <div className="stat-strip">
          <div className="stat">
            <span className="stat__label">
              <Icon name="trophy" /> Votações
            </span>
            <span className="stat__value">{data.votings}</span>
          </div>
          <div className="stat">
            <span className="stat__label">
              <Icon name="check-circle" /> Abertas agora
            </span>
            <span className="stat__value">{data.open}</span>
          </div>
          <div className="stat">
            <span className="stat__label">
              <Icon name="users" /> Atletas
            </span>
            <span className="stat__value">{data.players}</span>
          </div>
          <div className="stat">
            <span className="stat__label">
              <Icon name="layers" /> Categorias
            </span>
            <span className="stat__value">{data.categories}</span>
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

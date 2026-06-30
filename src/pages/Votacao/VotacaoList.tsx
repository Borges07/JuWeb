// Página pública: lista as votações disponíveis (abertas e pausadas) como
// cards. O usuário escolhe uma para entrar e votar.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPublicVotings } from '../../services/votingService'
import { PATHS } from '../../constants/routes'
import Loading from '../../components/Loading/Loading'
import Icon from '../../components/Icon/Icon'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import type { Voting } from '../../types'

export function VotacaoList() {
  const [votings, setVotings] = useState<Voting[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const data = await getPublicVotings()
        if (active) setVotings(data)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Erro ao carregar as votações.')
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  if (error) return <p className="alert alert--error">{error}</p>
  if (votings === null) return <Loading label="Carregando votações..." />

  return (
    <section className="page">
      <h1>Votações</h1>
      <p className="page__subtitle">Escolha uma votação para participar.</p>

      {votings.length === 0 ? (
        <div className="empty-state">
          <Icon name="trophy" />
          <strong>Nenhuma votação no momento</strong>
          <p>Quando uma votação for aberta, ela aparece aqui.</p>
        </div>
      ) : (
        <div className="voting-cards">
          {votings.map((voting) => {
            const open = voting.status === 'aberta'
            return (
              <Link
                key={voting.id}
                className="voting-card"
                to={PATHS.voteDetail(voting.id)}
              >
                <div className="voting-card__top">
                  <span className="voting-card__icon">
                    <Icon name="trophy" />
                  </span>
                  <StatusBadge status={voting.status} />
                </div>
                <h2 className="voting-card__title">{voting.title}</h2>
                {voting.description && (
                  <p className="voting-card__desc">{voting.description}</p>
                )}
                <span className="voting-card__cta">
                  {open ? 'Votar' : 'Ver votação'} <Icon name="arrow-right" />
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default VotacaoList

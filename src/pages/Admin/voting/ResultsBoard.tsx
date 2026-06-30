// Dash de votos de UMA votação (apuração com barras + percentual + líder).
// Componente reutilizável usado dentro da tela de gerenciar votação.

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPlayersByVoting } from '../../../services/playerService'
import { getResults } from '../../../services/voteService'
import { ROUTES } from '../../../constants/routes'
import Loading from '../../../components/Loading/Loading'
import Icon from '../../../components/Icon/Icon'
import type { PlayerResult } from '../../../types'

export function ResultsBoard({ votingId }: { votingId: string }) {
  const [board, setBoard] = useState<PlayerResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const reloadBoard = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const all = await getPlayersByVoting(votingId)
      setBoard(await getResults(votingId, all))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os resultados.')
    } finally {
      setRefreshing(false)
    }
  }, [votingId])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const all = await getPlayersByVoting(votingId)
        const results = await getResults(votingId, all)
        if (active) setBoard(results)
      } catch (err) {
        if (active)
          setError(err instanceof Error ? err.message : 'Não foi possível carregar os resultados.')
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [votingId])

  const total = board?.reduce((sum, r) => sum + r.votes, 0) ?? 0
  const max = board?.reduce((m, r) => Math.max(m, r.votes), 0) ?? 0

  return (
    <div className="panel" aria-live="polite" aria-busy={refreshing}>
      <div className="section-head">
        <span className="section-head__icon">
          <Icon name="bar-chart" />
        </span>
        <div className="section-head__text">
          <h2>Resultados</h2>
          <p>Apuração em tempo real — visível apenas para o admin.</p>
        </div>
        <div className="section-head__actions">
          <button
            className="btn btn--ghost btn--sm"
            type="button"
            onClick={() => void reloadBoard()}
            disabled={refreshing}
            aria-busy={refreshing}
          >
            <Icon name="refresh" /> Atualizar
          </button>
        </div>
      </div>

      {error ? (
        <div className="empty-state">
          <Icon name="alert" />
          <strong>Erro ao carregar os resultados</strong>
          <p>{error}</p>
          <button className="btn btn--ghost btn--sm" type="button" onClick={() => void reloadBoard()}>
            <Icon name="refresh" /> Tentar de novo
          </button>
        </div>
      ) : board === null ? (
        <Loading label="Carregando resultados..." />
      ) : board.length === 0 ? (
        <div className="empty-state">
          <Icon name="bar-chart" />
          <strong>Sem atletas para apurar</strong>
          <p>
            Cadastre atletas na tela de <Link to={ROUTES.ADMIN_PLAYERS}>Jogadores</Link> e
            vincule-os a esta votação para ver os votos aqui.
          </p>
        </div>
      ) : (
        <>
          <div className="results-total">
            <strong>{total}</strong>
            <span>voto{total === 1 ? '' : 's'} no total</span>
          </div>

          <div className="results-board">
            {board.map((r, index) => {
              const pct = total > 0 ? Math.round((r.votes / total) * 100) : 0
              const width = max > 0 ? (r.votes / max) * 100 : 0
              const isLead = index === 0 && r.votes > 0
              return (
                <div
                  className={'result-row' + (isLead ? ' result-row--lead' : '')}
                  key={r.player.id}
                >
                  <span className="result-row__pos">{index + 1}</span>
                  <div className="result-row__main">
                    <div className="result-row__name">
                      <strong>{r.player.name}</strong>
                      {r.player.category && <span>{r.player.category}</span>}
                    </div>
                    <div className="result-row__track">
                      <div className="result-row__bar" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                  <div className="result-row__value">
                    <strong>{r.votes}</strong>
                    <span>{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default ResultsBoard

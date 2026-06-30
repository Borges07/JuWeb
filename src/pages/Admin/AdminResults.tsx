// Sub-tela: dash de votos (apenas admin). Mostra a apuração com barras de
// proporção, percentual e destaque para o líder.

import { useCallback, useEffect, useState } from 'react'
import { getAllPlayers } from '../../services/playerService'
import { getResults } from '../../services/voteService'
import Loading from '../../components/Loading/Loading'
import Icon from '../../components/Icon/Icon'
import { AdminPageHeader } from './AdminLayout'
import type { PlayerResult } from '../../types'

export function AdminResults() {
  const [board, setBoard] = useState<PlayerResult[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Recarga manual (botão Atualizar): sinaliza refreshing durante a busca.
  const reloadBoard = useCallback(async () => {
    setRefreshing(true)
    try {
      const all = await getAllPlayers()
      setBoard(await getResults(all))
    } finally {
      setRefreshing(false)
    }
  }, [])

  // Carga inicial: await antes do setState + guarda de montagem (sem refreshing,
  // pois board === null já mostra o estado de carregamento).
  useEffect(() => {
    let active = true
    async function load() {
      const all = await getAllPlayers()
      const results = await getResults(all)
      if (active) setBoard(results)
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const total = board?.reduce((sum, r) => sum + r.votes, 0) ?? 0
  // Maior número de votos: base para o comprimento relativo das barras.
  const max = board?.reduce((m, r) => Math.max(m, r.votes), 0) ?? 0

  return (
    <div className="admin-page">
      <AdminPageHeader
        icon="bar-chart"
        title="Resultados"
        subtitle="Apuração dos votos em tempo real — visível apenas para o admin."
      >
        <button
          className="btn btn--ghost btn--sm"
          type="button"
          onClick={() => void reloadBoard()}
          disabled={refreshing}
          aria-busy={refreshing}
        >
          <Icon name="refresh" /> Atualizar
        </button>
      </AdminPageHeader>

      <div className="panel" aria-live="polite" aria-busy={refreshing}>
        {board === null ? (
          <Loading label="Carregando resultados..." />
        ) : board.length === 0 ? (
          <div className="empty-state">
            <Icon name="bar-chart" />
            <strong>Sem jogadores para apurar</strong>
            <p>Cadastre atletas na tela de Jogadores para ver os votos aqui.</p>
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
                        <div
                          className="result-row__bar"
                          style={{ width: `${width}%` }}
                        />
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
    </div>
  )
}

export default AdminResults

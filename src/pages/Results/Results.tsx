// Página de resultados: ranking de jogadores por número de votos,
// com filtros (nome / categoria) e detalhes do atleta em modal.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAllPlayers } from '../../services/playerService'
import { getResults } from '../../services/voteService'
import RankingCard from '../../components/RankingCard/RankingCard'
import PlayerModal from '../../components/PlayerModal/PlayerModal'
import Loading from '../../components/Loading/Loading'
import type { PlayerResult } from '../../types'

interface RankedResult {
  result: PlayerResult
  /** Posição no ranking geral (independe do filtro). */
  position: number
}

export function Results() {
  const [results, setResults] = useState<PlayerResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selected, setSelected] = useState<RankedResult | null>(null)
  const closeModal = useCallback(() => setSelected(null), [])

  useEffect(() => {
    async function load() {
      try {
        const players = await getAllPlayers()
        setResults(await getResults(players))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar resultados.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const totalVotes = results.reduce((sum, r) => sum + r.votes, 0)

  // Posição é definida pelo ranking geral; só depois aplicamos o filtro.
  const ranked = useMemo<RankedResult[]>(
    () => results.map((result, index) => ({ result, position: index + 1 })),
    [results],
  )

  const categories = useMemo(() => {
    const set = new Set<string>()
    results.forEach((r) => {
      if (r.player.category) set.add(r.player.category)
    })
    return Array.from(set).sort()
  }, [results])

  const filtered = ranked.filter(({ result }) => {
    const term = search.trim().toLowerCase()
    const matchName = !term || result.player.name.toLowerCase().includes(term)
    const matchCategory = !categoryFilter || result.player.category === categoryFilter
    return matchName && matchCategory
  })

  if (loading) return <Loading label="Apurando votos..." />
  if (error) return <p className="alert alert--error">{error}</p>

  return (
    <section className="page page--results">
      <h1>Resultados</h1>
      <p className="page__subtitle">Total de votos: {totalVotes}</p>

      {results.length === 0 ? (
        <p>Ainda não há jogadores cadastrados.</p>
      ) : (
        <>
          <div className="results__filters">
            <input
              className="results__search"
              type="search"
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar atleta por nome"
            />
            <select
              className="results__select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filtrar por categoria"
            >
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="ranking">
            {filtered.map(({ result, position }) => (
              <RankingCard
                key={result.player.id}
                position={position}
                result={result}
                totalVotes={totalVotes}
                onClick={() => setSelected({ result, position })}
              />
            ))}
          </div>

          {filtered.length === 0 && <p>Nenhum atleta encontrado com esse filtro.</p>}
        </>
      )}

      {selected && (
        <PlayerModal
          result={selected.result}
          position={selected.position}
          totalVotes={totalVotes}
          onClose={closeModal}
        />
      )}
    </section>
  )
}

export default Results

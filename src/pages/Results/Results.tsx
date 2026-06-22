// Página de resultados: ranking de jogadores por número de votos.

import { useEffect, useState } from 'react'
import { getAllPlayers } from '../../services/playerService'
import { getResults } from '../../services/voteService'
import RankingCard from '../../components/RankingCard/RankingCard'
import Loading from '../../components/Loading/Loading'
import type { PlayerResult } from '../../types'

export function Results() {
  const [results, setResults] = useState<PlayerResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (loading) return <Loading label="Apurando votos..." />
  if (error) return <p className="alert alert--error">{error}</p>

  const totalVotes = results.reduce((sum, r) => sum + r.votes, 0)

  return (
    <section className="page page--results">
      <h1>Resultados</h1>
      <p className="page__subtitle">Total de votos: {totalVotes}</p>

      <div className="ranking">
        {results.map((result, index) => (
          <RankingCard
            key={result.player.id}
            position={index + 1}
            result={result}
            totalVotes={totalVotes}
          />
        ))}
      </div>

      {results.length === 0 && <p>Ainda não há jogadores cadastrados.</p>}
    </section>
  )
}

export default Results

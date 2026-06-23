// Página unificada de Votação + Resultados.
// Mostra os atletas ativos em ranking (só a %). Ao clicar num atleta abre o
// modal: se a votação está aberta e o dispositivo ainda não votou, aparece o
// botão de votar; caso contrário, mostra apenas os dados.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getActivePlayers } from '../../services/playerService'
import { getResults } from '../../services/voteService'
import { getSettings } from '../../services/settingsService'
import { useVote } from '../../hooks/useVote'
import RankingCard from '../../components/RankingCard/RankingCard'
import PlayerModal from '../../components/PlayerModal/PlayerModal'
import Loading from '../../components/Loading/Loading'
import type { PlayerResult, Settings } from '../../types'

interface RankedResult {
  result: PlayerResult
  /** Posição no ranking geral (independe do filtro). */
  position: number
}

export function Votacao() {
  const [results, setResults] = useState<PlayerResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selected, setSelected] = useState<RankedResult | null>(null)
  const closeModal = useCallback(() => setSelected(null), [])

  const { voting, alreadyVoted, error: voteError, vote } = useVote()

  // Recarrega o ranking (apenas atletas ATIVOS — inativos somem da votação e
  // dos resultados). Retorna a lista nova para atualizar o modal aberto.
  const loadResults = useCallback(async (): Promise<PlayerResult[]> => {
    const players = await getActivePlayers()
    const fresh = await getResults(players)
    setResults(fresh)
    return fresh
  }, [])

  useEffect(() => {
    async function load() {
      try {
        await loadResults()
        setSettings(await getSettings())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar a votação.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [loadResults])

  const totalVotes = results.reduce((sum, r) => sum + r.votes, 0)

  const ranked = useMemo<RankedResult[]>(
    () => results.map((result, index) => ({ result, position: index + 1 })),
    [results],
  )

  // Dedup robusto: normaliza (trim + minúsculas) para nunca repetir a mesma
  // categoria/escola no filtro, mesmo com vários alunos iguais.
  const categories = useMemo(() => {
    const map = new Map<string, string>()
    results.forEach((r) => {
      const c = r.player.category?.trim()
      if (c) {
        const key = c.toLowerCase()
        if (!map.has(key)) map.set(key, c)
      }
    })
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b))
  }, [results])

  // Se a categoria selecionada deixou de existir (aluno removido/desativado),
  // ignora o filtro em vez de prender a tela num estado órfão.
  const activeCategory = categories.some(
    (c) => c.toLowerCase() === categoryFilter.toLowerCase(),
  )
    ? categoryFilter
    : ''

  const filtered = ranked.filter(({ result }) => {
    const term = search.trim().toLowerCase()
    const matchName = !term || result.player.name.toLowerCase().includes(term)
    const matchCategory =
      !activeCategory ||
      result.player.category?.trim().toLowerCase() === activeCategory.toLowerCase()
    return matchName && matchCategory
  })

  const votingOpen = settings?.votingOpen ?? false
  const canVote = votingOpen && !alreadyVoted

  async function handleVote(playerId: string) {
    const ok = await vote(playerId)
    if (ok) {
      // Atualiza percentuais e o próprio modal com os dados novos do atleta.
      const fresh = await loadResults()
      const idx = fresh.findIndex((r) => r.player.id === playerId)
      if (idx >= 0) setSelected({ result: fresh[idx], position: idx + 1 })
    }
  }

  if (loading) return <Loading label="Carregando..." />
  if (error) return <p className="alert alert--error">{error}</p>

  return (
    <section className="page page--votacao">
      <h1>Votação</h1>
      {(settings?.championship || settings?.match) && (
        <p className="page__subtitle">
          {[settings?.championship, settings?.match].filter(Boolean).join(' · ')}
        </p>
      )}

      {!votingOpen && (
        <p className="alert alert--info">A votação está encerrada — veja o ranking abaixo.</p>
      )}
      {votingOpen && alreadyVoted && (
        <p className="alert alert--info">Você já votou. Obrigado! 🎉</p>
      )}
      {canVote && (
        <p className="page__subtitle">Clique em um atleta para ver os detalhes e votar.</p>
      )}
      {voteError && <p className="alert alert--error">{voteError}</p>}

      {results.length === 0 ? (
        <p>Nenhum atleta disponível no momento.</p>
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
              value={activeCategory}
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
          canVote={canVote}
          voting={voting}
          alreadyVoted={alreadyVoted}
          onVote={() => handleVote(selected.result.player.id)}
          onClose={closeModal}
        />
      )}
    </section>
  )
}

export default Votacao

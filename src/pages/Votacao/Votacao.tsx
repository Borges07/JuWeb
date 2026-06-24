// Página pública de Votação.
// Lista os atletas ativos em ordem neutra (por camisa), SEM revelar votos,
// percentual ou posição — o andamento da votação fica só para o admin. Ao
// clicar num atleta abre o modal: se a votação está aberta e o dispositivo
// ainda não votou, aparece o botão de votar; senão, mostra apenas os dados.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getActivePlayers } from '../../services/playerService'
import { getResults } from '../../services/voteService'
import { getSettings } from '../../services/settingsService'
import { useVote } from '../../hooks/useVote'
import RankingCard from '../../components/RankingCard/RankingCard'
import PlayerModal from '../../components/PlayerModal/PlayerModal'
import Loading from '../../components/Loading/Loading'
import type { PlayerResult, Settings } from '../../types'

export function Votacao() {
  const [results, setResults] = useState<PlayerResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selected, setSelected] = useState<PlayerResult | null>(null)
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

  // Ordem neutra (por número da camisa) para não denunciar o placar pela
  // posição na lista. A apuração por votos fica restrita ao painel admin.
  const ordered = useMemo(
    () => [...results].sort((a, b) => a.player.number - b.player.number),
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

  const filtered = ordered.filter((result) => {
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
      // Recarrega os dados e atualiza o modal com o atleta atualizado.
      const fresh = await loadResults()
      const updated = fresh.find((r) => r.player.id === playerId)
      if (updated) setSelected(updated)
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
            {filtered.map((result) => (
              <RankingCard
                key={result.player.id}
                result={result}
                onClick={() => setSelected(result)}
              />
            ))}
          </div>

          {filtered.length === 0 && <p>Nenhum atleta encontrado com esse filtro.</p>}
        </>
      )}

      {selected && (
        <PlayerModal
          result={selected}
          canVote={canVote}
          voting={voting}
          alreadyVoted={alreadyVoted}
          onVote={() => handleVote(selected.player.id)}
          onClose={closeModal}
        />
      )}
    </section>
  )
}

export default Votacao

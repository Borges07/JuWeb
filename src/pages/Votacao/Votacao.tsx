// Página pública de Votação.
// Lista os atletas ativos em ordem neutra (por camisa), SEM revelar votos,
// percentual ou posição — o andamento da votação fica só para o admin.
// Para votar é preciso entrar com o Google (1 voto por conta). Ao clicar num
// atleta abre o modal com os dados e a ação de votar/entrar.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getActivePlayers } from '../../services/playerService'
import { getSettings } from '../../services/settingsService'
import { useVote } from '../../hooks/useVote'
import { useAuth } from '../../hooks/useAuth'
import RankingCard from '../../components/RankingCard/RankingCard'
import PlayerModal from '../../components/PlayerModal/PlayerModal'
import Loading from '../../components/Loading/Loading'
import type { Player, Settings } from '../../types'

export function Votacao() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selected, setSelected] = useState<Player | null>(null)
  const closeModal = useCallback(() => setSelected(null), [])

  const { user, loginWithGoogle, logout } = useAuth()
  const { voting, alreadyVoted, error: voteError, vote } = useVote()
  const [loggingIn, setLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setPlayers(await getActivePlayers())
        setSettings(await getSettings())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar a votação.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  // Ordem neutra (por número da camisa) para não denunciar o placar pela
  // posição na lista. A apuração por votos fica restrita ao painel admin.
  const ordered = useMemo(
    () => [...players].sort((a, b) => a.number - b.number),
    [players],
  )

  // Dedup robusto: normaliza (trim + minúsculas) para nunca repetir a mesma
  // categoria no filtro, mesmo com vários atletas iguais.
  const categories = useMemo(() => {
    const map = new Map<string, string>()
    players.forEach((p) => {
      const c = p.category?.trim()
      if (c) {
        const key = c.toLowerCase()
        if (!map.has(key)) map.set(key, c)
      }
    })
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b))
  }, [players])

  // Se a categoria selecionada deixou de existir, ignora o filtro.
  const activeCategory = categories.some(
    (c) => c.toLowerCase() === categoryFilter.toLowerCase(),
  )
    ? categoryFilter
    : ''

  const filtered = ordered.filter((p) => {
    const term = search.trim().toLowerCase()
    const matchName = !term || p.name.toLowerCase().includes(term)
    const matchCategory =
      !activeCategory || p.category?.trim().toLowerCase() === activeCategory.toLowerCase()
    return matchName && matchCategory
  })

  const votingOpen = settings?.votingOpen ?? false
  const isLoggedIn = !!user
  const canVote = votingOpen && isLoggedIn && !alreadyVoted

  async function handleLogin() {
    setLoginError(null)
    setLoggingIn(true)
    try {
      await loginWithGoogle()
    } catch {
      setLoginError('Não foi possível entrar com o Google. Tente novamente.')
    } finally {
      setLoggingIn(false)
    }
  }

  async function handleVote(playerId: string) {
    // Não recarrega nada: a lista pública não mostra contagem de votos.
    await vote(playerId)
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
        <p className="alert alert--info">A votação está encerrada.</p>
      )}

      {votingOpen && !isLoggedIn && (
        <div className="vote-login">
          <p className="page__subtitle">
            Entre com sua conta Google para votar — 1 voto por pessoa.
          </p>
          <button
            className="btn btn--primary"
            type="button"
            onClick={handleLogin}
            disabled={loggingIn}
          >
            {loggingIn ? 'Entrando...' : 'Entrar com Google para votar'}
          </button>
        </div>
      )}

      {votingOpen && isLoggedIn && (
        <p className="vote-account">
          Conectado como {user.displayName || user.email}
          {' · '}
          <button className="vote-account__link" type="button" onClick={() => logout()}>
            Sair
          </button>
        </p>
      )}

      {votingOpen && isLoggedIn && alreadyVoted && (
        <p className="alert alert--info">Você já votou. Obrigado! 🎉</p>
      )}
      {canVote && (
        <p className="page__subtitle">Clique em um atleta para ver os detalhes e votar.</p>
      )}
      {loginError && <p className="alert alert--error">{loginError}</p>}
      {voteError && <p className="alert alert--error">{voteError}</p>}

      {players.length === 0 ? (
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
            {filtered.map((p) => (
              <RankingCard key={p.id} player={p} onClick={() => setSelected(p)} />
            ))}
          </div>

          {filtered.length === 0 && <p>Nenhum atleta encontrado com esse filtro.</p>}
        </>
      )}

      {selected && (
        <PlayerModal
          player={selected}
          votingOpen={votingOpen}
          isLoggedIn={isLoggedIn}
          canVote={canVote}
          voting={voting}
          alreadyVoted={alreadyVoted}
          loggingIn={loggingIn}
          onLogin={handleLogin}
          onVote={() => handleVote(selected.id)}
          onClose={closeModal}
        />
      )}
    </section>
  )
}

export default Votacao

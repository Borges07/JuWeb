// Página pública de uma votação específica.
// Lista os atletas ativos em ordem neutra (por camisa), SEM revelar votos —
// o andamento fica só para o admin. Para votar é preciso entrar com o Google
// (1 voto por conta por votação). Trata os estados pausada/encerrada.
//
// O componente exportado é um wrapper que remonta a tela a cada troca de
// votação (key={votingId}), zerando todo o estado local e os hooks — evita
// mostrar atletas/voto/erro de uma votação anterior ao navegar entre votações.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getActivePlayersByVoting } from '../../services/playerService'
import { getVoting } from '../../services/votingService'
import { useVote } from '../../hooks/useVote'
import { useAuth } from '../../hooks/useAuth'
import RankingCard from '../../components/RankingCard/RankingCard'
import PlayerModal from '../../components/PlayerModal/PlayerModal'
import Loading from '../../components/Loading/Loading'
import Icon from '../../components/Icon/Icon'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import { ROUTES } from '../../constants/routes'
import type { Player, Voting } from '../../types'

function VotacaoDetailView({ votingId }: { votingId: string }) {
  const [voting, setVoting] = useState<Voting | null | undefined>(undefined)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selected, setSelected] = useState<Player | null>(null)
  const closeModal = useCallback(() => setSelected(null), [])

  const { user, loginWithGoogle, logout } = useAuth()
  const { voting: registering, alreadyVoted, error: voteError, vote } = useVote(votingId)
  const [loggingIn, setLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const v = await getVoting(votingId)
        if (!active) return
        setVoting(v ?? null)
        if (v) setPlayers(await getActivePlayersByVoting(votingId))
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Erro ao carregar a votação.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [votingId])

  const ordered = useMemo(
    () => [...players].sort((a, b) => a.number - b.number),
    [players],
  )

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

  const votingOpen = voting?.status === 'aberta'
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
    await vote(playerId)
  }

  const backLink = (
    <Link className="back-link" to={ROUTES.VOTE}>
      <Icon name="arrow-left" /> Votações
    </Link>
  )

  if (loading) return <Loading label="Carregando..." />
  if (error)
    return (
      <section className="page">
        {backLink}
        <p className="alert alert--error" role="alert">{error}</p>
      </section>
    )

  if (!voting) {
    return (
      <section className="page">
        {backLink}
        <div className="empty-state">
          <Icon name="alert" />
          <strong>Votação não encontrada</strong>
          <p>Ela pode ter sido encerrada ou removida.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page page--votacao">
      {backLink}
      <div className="page__title-row">
        <h1>{voting.title}</h1>
        <StatusBadge status={voting.status} />
      </div>
      {voting.description && <p className="page__subtitle">{voting.description}</p>}

      {voting.status === 'pausada' && (
        <p className="alert alert--info" role="status">
          Esta votação está pausada. Em breve ela volta — fique de olho. ⏸️
        </p>
      )}
      {voting.status === 'encerrada' && (
        <p className="alert alert--info" role="status">
          Esta votação foi encerrada. Obrigado por participar! 🎉
        </p>
      )}
      {voting.status === 'rascunho' && (
        <p className="alert alert--info" role="status">
          Esta votação ainda não foi aberta.
        </p>
      )}

      {votingOpen && !isLoggedIn && (
        <div className="vote-login">
          <p className="page__subtitle">Entre com sua conta Google para votar.</p>
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
        <p className="alert alert--info" role="status">
          Você já votou nesta votação. Obrigado! 🎉
        </p>
      )}
      {canVote && (
        <p className="page__subtitle">Clique em um atleta para ver os detalhes e votar.</p>
      )}
      {loginError && <p className="alert alert--error" role="alert">{loginError}</p>}
      {voteError && <p className="alert alert--error" role="alert">{voteError}</p>}

      {players.length === 0 ? (
        <div className="empty-state">
          <Icon name="users" />
          <strong>Nenhum atleta nesta votação</strong>
          <p>Os atletas ainda não foram cadastrados. Volte mais tarde.</p>
        </div>
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

          {filtered.length === 0 && (
            <div className="empty-state">
              <Icon name="search" />
              <strong>Nenhum atleta encontrado</strong>
              <p>Tente outro nome ou categoria.</p>
            </div>
          )}
        </>
      )}

      {selected && (
        <PlayerModal
          player={selected}
          votingOpen={votingOpen}
          isLoggedIn={isLoggedIn}
          canVote={canVote}
          voting={registering}
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

// Remonta a cada troca de votação (key) para zerar estado local e hooks.
export function VotacaoDetail() {
  const { votingId = '' } = useParams()
  return <VotacaoDetailView key={votingId} votingId={votingId} />
}

export default VotacaoDetail

// Página de votação: lista jogadores ativos e registra o voto.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayers } from '../../hooks/usePlayers'
import { useVote } from '../../hooks/useVote'
import { getSettings } from '../../services/settingsService'
import PlayerCard from '../../components/PlayerCard/PlayerCard'
import VoteButton from '../../components/VoteButton/VoteButton'
import Loading from '../../components/Loading/Loading'
import { ROUTES } from '../../constants/routes'
import type { Player, Settings } from '../../types'

export function Vote() {
  const { players, loading, error } = usePlayers(true)
  const { voting, alreadyVoted, error: voteError, vote } = useVote()
  const [selected, setSelected] = useState<Player | null>(null)
  const [success, setSuccess] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setSettings(null))
  }, [])

  async function handleVote() {
    if (!selected) return
    const ok = await vote(selected.id)
    if (ok) setSuccess(true)
  }

  if (loading) return <Loading label="Carregando jogadores..." />

  if (settings && !settings.votingOpen) {
    return (
      <section className="page">
        <h1>Votação encerrada</h1>
        <p className="page__subtitle">No momento não há votação aberta.</p>
        <Link className="btn btn--ghost" to={ROUTES.RESULTS}>
          Ver resultados
        </Link>
      </section>
    )
  }

  if (success || alreadyVoted) {
    return (
      <section className="page">
        <h1>{success ? 'Voto registrado! 🎉' : 'Você já votou'}</h1>
        <p className="page__subtitle">Obrigado por participar.</p>
        <Link className="btn btn--primary" to={ROUTES.RESULTS}>
          Ver resultados
        </Link>
      </section>
    )
  }

  return (
    <section className="page page--vote">
      <h1>Escolha o destaque</h1>
      {(settings?.championship || settings?.match) && (
        <p className="page__subtitle">
          {[settings?.championship, settings?.match].filter(Boolean).join(' · ')}
        </p>
      )}

      {error && <p className="alert alert--error">{error}</p>}

      <div className="player-grid">
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            selected={selected?.id === player.id}
            disabled={voting}
            onSelect={setSelected}
          />
        ))}
      </div>

      {players.length === 0 && <p>Nenhum jogador disponível para votação.</p>}

      {voteError && <p className="alert alert--error">{voteError}</p>}

      <VoteButton disabled={!selected} loading={voting} onClick={handleVote} />
    </section>
  )
}

export default Vote

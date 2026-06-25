// Modal de detalhes do atleta — aberto ao clicar num card.
// Mostra a foto grande e os dados (camisa e categoria). Conforme o estado da
// votação/login, mostra: entrar com Google, votar, ou "já votou".
// Não exibe votos/posição: o andamento da votação fica só para o admin.

import { useEffect, useRef } from 'react'
import type { Player } from '../../types'

interface PlayerModalProps {
  player: Player
  onClose: () => void
  /** Votação aberta no momento. */
  votingOpen?: boolean
  /** Usuário autenticado (pode votar). */
  isLoggedIn?: boolean
  /** votação aberta + logado + ainda não votou. */
  canVote?: boolean
  /** true enquanto o voto está sendo registrado. */
  voting?: boolean
  /** true se a conta já votou. */
  alreadyVoted?: boolean
  /** true enquanto o login Google está em andamento. */
  loggingIn?: boolean
  onLogin?: () => void
  onVote?: () => void
}

export function PlayerModal({
  player,
  onClose,
  votingOpen,
  isLoggedIn,
  canVote,
  voting,
  alreadyVoted,
  loggingIn,
  onLogin,
  onVote,
}: PlayerModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    // Trava o scroll do fundo e move o foco para o diálogo enquanto aberto.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  function renderAction() {
    if (!votingOpen) return null
    if (alreadyVoted) return <p className="modal__voted">✓ Você já votou</p>
    if (!isLoggedIn) {
      return (
        <button
          className="btn btn--primary modal__vote"
          type="button"
          disabled={loggingIn}
          onClick={onLogin}
        >
          {loggingIn ? 'Entrando...' : 'Entrar com Google para votar'}
        </button>
      )
    }
    if (canVote && onVote) {
      return (
        <button
          className="btn btn--primary modal__vote"
          type="button"
          disabled={voting}
          onClick={onVote}
        >
          {voting ? 'Registrando...' : 'Votar neste atleta'}
        </button>
      )
    }
    return null
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes de ${player.name}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal__close" type="button" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <div className="modal__photo-wrap">
          {player.photo ? (
            <img className="modal__photo" src={player.photo} alt={player.name} />
          ) : (
            <div className="modal__photo modal__photo--empty">{player.number}</div>
          )}
          <span className="modal__photo-badge">#{player.number}</span>
        </div>

        <h2 className="modal__name">{player.name}</h2>

        <div className="modal__stats">
          <div className="modal__stat">
            <strong>{player.number}</strong>
            <span>Camisa</span>
          </div>
          <div className="modal__stat modal__stat--text">
            <strong>{player.category || 'Sem categoria'}</strong>
            <span>Categoria</span>
          </div>
        </div>

        {renderAction()}
      </div>
    </div>
  )
}

export default PlayerModal

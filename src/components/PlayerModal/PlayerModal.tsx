// Modal de detalhes do atleta — aberto ao clicar num card.
// Mostra a foto grande e os dados (camisa e categoria). Se a votação está
// aberta e o dispositivo ainda não votou, mostra o botão de votar.
// Não exibe votos/posição: o andamento da votação fica só para o admin.

import { useEffect, useRef } from 'react'
import type { PlayerResult } from '../../types'

interface PlayerModalProps {
  result: PlayerResult
  onClose: () => void
  /** Se true, mostra o botão de votar. */
  canVote?: boolean
  /** true enquanto o voto está sendo registrado. */
  voting?: boolean
  /** true se o dispositivo já votou. */
  alreadyVoted?: boolean
  onVote?: () => void
}

export function PlayerModal({
  result,
  onClose,
  canVote,
  voting,
  alreadyVoted,
  onVote,
}: PlayerModalProps) {
  const { player } = result

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

        {canVote && onVote ? (
          <button
            className="btn btn--primary modal__vote"
            type="button"
            disabled={voting}
            onClick={onVote}
          >
            {voting ? 'Registrando...' : 'Votar neste atleta'}
          </button>
        ) : alreadyVoted ? (
          <p className="modal__voted">✓ Você já votou</p>
        ) : null}
      </div>
    </div>
  )
}

export default PlayerModal

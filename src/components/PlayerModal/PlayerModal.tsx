// Modal de detalhes do atleta — aberto ao clicar num card de resultados.
// Mostra a foto em tamanho grande e as informações completas.

import { useEffect, useRef } from 'react'
import type { PlayerResult } from '../../types'

interface PlayerModalProps {
  result: PlayerResult
  position: number
  totalVotes: number
  onClose: () => void
}

export function PlayerModal({ result, position, totalVotes, onClose }: PlayerModalProps) {
  const { player, votes } = result
  const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0

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

        {player.photo ? (
          <img className="modal__photo" src={player.photo} alt={player.name} />
        ) : (
          <div className="modal__photo modal__photo--empty">{player.number}</div>
        )}

        <h2 className="modal__name">{player.name}</h2>

        <div className="modal__tags">
          <span className="modal__tag">Camisa {player.number}</span>
          {player.category && <span className="modal__tag">{player.category}</span>}
        </div>

        <div className="modal__stats">
          <div className="modal__stat">
            <strong>{position}º</strong>
            <span>Posição</span>
          </div>
          <div className="modal__stat">
            <strong>{votes}</strong>
            <span>Voto{votes === 1 ? '' : 's'}</span>
          </div>
          <div className="modal__stat">
            <strong>{percent}%</strong>
            <span>do total</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerModal

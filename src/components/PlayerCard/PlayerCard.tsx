// Cartão de jogador usado na tela de votação.

import type { Player } from '../../types'

interface PlayerCardProps {
  player: Player
  selected?: boolean
  disabled?: boolean
  onSelect?: (player: Player) => void
}

export function PlayerCard({ player, selected, disabled, onSelect }: PlayerCardProps) {
  return (
    <button
      type="button"
      className={`player-card${selected ? ' player-card--selected' : ''}`}
      disabled={disabled}
      onClick={() => onSelect?.(player)}
      aria-pressed={selected}
    >
      <div className="player-card__avatar">
        {player.photo ? (
          <img src={player.photo} alt={player.name} />
        ) : (
          <span className="player-card__number">#{player.number}</span>
        )}
      </div>
      <div className="player-card__info">
        <strong className="player-card__name">{player.name}</strong>
        <span className="player-card__meta">
          Camisa {player.number}
          {player.category ? ` · ${player.category}` : ''}
        </span>
      </div>
    </button>
  )
}

export default PlayerCard

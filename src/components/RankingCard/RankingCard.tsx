// Linha de ranking usada na tela de resultados.

import type { PlayerResult } from '../../types'

interface RankingCardProps {
  position: number
  result: PlayerResult
  /** Total de votos, para calcular o percentual da barra. */
  totalVotes: number
  /** Se informado, o card vira clicável (abre os detalhes do atleta). */
  onClick?: () => void
}

export function RankingCard({ position, result, totalVotes, onClick }: RankingCardProps) {
  const { player, votes } = result
  const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0

  const className =
    'ranking-card' +
    (position === 1 ? ' ranking-card--leader' : '') +
    (onClick ? ' ranking-card--clickable' : '')

  return (
    <div
      className={className}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      <span className="ranking-card__position">{position}º</span>

      {player.photo ? (
        <img className="ranking-card__photo" src={player.photo} alt={player.name} />
      ) : (
        <span className="ranking-card__photo ranking-card__photo--empty">
          {player.number}
        </span>
      )}

      <div className="ranking-card__body">
        <div className="ranking-card__header">
          <div className="ranking-card__who">
            <strong>{player.name}</strong>
            <span className="ranking-card__category">
              Camisa {player.number}
              {player.category ? ` · ${player.category}` : ''}
            </span>
          </div>
          <span className="ranking-card__votes">{percent}%</span>
        </div>
        <div className="ranking-card__bar" aria-hidden="true">
          <div className="ranking-card__bar-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  )
}

export default RankingCard

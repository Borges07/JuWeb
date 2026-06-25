// Cartão de atleta na tela pública de votação.
// Mostra apenas foto, nome, camisa e categoria — sem posição/percentual, para
// não revelar o andamento da votação (só o admin vê o placar).

import type { Player } from '../../types'

interface RankingCardProps {
  player: Player
  /** Se informado, o card vira clicável (abre os detalhes do atleta). */
  onClick?: () => void
}

export function RankingCard({ player, onClick }: RankingCardProps) {
  const className = 'ranking-card' + (onClick ? ' ranking-card--clickable' : '')

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
      {player.photo ? (
        <img className="ranking-card__photo" src={player.photo} alt={player.name} />
      ) : (
        <span className="ranking-card__photo ranking-card__photo--empty">
          {player.number}
        </span>
      )}

      <div className="ranking-card__body">
        <strong className="ranking-card__name">{player.name}</strong>
        <span className="ranking-card__category">
          Camisa {player.number}
          {player.category ? ` · ${player.category}` : ''}
        </span>
      </div>

      {onClick && (
        <span className="ranking-card__cta" aria-hidden="true">
          ›
        </span>
      )}
    </div>
  )
}

export default RankingCard

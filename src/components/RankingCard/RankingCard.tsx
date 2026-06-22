// Linha de ranking usada na tela de resultados.

import type { PlayerResult } from '../../types'

interface RankingCardProps {
  position: number
  result: PlayerResult
  /** Total de votos, para calcular o percentual da barra. */
  totalVotes: number
}

export function RankingCard({ position, result, totalVotes }: RankingCardProps) {
  const { player, votes } = result
  const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0

  return (
    <div className={`ranking-card${position === 1 ? ' ranking-card--leader' : ''}`}>
      <span className="ranking-card__position">{position}º</span>
      <div className="ranking-card__body">
        <div className="ranking-card__header">
          <strong>{player.name}</strong>
          <span>
            {votes} voto{votes === 1 ? '' : 's'} · {percent}%
          </span>
        </div>
        <div className="ranking-card__bar" aria-hidden="true">
          <div className="ranking-card__bar-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  )
}

export default RankingCard

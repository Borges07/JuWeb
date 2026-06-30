// Selo de status de uma votação (rascunho / aberta / pausada / encerrada),
// reutilizado no admin e na lista pública.

import type { VotingStatus } from '../../types'

const VOTING_STATUS_LABEL: Record<VotingStatus, string> = {
  rascunho: 'Rascunho',
  aberta: 'Aberta',
  pausada: 'Pausada',
  encerrada: 'Encerrada',
}

const VARIANT: Record<VotingStatus, string> = {
  rascunho: 'badge--neutral',
  aberta: 'badge--success',
  pausada: 'badge--warning',
  encerrada: 'badge--neutral',
}

export function StatusBadge({ status }: { status: VotingStatus }) {
  return (
    <span className={`badge ${VARIANT[status]}`}>
      {status === 'aberta' && <span className="badge__dot" />}
      {VOTING_STATUS_LABEL[status]}
    </span>
  )
}

export default StatusBadge

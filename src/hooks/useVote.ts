// Hook que encapsula o fluxo de votação com login.
// Exige usuário autenticado (Google). 1 voto por conta (uid).

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { AlreadyVotedError, castVote, hasVoted } from '../services/voteService'

interface UseVoteState {
  voting: boolean
  /** true se a conta logada já votou. */
  alreadyVoted: boolean
  error: string | null
  vote: (playerId: string) => Promise<boolean>
}

export function useVote(votingId: string): UseVoteState {
  const { user } = useAuth()
  const [voting, setVoting] = useState(false)
  const [alreadyVoted, setAlreadyVoted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ao logar/trocar de conta (ou de votação), confere no Firestore se aquela
  // conta já votou NESTA votação. (Sem usuário resolve como "não votou".)
  useEffect(() => {
    let cancelled = false
    const check = user ? hasVoted(votingId, user.uid) : Promise.resolve(false)
    check
      .then((voted) => {
        if (!cancelled) setAlreadyVoted(voted)
      })
      .catch(() => {
        /* falha de rede não bloqueia a tentativa de voto */
      })
    return () => {
      cancelled = true
    }
  }, [user, votingId])

  const vote = useCallback(
    async (playerId: string): Promise<boolean> => {
      if (!user) {
        setError('Entre com o Google para votar.')
        return false
      }
      setVoting(true)
      setError(null)
      try {
        await castVote(votingId, user.uid, playerId)
        setAlreadyVoted(true)
        return true
      } catch (err) {
        // Só bloqueia como "já votou" se for voto duplicado de verdade.
        if (err instanceof AlreadyVotedError) {
          setAlreadyVoted(true)
        }
        setError(err instanceof Error ? err.message : 'Não foi possível registrar o voto.')
        return false
      } finally {
        setVoting(false)
      }
    },
    [user, votingId],
  )

  return { voting, alreadyVoted, error, vote }
}

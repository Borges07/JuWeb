// Hook que encapsula o fluxo de votação:
// fingerprint -> verifica se já votou -> registra voto.

import { useCallback, useEffect, useState } from 'react'
import { getFingerprint } from '../utils/fingerprint'
import {
  AlreadyVotedError,
  castVote,
  hasFingerprintVoted,
  hasVotedLocally,
} from '../services/voteService'

interface UseVoteState {
  voting: boolean
  /** true se este dispositivo já votou (LocalStorage ou Firestore). */
  alreadyVoted: boolean
  error: string | null
  vote: (playerId: string) => Promise<boolean>
}

export function useVote(): UseVoteState {
  const [voting, setVoting] = useState(false)
  const [alreadyVoted, setAlreadyVoted] = useState<boolean>(hasVotedLocally())
  const [error, setError] = useState<string | null>(null)

  // Confere no Firestore (2ª camada) mesmo que o LocalStorage tenha sido limpo.
  useEffect(() => {
    if (alreadyVoted) return
    let cancelled = false
    hasFingerprintVoted(getFingerprint())
      .then((voted) => {
        if (!cancelled && voted) setAlreadyVoted(true)
      })
      .catch(() => {
        /* falha de rede não bloqueia a tentativa de voto */
      })
    return () => {
      cancelled = true
    }
  }, [alreadyVoted])

  const vote = useCallback(async (playerId: string): Promise<boolean> => {
    setVoting(true)
    setError(null)
    try {
      await castVote(playerId, getFingerprint())
      setAlreadyVoted(true)
      return true
    } catch (err) {
      // Só bloqueia como "já votou" se for voto duplicado de verdade.
      // Erros de rede/permissão apenas exibem a mensagem e permitem tentar de novo.
      if (err instanceof AlreadyVotedError) {
        setAlreadyVoted(true)
      }
      setError(err instanceof Error ? err.message : 'Não foi possível registrar o voto.')
      return false
    } finally {
      setVoting(false)
    }
  }, [])

  return { voting, alreadyVoted, error, vote }
}

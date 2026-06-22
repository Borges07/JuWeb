// Hook para carregar jogadores (todos ou apenas ativos).

import { useCallback, useEffect, useState } from 'react'
import { getActivePlayers, getAllPlayers } from '../services/playerService'
import type { Player } from '../types'

export function usePlayers(onlyActive = false) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlayers = useCallback(
    () => (onlyActive ? getActivePlayers() : getAllPlayers()),
    [onlyActive],
  )

  // Recarga manual (usada após cadastrar/editar no painel admin).
  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setPlayers(await fetchPlayers())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar jogadores.')
    } finally {
      setLoading(false)
    }
  }, [fetchPlayers])

  // Carga inicial: estados são atualizados dentro de callbacks assíncronos.
  useEffect(() => {
    let active = true
    fetchPlayers()
      .then((data) => {
        if (active) setPlayers(data)
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar jogadores.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [fetchPlayers])

  return { players, loading, error, reload }
}

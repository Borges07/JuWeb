// Tipos centrais do domínio da aplicação de votação.

export interface Player {
  id: string
  name: string
  number: number
  /** URL da foto do jogador (opcional). */
  photo?: string
  /** Apenas jogadores ativos aparecem para votação. */
  active: boolean
}

/** Dados usados para criar/editar um jogador (sem o id gerado pelo Firestore). */
export type PlayerInput = Omit<Player, 'id'>

export interface Vote {
  id: string
  playerId: string
  /** Assinatura do dispositivo usada para evitar votos duplicados. */
  fingerprint: string
  /** Timestamp ISO de criação. */
  createdAt: string
}

export interface Settings {
  /** Indica se a votação está aberta. */
  votingOpen: boolean
  /** Temporada atual (ex.: "2026"). */
  season: string
  /** Identificação da partida atual (ex.: "Time A x Time B - 22/06"). */
  currentMatch: string
}

/** Resultado agregado por jogador, usado nas telas de ranking/resultados. */
export interface PlayerResult {
  player: Player
  votes: number
}

// Tipos centrais do domínio da aplicação de votação.

export interface Player {
  id: string
  name: string
  number: number
  /** Categoria do jogador (ex.: Sub-15, Sub-17, Adulto). Opcional. */
  category?: string
  /** Foto do jogador como data URL (base64) salvo no Firestore. Opcional. */
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
  /** Campeonato atual (ex.: "Liga Regional 2026"). */
  championship: string
  /** Partida atual (ex.: "ADEC x Time B - 22/06"). */
  match: string
}

/** Resultado agregado por jogador, usado nas telas de ranking/resultados. */
export interface PlayerResult {
  player: Player
  votes: number
}

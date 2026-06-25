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

/**
 * Categoria cadastrada pelo admin (ex.: "Sub08 | Celina Amaral").
 * Mantida em coleção própria para padronizar os nomes e evitar duplicatas
 * (variações de digitação) no filtro da votação.
 */
export interface Category {
  id: string
  name: string
}

export interface Vote {
  /** ID do documento = uid do votante (garante 1 voto por conta). */
  id: string
  playerId: string
  /** Timestamp de criação (serverTimestamp). */
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

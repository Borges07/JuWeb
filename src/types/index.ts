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
  /** Votação à qual o atleta está vinculado (id do doc em `votings`). */
  votingId: string
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
  /** ID do documento = uid do votante (garante 1 voto por conta por votação). */
  id: string
  playerId: string
  /** Timestamp de criação (serverTimestamp). */
  createdAt: string
}

/**
 * Estado de uma votação no seu ciclo de vida:
 * - rascunho: em montagem (cadastrando atletas), invisível ao público.
 * - aberta: recebendo votos.
 * - pausada: visível ao público, mas sem aceitar votos no momento.
 * - encerrada: finalizada (não aceita votos; some da lista pública).
 */
export type VotingStatus = 'rascunho' | 'aberta' | 'pausada' | 'encerrada'

/**
 * Uma votação (ex.: "Destaque do Campeonato Regional 2026"). Cada votação tem
 * seu próprio elenco de atletas e seus próprios votos (subcoleções no Firestore).
 */
export interface Voting {
  id: string
  title: string
  /** Campeonato/escola ou contexto da votação. */
  description: string
  status: VotingStatus
  /** Epoch em ms (derivado do serverTimestamp) para ordenação. */
  createdAt: number
}

/** Dados para criar/editar uma votação (sem id/status/createdAt gerados). */
export type VotingInput = Pick<Voting, 'title' | 'description'>

/** Resultado agregado por jogador, usado nas telas de ranking/resultados. */
export interface PlayerResult {
  player: Player
  votes: number
}

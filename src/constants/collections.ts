// Nomes das coleções do Firestore em um único lugar.

export const COLLECTIONS = {
  /** Votações (coleção raiz). Cada doc tem a subcoleção votes. */
  VOTINGS: 'votings',
  /** Atletas (coleção raiz). Cada doc tem `votingId` vinculando a uma votação. */
  PLAYERS: 'players',
  /** Subcoleção de votos dentro de cada votação: votings/{id}/votes. */
  VOTES: 'votes',
  /** Categorias globais reutilizadas no cadastro de atletas. */
  CATEGORIES: 'categories',
  /** Allowlist de administradores (doc id = uid do usuário). */
  ADMINS: 'admins',
} as const

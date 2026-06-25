// Nomes das coleções do Firestore em um único lugar.

export const COLLECTIONS = {
  PLAYERS: 'players',
  VOTES: 'votes',
  SETTINGS: 'settings',
  CATEGORIES: 'categories',
  /** Allowlist de administradores (doc id = uid do usuário). */
  ADMINS: 'admins',
} as const

/** Documento único usado para as configurações globais da votação. */
export const SETTINGS_DOC_ID = 'global'

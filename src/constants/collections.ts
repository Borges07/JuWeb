// Nomes das coleções do Firestore em um único lugar.

export const COLLECTIONS = {
  PLAYERS: 'players',
  VOTES: 'votes',
  SETTINGS: 'settings',
} as const

/** Documento único usado para as configurações globais da votação. */
export const SETTINGS_DOC_ID = 'global'

/** Chave usada no LocalStorage como 1ª camada anti-voto-duplo. */
export const HAS_VOTED_KEY = 'juju:hasVoted'

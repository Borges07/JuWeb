// Caminhos de rota centralizados para evitar strings espalhadas pelo código.

export const ROUTES = {
  HOME: '/',
  /** Lista pública das votações abertas (cards). */
  VOTE: '/votar',
  /** Votar dentro de uma votação específica. */
  VOTE_DETAIL: '/votar/:votingId',
  RESULTS: '/resultados',
  LOGIN: '/login',
  ADMIN: '/admin',
  // Sub-telas do painel administrativo.
  ADMIN_PLAYERS: '/admin/jogadores',
  ADMIN_VOTINGS: '/admin/votacoes',
  /** Gerenciar uma votação (status, atletas, resultados). */
  ADMIN_VOTING_MANAGE: '/admin/votacoes/:votingId',
  ADMIN_CATEGORIES: '/admin/categorias',
} as const

export type RouteKey = keyof typeof ROUTES

/** Construtores de caminho para rotas com parâmetro. */
export const PATHS = {
  voteDetail: (votingId: string) => `/votar/${votingId}`,
  adminVotingManage: (votingId: string) => `/admin/votacoes/${votingId}`,
} as const

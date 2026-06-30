// Caminhos de rota centralizados para evitar strings espalhadas pelo código.

export const ROUTES = {
  HOME: '/',
  VOTE: '/votar',
  RESULTS: '/resultados',
  LOGIN: '/login',
  ADMIN: '/admin',
  // Sub-telas do painel administrativo (cada uma com sua responsabilidade).
  ADMIN_PLAYERS: '/admin/jogadores',
  ADMIN_CATEGORIES: '/admin/categorias',
  ADMIN_VOTING: '/admin/votacao',
  ADMIN_RESULTS: '/admin/resultados',
} as const

export type RouteKey = keyof typeof ROUTES

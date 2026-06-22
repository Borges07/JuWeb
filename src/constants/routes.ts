// Caminhos de rota centralizados para evitar strings espalhadas pelo código.

export const ROUTES = {
  HOME: '/',
  VOTE: '/votar',
  RESULTS: '/resultados',
  LOGIN: '/login',
  ADMIN: '/admin',
} as const

export type RouteKey = keyof typeof ROUTES

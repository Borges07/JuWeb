// Validações simples usadas em formulários (ex.: cadastro de jogador, login).

import type { PlayerInput } from '../types'

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0
}

/**
 * Valida os dados de um jogador. Retorna um mapa de erros por campo;
 * vazio significa que está tudo certo.
 */
export function validatePlayer(input: Partial<PlayerInput>): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!input.name || !isNonEmpty(input.name)) {
    errors.name = 'Informe o nome do jogador.'
  }

  if (input.number === undefined || Number.isNaN(input.number) || input.number < 0) {
    errors.number = 'Informe um número válido.'
  }

  // A foto é enviada como arquivo e convertida em data URL — não validamos formato.
  return errors
}

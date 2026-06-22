// Autenticação do administrador via Firebase Authentication (e-mail/senha).

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from './firebase/config'

export function login(email: string, password: string): Promise<void> {
  return signInWithEmailAndPassword(auth, email, password).then(() => undefined)
}

export function logout(): Promise<void> {
  return signOut(auth)
}

/** Observa mudanças de sessão; retorna a função para cancelar a inscrição. */
export function observeAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}

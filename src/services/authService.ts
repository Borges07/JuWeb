// Autenticação via Firebase Authentication.
//   - Admin: e-mail/senha (criado no Console). Acesso ao painel /admin.
//   - Votante: login com Google (1 voto por conta).
// A distinção admin x votante é feita pela allowlist `admins` (doc id = uid).

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase/config'
import { COLLECTIONS } from '../constants/collections'

/** Login do administrador (e-mail/senha). */
export function login(email: string, password: string): Promise<void> {
  return signInWithEmailAndPassword(auth, email, password).then(() => undefined)
}

/** Login do votante (Google) — usado antes de votar. */
export function loginWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider()
  return signInWithPopup(auth, provider).then(() => undefined)
}

export function logout(): Promise<void> {
  return signOut(auth)
}

/** Observa mudanças de sessão; retorna a função para cancelar a inscrição. */
export function observeAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}

/**
 * Verifica se o usuário é administrador consultando a allowlist `admins`
 * (documento com ID igual ao uid). Em caso de erro/permissão, retorna false.
 */
export async function isAdminUser(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.ADMINS, uid))
    return snap.exists()
  } catch {
    return false
  }
}

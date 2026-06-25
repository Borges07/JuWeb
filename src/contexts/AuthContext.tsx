// Contexto de autenticação.
// Mantém o usuário logado (admin ou votante) disponível para toda a árvore e
// resolve se ele é administrador (allowlist `admins`).

import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import {
  isAdminUser,
  login as loginService,
  loginWithGoogle as loginWithGoogleService,
  logout as logoutService,
  observeAuth,
} from '../services/authService'

export interface AuthContextValue {
  user: User | null
  /** true enquanto verifica a sessão e a permissão de admin. */
  loading: boolean
  /** true se o usuário logado está na allowlist de administradores. */
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  // uid cujo status de admin já foi resolvido (null = "nenhum usuário").
  const [checkedUid, setCheckedUid] = useState<string | null>(null)

  // Assina a sessão uma vez.
  useEffect(() => {
    const unsubscribe = observeAuth((nextUser) => {
      setUser(nextUser)
      setAuthReady(true)
    })
    return unsubscribe
  }, [])

  // Reavalia o status de admin sempre que a sessão muda (só setState async).
  useEffect(() => {
    let cancelled = false
    const uid = user ? user.uid : null
    const check = user ? isAdminUser(user.uid) : Promise.resolve(false)
    check
      .then((ok) => {
        if (cancelled) return
        setIsAdmin(ok)
        setCheckedUid(uid)
      })
      .catch(() => {
        if (cancelled) return
        setIsAdmin(false)
        setCheckedUid(uid)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const currentUid = user ? user.uid : null
  // Carregando enquanto a sessão não resolveu OU o admin do uid atual não foi checado.
  const loading = !authReady || currentUid !== checkedUid

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin,
      login: loginService,
      loginWithGoogle: loginWithGoogleService,
      logout: logoutService,
    }),
    [user, loading, isAdmin],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

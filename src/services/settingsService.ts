// Configurações globais da votação no Firestore (coleção `settings`).

import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase/config'
import { COLLECTIONS, SETTINGS_DOC_ID } from '../constants/collections'
import type { Settings } from '../types'

const settingsDoc = doc(db, COLLECTIONS.SETTINGS, SETTINGS_DOC_ID)

const DEFAULT_SETTINGS: Settings = {
  votingOpen: false,
  season: '',
  currentMatch: '',
}

export async function getSettings(): Promise<Settings> {
  const snap = await getDoc(settingsDoc)
  if (!snap.exists()) return DEFAULT_SETTINGS
  return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<Settings>) }
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  await setDoc(settingsDoc, patch, { merge: true })
}

/** Abre a votação. */
export function openVoting(currentMatch: string, season: string): Promise<void> {
  return updateSettings({ votingOpen: true, currentMatch, season })
}

/** Encerra a votação (mantém os votos registrados). */
export function closeVoting(): Promise<void> {
  return updateSettings({ votingOpen: false })
}

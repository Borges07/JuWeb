// Operações de jogadores no Firestore (coleção `players`).

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase/config'
import { COLLECTIONS } from '../constants/collections'
import type { Player, PlayerInput } from '../types'

const playersRef = collection(db, COLLECTIONS.PLAYERS)

function mapPlayer(id: string, data: Record<string, unknown>): Player {
  return {
    id,
    name: String(data.name ?? ''),
    number: Number(data.number ?? 0),
    photo: data.photo ? String(data.photo) : undefined,
    active: Boolean(data.active),
  }
}

/** Lista todos os jogadores (uso administrativo). */
export async function getAllPlayers(): Promise<Player[]> {
  const snap = await getDocs(playersRef)
  return snap.docs
    .map((d) => mapPlayer(d.id, d.data()))
    .sort((a, b) => a.number - b.number)
}

/** Lista apenas jogadores ativos (tela de votação). */
export async function getActivePlayers(): Promise<Player[]> {
  const snap = await getDocs(query(playersRef, where('active', '==', true)))
  return snap.docs
    .map((d) => mapPlayer(d.id, d.data()))
    .sort((a, b) => a.number - b.number)
}

export async function createPlayer(input: PlayerInput): Promise<string> {
  const ref = await addDoc(playersRef, input)
  return ref.id
}

export async function updatePlayer(id: string, input: Partial<PlayerInput>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.PLAYERS, id), input)
}

export async function setPlayerActive(id: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.PLAYERS, id), { active })
}

export async function deletePlayer(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.PLAYERS, id))
}

// Operações de atletas no Firestore (coleção raiz `players`).
//
// Cada atleta tem um campo `votingId` que o vincula a uma votação. O cadastro
// é feito na tela global de Jogadores; a votação consome só os atletas ativos
// vinculados a ela.

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

function playerDoc(id: string) {
  return doc(db, COLLECTIONS.PLAYERS, id)
}

function mapPlayer(id: string, data: Record<string, unknown>): Player {
  return {
    id,
    name: String(data.name ?? ''),
    number: Number(data.number ?? 0),
    category: data.category ? String(data.category) : undefined,
    photo: data.photo ? String(data.photo) : undefined,
    active: Boolean(data.active),
    votingId: String(data.votingId ?? ''),
  }
}

const byNumber = (a: Player, b: Player) => a.number - b.number

/** Lista TODOS os atletas (tela global de Jogadores). */
export async function getAllPlayers(): Promise<Player[]> {
  const snap = await getDocs(playersRef)
  return snap.docs.map((d) => mapPlayer(d.id, d.data())).sort(byNumber)
}

/** Lista os atletas vinculados a uma votação (admin: gerenciar/apurar). */
export async function getPlayersByVoting(votingId: string): Promise<Player[]> {
  const snap = await getDocs(query(playersRef, where('votingId', '==', votingId)))
  return snap.docs.map((d) => mapPlayer(d.id, d.data())).sort(byNumber)
}

/**
 * Lista os atletas ATIVOS de uma votação (tela pública). Filtra `active` em
 * memória para usar só o índice de campo único de `votingId` (sem índice
 * composto no Firestore).
 */
export async function getActivePlayersByVoting(votingId: string): Promise<Player[]> {
  const players = await getPlayersByVoting(votingId)
  return players.filter((p) => p.active)
}

export async function createPlayer(input: PlayerInput): Promise<string> {
  const ref = await addDoc(playersRef, input)
  return ref.id
}

export async function updatePlayer(id: string, input: Partial<PlayerInput>): Promise<void> {
  await updateDoc(playerDoc(id), input)
}

export async function setPlayerActive(id: string, active: boolean): Promise<void> {
  await updateDoc(playerDoc(id), { active })
}

export async function deletePlayer(id: string): Promise<void> {
  await deleteDoc(playerDoc(id))
}

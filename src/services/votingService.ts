// Operações de votações no Firestore (coleção `votings`).
//
// Cada votação tem sua própria subcoleção de votos (`votings/{id}/votes`) e seus
// atletas vivem na coleção raiz `players` vinculados por `votingId` — assim cada
// votação tem sua apuração independente e 1 voto por usuário vale por votação.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase/config'
import { COLLECTIONS } from '../constants/collections'
import type { Voting, VotingInput, VotingStatus } from '../types'

const votingsRef = collection(db, COLLECTIONS.VOTINGS)

function mapVoting(id: string, data: Record<string, unknown>): Voting {
  // createdAt pode vir como Timestamp do Firestore (tem toMillis) ou número.
  const createdAtRaw = data.createdAt as { toMillis?: () => number } | number | undefined
  const createdAt =
    typeof createdAtRaw === 'number'
      ? createdAtRaw
      : (createdAtRaw?.toMillis?.() ?? 0)

  return {
    id,
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    status: (data.status as VotingStatus) ?? 'rascunho',
    createdAt,
  }
}

/** Lista todas as votações (admin), das mais novas para as mais antigas. */
export async function getVotings(): Promise<Voting[]> {
  const snap = await getDocs(votingsRef)
  return snap.docs
    .map((d) => mapVoting(d.id, d.data()))
    .sort((a, b) => b.createdAt - a.createdAt)
}

/** Votações visíveis ao público: abertas (votáveis) e pausadas (em espera). */
export async function getPublicVotings(): Promise<Voting[]> {
  const snap = await getDocs(
    query(votingsRef, where('status', 'in', ['aberta', 'pausada'])),
  )
  return snap.docs
    .map((d) => mapVoting(d.id, d.data()))
    .sort((a, b) => b.createdAt - a.createdAt)
}

/** Busca uma votação pelo id (null se não existir). */
export async function getVoting(id: string): Promise<Voting | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.VOTINGS, id))
  return snap.exists() ? mapVoting(snap.id, snap.data()) : null
}

/** Cria uma votação em rascunho. */
export async function createVoting(input: VotingInput): Promise<string> {
  const title = input.title.trim()
  if (!title) throw new Error('Informe o nome da votação.')
  const ref = await addDoc(votingsRef, {
    title,
    description: input.description.trim(),
    status: 'rascunho' satisfies VotingStatus,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

/** Atualiza nome/descrição da votação. */
export async function updateVoting(id: string, patch: Partial<VotingInput>): Promise<void> {
  const data: Record<string, string> = {}
  if (patch.title !== undefined) data.title = patch.title.trim()
  if (patch.description !== undefined) data.description = patch.description.trim()
  await updateDoc(doc(db, COLLECTIONS.VOTINGS, id), data)
}

/** Altera o status (abrir, pausar, encerrar, reabrir). */
export async function setVotingStatus(id: string, status: VotingStatus): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.VOTINGS, id), { status })
}

/**
 * Exclui a votação e tudo vinculado a ela: os atletas (raiz `players` com
 * votingId == id) e os votos (subcoleção). O cliente Firestore não apaga em
 * cascata, então removemos os documentos antes. Atenção: irreversível.
 */
export async function deleteVoting(id: string): Promise<void> {
  // Atletas vinculados (coleção raiz, filtrando por votingId).
  const playersSnap = await getDocs(
    query(collection(db, COLLECTIONS.PLAYERS), where('votingId', '==', id)),
  )
  // Votos da votação (subcoleção).
  const votesSnap = await getDocs(
    collection(db, COLLECTIONS.VOTINGS, id, COLLECTIONS.VOTES),
  )
  await Promise.all(
    [...playersSnap.docs, ...votesSnap.docs].map((d) => deleteDoc(d.ref)),
  )
  await deleteDoc(doc(db, COLLECTIONS.VOTINGS, id))
}

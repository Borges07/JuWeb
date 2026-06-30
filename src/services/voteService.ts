// Operações de votos no Firestore.
//
// Os votos vivem na subcoleção `votes` de cada votação:
// votings/{votingId}/votes/{uid}. Como o ID do documento é o `uid` do usuário
// autenticado (login Google), a regra do Firestore garante 1 voto por conta
// POR VOTAÇÃO — à prova de limpar cache, trocar navegador ou aparelho.

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase/config'
import { COLLECTIONS } from '../constants/collections'
import type { PlayerResult, Player, Vote } from '../types'

/** Referência à subcoleção de votos de uma votação. */
function votesRef(votingId: string) {
  return collection(db, COLLECTIONS.VOTINGS, votingId, COLLECTIONS.VOTES)
}

function voteDoc(votingId: string, uid: string) {
  return doc(db, COLLECTIONS.VOTINGS, votingId, COLLECTIONS.VOTES, uid)
}

/** Erro específico para "esta conta já votou" (distingue de erro de rede). */
export class AlreadyVotedError extends Error {
  constructor() {
    super('Você já votou nesta votação com esta conta.')
    this.name = 'AlreadyVotedError'
  }
}

/** Verifica se o usuário (uid) já votou nesta votação. */
export async function hasVoted(votingId: string, uid: string): Promise<boolean> {
  const snap = await getDoc(voteDoc(votingId, uid))
  return snap.exists()
}

/**
 * Registra o voto do usuário nesta votação. O documento usa o `uid` como ID,
 * então só é possível criar uma vez. Lança AlreadyVotedError se já votou.
 */
export async function castVote(
  votingId: string,
  uid: string,
  playerId: string,
): Promise<void> {
  const ref = voteDoc(votingId, uid)
  const existing = await getDoc(ref)
  if (existing.exists()) {
    throw new AlreadyVotedError()
  }

  await setDoc(ref, {
    playerId,
    createdAt: serverTimestamp(),
  })
}

/** Retorna todos os votos da votação (uso em resultados/admin). */
export async function getAllVotes(votingId: string): Promise<Pick<Vote, 'playerId'>[]> {
  const snap = await getDocs(votesRef(votingId))
  return snap.docs.map((d) => ({ playerId: String(d.data().playerId ?? '') }))
}

/** Agrega os votos por atleta, do mais votado para o menos votado. */
export async function getResults(
  votingId: string,
  players: Player[],
): Promise<PlayerResult[]> {
  const votes = await getAllVotes(votingId)
  const counts = new Map<string, number>()
  for (const vote of votes) {
    counts.set(vote.playerId, (counts.get(vote.playerId) ?? 0) + 1)
  }

  return players
    .map((player) => ({ player, votes: counts.get(player.id) ?? 0 }))
    .sort((a, b) => b.votes - a.votes)
}

/**
 * Reinicia a votação apagando todos os votos dela. Irreversível.
 */
export async function resetVotes(votingId: string): Promise<void> {
  const snap = await getDocs(votesRef(votingId))
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
}

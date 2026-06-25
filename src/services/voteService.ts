// Operações de votos no Firestore (coleção `votes`).
//
// Cada voto é um documento cujo ID é o `uid` do usuário autenticado (login
// Google). Isso garante 1 voto por conta no nível do servidor (regras do
// Firestore), à prova de limpar cache, trocar navegador ou aparelho.

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

const votesRef = collection(db, COLLECTIONS.VOTES)

/** Erro específico para "esta conta já votou" (distingue de erro de rede). */
export class AlreadyVotedError extends Error {
  constructor() {
    super('Você já votou com esta conta.')
    this.name = 'AlreadyVotedError'
  }
}

/** Verifica se o usuário (uid) já registrou um voto. */
export async function hasVoted(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, COLLECTIONS.VOTES, uid))
  return snap.exists()
}

/**
 * Registra o voto do usuário. O documento usa o `uid` como ID, então a regra
 * do Firestore só permite criar uma vez. Lança AlreadyVotedError se já votou.
 */
export async function castVote(uid: string, playerId: string): Promise<void> {
  const ref = doc(db, COLLECTIONS.VOTES, uid)
  const existing = await getDoc(ref)
  if (existing.exists()) {
    throw new AlreadyVotedError()
  }

  await setDoc(ref, {
    playerId,
    createdAt: serverTimestamp(),
  })
}

/** Retorna todos os votos (uso em resultados/admin — leitura restrita a admin). */
export async function getAllVotes(): Promise<Pick<Vote, 'playerId'>[]> {
  const snap = await getDocs(votesRef)
  return snap.docs.map((d) => ({ playerId: String(d.data().playerId ?? '') }))
}

/** Agrega os votos por jogador, ordenando do mais votado para o menos votado. */
export async function getResults(players: Player[]): Promise<PlayerResult[]> {
  const votes = await getAllVotes()
  const counts = new Map<string, number>()
  for (const vote of votes) {
    counts.set(vote.playerId, (counts.get(vote.playerId) ?? 0) + 1)
  }

  return players
    .map((player) => ({ player, votes: counts.get(player.id) ?? 0 }))
    .sort((a, b) => b.votes - a.votes)
}

/**
 * Reinicia a votação apagando todos os votos.
 * Atenção: operação irreversível. Use com cuidado no painel admin.
 */
export async function resetVotes(): Promise<void> {
  const snap = await getDocs(votesRef)
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
}

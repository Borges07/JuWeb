// Operações de votos no Firestore (coleção `votes`).

import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from './firebase/config'
import { COLLECTIONS, HAS_VOTED_KEY } from '../constants/collections'
import type { PlayerResult, Player, Vote } from '../types'

const votesRef = collection(db, COLLECTIONS.VOTES)

/** Verifica no Firestore se o fingerprint informado já registrou um voto. */
export async function hasFingerprintVoted(fingerprint: string): Promise<boolean> {
  const snap = await getDocs(query(votesRef, where('fingerprint', '==', fingerprint)))
  return !snap.empty
}

/** 1ª camada (rápida): marca local de já-votou. */
export function markVotedLocally(): void {
  try {
    localStorage.setItem(HAS_VOTED_KEY, 'true')
  } catch {
    /* ignora indisponibilidade do LocalStorage */
  }
}

/** 1ª camada (rápida): consulta o local de já-votou. */
export function hasVotedLocally(): boolean {
  try {
    return localStorage.getItem(HAS_VOTED_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * Registra um voto aplicando a verificação de fingerprint no Firestore.
 * Lança erro se o dispositivo já votou.
 */
export async function castVote(playerId: string, fingerprint: string): Promise<void> {
  const alreadyVoted = await hasFingerprintVoted(fingerprint)
  if (alreadyVoted) {
    throw new Error('Este dispositivo já votou.')
  }

  await addDoc(votesRef, {
    playerId,
    fingerprint,
    createdAt: serverTimestamp(),
  })

  markVotedLocally()
}

/** Retorna todos os votos (uso em resultados/admin). */
export async function getAllVotes(): Promise<Pick<Vote, 'playerId' | 'fingerprint'>[]> {
  const snap = await getDocs(votesRef)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      playerId: String(data.playerId ?? ''),
      fingerprint: String(data.fingerprint ?? ''),
    }
  })
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
  try {
    localStorage.removeItem(HAS_VOTED_KEY)
  } catch {
    /* ignora indisponibilidade do LocalStorage */
  }
}

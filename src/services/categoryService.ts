// Operações de categorias no Firestore (coleção `categories`).
//
// As categorias são cadastradas pelo admin e reutilizadas no <select> do
// cadastro de jogadores. Isso padroniza os nomes e evita que variações de
// digitação ("Sub08 | Celina" x "Sub 08 I Celina") dupliquem no filtro.

import { addDoc, collection, deleteDoc, doc, getDocs } from 'firebase/firestore'
import { db } from './firebase/config'
import { COLLECTIONS } from '../constants/collections'
import type { Category } from '../types'

const categoriesRef = collection(db, COLLECTIONS.CATEGORIES)

/** Erro específico para "categoria já existe" (distingue de erro de rede). */
export class DuplicateCategoryError extends Error {
  constructor(name: string) {
    super(`A categoria "${name}" já está cadastrada.`)
    this.name = 'DuplicateCategoryError'
  }
}

/** Normaliza para comparação (trim + minúsculas) — base da deduplicação. */
function normalize(name: string): string {
  return name.trim().toLowerCase()
}

function mapCategory(id: string, data: Record<string, unknown>): Category {
  return { id, name: String(data.name ?? '') }
}

/** Lista as categorias cadastradas, em ordem alfabética. */
export async function getCategories(): Promise<Category[]> {
  const snap = await getDocs(categoriesRef)
  return snap.docs
    .map((d) => mapCategory(d.id, d.data()))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Cadastra uma categoria. Lança erro se o nome for vazio ou se já existir
 * uma equivalente (mesmo nome ignorando espaços e maiúsculas/minúsculas).
 */
export async function createCategory(name: string): Promise<string> {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('Informe o nome da categoria.')
  }

  const existing = await getCategories()
  if (existing.some((c) => normalize(c.name) === normalize(trimmed))) {
    throw new DuplicateCategoryError(trimmed)
  }

  const ref = await addDoc(categoriesRef, { name: trimmed })
  return ref.id
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.CATEGORIES, id))
}

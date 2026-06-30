// Sub-tela: cadastro e remoção das categorias reutilizadas no cadastro de
// jogadores e no filtro da votação.

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  createCategory,
  deleteCategory,
  getCategories,
} from '../../services/categoryService'
import Loading from '../../components/Loading/Loading'
import Icon from '../../components/Icon/Icon'
import { AdminPageHeader } from './AdminLayout'
import type { Category } from '../../types'

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryInput, setCategoryInput] = useState('')
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [categoryBusy, setCategoryBusy] = useState(false)

  // Recarga usada pelos handlers de adicionar/remover.
  const reloadCategories = useCallback(async () => {
    setCategories(await getCategories())
  }, [])

  // Carga inicial: await antes do setState + guarda de montagem.
  useEffect(() => {
    let active = true
    async function load() {
      const cats = await getCategories()
      if (active) {
        setCategories(cats)
        setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  async function handleAddCategory(event: FormEvent) {
    event.preventDefault()
    setCategoryError(null)
    setCategoryBusy(true)
    try {
      await createCategory(categoryInput)
      setCategoryInput('')
      await reloadCategories()
    } catch (err) {
      setCategoryError(
        err instanceof Error ? err.message : 'Não foi possível cadastrar a categoria.',
      )
    } finally {
      setCategoryBusy(false)
    }
  }

  async function handleDeleteCategory(category: Category) {
    if (!confirm(`Remover a categoria "${category.name}"?`)) return
    try {
      await deleteCategory(category.id)
      await reloadCategories()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível remover a categoria.')
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        icon="layers"
        title="Categorias"
        subtitle="Padronize os nomes para reaproveitá-los no cadastro e no filtro."
      >
        <span className="badge badge--neutral">{categories.length} cadastradas</span>
      </AdminPageHeader>

      <div className="panel">
        <h2>Nova categoria</h2>
        <p className="page__subtitle">
          Cadastre as categorias aqui. Nomes repetidos são bloqueados para não
          duplicar no filtro da votação.
        </p>
        <form className="form" onSubmit={handleAddCategory}>
          <div className="form__row">
            <label className="form__field">
              <span>Categoria (ex.: Sub08 | Celina Amaral)</span>
              <input
                value={categoryInput}
                onChange={(e) => {
                  setCategoryInput(e.target.value)
                  setCategoryError(null)
                }}
              />
              {categoryError && <small className="form__error">{categoryError}</small>}
            </label>
            <button
              className="btn btn--primary category-form__add"
              type="submit"
              disabled={categoryBusy || categoryInput.trim() === ''}
            >
              <Icon name="plus" /> Adicionar
            </button>
          </div>
        </form>

        <hr className="panel__divider" />

        {loading ? (
          <Loading />
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <Icon name="layers" />
            <strong>Nenhuma categoria ainda</strong>
            <p>Cadastre a primeira categoria no formulário acima.</p>
          </div>
        ) : (
          <ul className="category-list">
            {categories.map((category) => (
              <li className="category-list__item" key={category.id}>
                <span>{category.name}</span>
                <button
                  className="category-list__remove"
                  type="button"
                  aria-label={`Remover categoria ${category.name}`}
                  onClick={() => handleDeleteCategory(category)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default AdminCategories

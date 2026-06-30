// Sub-tela: cadastro, edição e gestão dos jogadores.

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { usePlayers } from '../../hooks/usePlayers'
import {
  createPlayer,
  deletePlayer,
  setPlayerActive,
  updatePlayer,
} from '../../services/playerService'
import { getCategories } from '../../services/categoryService'
import { validatePlayer } from '../../utils/validators'
import { fileToResizedDataUrl } from '../../utils/image'
import Loading from '../../components/Loading/Loading'
import Icon from '../../components/Icon/Icon'
import { AdminPageHeader } from './AdminLayout'
import type { Category, Player } from '../../types'

const EMPTY_FORM = { name: '', number: '', category: '', photo: '' }

export function AdminPlayers() {
  const { players, loading, reload } = usePlayers(false)

  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Usado para "resetar" o <input type="file"> após cadastrar/editar.
  const [fileKey, setFileKey] = useState(0)
  const [busy, setBusy] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])

  // Carrega as categorias para o <select> (await antes do setState + guarda de
  // montagem, evitando setState síncrono no efeito / após desmontar).
  useEffect(() => {
    let active = true
    async function loadCategories() {
      const cats = await getCategories()
      if (active) setCategories(cats)
    }
    void loadCategories()
    return () => {
      active = false
    }
  }, [])

  // Opções do <select> de categoria. Inclui a categoria atual do formulário
  // mesmo que ela ainda não esteja cadastrada (dados antigos), para que editar
  // um jogador não descarte silenciosamente a categoria dele.
  const categoryOptions = useMemo(() => {
    const names = categories.map((c) => c.name)
    const current = form.category.trim()
    if (current && !names.some((n) => n.toLowerCase() === current.toLowerCase())) {
      return [current, ...names]
    }
    return names
  }, [categories, form.category])

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoError(null)
    try {
      const dataUrl = await fileToResizedDataUrl(file)
      setForm((f) => ({ ...f, photo: dataUrl }))
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Erro ao processar a imagem.')
    }
  }

  function clearPhoto() {
    setForm((f) => ({ ...f, photo: '' }))
    setFileKey((k) => k + 1)
  }

  function startEdit(player: Player) {
    setEditingId(player.id)
    setForm({
      name: player.name,
      number: String(player.number),
      category: player.category ?? '',
      photo: player.photo ?? '',
    })
    setErrors({})
    setPhotoError(null)
    setSubmitError(null)
    setFileKey((k) => k + 1)
    // Leva o admin de volta ao formulário no topo ao iniciar uma edição.
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setSubmitError(null)
    setFileKey((k) => k + 1)
  }

  async function handleSubmitPlayer(event: FormEvent) {
    event.preventDefault()
    const parsed = {
      name: form.name.trim(),
      // Número vazio vira NaN para a validação barrar (em vez de salvar 0).
      number: form.number.trim() === '' ? NaN : Number(form.number),
      // Ao editar, '' limpa o campo; ao cadastrar, vazio não grava nada.
      category: editingId ? form.category.trim() : form.category.trim() || undefined,
      photo: editingId ? form.photo : form.photo || undefined,
    }
    const validation = validatePlayer(parsed)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setBusy(true)
    setSubmitError(null)
    try {
      if (editingId) {
        await updatePlayer(editingId, parsed)
      } else {
        await createPlayer({ ...parsed, active: true })
      }
      cancelEdit()
      await reload()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Não foi possível salvar o jogador.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleActive(id: string, active: boolean) {
    try {
      await setPlayerActive(id, !active)
      await reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível atualizar o jogador.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este jogador? Ele sai da votação e dos resultados.')) return
    if (editingId === id) cancelEdit()
    try {
      await deletePlayer(id)
      await reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível remover o jogador.')
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        icon="users"
        title="Jogadores"
        subtitle="Cadastre, edite e controle quem aparece na votação."
      >
        <span className="badge badge--neutral">{players.length} no total</span>
      </AdminPageHeader>

      {/* Cadastro / edição */}
      <div className="panel">
        <h2>
          {editingId ? 'Editar jogador' : 'Cadastrar jogador'}
        </h2>
        <form className="form" onSubmit={handleSubmitPlayer}>
          <div className="form__row">
            <label className="form__field">
              <span>Nome</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <small className="form__error">{errors.name}</small>}
            </label>
            <label className="form__field">
              <span>Número</span>
              <input
                type="number"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
              />
              {errors.number && <small className="form__error">{errors.number}</small>}
            </label>
          </div>

          <label className="form__field">
            <span>Categoria</span>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              disabled={categories.length === 0}
              aria-describedby={categories.length === 0 ? 'cat-hint' : undefined}
            >
              <option value="">Sem categoria</option>
              {categoryOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <small id="cat-hint" className="form__hint">
                Cadastre uma categoria na tela de Categorias para poder selecioná-la.
              </small>
            )}
          </label>

          <div className="form__field">
            <span id="photo-label">Foto do jogador (opcional)</span>
            <div className="photo-upload">
              {form.photo ? (
                <img className="photo-upload__preview" src={form.photo} alt="Prévia da foto" />
              ) : (
                <span className="photo-upload__placeholder">Sem foto</span>
              )}
              <div className="photo-upload__controls">
                <label className="file-input">
                  <span className="btn btn--ghost btn--sm">
                    <Icon name="image" /> {form.photo ? 'Trocar foto' : 'Escolher foto'}
                  </span>
                  <input
                    key={fileKey}
                    type="file"
                    accept="image/*"
                    aria-labelledby="photo-label"
                    onChange={handlePhotoChange}
                  />
                </label>
                {form.photo && (
                  <button type="button" className="btn btn--ghost btn--sm" onClick={clearPhoto}>
                    <Icon name="trash" /> Remover foto
                  </button>
                )}
              </div>
            </div>
            {photoError && <small className="form__error">{photoError}</small>}
          </div>

          {submitError && <p className="alert alert--error">{submitError}</p>}

          <div className="admin__actions">
            <button className="btn btn--primary" type="submit" disabled={busy}>
              <Icon name={editingId ? 'check' : 'plus'} />
              {editingId ? 'Salvar alterações' : 'Adicionar jogador'}
            </button>
            {editingId && (
              <button className="btn btn--ghost" type="button" onClick={cancelEdit}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista de jogadores */}
      <div className="panel">
        <h2>Jogadores cadastrados</h2>
        {loading ? (
          <Loading />
        ) : players.length === 0 ? (
          <div className="empty-state">
            <Icon name="users" />
            <strong>Nenhum jogador ainda</strong>
            <p>Use o formulário acima para cadastrar o primeiro atleta.</p>
          </div>
        ) : (
          <ul className="player-list">
            {players.map((player) => (
              <li className="player-list__item" key={player.id}>
                {player.photo ? (
                  <img className="player-list__photo" src={player.photo} alt={player.name} />
                ) : (
                  <span className="player-list__photo player-list__photo--empty">
                    {player.number}
                  </span>
                )}

                <div className="player-list__info">
                  <strong className="player-list__name">
                    #{player.number} {player.name}
                  </strong>
                  <span className="player-list__meta">
                    {player.category || 'Sem categoria'}
                    {' · '}
                    <span className={player.active ? 'is-active' : 'is-inactive'}>
                      {player.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </span>
                </div>

                <div className="player-list__actions">
                  <button
                    className="btn btn--ghost btn--sm"
                    type="button"
                    onClick={() => startEdit(player)}
                  >
                    <Icon name="edit" /> Editar
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    type="button"
                    onClick={() => handleToggleActive(player.id, player.active)}
                  >
                    <Icon name="power" />
                    {player.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    className="btn btn--danger btn--sm"
                    type="button"
                    onClick={() => handleDelete(player.id)}
                  >
                    <Icon name="trash" /> Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default AdminPlayers

// Sub-tela GLOBAL de Jogadores: cadastro, edição e gestão de todos os atletas.
// Cada atleta é vinculado a uma votação pelo campo "Votação". A votação só
// consome os atletas ativos vinculados a ela.

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { Link } from 'react-router-dom'
import {
  createPlayer,
  deletePlayer,
  getAllPlayers,
  setPlayerActive,
  updatePlayer,
} from '../../services/playerService'
import { getCategories } from '../../services/categoryService'
import { getVotings } from '../../services/votingService'
import { validatePlayer } from '../../utils/validators'
import { fileToResizedDataUrl } from '../../utils/image'
import { ROUTES } from '../../constants/routes'
import Loading from '../../components/Loading/Loading'
import Icon from '../../components/Icon/Icon'
import { AdminPageHeader } from './AdminLayout'
import type { Category, Player, Voting } from '../../types'

const EMPTY_FORM = { name: '', number: '', category: '', photo: '', votingId: '' }

export function AdminPlayers() {
  const [players, setPlayers] = useState<Player[] | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [votings, setVotings] = useState<Voting[]>([])

  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fileKey, setFileKey] = useState(0)
  const [busy, setBusy] = useState(false)

  const reloadPlayers = useCallback(async () => {
    setPlayers(await getAllPlayers())
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      const [p, c, v] = await Promise.all([getAllPlayers(), getCategories(), getVotings()])
      if (!active) return
      setPlayers(p)
      setCategories(c)
      setVotings(v)
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  // Mapa votingId -> título, para rotular cada atleta na lista.
  const votingTitle = useMemo(() => {
    const map = new Map<string, string>()
    votings.forEach((v) => map.set(v.id, v.title))
    return map
  }, [votings])

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
      votingId: player.votingId,
    })
    setErrors({})
    setPhotoError(null)
    setSubmitError(null)
    setFileKey((k) => k + 1)
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
      number: form.number.trim() === '' ? NaN : Number(form.number),
      category: editingId ? form.category.trim() : form.category.trim() || undefined,
      photo: editingId ? form.photo : form.photo || undefined,
      votingId: form.votingId,
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
      await reloadPlayers()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Não foi possível salvar o atleta.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleActive(id: string, active: boolean) {
    try {
      await setPlayerActive(id, !active)
      await reloadPlayers()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível atualizar o atleta.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este atleta? Ele sai da votação e dos resultados.')) return
    if (editingId === id) cancelEdit()
    try {
      await deletePlayer(id)
      await reloadPlayers()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível remover o atleta.')
    }
  }

  const noVotings = votings.length === 0

  return (
    <div className="admin-page">
      <AdminPageHeader
        icon="users"
        title="Jogadores"
        subtitle="Cadastre os atletas e vincule cada um a uma votação."
      >
        {players && <span className="badge badge--neutral">{players.length} no total</span>}
      </AdminPageHeader>

      {/* Cadastro / edição */}
      <div className="panel">
        <h2>{editingId ? 'Editar atleta' : 'Cadastrar atleta'}</h2>

        {noVotings && (
          <p className="alert alert--info">
            Crie uma votação primeiro em{' '}
            <Link to={ROUTES.ADMIN_VOTINGS}>Votações</Link> para poder vincular o atleta.
          </p>
        )}

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
            <span>Votação</span>
            <select
              value={form.votingId}
              onChange={(e) => setForm({ ...form, votingId: e.target.value })}
              disabled={noVotings}
            >
              <option value="">Selecione a votação</option>
              {votings.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </select>
            {errors.votingId && <small className="form__error">{errors.votingId}</small>}
          </label>

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
            <span id="photo-label">Foto do atleta (opcional)</span>
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

          {submitError && <p className="alert alert--error" role="alert">{submitError}</p>}

          <div className="admin__actions">
            <button className="btn btn--primary" type="submit" disabled={busy || noVotings}>
              <Icon name={editingId ? 'check' : 'plus'} />
              {editingId ? 'Salvar alterações' : 'Adicionar atleta'}
            </button>
            {editingId && (
              <button className="btn btn--ghost" type="button" onClick={cancelEdit}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista de atletas */}
      <div className="panel">
        <h2>Atletas cadastrados</h2>
        {players === null ? (
          <Loading />
        ) : players.length === 0 ? (
          <div className="empty-state">
            <Icon name="users" />
            <strong>Nenhum atleta ainda</strong>
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
                  <span className="player-list__voting">
                    <Icon name="trophy" />
                    {votingTitle.get(player.votingId) ?? 'Sem votação'}
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

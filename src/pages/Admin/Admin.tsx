// Painel administrativo: CRUD de alunos, controle da votação e board de votos.

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { useAuth } from '../../hooks/useAuth'
import { usePlayers } from '../../hooks/usePlayers'
import {
  createPlayer,
  deletePlayer,
  getAllPlayers,
  setPlayerActive,
  updatePlayer,
} from '../../services/playerService'
import {
  closeVoting,
  getSettings,
  openVoting,
} from '../../services/settingsService'
import { getResults, resetVotes } from '../../services/voteService'
import { validatePlayer } from '../../utils/validators'
import { fileToResizedDataUrl } from '../../utils/image'
import Loading from '../../components/Loading/Loading'
import type { Player, PlayerResult, Settings } from '../../types'

const EMPTY_FORM = { name: '', number: '', category: '', photo: '' }

export function Admin() {
  const { user, logout } = useAuth()
  const { players, loading, reload } = usePlayers(false)

  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Usado para "resetar" o <input type="file"> após cadastrar/editar.
  const [fileKey, setFileKey] = useState(0)

  const [settings, setSettings] = useState<Settings | null>(null)
  const [championship, setChampionship] = useState('')
  const [match, setMatch] = useState('')
  const [busy, setBusy] = useState(false)

  const [board, setBoard] = useState<PlayerResult[]>([])

  const reloadBoard = useCallback(async () => {
    const all = await getAllPlayers()
    setBoard(await getResults(all))
  }, [])

  useEffect(() => {
    async function init() {
      const s = await getSettings()
      setSettings(s)
      setChampionship(s.championship)
      setMatch(s.match)
      await reloadBoard()
    }
    void init()
  }, [reloadBoard])

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
      await reloadBoard()
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
      await reloadBoard()
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
      await reloadBoard()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível remover o jogador.')
    }
  }

  async function handleToggleVoting() {
    setBusy(true)
    try {
      if (settings?.votingOpen) {
        await closeVoting()
      } else {
        await openVoting(championship, match)
      }
      setSettings(await getSettings())
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível atualizar a votação.')
    } finally {
      setBusy(false)
    }
  }

  async function handleResetVotes() {
    if (!confirm('Apagar TODOS os votos? Esta ação não pode ser desfeita.')) return
    setBusy(true)
    try {
      await resetVotes()
      await reloadBoard()
      alert('Votação reiniciada.')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível reiniciar a votação.')
    } finally {
      setBusy(false)
    }
  }

  const boardTotal = board.reduce((sum, r) => sum + r.votes, 0)

  return (
    <section className="page page--admin">
      <header className="admin__header">
        <h1>Painel administrativo</h1>
        <div className="admin__user">
          <span>{user?.email}</span>
          <button className="btn btn--ghost" type="button" onClick={() => logout()}>
            Sair
          </button>
        </div>
      </header>

      {/* Controle da votação */}
      <div className="admin__panel">
        <h2>Votação</h2>
        <p>
          Status:{' '}
          <strong>{settings?.votingOpen ? 'Aberta' : 'Encerrada'}</strong>
        </p>
        <div className="form__row">
          <label className="form__field">
            <span>Campeonato</span>
            <input value={championship} onChange={(e) => setChampionship(e.target.value)} />
          </label>
          <label className="form__field">
            <span>Partida</span>
            <input value={match} onChange={(e) => setMatch(e.target.value)} />
          </label>
        </div>
        <div className="admin__actions">
          <button className="btn btn--primary" type="button" disabled={busy} onClick={handleToggleVoting}>
            {settings?.votingOpen ? 'Encerrar votação' : 'Abrir votação'}
          </button>
          <button className="btn btn--danger" type="button" disabled={busy} onClick={handleResetVotes}>
            Reiniciar votação (apagar votos)
          </button>
        </div>
      </div>

      {/* Board de votos — visível só para o admin */}
      <div className="admin__panel">
        <div className="admin__panel-head">
          <h2>Resultados (apenas admin)</h2>
          <button className="btn btn--ghost" type="button" onClick={() => void reloadBoard()}>
            Atualizar
          </button>
        </div>
        <p className="page__subtitle">Total de votos: {boardTotal}</p>
        {board.length === 0 ? (
          <p>Nenhum jogador cadastrado.</p>
        ) : (
          <ul className="board">
            {board.map((r, index) => {
              const pct = boardTotal > 0 ? Math.round((r.votes / boardTotal) * 100) : 0
              return (
                <li className="board__row" key={r.player.id}>
                  <span className="board__pos">{index + 1}º</span>
                  <span className="board__name">
                    {r.player.name}
                    {r.player.category ? ` · ${r.player.category}` : ''}
                  </span>
                  <span className="board__votes">
                    {r.votes} voto{r.votes === 1 ? '' : 's'} · {pct}%
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Cadastro / edição de jogador */}
      <div className="admin__panel">
        <h2>{editingId ? 'Editar jogador' : 'Cadastrar jogador'}</h2>
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
            <span>Categoria (ex.: Sub-15, Adulto)</span>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </label>

          <div className="form__field">
            <span>Foto do jogador (opcional)</span>
            <div className="photo-upload">
              {form.photo ? (
                <img className="photo-upload__preview" src={form.photo} alt="Prévia da foto" />
              ) : (
                <span className="photo-upload__placeholder">Sem foto</span>
              )}
              <div>
                <input
                  key={fileKey}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                {form.photo && (
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={clearPhoto}
                  >
                    Remover foto
                  </button>
                )}
              </div>
            </div>
            {photoError && <small className="form__error">{photoError}</small>}
          </div>

          {submitError && <p className="alert alert--error">{submitError}</p>}

          <div className="admin__actions">
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {editingId ? 'Salvar alterações' : 'Adicionar'}
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
      <div className="admin__panel">
        <h2>Jogadores</h2>
        {loading ? (
          <Loading />
        ) : players.length === 0 ? (
          <p>Nenhum jogador cadastrado.</p>
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
                    className="btn btn--ghost"
                    type="button"
                    onClick={() => startEdit(player)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn--ghost"
                    type="button"
                    onClick={() => handleToggleActive(player.id, player.active)}
                  >
                    {player.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    className="btn btn--danger"
                    type="button"
                    onClick={() => handleDelete(player.id)}
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default Admin

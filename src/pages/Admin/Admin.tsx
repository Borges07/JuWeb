// Painel administrativo: gestão de jogadores e controle da votação.

import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { usePlayers } from '../../hooks/usePlayers'
import {
  createPlayer,
  deletePlayer,
  setPlayerActive,
} from '../../services/playerService'
import {
  closeVoting,
  getSettings,
  openVoting,
} from '../../services/settingsService'
import { resetVotes } from '../../services/voteService'
import { validatePlayer } from '../../utils/validators'
import Loading from '../../components/Loading/Loading'
import type { Settings } from '../../types'

const EMPTY_FORM = { name: '', number: '', photo: '' }

export function Admin() {
  const { user, logout } = useAuth()
  const { players, loading, reload } = usePlayers(false)

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [settings, setSettings] = useState<Settings | null>(null)
  const [match, setMatch] = useState('')
  const [season, setSeason] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s)
      setMatch(s.currentMatch)
      setSeason(s.season)
    })
  }, [])

  async function handleAddPlayer(event: FormEvent) {
    event.preventDefault()
    const parsed = {
      name: form.name.trim(),
      number: Number(form.number),
      photo: form.photo.trim() || undefined,
    }
    const validation = validatePlayer(parsed)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setBusy(true)
    try {
      await createPlayer({ ...parsed, active: true })
      setForm(EMPTY_FORM)
      await reload()
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleActive(id: string, active: boolean) {
    await setPlayerActive(id, !active)
    await reload()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este jogador?')) return
    await deletePlayer(id)
    await reload()
  }

  async function handleToggleVoting() {
    setBusy(true)
    try {
      if (settings?.votingOpen) {
        await closeVoting()
      } else {
        await openVoting(match, season)
      }
      setSettings(await getSettings())
    } finally {
      setBusy(false)
    }
  }

  async function handleResetVotes() {
    if (!confirm('Apagar TODOS os votos? Esta ação não pode ser desfeita.')) return
    setBusy(true)
    try {
      await resetVotes()
      alert('Votação reiniciada.')
    } finally {
      setBusy(false)
    }
  }

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
            <span>Partida atual</span>
            <input value={match} onChange={(e) => setMatch(e.target.value)} />
          </label>
          <label className="form__field">
            <span>Temporada</span>
            <input value={season} onChange={(e) => setSeason(e.target.value)} />
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

      {/* Cadastro de jogador */}
      <div className="admin__panel">
        <h2>Cadastrar jogador</h2>
        <form className="form" onSubmit={handleAddPlayer}>
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
            <span>Foto (URL, opcional)</span>
            <input
              value={form.photo}
              onChange={(e) => setForm({ ...form, photo: e.target.value })}
            />
            {errors.photo && <small className="form__error">{errors.photo}</small>}
          </label>
          <button className="btn btn--primary" type="submit" disabled={busy}>
            Adicionar
          </button>
        </form>
      </div>

      {/* Lista de jogadores */}
      <div className="admin__panel">
        <h2>Jogadores</h2>
        {loading ? (
          <Loading />
        ) : (
          <table className="admin__table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id}>
                  <td>{player.number}</td>
                  <td>{player.name}</td>
                  <td>{player.active ? 'Ativo' : 'Inativo'}</td>
                  <td className="admin__row-actions">
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
                  </td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td colSpan={4}>Nenhum jogador cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

export default Admin

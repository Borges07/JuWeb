// Sub-tela: lista e cria votações. Cada votação tem seu próprio elenco e
// apuração; o controle detalhado fica na tela de gerenciar (AdminVotingManage).

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  createVoting,
  getVotings,
} from '../../services/votingService'
import { PATHS } from '../../constants/routes'
import Loading from '../../components/Loading/Loading'
import Icon from '../../components/Icon/Icon'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import { AdminPageHeader } from './AdminLayout'
import type { Voting } from '../../types'

export function AdminVotings() {
  const [votings, setVotings] = useState<Voting[] | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    setVotings(await getVotings())
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      const data = await getVotings()
      if (active) setVotings(data)
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await createVoting({ title, description })
      setTitle('')
      setDescription('')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a votação.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        icon="trophy"
        title="Votações"
        subtitle="Crie e gerencie quantas votações quiser — cada uma com seus atletas."
      >
        {votings && <span className="badge badge--neutral">{votings.length} no total</span>}
      </AdminPageHeader>

      {/* Nova votação */}
      <div className="panel">
        <h2>Nova votação</h2>
        <p className="page__subtitle">
          Ela nasce como rascunho. Depois você cadastra os atletas e abre a votação.
        </p>
        <form className="form" onSubmit={handleCreate}>
          <label className="form__field">
            <span>Nome da votação</span>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setError(null)
              }}
              placeholder="Ex.: Destaque do Campeonato Regional 2026"
            />
          </label>
          <label className="form__field">
            <span>Campeonato / escola (opcional)</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: Escola Celina Amaral · Sub-10"
            />
          </label>
          {error && <p className="alert alert--error">{error}</p>}
          <div className="admin__actions">
            <button
              className="btn btn--primary"
              type="submit"
              disabled={busy || title.trim() === ''}
            >
              <Icon name="plus" /> Criar votação
            </button>
          </div>
        </form>
      </div>

      {/* Lista de votações */}
      <div className="panel">
        <h2>Suas votações</h2>
        {votings === null ? (
          <Loading />
        ) : votings.length === 0 ? (
          <div className="empty-state">
            <Icon name="trophy" />
            <strong>Nenhuma votação ainda</strong>
            <p>Crie a primeira votação no formulário acima.</p>
          </div>
        ) : (
          <ul className="voting-list">
            {votings.map((voting) => (
              <li className="voting-row" key={voting.id}>
                <div className="voting-row__info">
                  <div className="voting-row__title">
                    <strong>{voting.title}</strong>
                    <StatusBadge status={voting.status} />
                  </div>
                  {voting.description && (
                    <span className="voting-row__desc">{voting.description}</span>
                  )}
                </div>
                <Link
                  className="btn btn--soft btn--sm"
                  to={PATHS.adminVotingManage(voting.id)}
                >
                  Gerenciar <Icon name="arrow-right" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default AdminVotings

// Tela de gerenciar UMA votação: controle de status (abrir/pausar/encerrar/
// reabrir), edição de dados, exclusão e reinício de votos — além do cadastro
// de atletas e do dash de resultados (componentes reutilizáveis).
//
// O componente exportado remonta a tela a cada troca de votação (key={votingId}),
// zerando o estado local e o dos componentes filhos (atletas/resultados).

import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteVoting,
  getVoting,
  setVotingStatus,
  updateVoting,
} from '../../services/votingService'
import { resetVotes } from '../../services/voteService'
import { ROUTES } from '../../constants/routes'
import Loading from '../../components/Loading/Loading'
import Icon from '../../components/Icon/Icon'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import VotingPlayersModal from './voting/VotingPlayersModal'
import ResultsBoard from './voting/ResultsBoard'
import type { Voting, VotingStatus } from '../../types'

interface ActionMsg {
  type: 'error' | 'info'
  text: string
}

function AdminVotingManageView({ votingId }: { votingId: string }) {
  const navigate = useNavigate()

  // undefined = carregando, null = não encontrada, Voting = ok.
  const [voting, setVoting] = useState<Voting | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  // Status sendo aplicado (para rótulo de progresso no botão correspondente).
  const [pending, setPending] = useState<VotingStatus | null>(null)
  const [msg, setMsg] = useState<ActionMsg | null>(null)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [showPlayers, setShowPlayers] = useState(false)
  // Incrementado ao alterar atletas no modal — força o ResultsBoard a recarregar.
  const [boardRefresh, setBoardRefresh] = useState(0)

  const load = useCallback(async () => {
    setVoting(await getVoting(votingId))
  }, [votingId])

  const closePlayers = useCallback(() => setShowPlayers(false), [])

  useEffect(() => {
    let active = true
    async function run() {
      const data = await getVoting(votingId)
      if (active) setVoting(data ?? null)
    }
    void run()
    return () => {
      active = false
    }
  }, [votingId])

  async function changeStatus(status: VotingStatus) {
    setBusy(true)
    setPending(status)
    setMsg(null)
    try {
      await setVotingStatus(votingId, status)
      await load()
    } catch (err) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Não foi possível atualizar o status.',
      })
    } finally {
      setBusy(false)
      setPending(null)
    }
  }

  function startEditing(v: Voting) {
    setEditTitle(v.title)
    setEditDesc(v.description)
    setMsg(null)
    setEditing(true)
  }

  async function saveEditing() {
    if (editTitle.trim() === '') return
    setBusy(true)
    setMsg(null)
    try {
      await updateVoting(votingId, { title: editTitle, description: editDesc })
      setEditing(false)
      await load()
    } catch (err) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Não foi possível salvar.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleResetVotes() {
    if (!confirm('Apagar TODOS os votos desta votação? Esta ação não pode ser desfeita.'))
      return
    setBusy(true)
    setMsg(null)
    try {
      await resetVotes(votingId)
      setMsg({ type: 'info', text: 'Votos reiniciados.' })
    } catch (err) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Não foi possível reiniciar os votos.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        'Excluir esta votação? Atletas e votos dela serão apagados. Esta ação não pode ser desfeita.',
      )
    )
      return
    setBusy(true)
    setMsg(null)
    try {
      await deleteVoting(votingId)
      navigate(ROUTES.ADMIN_VOTINGS, { replace: true })
    } catch (err) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Não foi possível excluir a votação.',
      })
      setBusy(false)
    }
  }

  if (voting === undefined) {
    return (
      <div className="admin-page">
        <Link className="admin-back" to={ROUTES.ADMIN_VOTINGS}>
          <Icon name="arrow-left" /> Votações
        </Link>
        <Loading label="Carregando votação..." />
      </div>
    )
  }

  if (voting === null) {
    return (
      <div className="admin-page">
        <Link className="admin-back" to={ROUTES.ADMIN_VOTINGS}>
          <Icon name="arrow-left" /> Votações
        </Link>
        <div className="empty-state">
          <Icon name="alert" />
          <strong>Votação não encontrada</strong>
          <p>Ela pode ter sido excluída.</p>
        </div>
      </div>
    )
  }

  const { status } = voting

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <Link className="admin-back" to={ROUTES.ADMIN_VOTINGS}>
          <Icon name="arrow-left" /> Votações
        </Link>
        <div className="section-head">
          <span className="section-head__icon">
            <Icon name="trophy" />
          </span>
          <div className="section-head__text">
            <h1>{voting.title}</h1>
            {voting.description && <p>{voting.description}</p>}
          </div>
          <div className="section-head__actions">
            <StatusBadge status={status} />
          </div>
        </div>
      </div>

      {/* Controle de status + edição */}
      <div className="panel">
        <div className="section-head">
          <span className="section-head__icon">
            <Icon name="sliders" />
          </span>
          <div className="section-head__text">
            <h2>Controle da votação</h2>
            <p>Abra, pause ou encerre — o público só vê votações abertas e pausadas.</p>
          </div>
        </div>

        {editing ? (
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault()
              void saveEditing()
            }}
          >
            <label className="form__field">
              <span>Nome da votação</span>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </label>
            <label className="form__field">
              <span>Campeonato / escola</span>
              <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </label>
            <div className="admin__actions">
              <button
                className="btn btn--primary"
                type="submit"
                disabled={busy || editTitle.trim() === ''}
              >
                <Icon name="check" /> Salvar
              </button>
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => setEditing(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="admin__actions">
            {status === 'rascunho' && (
              <button
                className="btn btn--primary"
                type="button"
                disabled={busy}
                aria-busy={pending === 'aberta'}
                onClick={() => changeStatus('aberta')}
              >
                <Icon name="play" /> {pending === 'aberta' ? 'Abrindo...' : 'Abrir votação'}
              </button>
            )}
            {status === 'aberta' && (
              <>
                <button
                  className="btn btn--soft"
                  type="button"
                  disabled={busy}
                  aria-busy={pending === 'pausada'}
                  onClick={() => changeStatus('pausada')}
                >
                  <Icon name="power" /> {pending === 'pausada' ? 'Pausando...' : 'Pausar'}
                </button>
                <button
                  className="btn btn--danger"
                  type="button"
                  disabled={busy}
                  aria-busy={pending === 'encerrada'}
                  onClick={() => changeStatus('encerrada')}
                >
                  <Icon name="check" /> {pending === 'encerrada' ? 'Encerrando...' : 'Encerrar'}
                </button>
              </>
            )}
            {status === 'pausada' && (
              <>
                <button
                  className="btn btn--primary"
                  type="button"
                  disabled={busy}
                  aria-busy={pending === 'aberta'}
                  onClick={() => changeStatus('aberta')}
                >
                  <Icon name="play" /> {pending === 'aberta' ? 'Retomando...' : 'Retomar'}
                </button>
                <button
                  className="btn btn--danger"
                  type="button"
                  disabled={busy}
                  aria-busy={pending === 'encerrada'}
                  onClick={() => changeStatus('encerrada')}
                >
                  <Icon name="check" /> {pending === 'encerrada' ? 'Encerrando...' : 'Encerrar'}
                </button>
              </>
            )}
            {status === 'encerrada' && (
              <button
                className="btn btn--soft"
                type="button"
                disabled={busy}
                aria-busy={pending === 'aberta'}
                onClick={() => changeStatus('aberta')}
              >
                <Icon name="refresh" /> {pending === 'aberta' ? 'Reabrindo...' : 'Reabrir'}
              </button>
            )}
            <button
              className="btn btn--ghost"
              type="button"
              disabled={busy}
              onClick={() => startEditing(voting)}
            >
              <Icon name="edit" /> Editar dados
            </button>
          </div>
        )}

        {msg && (
          <p
            className={msg.type === 'error' ? 'alert alert--error' : 'alert alert--info'}
            role={msg.type === 'error' ? 'alert' : 'status'}
          >
            {msg.text}
          </p>
        )}
      </div>

      {/* Atletas desta votação (cadastro fica na tela global de Jogadores) */}
      <div className="panel">
        <div className="section-head">
          <span className="section-head__icon">
            <Icon name="users" />
          </span>
          <div className="section-head__text">
            <h2>Atletas</h2>
            <p>Ative, desative ou remova quem participa. O cadastro fica em Jogadores.</p>
          </div>
          <div className="section-head__actions">
            <button
              className="btn btn--soft"
              type="button"
              onClick={() => setShowPlayers(true)}
            >
              <Icon name="users" /> Gerenciar jogadores
            </button>
          </div>
        </div>
      </div>

      {/* Resultados (remontado quando os atletas mudam no modal) */}
      <ResultsBoard key={boardRefresh} votingId={votingId} />

      {/* Zona de risco */}
      <div className="panel panel--danger">
        <h2>Zona de risco</h2>
        <p className="page__subtitle">
          Reiniciar apaga todos os votos desta votação. Excluir remove a votação,
          seus atletas e votos. Ambas são irreversíveis.
        </p>
        <div className="admin__actions">
          <button
            className="btn btn--ghost"
            type="button"
            disabled={busy}
            onClick={handleResetVotes}
          >
            <Icon name="refresh" /> Reiniciar votos
          </button>
          <button
            className="btn btn--danger"
            type="button"
            disabled={busy}
            onClick={handleDelete}
          >
            <Icon name="trash" /> Excluir votação
          </button>
        </div>
      </div>

      {showPlayers && (
        <VotingPlayersModal
          votingId={votingId}
          votingTitle={voting.title}
          onClose={closePlayers}
          onChanged={() => setBoardRefresh((n) => n + 1)}
        />
      )}
    </div>
  )
}

// Remonta a cada troca de votação (key) para zerar estado local e filhos.
export function AdminVotingManage() {
  const { votingId = '' } = useParams()
  return <AdminVotingManageView key={votingId} votingId={votingId} />
}

export default AdminVotingManage

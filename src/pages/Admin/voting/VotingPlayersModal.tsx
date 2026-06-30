// Modal para GERENCIAR os atletas de uma votação (ativar/desativar e remover).
// O cadastro/edição completo é feito na tela global de Jogadores — aqui é só o
// controle rápido de quem participa desta votação.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  deletePlayer,
  getPlayersByVoting,
  setPlayerActive,
} from '../../../services/playerService'
import { ROUTES } from '../../../constants/routes'
import Loading from '../../../components/Loading/Loading'
import Icon from '../../../components/Icon/Icon'
import type { Player } from '../../../types'

interface Props {
  votingId: string
  votingTitle: string
  onClose: () => void
  /** Chamado após alterar/remover, para a tela-mãe atualizar contagens. */
  onChanged?: () => void
}

export function VotingPlayersModal({ votingId, votingTitle, onClose, onChanged }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [players, setPlayers] = useState<Player[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    try {
      setPlayers(await getPlayersByVoting(votingId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os atletas.')
    }
  }, [votingId])

  // Carga dos atletas — só re-executa se a votação mudar.
  useEffect(() => {
    let active = true
    getPlayersByVoting(votingId)
      .then((p) => {
        if (active) setPlayers(p)
      })
      .catch((err) => {
        if (active)
          setError(err instanceof Error ? err.message : 'Não foi possível carregar os atletas.')
      })
    return () => {
      active = false
    }
  }, [votingId])

  // Teclado (Esc), trava de scroll do fundo e foco inicial no diálogo.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  async function toggle(player: Player) {
    setBusyId(player.id)
    try {
      await setPlayerActive(player.id, !player.active)
      await reload()
      onChanged?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível atualizar o atleta.')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(player: Player) {
    if (!confirm(`Remover ${player.name} desta votação? Esta ação não pode ser desfeita.`)) return
    setBusyId(player.id)
    try {
      await deletePlayer(player.id)
      await reload()
      onChanged?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível remover o atleta.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal modal--wide"
        role="dialog"
        aria-modal="true"
        aria-label={`Gerenciar atletas de ${votingTitle}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal__close" type="button" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <div className="section-head">
          <span className="section-head__icon">
            <Icon name="users" />
          </span>
          <div className="section-head__text">
            <h2>Gerenciar atletas</h2>
            <p>
              Ative, desative ou remova. Para cadastrar ou editar, use a tela de{' '}
              <Link to={ROUTES.ADMIN_PLAYERS} onClick={onClose}>
                Jogadores
              </Link>
              .
            </p>
          </div>
        </div>

        {error ? (
          <div className="empty-state">
            <Icon name="alert" />
            <strong>Erro ao carregar</strong>
            <p>{error}</p>
            <button className="btn btn--ghost btn--sm" type="button" onClick={() => void reload()}>
              <Icon name="refresh" /> Tentar de novo
            </button>
          </div>
        ) : players === null ? (
          <Loading label="Carregando atletas..." />
        ) : players.length === 0 ? (
          <div className="empty-state">
            <Icon name="users" />
            <strong>Nenhum atleta nesta votação</strong>
            <p>
              Cadastre atletas em{' '}
              <Link to={ROUTES.ADMIN_PLAYERS} onClick={onClose}>
                Jogadores
              </Link>{' '}
              e vincule-os a esta votação.
            </p>
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
                    disabled={busyId === player.id}
                    onClick={() => toggle(player)}
                  >
                    <Icon name="power" />
                    {player.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    className="btn btn--danger btn--sm"
                    type="button"
                    disabled={busyId === player.id}
                    onClick={() => remove(player)}
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

export default VotingPlayersModal

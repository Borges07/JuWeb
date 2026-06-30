// Sub-tela: controle da votação — abrir/encerrar, definir campeonato e partida,
// e reiniciar (apagar todos os votos).

import { useEffect, useState } from 'react'
import {
  closeVoting,
  getSettings,
  openVoting,
} from '../../services/settingsService'
import { resetVotes } from '../../services/voteService'
import Loading from '../../components/Loading/Loading'
import Icon from '../../components/Icon/Icon'
import { AdminPageHeader } from './AdminLayout'
import type { Settings } from '../../types'

export function AdminVoting() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [championship, setChampionship] = useState('')
  const [match, setMatch] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      const s = await getSettings()
      if (!active) return
      setSettings(s)
      setChampionship(s.championship)
      setMatch(s.match)
    }
    void load()
    return () => {
      active = false
    }
  }, [])

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
      alert('Votação reiniciada.')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível reiniciar a votação.')
    } finally {
      setBusy(false)
    }
  }

  const open = settings?.votingOpen ?? false

  return (
    <div className="admin-page">
      <AdminPageHeader
        icon="sliders"
        title="Votação"
        subtitle="Abra ou encerre a votação e configure a partida atual."
      >
        {settings &&
          (open ? (
            <span className="badge badge--success">
              <span className="badge__dot" /> Aberta
            </span>
          ) : (
            <span className="badge badge--neutral">Encerrada</span>
          ))}
      </AdminPageHeader>

      {!settings ? (
        <Loading label="Carregando configurações..." />
      ) : (
        <>
          <div className="panel">
            <h2>Partida atual</h2>
            <p className="page__subtitle">
              Esses dados aparecem no topo da tela pública de votação.
            </p>
            <div className="form">
              <div className="form__row">
                <label className="form__field">
                  <span>Campeonato</span>
                  <input
                    value={championship}
                    onChange={(e) => setChampionship(e.target.value)}
                    placeholder="Ex.: Liga Regional 2026"
                    disabled={open}
                  />
                </label>
                <label className="form__field">
                  <span>Partida</span>
                  <input
                    value={match}
                    onChange={(e) => setMatch(e.target.value)}
                    placeholder="Ex.: ADEC x Time B"
                    disabled={open}
                  />
                </label>
              </div>
              {open && (
                <p className="form__hint">
                  Encerre a votação para alterar campeonato e partida — eles são
                  definidos ao abrir a votação.
                </p>
              )}
              <div className="admin__actions">
                <button
                  className={open ? 'btn btn--danger' : 'btn btn--primary'}
                  type="button"
                  disabled={busy}
                  onClick={handleToggleVoting}
                >
                  <Icon name={open ? 'power' : 'play'} />
                  {open ? 'Encerrar votação' : 'Abrir votação'}
                </button>
              </div>
            </div>
          </div>

          <div className="panel panel--danger">
            <h2>Zona de risco</h2>
            <p className="page__subtitle">
              Reiniciar apaga permanentemente todos os votos registrados. Use
              apenas ao iniciar uma nova partida.
            </p>
            <div className="admin__actions">
              <button
                className="btn btn--danger"
                type="button"
                disabled={busy}
                onClick={handleResetVotes}
              >
                <Icon name="refresh" /> Reiniciar votação (apagar votos)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminVoting

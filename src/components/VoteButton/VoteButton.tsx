// Botão de confirmação do voto.

interface VoteButtonProps {
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}

export function VoteButton({ disabled, loading, onClick }: VoteButtonProps) {
  return (
    <button
      type="button"
      className="vote-button"
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? 'Registrando...' : 'Confirmar voto'}
    </button>
  )
}

export default VoteButton

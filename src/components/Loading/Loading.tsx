// Indicador de carregamento simples e reutilizável.

export function Loading({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="loading__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export default Loading

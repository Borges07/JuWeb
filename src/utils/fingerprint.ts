// Fingerprint do dispositivo — 2ª camada de proteção contra votos duplicados.
//
// NÃO é login e NÃO exige cadastro. Combina características do navegador
// (navegador, SO, idioma, timezone, resolução, núcleos de CPU, etc.) para
// gerar uma "assinatura" estável do dispositivo.
//
// Limitações conhecidas (conforme especificação):
//   Protege contra: F5, atualizar página, fechar/reabrir o navegador.
//   NÃO protege totalmente contra: limpar o navegador, aba anônima,
//   troca de dispositivo, usuários avançados.
// É suficiente para uma votação esportiva simples.
//
// Obs.: para algo mais robusto no futuro, dá para trocar por uma lib dedicada
// como @fingerprintjs/fingerprintjs sem mudar a interface deste módulo.

const FINGERPRINT_KEY = 'juju:fingerprint'

/** Coleta sinais do navegador que tendem a ser estáveis no mesmo dispositivo. */
function collectSignals(): string {
  const nav = navigator as Navigator & { deviceMemory?: number }
  const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`

  const signals = [
    nav.userAgent,
    nav.language,
    (nav.languages || []).join(','),
    nav.platform,
    nav.hardwareConcurrency ?? 'na',
    nav.deviceMemory ?? 'na',
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    new Date().getTimezoneOffset(),
    screenInfo,
    window.devicePixelRatio,
  ]

  return signals.join('|')
}

/** Hash determinístico simples (FNV-1a 32 bits) para reduzir o texto a um id curto. */
function hash(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  // Converte para hexadecimal sem sinal.
  return (h >>> 0).toString(16).padStart(8, '0')
}

/**
 * Retorna o fingerprint do dispositivo. O valor é gerado uma vez e guardado
 * no LocalStorage para se manter estável mesmo que algum sinal varie.
 */
export function getFingerprint(): string {
  try {
    const cached = localStorage.getItem(FINGERPRINT_KEY)
    if (cached) return cached
  } catch {
    // LocalStorage indisponível (ex.: modo restrito) — segue sem cache.
  }

  const fingerprint = hash(collectSignals())

  try {
    localStorage.setItem(FINGERPRINT_KEY, fingerprint)
  } catch {
    // Ignora falha ao persistir; o fingerprint ainda é utilizável nesta sessão.
  }

  return fingerprint
}

// Processa a foto enviada no admin: redimensiona e comprime para um data URL
// (base64) pequeno, que é salvo direto no campo `photo` do jogador no Firestore.
//
// Por que data URL e não Firebase Storage?
//   Mantém a configuração mínima (só Firestore + Auth, sem ativar o Storage).
//   Para fotos pequenas de jogadores é suficiente e cabe folgado no limite de
//   1 MB por documento do Firestore. Dá para migrar para o Storage depois sem
//   mudar a interface do app (o campo continua sendo `photo`).

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Arquivo de imagem inválido.'))
    img.src = src
  })
}

/** Calcula as dimensões mantendo a proporção, limitadas a `max`. */
function fitWithin(w: number, h: number, max: number): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h }
  const ratio = w / h
  return ratio >= 1
    ? { width: max, height: Math.round(max / ratio) }
    : { width: Math.round(max * ratio), height: max }
}

/**
 * Converte um arquivo de imagem em um data URL JPEG redimensionado.
 * @param file   Arquivo selecionado no <input type="file">.
 * @param max    Maior lado da imagem final, em pixels (padrão 512 — nítido no modal).
 * @param quality Qualidade do JPEG, de 0 a 1 (padrão 0.8).
 */
export async function fileToResizedDataUrl(
  file: File,
  max = 512,
  quality = 0.8,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem.')
  }

  const original = await readAsDataUrl(file)
  const img = await loadImage(original)
  const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, max)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível processar a imagem.')

  // Fundo branco para fotos sem transparência ficarem corretas em JPEG.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', quality)
}

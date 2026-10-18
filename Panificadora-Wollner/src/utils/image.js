// Reduz fotos no navegador antes do envio (rápido para o catálogo e dentro do limite de upload).

const MAX_BYTES = 3.5 * 1024 * 1024

function loadBitmap(file) {
  if ('createImageBitmap' in window) return createImageBitmap(file)
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler esta imagem.'))
    }
    img.src = url
  })
}

function toBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

export async function prepareImage(file, { maxSide = 1600, keepTransparency = false } = {}) {
  if (!file.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem (JPG, PNG ou WebP).')

  let bitmap
  try {
    bitmap = await loadBitmap(file)
  } catch {
    throw new Error('Não foi possível ler esta imagem. Tente outro arquivo.')
  }

  let side = maxSide
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = keepTransparency
      ? await toBlob(canvas, 'image/png')
      : (await toBlob(canvas, 'image/webp', 0.82)) || (await toBlob(canvas, 'image/jpeg', 0.85))
    if (blob && blob.size <= MAX_BYTES) return blob
    side = Math.round(side * 0.75)
  }
  throw new Error('A imagem continua muito grande após reduzir. Tente uma foto menor.')
}

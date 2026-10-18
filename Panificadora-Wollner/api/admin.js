// Ações do painel administrativo: /api/admin/<ação>
//   session | login | logout | load | save | upload
import {
  authConfigured,
  checkCredentials,
  clearLoginFailures,
  currentSession,
  endSession,
  hasCsrfHeader,
  loginBlocked,
  registerLoginFailure,
  startSession,
} from './_lib/auth.js'
import { getAction, readBuffer, readJson, sendError, sendJson } from './_lib/http.js'
import { sanitizeContent, ValidationError } from './_lib/sanitize.js'
import {
  IMAGE_TYPES,
  collectImageUrls,
  deleteImages,
  readContent,
  saveImage,
  storageLabel,
  storageReady,
  writeContent,
} from './_lib/storage.js'

const NO_STORE = { 'Cache-Control': 'no-store' }
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

function sniffImageType(buffer) {
  if (buffer.length > 12) {
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
    if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
    if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return 'image/webp'
  }
  return null
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default async function handler(req, res) {
  const action = getAction(req)

  try {
    if (!authConfigured()) {
      return sendError(res, 503, 'Painel não configurado. Defina ADMIN_USER, ADMIN_PASSWORD_HASH e SESSION_SECRET (veja o README).', { code: 'not_configured' })
    }

    if (action === 'session' && req.method === 'GET') {
      const session = currentSession(req)
      return sendJson(res, 200, { authenticated: Boolean(session), storage: storageLabel(), storageReady: storageReady() }, NO_STORE)
    }

    if (req.method !== 'POST') return sendError(res, 405, 'Método não permitido.')
    if (!hasCsrfHeader(req)) return sendError(res, 403, 'Requisição não autorizada.')

    if (action === 'login') {
      if (loginBlocked(req)) return sendError(res, 429, 'Muitas tentativas. Aguarde alguns minutos e tente de novo.')
      const { user, password } = await readJson(req, 10_000)
      if (checkCredentials(user ?? '', password ?? '')) {
        clearLoginFailures(req)
        startSession(req, res, process.env.ADMIN_USER)
        return sendJson(res, 200, { ok: true }, NO_STORE)
      }
      registerLoginFailure(req)
      await wait(700)
      return sendError(res, 401, 'Usuário ou senha incorretos.')
    }

    if (action === 'logout') {
      endSession(req, res)
      return sendJson(res, 200, { ok: true }, NO_STORE)
    }

    // Daqui para baixo, só com sessão válida.
    if (!currentSession(req)) return sendError(res, 401, 'Sessão expirada. Entre novamente.', { code: 'unauthenticated' })

    if (action === 'load') {
      const content = await readContent({ fresh: true })
      return sendJson(res, 200, { content, storage: storageLabel(), storageReady: storageReady() }, NO_STORE)
    }

    if (action === 'save') {
      if (!storageReady()) return sendError(res, 503, 'Armazenamento não configurado: nada foi salvo. Veja o README (Vercel Blob).')
      const body = await readJson(req, 1_500_000)
      const clean = sanitizeContent(body.content)

      const current = await readContent({ fresh: true })
      if ((body.baseVersion ?? '') !== (current.updatedAt ?? '')) {
        return sendError(res, 409, 'O conteúdo foi alterado em outra sessão. Recarregue o painel para não perder alterações de outra pessoa.', { code: 'conflict' })
      }

      clean.updatedAt = new Date().toISOString()
      await writeContent(clean)

      // Remove do armazenamento as fotos que deixaram de ser usadas.
      const stillUsed = collectImageUrls(clean)
      const removed = [...collectImageUrls(current)].filter((url) => !stillUsed.has(url))
      await deleteImages(removed).catch((error) => console.error('Falha ao limpar imagens antigas:', error))

      return sendJson(res, 200, { content: clean }, NO_STORE)
    }

    if (action === 'upload') {
      if (!storageReady()) return sendError(res, 503, 'Armazenamento não configurado: a foto não foi enviada. Veja o README (Vercel Blob).')
      const buffer = await readBuffer(req, MAX_UPLOAD_BYTES)
      const type = sniffImageType(buffer)
      if (!type || !IMAGE_TYPES[type]) return sendError(res, 415, 'Envie uma imagem JPG, PNG ou WebP.')
      const url = await saveImage(buffer, type)
      return sendJson(res, 200, { url }, NO_STORE)
    }

    return sendError(res, 404, 'Ação não encontrada.')
  } catch (error) {
    if (error instanceof ValidationError) {
      return sendError(res, 422, 'Corrija os campos e tente salvar de novo.', { details: error.errors })
    }
    if (error?.status) return sendError(res, error.status, error.message)
    console.error('Erro no painel:', error)
    return sendError(res, 500, 'Erro inesperado no servidor. Tente novamente.')
  }
}

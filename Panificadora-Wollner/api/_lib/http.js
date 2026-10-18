// Utilitários HTTP usando apenas a API padrão do Node (funcionam na Vercel e no servidor local do Vite).

export function sendJson(res, status, body, headers = {}) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value)
  res.end(JSON.stringify(body))
}

export function sendError(res, status, message, extra = {}) {
  sendJson(res, status, { error: message, ...extra }, {
    'Cache-Control': 'no-store',
    ...(status === 413 ? { Connection: 'close' } : {}),
  })
}

function tooLarge() {
  const error = new Error('Arquivo grande demais.')
  error.status = 413
  return error
}

async function readStream(req, limitBytes) {
  const declared = Number(req.headers['content-length'])
  if (Number.isFinite(declared) && declared > limitBytes) throw tooLarge()

  const chunks = []
  let size = 0
  let exceeded = false
  // Continua lendo (sem guardar) até o fim, para não derrubar a conexão no meio do envio.
  for await (const chunk of req) {
    size += chunk.length
    if (size > limitBytes) exceeded = true
    else chunks.push(chunk)
  }
  if (exceeded) throw tooLarge()
  return Buffer.concat(chunks)
}

// Na Vercel o corpo pode já vir lido em req.body; no servidor local vem pelo stream.
export async function readBuffer(req, limitBytes) {
  if (Buffer.isBuffer(req.body)) {
    if (req.body.length > limitBytes) throw tooLarge()
    return req.body
  }
  if (typeof req.body === 'string') return Buffer.from(req.body)
  return readStream(req, limitBytes)
}

export async function readJson(req, limitBytes = 1_000_000) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body
  const buffer = await readBuffer(req, limitBytes)
  try {
    return JSON.parse(buffer.toString('utf8') || '{}')
  } catch {
    const error = new Error('JSON inválido.')
    error.status = 400
    throw error
  }
}

export function parseCookies(req) {
  const header = req.headers.cookie || ''
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=')
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))]
      }),
  )
}

export function isSecureRequest(req) {
  return req.headers['x-forwarded-proto'] === 'https' || Boolean(req.socket?.encrypted)
}

export function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) return String(forwarded).split(',')[0].trim()
  return req.socket?.remoteAddress || 'desconhecido'
}

// A ação vem de /api/admin?action=login (rewrite da Vercel) ou de /api/admin/login.
export function getAction(req) {
  const url = new URL(req.url, 'http://localhost')
  const fromQuery = url.searchParams.get('action')
  if (fromQuery) return fromQuery
  const match = /^\/api\/admin\/([a-z-]+)\/?$/.exec(url.pathname)
  return match ? match[1] : ''
}

import crypto from 'node:crypto'
import { clientIp, isSecureRequest, parseCookies } from './http.js'

const COOKIE_NAME = 'wollner_session'
const SESSION_HOURS = 12

export function authConfigured() {
  return Boolean(
    process.env.ADMIN_USER && process.env.ADMIN_PASSWORD_HASH && process.env.SESSION_SECRET,
  )
}

// Formato do hash: scrypt:N:r:p:salt:hash (gerado por `npm run hash-password`).
// Usa ":" e base64url de propósito: o caractere "$" é interpretado como variável em arquivos .env.
export function hashPassword(password) {
  const N = 16384
  const r = 8
  const p = 1
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, 64, { N, r, p })
  return `scrypt:${N}:${r}:${p}:${salt.toString('base64url')}:${hash.toString('base64url')}`
}

function verifyPassword(password, stored) {
  const [scheme, N, r, p, saltB64, hashB64] = String(stored).trim().split(':')
  if (scheme !== 'scrypt' || !hashB64) return false
  const expected = Buffer.from(hashB64, 'base64url')
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64url'), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  })
  return crypto.timingSafeEqual(actual, expected)
}

function safeEqualText(a, b) {
  const left = crypto.createHash('sha256').update(String(a)).digest()
  const right = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(left, right)
}

export function checkCredentials(user, password) {
  const userOk = safeEqualText(user, process.env.ADMIN_USER)
  const passOk = verifyPassword(String(password), process.env.ADMIN_PASSWORD_HASH)
  return userOk && passOk
}

function sign(payload) {
  return crypto.createHmac('sha256', process.env.SESSION_SECRET).update(payload).digest('base64url')
}

function createToken(user) {
  const expires = Date.now() + SESSION_HOURS * 3600 * 1000
  const payload = Buffer.from(JSON.stringify({ u: user, exp: expires })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

function readToken(token) {
  const [payload, signature] = String(token || '').split('.')
  if (!payload || !signature) return null
  const expected = sign(payload)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return data.exp > Date.now() ? data : null
  } catch {
    return null
  }
}

export function startSession(req, res, user) {
  const flags = ['HttpOnly', 'SameSite=Strict', 'Path=/', `Max-Age=${SESSION_HOURS * 3600}`]
  if (isSecureRequest(req)) flags.push('Secure')
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${createToken(user)}; ${flags.join('; ')}`)
}

export function endSession(req, res) {
  const flags = ['HttpOnly', 'SameSite=Strict', 'Path=/', 'Max-Age=0']
  if (isSecureRequest(req)) flags.push('Secure')
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; ${flags.join('; ')}`)
}

export function currentSession(req) {
  if (!authConfigured()) return null
  return readToken(parseCookies(req)[COOKIE_NAME])
}

// Proteção extra contra requisições vindas de outros sites: o navegador não envia
// cabeçalhos personalizados entre origens sem permissão.
export function hasCsrfHeader(req) {
  return req.headers['x-wollner-admin'] === '1'
}

// Limite simples de tentativas de login por IP. Em ambiente serverless a memória
// não é compartilhada entre instâncias, então isto é uma proteção "melhor esforço".
const attempts = new Map()
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 8

export function loginBlocked(req) {
  const entry = attempts.get(clientIp(req))
  if (!entry) return false
  if (Date.now() - entry.first > WINDOW_MS) {
    attempts.delete(clientIp(req))
    return false
  }
  return entry.count >= MAX_ATTEMPTS
}

export function registerLoginFailure(req) {
  const ip = clientIp(req)
  const entry = attempts.get(ip)
  if (!entry || Date.now() - entry.first > WINDOW_MS) attempts.set(ip, { count: 1, first: Date.now() })
  else entry.count += 1
}

export function clearLoginFailures(req) {
  attempts.delete(clientIp(req))
}

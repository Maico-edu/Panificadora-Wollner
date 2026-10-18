// Testes automáticos de lógica e da API (rodam sem internet): npm run test:api
// Usam uma pasta temporária para os dados; nada do projeto é alterado.
import assert from 'node:assert/strict'
import http from 'node:http'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wollner-test-'))
const projectRoot = process.cwd()
process.chdir(tmp)
delete process.env.VERCEL
delete process.env.BLOB_READ_WRITE_TOKEN
delete process.env.BLOB_STORE_ID

const { hashPassword } = await import(path.join(projectRoot, 'api/_lib/auth.js'))
process.env.ADMIN_USER = 'tester'
process.env.ADMIN_PASSWORD_HASH = hashPassword('senha-correta-123')
process.env.SESSION_SECRET = 'segredo-de-teste-segredo-de-teste'

const whatsapp = await import(path.join(projectRoot, 'shared/whatsapp.js'))
const company = await import(path.join(projectRoot, 'shared/company.js'))
const { defaultContent } = await import(path.join(projectRoot, 'shared/defaultContent.js'))
const content = (await import(path.join(projectRoot, 'api/content.js'))).default
const admin = (await import(path.join(projectRoot, 'api/admin.js'))).default

let passed = 0
async function test(name, fn) {
  try {
    await fn()
    passed += 1
    console.log(`  ok  ${name}`)
  } catch (error) {
    console.error(`FAIL  ${name}\n`, error)
    process.exitCode = 1
  }
}

console.log('\nLógica (WhatsApp, preços, tempo de atuação)')

await test('renderTemplate substitui variáveis e remove linhas vazias', () => {
  const out = whatsapp.renderTemplate('Quero {produto}.\nQuantidade: {quantidade}\nObs: {observacoes}', {
    produto: 'Bolo',
    quantidade: '2',
  })
  assert.equal(out, 'Quero Bolo.\nQuantidade: 2')
})
await test('renderTemplate nunca mostra undefined/null/chaves', () => {
  const out = whatsapp.renderTemplate('Olá {empresa}! {inexistente} {produto}', { empresa: 'Wollner', produto: null })
  assert.equal(out, 'Olá Wollner!')
  assert.ok(!/undefined|null|\{|\}/.test(out))
})
await test('URL do WhatsApp codifica o texto e normaliza o número', () => {
  const url = whatsapp.buildWhatsappUrl('(47) 98809-6127', 'Olá! Bolo & café?\nLinha 2')
  assert.equal(url, 'https://wa.me/5547988096127?text=Ol%C3%A1!%20Bolo%20%26%20caf%C3%A9%3F%0ALinha%202')
})
await test('preços: fixo, consulta, a combinar e fixo sem valor (nunca R$ 0,00)', () => {
  assert.match(whatsapp.formatPrice({ priceType: 'fixed', price: 12.5 }), /R\$\s?12,50/)
  assert.equal(whatsapp.formatPrice({ priceType: 'consult' }), 'Preço sob consulta')
  assert.equal(whatsapp.formatPrice({ priceType: 'negotiable' }), 'Preço a combinar')
  assert.equal(whatsapp.formatPrice({ priceType: 'fixed', price: 0 }), 'Preço sob consulta')
  assert.equal(whatsapp.formatPrice({ priceType: 'fixed', price: null }), 'Preço sob consulta')
})
await test('mensagem do produto: consulta sem preço fixo, encomenda com preço fixo', () => {
  const c = structuredClone(defaultContent)
  const bolo = c.products[0]
  assert.match(whatsapp.productMessage(c, bolo), /saber o preço de: Bolo confeitado/)
  bolo.priceType = 'fixed'
  bolo.price = 80
  const msg = whatsapp.productMessage(c, bolo, { quantity: '1', date: '2026-12-24', notes: '' })
  assert.match(msg, /encomendar: Bolo confeitado/)
  assert.match(msg, /Quantidade: 1/)
  assert.match(msg, /Data desejada: 24\/12\/2026/)
  assert.ok(!/Observações/.test(msg))
})
await test('mensagem própria e modelo salvo por produto', () => {
  const c = structuredClone(defaultContent)
  const p = c.products[0]
  p.messageMode = 'custom'
  p.messageCustom = 'Oi! Quero o {produto} ({categoria}).'
  assert.equal(whatsapp.productMessage(c, p), 'Oi! Quero o Bolo confeitado (Bolos).')
  p.messageMode = 'template'
  p.messageTemplateId = 'modelo-informacoes'
  assert.match(whatsapp.productMessage(c, p), /saber mais sobre o produto Bolo confeitado da Panificadora Wollner/)
})
await test('tempo de atuação respeita o aniversário e não inventa dados', () => {
  const now = new Date(2026, 9, 17)
  assert.equal(company.yearsOfActivity({ foundedYear: null }, now), null)
  assert.equal(company.yearsOfActivity({ foundedYear: 2000 }, now), 26)
  assert.equal(company.yearsOfActivity({ foundedYear: 2000, foundedMonth: 12, foundedDay: 1 }, now), 25)
  assert.equal(company.yearsOfActivity({ foundedYear: 2000, foundedMonth: 10, foundedDay: 17 }, now), 26)
  assert.equal(company.yearsOfActivity({ foundedYear: 2000, foundedMonth: 10, foundedDay: 18 }, now), 25)
})
await test('links do mapa usam o endereço real', () => {
  const url = company.mapDirectionsUrl(defaultContent.company, 'Centro, Joinville')
  assert.match(decodeURIComponent(url).replaceAll('+', ' '), /destination=Panificadora Wollner, Rua Adolfo da Veiga, 495, Boehmerwald, Joinville, SC, 89235-000/)
  assert.match(url, /origin=Centro%2C\+Joinville/)
  assert.equal(whatsapp.formatWhatsappNumber('5547988096127'), '+55 47 98809-6127')
})

// ---------- API real, via servidor HTTP temporário ----------
const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://x')
  if (pathname === '/api/content') return content(req, res)
  if (pathname.startsWith('/api/admin')) return admin(req, res)
  res.statusCode = 404
  res.end()
})
await new Promise((resolve) => server.listen(0, resolve))
const base = `http://127.0.0.1:${server.address().port}`
let cookie = ''

async function call(method, url, { body, headers = {}, raw } = {}) {
  const response = await fetch(base + url, {
    method,
    headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body && !raw ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  })
  const set = response.headers.get('set-cookie')
  if (set) cookie = set.split(';')[0].endsWith('=') ? '' : set.split(';')[0]
  const text = await response.text()
  return { status: response.status, json: text ? JSON.parse(text) : null, headers: response.headers }
}
const CSRF = { 'X-Wollner-Admin': '1' }

console.log('\nAPI (login, salvar, persistência, upload)')

await test('GET /api/content devolve o conteúdo inicial com cache de CDN', async () => {
  const r = await call('GET', '/api/content')
  assert.equal(r.status, 200)
  assert.equal(r.json.company.address.street, 'Rua Adolfo da Veiga, 495')
  assert.match(r.headers.get('cache-control'), /max-age=0, must-revalidate/)
  assert.match(r.headers.get('vercel-cdn-cache-control'), /max-age=60/)
})
await test('ações protegidas recusam quem não fez login', async () => {
  assert.equal((await call('POST', '/api/admin/load', { headers: CSRF })).status, 401)
  assert.equal((await call('POST', '/api/admin/save', { headers: CSRF, body: { content: {} } })).status, 401)
  assert.equal((await call('POST', '/api/admin/upload', { headers: CSRF, raw: Buffer.from('x') })).status, 401)
})
await test('login com senha errada é recusado; sem cabeçalho CSRF também', async () => {
  assert.equal((await call('POST', '/api/admin/login', { headers: CSRF, body: { user: 'tester', password: 'errada' } })).status, 401)
  assert.equal((await call('POST', '/api/admin/login', { body: { user: 'tester', password: 'senha-correta-123' } })).status, 403)
})
await test('login correto cria cookie HttpOnly', async () => {
  const response = await fetch(base + '/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...CSRF },
    body: JSON.stringify({ user: 'tester', password: 'senha-correta-123' }),
  })
  assert.equal(response.status, 200)
  const set = response.headers.get('set-cookie')
  assert.match(set, /HttpOnly/)
  assert.match(set, /SameSite=Strict/)
  cookie = set.split(';')[0]
  assert.equal((await call('GET', '/api/admin/session')).json.authenticated, true)
})

let doc
let version
await test('carregar, editar produto/WhatsApp/endereço e salvar', async () => {
  const loaded = await call('POST', '/api/admin/load', { headers: CSRF })
  assert.equal(loaded.status, 200)
  doc = loaded.json.content
  version = doc.updatedAt
  doc.company.whatsapp = '(47) 91234-5678'
  doc.company.address.street = 'Rua Nova, 10'
  doc.products[0].priceType = 'fixed'
  doc.products[0].price = '89,90'
  doc.products.push({ ...structuredClone(doc.products[0]), id: 'pao-frances', name: 'Pão francês', priceType: 'consult', price: null })
  const saved = await call('POST', '/api/admin/save', { headers: CSRF, body: { content: doc, baseVersion: version } })
  assert.equal(saved.status, 200, JSON.stringify(saved.json))
  assert.ok(saved.json.content.updatedAt)
  version = saved.json.content.updatedAt
})
await test('alterações persistem (leitura pública e fresca)', async () => {
  const pub = (await call('GET', '/api/content')).json
  assert.equal(pub.company.whatsapp, '5547912345678')
  assert.equal(pub.company.address.street, 'Rua Nova, 10')
  assert.equal(pub.products[0].price, 89.9)
  assert.equal(pub.products.at(-1).name, 'Pão francês')
  assert.ok(fs.existsSync(path.join(tmp, '.data', 'site.json')))
})
await test('salvar com versão antiga dá conflito (409)', async () => {
  const r = await call('POST', '/api/admin/save', { headers: CSRF, body: { content: doc, baseVersion: 'antiga' } })
  assert.equal(r.status, 409)
})
await test('validação recusa dados ruins (422) e links perigosos', async () => {
  const bad = structuredClone(doc)
  bad.company.whatsapp = '123'
  bad.products[1].name = ''
  bad.home.slides[0].buttonTarget = 'javascript:alert(1)'
  bad.products[0].image = 'javascript:alert(1)'
  const r = await call('POST', '/api/admin/save', { headers: CSRF, body: { content: bad, baseVersion: version } })
  assert.equal(r.status, 422)
  assert.ok(r.json.details.length >= 3)
  const still = (await call('GET', '/api/content')).json
  assert.equal(still.company.whatsapp, '5547912345678')
})

let uploaded
await test('upload de imagem válida devolve URL e arquivo existe', async () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
  const r = await call('POST', '/api/admin/upload', { headers: { ...CSRF, 'Content-Type': 'application/octet-stream' }, raw: png })
  assert.equal(r.status, 200, JSON.stringify(r.json))
  uploaded = r.json.url
  assert.match(uploaded, /^\/uploads\/\d{4}-\d{2}\/[a-f0-9]+\.png$/)
  assert.ok(fs.existsSync(path.join(tmp, '.data', uploaded)))
})
await test('upload recusa arquivo que não é imagem e arquivo grande demais', async () => {
  const fake = await call('POST', '/api/admin/upload', { headers: { ...CSRF, 'Content-Type': 'application/octet-stream' }, raw: Buffer.from('<script>alert(1)</script>............') })
  assert.equal(fake.status, 415)
  const big = await call('POST', '/api/admin/upload', { headers: { ...CSRF, 'Content-Type': 'application/octet-stream' }, raw: Buffer.alloc(5 * 1024 * 1024, 1) })
  assert.equal(big.status, 413)
})
await test('foto trocada/removida é apagada do armazenamento ao salvar', async () => {
  doc.products[0].image = uploaded
  let r = await call('POST', '/api/admin/save', { headers: CSRF, body: { content: doc, baseVersion: version } })
  assert.equal(r.status, 200, JSON.stringify(r.json))
  version = r.json.content.updatedAt
  assert.ok(fs.existsSync(path.join(tmp, '.data', uploaded)))
  doc.products[0].image = ''
  r = await call('POST', '/api/admin/save', { headers: CSRF, body: { content: doc, baseVersion: version } })
  assert.equal(r.status, 200)
  assert.ok(!fs.existsSync(path.join(tmp, '.data', uploaded)))
})
await test('logout encerra a sessão', async () => {
  await call('POST', '/api/admin/logout', { headers: CSRF })
  assert.equal((await call('GET', '/api/admin/session')).json.authenticated, false)
  assert.equal((await call('POST', '/api/admin/load', { headers: CSRF })).status, 401)
})
await test('painel sem variáveis de ambiente responde 503 (não libera acesso)', async () => {
  const saved = process.env.ADMIN_PASSWORD_HASH
  delete process.env.ADMIN_PASSWORD_HASH
  const r = await call('POST', '/api/admin/login', { headers: CSRF, body: { user: 'tester', password: 'qualquer' } })
  process.env.ADMIN_PASSWORD_HASH = saved
  assert.equal(r.status, 503)
})

server.close()
fs.rmSync(tmp, { recursive: true, force: true })
console.log(`\n${passed} testes passaram${process.exitCode ? ' — com falhas acima' : ''}.\n`)

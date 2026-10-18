// Armazenamento persistente.
//  - Produção (Vercel): Vercel Blob, loja pública. Guarda o JSON do site e as imagens.
//  - Desenvolvimento local: arquivos na pasta .data/ (NÃO persiste na Vercel).
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { defaultContent } from '../../shared/defaultContent.js'

const DATA_PATH = 'data/site.json'
const LOCAL_DIR = path.resolve(process.cwd(), '.data')

export const IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function usingBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)
}

export function storageReady() {
  // Na Vercel o disco é temporário: sem Blob configurado, não há onde salvar de verdade.
  return usingBlob() || !process.env.VERCEL
}

export function storageLabel() {
  return usingBlob() ? 'Vercel Blob' : 'arquivos locais (.data/)'
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

// Mantém campos novos do código aparecendo mesmo em dados salvos antes.
function mergeDefaults(defaults, stored) {
  if (Array.isArray(defaults) || Array.isArray(stored)) return stored ?? defaults
  if (defaults && typeof defaults === 'object') {
    const result = {}
    const source = stored && typeof stored === 'object' ? stored : {}
    for (const key of new Set([...Object.keys(defaults), ...Object.keys(source)])) {
      result[key] = key in source ? mergeDefaults(defaults[key], source[key]) : clone(defaults[key])
    }
    return result
  }
  return stored === undefined ? defaults : stored
}

async function readBlobText({ fresh }) {
  const { get } = await import('@vercel/blob')
  const result = await get(DATA_PATH, { access: 'public', useCache: !fresh })
  if (!result || !result.stream) return null
  return new Response(result.stream).text()
}

export async function readContent({ fresh = false } = {}) {
  let text = null
  try {
    if (usingBlob()) {
      text = await readBlobText({ fresh })
    } else {
      text = await fs.readFile(path.join(LOCAL_DIR, 'site.json'), 'utf8').catch(() => null)
    }
  } catch (error) {
    if (error?.name === 'BlobNotFoundError') text = null
    else throw error
  }
  if (!text) return clone(defaultContent)
  return mergeDefaults(defaultContent, JSON.parse(text))
}

export async function writeContent(content) {
  const body = JSON.stringify(content)
  if (usingBlob()) {
    const { put } = await import('@vercel/blob')
    await put(DATA_PATH, body, {
      access: 'public',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/json',
      // Ao sobrescrever, a Vercel renova o cache em até 60 s. Este valor é só uma segurança
      // e mantém baixo o número de leituras contadas no plano gratuito.
      cacheControlMaxAge: 300,
    })
    return
  }
  await fs.mkdir(LOCAL_DIR, { recursive: true })
  await fs.writeFile(path.join(LOCAL_DIR, 'site.json'), body)
}

export async function saveImage(buffer, contentType) {
  const ext = IMAGE_TYPES[contentType]
  const folder = new Date().toISOString().slice(0, 7)
  if (usingBlob()) {
    const { put } = await import('@vercel/blob')
    const result = await put(`uploads/${folder}/foto.${ext}`, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType,
      cacheControlMaxAge: 31536000,
    })
    return result.url
  }
  const name = `${crypto.randomBytes(8).toString('hex')}.${ext}`
  const dir = path.join(LOCAL_DIR, 'uploads', folder)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, name), buffer)
  return `/uploads/${folder}/${name}`
}

// Só apaga arquivos enviados pelo painel (nunca as imagens que vêm com o código).
export function isManagedImage(url) {
  if (typeof url !== 'string') return false
  if (url.startsWith('/uploads/')) return true
  try {
    const { hostname, pathname } = new URL(url)
    return hostname.endsWith('.public.blob.vercel-storage.com') && pathname.startsWith('/uploads/')
  } catch {
    return false
  }
}

export async function deleteImages(urls) {
  const managed = urls.filter(isManagedImage)
  if (managed.length === 0) return
  if (usingBlob()) {
    const { del } = await import('@vercel/blob')
    await del(managed.filter((u) => u.startsWith('https://')))
    return
  }
  for (const url of managed) {
    const target = path.resolve(LOCAL_DIR, url.replace(/^\//, ''))
    if (target.startsWith(path.join(LOCAL_DIR, 'uploads'))) await fs.rm(target, { force: true })
  }
}

export async function readLocalUpload(urlPath) {
  const target = path.resolve(LOCAL_DIR, urlPath.replace(/^\//, ''))
  if (!target.startsWith(path.join(LOCAL_DIR, 'uploads') + path.sep)) return null
  return fs.readFile(target).catch(() => null)
}

export function collectImageUrls(content) {
  const urls = new Set()
  const add = (u) => u && urls.add(u)
  add(content.company?.logo)
  for (const s of content.home?.slides ?? []) add(s.image)
  add(content.about?.mainPhoto)
  for (const p of content.about?.photos ?? []) add(p.url)
  for (const p of content.products ?? []) add(p.image)
  return urls
}

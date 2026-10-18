// Valida e limpa o conteúdo enviado pelo painel antes de salvar.
// Só campos conhecidos passam; textos e listas têm limite de tamanho.
import { normalizeWhatsappNumber } from '../../shared/whatsapp.js'

const ID_PATTERN = /^[a-zA-Z0-9_-]{1,60}$/

class ValidationError extends Error {
  constructor(errors) {
    super('Dados inválidos.')
    this.errors = errors
  }
}

function text(value, max, { multiline = false } = {}) {
  let s = typeof value === 'string' ? value : value == null ? '' : String(value)
  s = s.replace(/\r\n/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  if (!multiline) s = s.replace(/\n+/g, ' ')
  return s.trim().slice(0, max)
}

function bool(value) {
  return value === true
}

function list(value, max) {
  return Array.isArray(value) ? value.slice(0, max) : []
}

function imageUrl(value, errors, label) {
  const s = text(value, 600)
  if (!s) return ''
  if (s.startsWith('/') && !s.startsWith('//')) return s
  if (/^https:\/\//i.test(s)) return s
  errors.push(`${label}: endereço de imagem inválido.`)
  return ''
}

function linkTarget(value, errors, label) {
  const s = text(value, 600)
  if (!s || s === 'whatsapp') return s
  if (s.startsWith('/') && !s.startsWith('//')) return s
  if (/^https?:\/\//i.test(s)) return s
  errors.push(`${label}: use um caminho do site (/encomendas), "whatsapp" ou um link https://.`)
  return ''
}

function optionalUrl(value, errors, label) {
  const s = text(value, 300)
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  errors.push(`${label}: o link precisa começar com http:// ou https://.`)
  return ''
}

function uniqueIds(items, label, errors) {
  const seen = new Set()
  for (const item of items) {
    if (!ID_PATTERN.test(item.id)) errors.push(`${label}: identificador inválido.`)
    if (seen.has(item.id)) errors.push(`${label}: identificador repetido (${item.id}).`)
    seen.add(item.id)
  }
}

function intOrNull(value, min, max) {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isInteger(n) && n >= min && n <= max ? n : null
}

export function sanitizeContent(input) {
  const errors = []
  const src = input && typeof input === 'object' ? input : {}

  // ---- empresa
  const c = src.company ?? {}
  const whatsapp = normalizeWhatsappNumber(c.whatsapp)
  if (whatsapp.length < 12 || whatsapp.length > 15) {
    errors.push('WhatsApp: informe DDD + número (ex.: 47 98809-6127).')
  }
  const address = c.address ?? {}
  const company = {
    name: text(c.name, 80),
    tagline: text(c.tagline, 80),
    description: text(c.description, 300),
    logo: imageUrl(c.logo, errors, 'Logotipo'),
    whatsapp,
    email: text(c.email, 120),
    address: {
      street: text(address.street, 120),
      neighborhood: text(address.neighborhood, 80),
      city: text(address.city, 80),
      state: text(address.state, 2).toUpperCase(),
      zip: text(address.zip, 12),
    },
    hours: list(c.hours, 12).map((h) => ({ label: text(h?.label, 60), value: text(h?.value, 60) })).filter((h) => h.label || h.value),
    hoursNote: text(c.hoursNote, 200),
    social: {
      instagram: optionalUrl(c.social?.instagram, errors, 'Instagram'),
      facebook: optionalUrl(c.social?.facebook, errors, 'Facebook'),
    },
    map: { query: text(c.map?.query, 200) },
  }
  if (!company.name) errors.push('Contato: informe o nome da empresa.')

  // ---- categorias
  const categories = list(src.categories, 40).map((cat) => ({
    id: text(cat?.id, 60),
    name: text(cat?.name, 50),
  }))
  uniqueIds(categories, 'Categoria', errors)
  for (const cat of categories) if (!cat.name) errors.push('Categoria sem nome.')
  const categoryIds = new Set(categories.map((cat) => cat.id))

  // ---- mensagens
  const m = src.messages ?? {}
  const templates = list(m.templates, 40).map((t) => ({
    id: text(t?.id, 60),
    name: text(t?.name, 60),
    text: text(t?.text, 800, { multiline: true }),
  }))
  uniqueIds(templates, 'Modelo de mensagem', errors)
  for (const t of templates) if (!t.name || !t.text) errors.push('Modelo de mensagem precisa de nome e texto.')
  const templateIds = new Set(templates.map((t) => t.id))
  const messages = {
    order: text(m.order, 800, { multiline: true }),
    priceConsult: text(m.priceConsult, 800, { multiline: true }),
    general: text(m.general, 800, { multiline: true }),
    floating: text(m.floating, 800, { multiline: true }),
    buttonOrder: text(m.buttonOrder, 30),
    buttonConsult: text(m.buttonConsult, 30),
    templates,
  }
  for (const [key, label] of [['order', 'Mensagem de encomenda'], ['priceConsult', 'Mensagem de consulta de preço'], ['general', 'Mensagem geral'], ['floating', 'Mensagem do botão flutuante']]) {
    if (!messages[key]) errors.push(`${label}: não pode ficar vazia.`)
  }
  if (!messages.buttonOrder || !messages.buttonConsult) errors.push('Textos dos botões não podem ficar vazios.')

  // ---- produtos
  const products = list(src.products, 500).map((p, index) => {
    const priceType = ['fixed', 'consult', 'negotiable'].includes(p?.priceType) ? p.priceType : 'consult'
    let price = null
    if (priceType === 'fixed') {
      const n = Number(String(p?.price ?? '').replace(',', '.'))
      if (Number.isFinite(n) && n > 0 && n < 100000) price = Math.round(n * 100) / 100
      else errors.push(`Produto "${text(p?.name, 80) || index + 1}": informe um preço válido ou mude o tipo de preço.`)
    }
    const messageMode = ['default', 'template', 'custom'].includes(p?.messageMode) ? p.messageMode : 'default'
    const product = {
      id: text(p?.id, 60),
      name: text(p?.name, 100),
      description: text(p?.description, 400),
      categoryId: categoryIds.has(p?.categoryId) ? p.categoryId : '',
      image: imageUrl(p?.image, errors, 'Foto do produto'),
      priceType,
      price,
      active: bool(p?.active),
      available: bool(p?.available),
      featured: bool(p?.featured),
      messageMode,
      messageTemplateId: templateIds.has(p?.messageTemplateId) ? p.messageTemplateId : '',
      messageCustom: text(p?.messageCustom, 800, { multiline: true }),
      requestFields: {
        quantity: bool(p?.requestFields?.quantity),
        date: bool(p?.requestFields?.date),
        variation: bool(p?.requestFields?.variation),
        notes: bool(p?.requestFields?.notes),
      },
    }
    if (!product.name) errors.push('Existe um produto sem nome.')
    if (messageMode === 'template' && !product.messageTemplateId) product.messageMode = 'default'
    if (messageMode === 'custom' && !product.messageCustom) product.messageMode = 'default'
    return product
  })
  uniqueIds(products, 'Produto', errors)

  // ---- página inicial
  const h = src.home ?? {}
  const slides = list(h.slides, 12).map((s) => ({
    id: text(s?.id, 60),
    image: imageUrl(s?.image, errors, 'Foto do slide'),
    title: text(s?.title, 80),
    subtitle: text(s?.subtitle, 160),
    buttonText: text(s?.buttonText, 40),
    buttonTarget: linkTarget(s?.buttonTarget, errors, 'Botão do slide'),
    active: bool(s?.active),
  }))
  uniqueIds(slides, 'Slide', errors)
  for (const s of slides) if (s.active && !s.image) errors.push('Slide ativo precisa de uma foto.')
  const home = {
    slides,
    introTitle: text(h.introTitle, 100),
    introText: text(h.introText, 600, { multiline: true }),
    featuredTitle: text(h.featuredTitle, 80),
    ordersCtaTitle: text(h.ordersCtaTitle, 100),
    ordersCtaText: text(h.ordersCtaText, 300),
    ordersCtaButton: text(h.ordersCtaButton, 40),
    historyTitle: text(h.historyTitle, 80),
    contactTitle: text(h.contactTitle, 80),
    whatsappInviteTitle: text(h.whatsappInviteTitle, 80),
    whatsappInviteText: text(h.whatsappInviteText, 300),
    whatsappInviteButton: text(h.whatsappInviteButton, 40),
  }

  // ---- institucional
  const a = src.about ?? {}
  const thisYear = new Date().getFullYear()
  const foundedYear = intOrNull(a.foundedYear, 1800, thisYear)
  if (a.foundedYear && foundedYear === null) errors.push(`Ano de fundação: use um ano entre 1800 e ${thisYear}.`)
  const photos = list(a.photos, 12).map((p) => ({
    id: text(p?.id, 60),
    url: imageUrl(p?.url, errors, 'Foto institucional'),
    caption: text(p?.caption, 120),
  }))
  uniqueIds(photos, 'Foto institucional', errors)
  const differentials = list(a.differentials, 12).map((d) => ({
    id: text(d?.id, 60),
    title: text(d?.title, 80),
    text: text(d?.text, 300),
  }))
  uniqueIds(differentials, 'Diferencial', errors)
  const about = {
    title: text(a.title, 100),
    intro: text(a.intro, 600, { multiline: true }),
    history: text(a.history, 4000, { multiline: true }),
    foundedYear,
    foundedMonth: foundedYear ? intOrNull(a.foundedMonth, 1, 12) : null,
    foundedDay: foundedYear ? intOrNull(a.foundedDay, 1, 31) : null,
    mainPhoto: imageUrl(a.mainPhoto, errors, 'Foto principal'),
    photos: photos.filter((p) => p.url),
    differentials: differentials.filter((d) => d.title),
  }

  if (errors.length) throw new ValidationError([...new Set(errors)])

  return { schemaVersion: 1, updatedAt: '', company, home, about, categories, products, messages }
}

export { ValidationError }

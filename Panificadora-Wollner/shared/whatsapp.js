// Regras de mensagens do WhatsApp e de preços. Usado pelo site e pelo painel.

export const MESSAGE_VARIABLES = [
  { name: 'produto', help: 'Nome do produto' },
  { name: 'preco', help: 'Preço (ou "sob consulta")' },
  { name: 'categoria', help: 'Categoria do produto' },
  { name: 'empresa', help: 'Nome da empresa' },
  { name: 'quantidade', help: 'Quantidade informada pelo cliente' },
  { name: 'data', help: 'Data desejada informada pelo cliente' },
  { name: 'variacao', help: 'Tamanho ou variação informada pelo cliente' },
  { name: 'observacoes', help: 'Observações do cliente' },
]

export function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

// Garante o código do país (55) em números brasileiros.
export function normalizeWhatsappNumber(value) {
  const digits = onlyDigits(value)
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  return digits
}

export function formatWhatsappNumber(value) {
  const d = normalizeWhatsappNumber(value)
  if (d.length === 13 && d.startsWith('55')) {
    return `+55 ${d.slice(2, 4)} ${d.slice(4, 9)}-${d.slice(9)}`
  }
  if (d.length === 12 && d.startsWith('55')) {
    return `+55 ${d.slice(2, 4)} ${d.slice(4, 8)}-${d.slice(8)}`
  }
  return d ? `+${d}` : ''
}

export function buildWhatsappUrl(number, text = '') {
  const digits = normalizeWhatsappNumber(number)
  const base = `https://wa.me/${digits}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

const VARIABLE_PATTERN = /\{([a-zA-Z_]+)\}/g

// Substitui {variaveis}. Linhas cujas variáveis estão todas vazias são removidas,
// para não sobrar "Quantidade: " solto. Nunca escreve "undefined" ou "null".
export function renderTemplate(template, values = {}) {
  const lines = String(template ?? '').split('\n')
  const out = []

  for (const line of lines) {
    const names = [...line.matchAll(VARIABLE_PATTERN)].map((m) => m[1])
    const resolve = (name) => {
      const v = values[name]
      return v === undefined || v === null ? '' : String(v).trim()
    }

    if (names.length > 0 && names.every((n) => resolve(n) === '')) continue

    const filled = line
      .replace(VARIABLE_PATTERN, (_, name) => resolve(name))
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\s+([,.;!?])/g, '$1')
      .trimEnd()
    out.push(filled)
  }

  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function formatPrice(product) {
  if (product?.priceType === 'fixed') {
    const price = Number(product.price)
    if (Number.isFinite(price) && price > 0) {
      return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }
    return 'Preço sob consulta'
  }
  if (product?.priceType === 'negotiable') return 'Preço a combinar'
  return 'Preço sob consulta'
}

export function hasFixedPrice(product) {
  return product?.priceType === 'fixed' && Number(product.price) > 0
}

export function formatDateBR(isoDate) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate ?? ''))
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

export function categoryName(content, product) {
  return content.categories.find((c) => c.id === product.categoryId)?.name ?? ''
}

// Escolhe o modelo certo para o produto: mensagem própria, modelo salvo,
// ou a padrão (encomenda, ou consulta de preço quando não há preço fixo).
export function pickProductTemplate(content, product) {
  const { messages } = content
  if (product.messageMode === 'custom' && product.messageCustom?.trim()) {
    return product.messageCustom
  }
  if (product.messageMode === 'template') {
    const found = messages.templates.find((t) => t.id === product.messageTemplateId)
    if (found?.text?.trim()) return found.text
  }
  return hasFixedPrice(product) ? messages.order : messages.priceConsult
}

export function buttonLabelFor(content, product) {
  return hasFixedPrice(product) ? content.messages.buttonOrder : content.messages.buttonConsult
}

export function productNeedsDialog(product) {
  const f = product.requestFields || {}
  return Boolean(f.quantity || f.date || f.variation || f.notes)
}

export function productMessage(content, product, extras = {}) {
  const template = pickProductTemplate(content, product)
  return renderTemplate(template, {
    produto: product.name,
    preco: hasFixedPrice(product) ? formatPrice(product) : '',
    categoria: categoryName(content, product),
    empresa: content.company.name,
    quantidade: extras.quantity,
    data: formatDateBR(extras.date),
    variacao: extras.variation,
    observacoes: extras.notes,
  })
}

export function generalMessage(content, kind = 'general') {
  const template = kind === 'floating' ? content.messages.floating : content.messages.general
  return renderTemplate(template, { empresa: content.company.name })
}

export function whatsappUrlForProduct(content, product, extras = {}) {
  return buildWhatsappUrl(content.company.whatsapp, productMessage(content, product, extras))
}

export function whatsappUrlGeneral(content, kind = 'general') {
  return buildWhatsappUrl(content.company.whatsapp, generalMessage(content, kind))
}

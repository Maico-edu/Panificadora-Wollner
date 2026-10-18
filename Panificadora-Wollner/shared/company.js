// Cálculos e links ligados aos dados da empresa.

// Anos completos de atividade. Com dia e mês informados, respeita o aniversário;
// sem eles, usa só a diferença de anos. Sem ano, devolve null (nada é inventado).
export function yearsOfActivity(about, now = new Date()) {
  const year = Number(about?.foundedYear)
  if (!Number.isInteger(year) || year < 1800 || year > now.getFullYear()) return null

  const month = Number(about.foundedMonth)
  const day = Number(about.foundedDay)
  let years = now.getFullYear() - year

  if (Number.isInteger(month) && month >= 1 && month <= 12) {
    const nowMonth = now.getMonth() + 1
    const hasDay = Number.isInteger(day) && day >= 1 && day <= 31
    const beforeAnniversary =
      nowMonth < month || (nowMonth === month && hasDay && now.getDate() < day)
    if (beforeAnniversary) years -= 1
  }
  return Math.max(0, years)
}

export function formatAddress(address, { withZip = true } = {}) {
  const a = address || {}
  const cityState = [a.city, a.state].filter(Boolean).join(' — ')
  const main = [a.street, a.neighborhood, cityState].filter(Boolean).join(', ')
  return withZip && a.zip ? `${main}, CEP ${a.zip}` : main
}

function mapQuery(company) {
  const custom = company.map?.query?.trim()
  if (custom) return custom
  const a = company.address || {}
  return [company.name, a.street, a.neighborhood, a.city, a.state, a.zip, 'Brasil']
    .filter(Boolean)
    .join(', ')
}

export function mapEmbedUrl(company) {
  return `https://www.google.com/maps?q=${encodeURIComponent(mapQuery(company))}&output=embed`
}

export function mapOpenUrl(company) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery(company))}`
}

// Sem origem, o Google Maps usa a localização atual (se a pessoa permitir).
export function mapDirectionsUrl(company, origin = '') {
  const params = new URLSearchParams({ api: '1', destination: mapQuery(company) })
  if (origin.trim()) params.set('origin', origin.trim())
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

// Único lugar que conversa com a API. Os componentes não usam fetch diretamente.

const ADMIN_HEADERS = { 'X-Wollner-Admin': '1' }

export class ApiError extends Error {
  constructor(message, status, details = [], code = '') {
    super(message)
    this.status = status
    this.details = details
    this.code = code
  }
}

async function request(url, options = {}) {
  let response
  try {
    response = await fetch(url, { credentials: 'same-origin', ...options })
  } catch {
    throw new ApiError('Sem conexão com o servidor. Verifique a internet e tente de novo.', 0)
  }
  let data = null
  try {
    data = await response.json()
  } catch {
    // resposta sem corpo JSON
  }
  if (!response.ok) {
    throw new ApiError(
      data?.error || 'Não foi possível concluir a operação.',
      response.status,
      data?.details || [],
      data?.code || '',
    )
  }
  return data
}

function post(action, body) {
  return request(`/api/admin/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
    body: JSON.stringify(body ?? {}),
  })
}

export const publicApi = {
  getContent: () => request('/api/content'),
}

export const adminApi = {
  session: () => request('/api/admin/session', { headers: ADMIN_HEADERS }),
  login: (user, password) => post('login', { user, password }),
  logout: () => post('logout'),
  load: () => post('load'),
  save: (content, baseVersion) => post('save', { content, baseVersion }),
  upload: (blob) =>
    request('/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream', ...ADMIN_HEADERS },
      body: blob,
    }),
}

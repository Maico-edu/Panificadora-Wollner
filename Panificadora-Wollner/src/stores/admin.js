import { computed, ref } from 'vue'
import { adminApi, ApiError } from '../services/api.js'
import { prepareImage } from '../utils/image.js'
import { loadContent } from './content.js'

// Estado do painel: o que está sendo editado (rascunho) e a comunicação com a API.
// Os formulários mexem só no rascunho; "Salvar alterações" envia tudo de uma vez.

const auth = ref('checking') // checking | out | in | unconfigured | error
const authMessage = ref('')
const storage = ref({ label: '', ready: true })
const draft = ref(null)
const snapshot = ref('')
const baseVersion = ref('')
const savedAt = ref('')
const loading = ref(false)
const saving = ref(false)
const notice = ref(null) // { type: 'success' | 'error', text, details }
let noticeTimer = null

const dirty = computed(() => Boolean(draft.value) && JSON.stringify(draft.value) !== snapshot.value)

function notify(type, text, details = []) {
  clearTimeout(noticeTimer)
  notice.value = { type, text, details }
  if (type === 'success') noticeTimer = setTimeout(dismissNotice, 6000)
}

function dismissNotice() {
  clearTimeout(noticeTimer)
  notice.value = null
}

function setDraft(content) {
  draft.value = structuredClone(content)
  snapshot.value = JSON.stringify(content)
  baseVersion.value = content.updatedAt ?? ''
  savedAt.value = content.updatedAt ?? ''
}

function newId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`
}

function handleError(error, fallback) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      auth.value = 'out'
      authMessage.value = 'Sua sessão expirou. Entre novamente (suas alterações não salvas continuam na tela até você sair do painel).'
      return
    }
    notify('error', error.message, error.details)
    return
  }
  notify('error', fallback)
}

async function checkSession() {
  auth.value = 'checking'
  try {
    const result = await adminApi.session()
    storage.value = { label: result.storage, ready: result.storageReady }
    if (result.authenticated) {
      auth.value = 'in'
      await loadDraft()
    } else {
      auth.value = 'out'
    }
  } catch (error) {
    if (error instanceof ApiError && error.code === 'not_configured') {
      auth.value = 'unconfigured'
    } else {
      auth.value = 'error'
      authMessage.value = error instanceof ApiError ? error.message : 'Não foi possível falar com o servidor.'
    }
  }
}

async function login(user, password) {
  authMessage.value = ''
  try {
    await adminApi.login(user, password)
    auth.value = 'in'
    await loadDraft()
    return true
  } catch (error) {
    authMessage.value = error instanceof ApiError ? error.message : 'Não foi possível entrar. Tente novamente.'
    return false
  }
}

async function logout() {
  try {
    await adminApi.logout()
  } catch {
    // mesmo com falha de rede, volta para a tela de login
  }
  draft.value = null
  snapshot.value = ''
  auth.value = 'out'
  dismissNotice()
}

async function loadDraft() {
  loading.value = true
  try {
    const result = await adminApi.load()
    storage.value = { label: result.storage, ready: result.storageReady }
    setDraft(result.content)
  } catch (error) {
    handleError(error, 'Não foi possível carregar os dados do site.')
  } finally {
    loading.value = false
  }
}

function discard() {
  if (snapshot.value) draft.value = JSON.parse(snapshot.value)
}

// Conferência rápida antes de enviar; o servidor repete e é quem decide de verdade.
function validateDraft() {
  const d = draft.value
  const problems = []
  d.products.forEach((p, i) => {
    const name = p.name.trim() || `Produto ${i + 1}`
    if (!p.name.trim()) problems.push(`${name}: informe o nome.`)
    if (p.priceType === 'fixed') {
      const n = Number(String(p.price ?? '').replace(',', '.'))
      if (!Number.isFinite(n) || n <= 0) problems.push(`${name}: informe o preço ou mude para "sob consulta".`)
    }
  })
  d.categories.forEach((c) => {
    if (!c.name.trim()) problems.push('Existe uma categoria sem nome.')
  })
  d.home.slides.forEach((s, i) => {
    if (s.active && !s.image) problems.push(`Slide ${i + 1}: escolha uma foto ou desative o slide.`)
    if (s.buttonTarget === 'https://') problems.push(`Slide ${i + 1}: complete o link do botão.`)
  })
  if (!d.company.name.trim()) problems.push('Contato: informe o nome da empresa.')
  const digits = d.company.whatsapp.replace(/\D/g, '')
  if (digits.length < 10) problems.push('Contato: informe o WhatsApp com DDD.')
  return problems
}

async function save() {
  if (!draft.value || saving.value) return false
  const problems = validateDraft()
  if (problems.length) {
    notify('error', 'Corrija estes pontos antes de salvar:', problems)
    return false
  }
  saving.value = true
  try {
    const result = await adminApi.save(draft.value, baseVersion.value)
    setDraft(result.content)
    loadContent({ force: true })
    notify('success', 'Alterações salvas. Os visitantes veem a nova versão em cerca de 1 a 2 minutos.')
    return true
  } catch (error) {
    handleError(error, 'Não foi possível salvar. Confira a conexão e tente novamente.')
    return false
  } finally {
    saving.value = false
  }
}

async function uploadImage(file, options = {}) {
  const blob = await prepareImage(file, options)
  const result = await adminApi.upload(blob)
  return result.url
}

export function useAdmin() {
  return {
    auth,
    authMessage,
    storage,
    draft,
    dirty,
    loading,
    saving,
    savedAt,
    notice,
    notify,
    dismissNotice,
    checkSession,
    login,
    logout,
    loadDraft,
    discard,
    save,
    uploadImage,
    newId,
    handleError,
  }
}

import { computed, ref } from 'vue'
import { defaultContent } from '../../shared/defaultContent.js'
import { publicApi } from '../services/api.js'

const CACHE_KEY = 'wollner:content:v1'

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCache(value) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(value))
  } catch {
    // armazenamento do navegador indisponível: segue sem cache
  }
}

const cached = readCache()
const content = ref(cached ?? structuredClone(defaultContent))
const status = ref(cached ? 'cached' : 'idle') // idle | loading | cached | ready | fallback
const settled = computed(() => status.value !== 'idle' && status.value !== 'loading')
let pending = null

export function loadContent({ force = false } = {}) {
  if (pending && !force) return pending
  if (status.value === 'idle') status.value = 'loading'
  pending = publicApi
    .getContent()
    .then((data) => {
      content.value = data
      status.value = 'ready'
      writeCache(data)
    })
    .catch(() => {
      status.value = cached || status.value === 'ready' ? 'ready' : 'fallback'
    })
  return pending
}

export function useContent() {
  return { content, status, settled, loadContent }
}

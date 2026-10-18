import { reactive } from 'vue'

// Caixa de confirmação simples: const ok = await askConfirm({ title, message, confirmText })
const state = reactive({ open: false, title: '', message: '', confirmText: 'Confirmar', danger: false })
let resolver = null

export function askConfirm({ title, message = '', confirmText = 'Confirmar', danger = true }) {
  Object.assign(state, { open: true, title, message, confirmText, danger })
  return new Promise((resolve) => {
    resolver = resolve
  })
}

export function answerConfirm(answer) {
  state.open = false
  resolver?.(answer)
  resolver = null
}

export function useConfirm() {
  return { state, askConfirm, answerConfirm }
}

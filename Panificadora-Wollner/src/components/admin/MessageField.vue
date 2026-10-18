<script setup>
import { computed, nextTick, ref } from 'vue'
import { useAdmin } from '../../stores/admin.js'
import { MESSAGE_VARIABLES, renderTemplate } from '../../../shared/whatsapp.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, required: true },
  rows: { type: Number, default: 4 },
  hint: { type: String, default: '' },
  variables: { type: Array, default: () => MESSAGE_VARIABLES.map((v) => v.name) },
})
const emit = defineEmits(['update:modelValue'])

const { draft } = useAdmin()
const area = ref(null)
const fieldId = `msg-${Math.random().toString(36).slice(2, 8)}`

const known = MESSAGE_VARIABLES.map((v) => v.name)
const sample = computed(() => ({
  produto: 'Bolo confeitado',
  preco: 'R$ 80,00',
  categoria: 'Bolos',
  empresa: draft.value?.company.name || 'Panificadora Wollner',
  quantidade: '2',
  data: '24/12/2026',
  variacao: 'Tamanho grande',
  observacoes: 'Sem granulado',
}))

const preview = computed(() => renderTemplate(props.modelValue, sample.value))
const unknown = computed(() => {
  const found = [...props.modelValue.matchAll(/\{([a-zA-Z_]+)\}/g)].map((m) => m[1])
  return [...new Set(found.filter((name) => !known.includes(name)))]
})

function insert(name) {
  const el = area.value
  const token = `{${name}}`
  const value = props.modelValue ?? ''
  const start = el?.selectionStart ?? value.length
  const end = el?.selectionEnd ?? value.length
  emit('update:modelValue', value.slice(0, start) + token + value.slice(end))
  nextTick(() => {
    el?.focus()
    el?.setSelectionRange(start + token.length, start + token.length)
  })
}
</script>

<template>
  <div class="adm-field">
    <label :for="fieldId">{{ label }}</label>
    <textarea
      :id="fieldId"
      ref="area"
      :rows="rows"
      maxlength="800"
      :value="modelValue"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <small v-if="hint">{{ hint }}</small>
    <div class="adm-chips" role="group" aria-label="Inserir variável na mensagem">
      <button v-for="name in variables" :key="name" type="button" class="adm-chip" @click="insert(name)">
        {{ '{' + name + '}' }}
      </button>
    </div>
    <p v-if="unknown.length" class="adm-warning">
      Variável desconhecida (será ignorada): {{ unknown.map((n) => '{' + n + '}').join(', ') }}
    </p>
    <div class="adm-preview" aria-live="polite">
      <strong>Pré-visualização (com dados de exemplo)</strong>
      <p>{{ preview || '(mensagem vazia)' }}</p>
    </div>
  </div>
</template>

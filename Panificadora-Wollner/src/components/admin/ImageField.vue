<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../AppIcon.vue'
import { useAdmin } from '../../stores/admin.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Foto' },
  hint: { type: String, default: '' },
  keepTransparency: { type: Boolean, default: false },
  maxSide: { type: Number, default: 1600 },
  removable: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])

const { uploadImage, notify, handleError } = useAdmin()
const input = ref(null)
const uploading = ref(false)
const broken = ref(false)
const inputId = `img-${Math.random().toString(36).slice(2, 8)}`

const hasImage = computed(() => Boolean(props.modelValue))

async function onFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  uploading.value = true
  try {
    const url = await uploadImage(file, { maxSide: props.maxSide, keepTransparency: props.keepTransparency })
    broken.value = false
    emit('update:modelValue', url)
  } catch (error) {
    if (error?.status !== undefined) handleError(error, 'Não foi possível enviar a foto.')
    else notify('error', error?.message || 'Não foi possível enviar a foto.')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="imgf">
    <span class="imgf__label">{{ label }}</span>
    <div class="imgf__body">
      <div class="imgf__preview">
        <img v-if="hasImage && !broken" :src="modelValue" alt="Pré-visualização da foto" @error="broken = true" />
        <div v-else class="imgf__empty">
          <AppIcon name="image" :size="28" />
          <span>{{ hasImage ? 'Não foi possível abrir a foto' : 'Sem foto' }}</span>
        </div>
      </div>
      <div class="imgf__actions">
        <input :id="inputId" ref="input" class="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/*" @change="onFile" />
        <label :for="inputId" class="btn btn--outline btn--small" :aria-disabled="uploading">
          <AppIcon name="upload" :size="16" />
          {{ uploading ? 'Enviando…' : hasImage ? 'Trocar foto' : 'Enviar foto' }}
        </label>
        <button v-if="hasImage && removable" type="button" class="btn btn--danger btn--small" :disabled="uploading" @click="emit('update:modelValue', '')">
          <AppIcon name="trash" :size="16" />
          Remover
        </button>
        <small v-if="hint">{{ hint }}</small>
      </div>
    </div>
  </div>
</template>

<style scoped>
.imgf__label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--ink-700);
}
.imgf__body {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.imgf__preview {
  flex: none;
  width: 140px;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--cream-100);
  border: 1px solid var(--cream-200);
  border-radius: var(--radius);
}
.imgf__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.imgf__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 100%;
  padding: 6px;
  font-size: 0.75rem;
  text-align: center;
  color: var(--ink-500);
}
.imgf__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.imgf__actions small {
  max-width: 28ch;
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--ink-500);
}
.imgf__actions label[aria-disabled='true'] {
  opacity: 0.6;
  pointer-events: none;
}
</style>

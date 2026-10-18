<script setup>
import { ref, watch } from 'vue'
import { useConfirm } from '../../composables/useConfirm.js'

const { state, answerConfirm } = useConfirm()
const dialog = ref(null)

watch(
  () => state.open,
  (open) => {
    if (!dialog.value) return
    if (open && !dialog.value.open) dialog.value.showModal()
    if (!open && dialog.value.open) dialog.value.close()
  },
)
</script>

<template>
  <dialog ref="dialog" class="confirm" aria-labelledby="confirm-title" @cancel.prevent="answerConfirm(false)">
    <h2 id="confirm-title">{{ state.title }}</h2>
    <p v-if="state.message">{{ state.message }}</p>
    <div class="confirm__actions">
      <button type="button" class="btn btn--outline" @click="answerConfirm(false)">Cancelar</button>
      <button type="button" class="btn" :class="state.danger ? 'btn--primary' : 'btn--primary'" @click="answerConfirm(true)">
        {{ state.confirmText }}
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.confirm {
  width: min(440px, calc(100vw - 24px));
  padding: 24px;
  color: var(--ink-900);
  background: var(--surface-card);
  border: 0;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
.confirm::backdrop {
  background: rgba(46, 10, 12, 0.55);
}
.confirm h2 {
  font-size: 1.25rem;
}
.confirm p {
  color: var(--ink-700);
}
.confirm__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}
</style>

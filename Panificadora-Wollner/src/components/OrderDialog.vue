<script setup>
import { computed, reactive, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { useContent } from '../stores/content.js'
import { useOrder } from '../stores/order.js'
import { buildWhatsappUrl, formatPrice, productMessage } from '../../shared/whatsapp.js'

const { content } = useContent()
const { selectedProduct, closeOrder } = useOrder()
const dialog = ref(null)
const extras = reactive({ quantity: '', date: '', variation: '', notes: '' })

const today = new Date()
const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

const fields = computed(() => selectedProduct.value?.requestFields ?? {})
const message = computed(() =>
  selectedProduct.value ? productMessage(content.value, selectedProduct.value, extras) : '',
)
const url = computed(() => buildWhatsappUrl(content.value.company.whatsapp, message.value))

watch(selectedProduct, (product) => {
  if (!dialog.value) return
  if (product) {
    Object.assign(extras, { quantity: '', date: '', variation: '', notes: '' })
    if (!dialog.value.open) dialog.value.showModal()
  } else if (dialog.value.open) {
    dialog.value.close()
  }
})

// Fecha depois do clique, para o navegador conseguir abrir o link do WhatsApp antes.
function onSend() {
  setTimeout(closeOrder, 300)
}

function onBackdropClick(event) {
  if (event.target === dialog.value) closeOrder()
}
</script>

<template>
  <dialog
    ref="dialog"
    class="order"
    aria-labelledby="order-title"
    @close="closeOrder"
    @click="onBackdropClick"
  >
    <form v-if="selectedProduct" method="dialog" class="order__form" @submit.prevent>
      <header class="order__header">
        <div>
          <h2 id="order-title">{{ selectedProduct.name }}</h2>
          <p class="order__price">{{ formatPrice(selectedProduct) }}</p>
        </div>
        <button type="button" class="order__close" aria-label="Fechar" @click="closeOrder">
          <AppIcon name="close" :size="22" />
        </button>
      </header>

      <div class="order__fields">
        <label v-if="fields.quantity" class="field">
          <span>Quantidade</span>
          <input v-model="extras.quantity" type="text" inputmode="numeric" maxlength="30" placeholder="Ex.: 12 unidades" />
        </label>
        <label v-if="fields.date" class="field">
          <span>Data desejada</span>
          <input v-model="extras.date" type="date" :min="minDate" />
        </label>
        <label v-if="fields.variation" class="field">
          <span>Tamanho ou variação</span>
          <input v-model="extras.variation" type="text" maxlength="80" />
        </label>
        <label v-if="fields.notes" class="field">
          <span>Observações</span>
          <textarea v-model="extras.notes" rows="3" maxlength="300" />
        </label>
      </div>

      <div class="order__preview">
        <span class="order__preview-label">Mensagem que será aberta no WhatsApp</span>
        <p>{{ message }}</p>
      </div>

      <a class="btn btn--whatsapp order__send" :href="url" target="_blank" rel="noopener" @click="onSend">
        <AppIcon name="whatsapp" :size="20" />
        Abrir no WhatsApp
      </a>
      <p class="order__hint">A mensagem não é enviada sozinha: você revisa e envia no WhatsApp.</p>
    </form>
  </dialog>
</template>

<style scoped>
.order {
  width: min(520px, calc(100vw - 24px));
  max-height: calc(100vh - 24px);
  padding: 0;
  color: var(--ink-900);
  background: var(--surface-card);
  border: 0;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
.order::backdrop {
  background: rgba(46, 10, 12, 0.6);
}
.order__form {
  padding: 22px;
}
.order__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.order__header h2 {
  margin-bottom: 2px;
  font-size: 1.4rem;
}
.order__price {
  margin: 0;
  font-weight: 700;
  color: var(--ink-500);
}
.order__close {
  display: flex;
  padding: 8px;
  color: var(--ink-700);
  background: transparent;
  border: 0;
  border-radius: var(--radius);
  cursor: pointer;
}
.order__close:hover {
  background: var(--cream-200);
}
.order__fields {
  display: grid;
  gap: 14px;
  margin-bottom: 16px;
}
.field {
  display: grid;
  gap: 4px;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--ink-700);
}
.field input,
.field textarea {
  width: 100%;
  padding: 10px 12px;
  font: 400 1rem var(--font-body);
  color: var(--ink-900);
  background: var(--surface-input);
  border: 1px solid var(--cream-200);
  border-radius: var(--radius);
}
.order__preview {
  margin-bottom: 16px;
  padding: 12px 14px;
  background: var(--surface-card);
  border: 1px dashed var(--gold-500);
  border-radius: var(--radius);
}
.order__preview-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-500);
}
.order__preview p {
  margin: 0;
  font-size: 0.93rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.order__send {
  width: 100%;
}
.order__hint {
  margin: 10px 0 0;
  font-size: 0.82rem;
  text-align: center;
  color: var(--ink-500);
}
</style>

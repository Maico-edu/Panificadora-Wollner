<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'
import MessageField from './MessageField.vue'
import { useAdmin } from '../../stores/admin.js'
import { useConfirm } from '../../composables/useConfirm.js'
import { MESSAGE_VARIABLES } from '../../../shared/whatsapp.js'

const { draft, newId } = useAdmin()
const { askConfirm } = useConfirm()

const messages = computed(() => draft.value.messages)

function addTemplate() {
  messages.value.templates.push({ id: newId('modelo'), name: '', text: '' })
}

async function removeTemplate(template, index) {
  const using = draft.value.products.filter((p) => p.messageMode === 'template' && p.messageTemplateId === template.id)
  const ok = await askConfirm({
    title: `Excluir o modelo "${template.name || 'sem nome'}"?`,
    message: using.length
      ? `${using.length} ${using.length === 1 ? 'produto usa' : 'produtos usam'} este modelo e voltarão para a mensagem padrão.`
      : 'Nenhum produto usa este modelo.',
    confirmText: 'Excluir modelo',
  })
  if (!ok) return
  for (const product of using) {
    product.messageMode = 'default'
    product.messageTemplateId = ''
  }
  messages.value.templates.splice(index, 1)
}
</script>

<template>
  <section class="adm-card">
    <h2>Variáveis disponíveis</h2>
    <p class="adm-help">
      Escreva a variável entre chaves e o site troca pelo valor real. Se uma informação não existir (por exemplo, o cliente não informou a data), a linha dela some sozinha da mensagem.
    </p>
    <dl class="vars">
      <div v-for="v in MESSAGE_VARIABLES" :key="v.name">
        <dt>{{ '{' + v.name + '}' }}</dt>
        <dd>{{ v.help }}</dd>
      </div>
    </dl>
    <p class="adm-help">A mensagem nunca é enviada sozinha: o cliente confere e envia no próprio WhatsApp.</p>
  </section>

  <section class="adm-card">
    <h2>Mensagens padrão</h2>
    <div class="stack">
      <MessageField v-model="messages.order" label="Encomenda (produtos com preço fixo)" :rows="6" />
      <MessageField v-model="messages.priceConsult" label="Consulta de preço (preço sob consulta ou a combinar)" :rows="3" />
      <MessageField v-model="messages.general" label="Contato geral (botões “WhatsApp” do site)" :rows="2" :variables="['empresa']" />
      <MessageField v-model="messages.floating" label="Botão flutuante do WhatsApp" :rows="2" :variables="['empresa']" />
    </div>
  </section>

  <section class="adm-card">
    <h2>Texto dos botões dos produtos</h2>
    <div class="adm-grid">
      <label class="adm-field">
        Produto com preço fixo
        <input v-model="messages.buttonOrder" type="text" maxlength="30" />
      </label>
      <label class="adm-field">
        Produto sob consulta ou a combinar
        <input v-model="messages.buttonConsult" type="text" maxlength="30" />
      </label>
    </div>
  </section>

  <section class="adm-card">
    <h2>Modelos reutilizáveis</h2>
    <p class="adm-help">Crie modelos e escolha, em cada produto, qual usar (aba Produtos, em “Mensagem do WhatsApp”).</p>
    <ul v-if="messages.templates.length" class="adm-list">
      <li v-for="(template, index) in messages.templates" :key="template.id" class="template">
        <div class="template__head">
          <label class="adm-field template__name">
            Nome do modelo
            <input v-model="template.name" type="text" maxlength="60" />
          </label>
          <button type="button" class="adm-iconbtn adm-iconbtn--danger" aria-label="Excluir modelo" @click="removeTemplate(template, index)">
            <AppIcon name="trash" :size="18" />
          </button>
        </div>
        <MessageField v-model="template.text" label="Texto do modelo" :rows="4" />
      </li>
    </ul>
    <p v-else class="adm-empty">Nenhum modelo criado.</p>
    <button type="button" class="btn btn--outline" @click="addTemplate">
      <AppIcon name="plus" :size="18" />
      Novo modelo
    </button>
  </section>
</template>

<style scoped>
.stack {
  display: grid;
  gap: 24px;
}
.vars {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px 20px;
  margin: 0 0 12px;
}
.vars dt {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-weight: 700;
  color: var(--wine-800);
}
.vars dd {
  margin: 0;
  font-size: 0.88rem;
  color: var(--ink-500);
}
.template {
  padding: 16px 0;
  border-top: 1px solid var(--cream-200);
}
.template:first-child {
  border-top: 0;
}
.template__head {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 14px;
}
.template__name {
  flex: 1;
}
</style>

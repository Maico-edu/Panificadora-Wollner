<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../AppIcon.vue'
import ImageField from './ImageField.vue'
import MessageField from './MessageField.vue'
import { useAdmin } from '../../stores/admin.js'
import { useConfirm } from '../../composables/useConfirm.js'
import { formatPrice, productMessage } from '../../../shared/whatsapp.js'

const { draft, newId } = useAdmin()
const { askConfirm } = useConfirm()

const editingId = ref(null)
const search = ref('')
const categoryFilter = ref('')
const statusFilter = ref('')

const products = computed(() => draft.value.products)
const categories = computed(() => draft.value.categories)
const templates = computed(() => draft.value.messages.templates)
const editing = computed(() => products.value.find((p) => p.id === editingId.value) ?? null)

const normalize = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const filtered = computed(() => {
  const term = normalize(search.value.trim())
  return products.value.filter((p) => {
    if (term && !normalize(p.name).includes(term)) return false
    if (categoryFilter.value === '__none' && p.categoryId) return false
    if (categoryFilter.value && categoryFilter.value !== '__none' && p.categoryId !== categoryFilter.value) return false
    if (statusFilter.value === 'inactive' && p.active) return false
    if (statusFilter.value === 'unavailable' && p.available) return false
    if (statusFilter.value === 'featured' && !p.featured) return false
    return true
  })
})
const isFiltering = computed(() => Boolean(search.value || categoryFilter.value || statusFilter.value))

function categoryLabel(id) {
  return categories.value.find((c) => c.id === id)?.name ?? 'Sem categoria'
}

function priceLabel(p) {
  return formatPrice({ ...p, price: parsePrice(p.price) })
}

function parsePrice(value) {
  const n = Number(String(value ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function addProduct() {
  const product = {
    id: newId('produto'),
    name: '',
    description: '',
    categoryId: categories.value.some((c) => c.id === categoryFilter.value) ? categoryFilter.value : '',
    image: '',
    priceType: 'consult',
    price: '',
    active: true,
    available: true,
    featured: false,
    messageMode: 'default',
    messageTemplateId: '',
    messageCustom: '',
    requestFields: { quantity: true, date: false, variation: false, notes: false },
  }
  products.value.unshift(product)
  search.value = ''
  categoryFilter.value = ''
  statusFilter.value = ''
  editingId.value = product.id
}

async function removeProduct(product) {
  const ok = await askConfirm({
    title: `Excluir "${product.name || 'produto sem nome'}"?`,
    message: 'O produto sai do catálogo e a foto enviada é apagada quando você salvar. Isso não pode ser desfeito depois de salvar.',
    confirmText: 'Excluir produto',
  })
  if (!ok) return
  const index = products.value.indexOf(product)
  if (index >= 0) products.value.splice(index, 1)
  if (editingId.value === product.id) editingId.value = null
}

function move(product, delta) {
  const list = filtered.value
  const neighbor = list[list.findIndex((p) => p.id === product.id) + delta]
  if (!neighbor) return
  const all = products.value
  const a = all.findIndex((p) => p.id === product.id)
  const b = all.findIndex((p) => p.id === neighbor.id)
  ;[all[a], all[b]] = [all[b], all[a]]
}

function toggleActive(product) {
  product.active = !product.active
}

function closeEditor() {
  const p = editing.value
  if (p && !p.name.trim() && !p.image && !p.description.trim()) {
    products.value.splice(products.value.indexOf(p), 1)
  }
  editingId.value = null
}

const previewText = computed(() => {
  const p = editing.value
  if (!p) return ''
  const sampleExtras = { quantity: '2', date: '2026-12-24', variation: 'Tamanho grande', notes: 'Sem granulado' }
  const copy = { ...p, price: parsePrice(p.price), requestFields: p.requestFields }
  return productMessage(draft.value, copy, {
    quantity: p.requestFields.quantity ? sampleExtras.quantity : '',
    date: p.requestFields.date ? sampleExtras.date : '',
    variation: p.requestFields.variation ? sampleExtras.variation : '',
    notes: p.requestFields.notes ? sampleExtras.notes : '',
  })
})
</script>

<template>
  <!-- Editor de um produto -->
  <section v-if="editing" class="adm-card">
    <div class="adm-toolbar">
      <button type="button" class="btn btn--outline btn--small" @click="closeEditor">
        <AppIcon name="chevron-left" :size="16" />
        Voltar à lista
      </button>
      <h2 class="editor-title">{{ editing.name || 'Novo produto' }}</h2>
    </div>

    <div class="adm-grid">
      <label class="adm-field">
        Nome do produto *
        <input v-model="editing.name" type="text" maxlength="100" required />
      </label>
      <label class="adm-field">
        Categoria
        <select v-model="editing.categoryId">
          <option value="">Sem categoria</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </label>
      <label class="adm-field adm-span">
        Descrição curta
        <textarea v-model="editing.description" rows="3" maxlength="400" />
        <small>Aparece no card do produto. Até 400 caracteres.</small>
      </label>

      <div class="adm-span">
        <ImageField v-model="editing.image" label="Foto do produto" hint="JPG, PNG ou WebP. A foto é reduzida automaticamente." />
      </div>

      <label class="adm-field">
        Tipo de preço
        <select v-model="editing.priceType">
          <option value="fixed">Preço fixo</option>
          <option value="consult">Preço sob consulta</option>
          <option value="negotiable">Preço a combinar</option>
        </select>
      </label>
      <label v-if="editing.priceType === 'fixed'" class="adm-field">
        Preço (R$)
        <input v-model="editing.price" type="text" inputmode="decimal" placeholder="Ex.: 89,90" />
        <small>Use vírgula para os centavos.</small>
      </label>
    </div>

    <h3 class="sub">Exibição</h3>
    <div class="adm-checks">
      <label class="adm-check">
        <input v-model="editing.active" type="checkbox" />
        <span>Mostrar no site <small>Desmarque para esconder o produto sem excluir.</small></span>
      </label>
      <label class="adm-check">
        <input v-model="editing.available" type="checkbox" />
        <span>Disponível para encomenda <small>Desmarcado, o card aparece como “Indisponível no momento”.</small></span>
      </label>
      <label class="adm-check">
        <input v-model="editing.featured" type="checkbox" />
        <span>Destaque na página inicial</span>
      </label>
    </div>

    <h3 class="sub">Mensagem do WhatsApp</h3>
    <div class="adm-checks">
      <label class="adm-check">
        <input v-model="editing.messageMode" type="radio" value="default" />
        <span>Usar a mensagem padrão <small>Encomenda se tiver preço fixo; consulta de preço nos outros casos.</small></span>
      </label>
      <label class="adm-check">
        <input v-model="editing.messageMode" type="radio" value="template" :disabled="!templates.length" />
        <span>Usar um modelo salvo</span>
      </label>
      <label v-if="editing.messageMode === 'template'" class="adm-field">
        Modelo
        <select v-model="editing.messageTemplateId">
          <option value="">Escolha um modelo</option>
          <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </label>
      <label class="adm-check">
        <input v-model="editing.messageMode" type="radio" value="custom" />
        <span>Escrever uma mensagem só para este produto</span>
      </label>
    </div>
    <MessageField
      v-if="editing.messageMode === 'custom'"
      v-model="editing.messageCustom"
      label="Mensagem deste produto"
      :rows="4"
    />

    <h3 class="sub">O que perguntar ao cliente antes de abrir o WhatsApp</h3>
    <div class="adm-checks adm-checks--row">
      <label class="adm-check"><input v-model="editing.requestFields.quantity" type="checkbox" /><span>Quantidade</span></label>
      <label class="adm-check"><input v-model="editing.requestFields.date" type="checkbox" /><span>Data desejada</span></label>
      <label class="adm-check"><input v-model="editing.requestFields.variation" type="checkbox" /><span>Tamanho ou variação</span></label>
      <label class="adm-check"><input v-model="editing.requestFields.notes" type="checkbox" /><span>Observações</span></label>
    </div>

    <div class="adm-preview">
      <strong>Mensagem final deste produto (exemplo)</strong>
      <p>{{ previewText }}</p>
    </div>

    <div class="adm-toolbar editor-footer">
      <button type="button" class="btn btn--primary" @click="closeEditor">Concluir edição</button>
      <button type="button" class="btn btn--danger" @click="removeProduct(editing)">
        <AppIcon name="trash" :size="16" />
        Excluir produto
      </button>
    </div>
  </section>

  <!-- Lista de produtos -->
  <section v-else class="adm-card">
    <div class="adm-toolbar">
      <button type="button" class="btn btn--primary" @click="addProduct">
        <AppIcon name="plus" :size="18" />
        Novo produto
      </button>
      <input v-model="search" class="adm-input" type="search" placeholder="Buscar pelo nome" aria-label="Buscar produto pelo nome" />
      <select v-model="categoryFilter" class="adm-input" aria-label="Filtrar por categoria">
        <option value="">Todas as categorias</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        <option value="__none">Sem categoria</option>
      </select>
      <select v-model="statusFilter" class="adm-input" aria-label="Filtrar por situação">
        <option value="">Qualquer situação</option>
        <option value="featured">Em destaque</option>
        <option value="inactive">Escondidos do site</option>
        <option value="unavailable">Indisponíveis</option>
      </select>
    </div>
    <p class="adm-help">
      {{ products.length }} {{ products.length === 1 ? 'produto' : 'produtos' }}. A ordem desta lista é a ordem do catálogo no site (use as setas para mudar).
      <template v-if="isFiltering"> Com filtro ativo, as setas trocam de lugar com o vizinho que aparece aqui.</template>
    </p>

    <ul v-if="filtered.length" class="adm-list">
      <li v-for="(product, index) in filtered" :key="product.id" class="adm-row">
        <img v-if="product.image" class="adm-row__thumb" :src="product.image" alt="" loading="lazy" />
        <div v-else class="adm-row__thumb adm-row__thumb--empty"><AppIcon name="image" :size="22" /></div>
        <div class="adm-row__main">
          <p class="adm-row__title">{{ product.name || '(sem nome)' }}</p>
          <p class="adm-row__meta">{{ categoryLabel(product.categoryId) }} · {{ priceLabel(product) }}</p>
          <div class="adm-badges">
            <span v-if="product.featured" class="adm-badge adm-badge--gold">Destaque</span>
            <span v-if="!product.active" class="adm-badge adm-badge--warn">Escondido do site</span>
            <span v-if="!product.available" class="adm-badge adm-badge--warn">Indisponível</span>
          </div>
        </div>
        <div class="adm-row__actions">
          <button type="button" class="adm-iconbtn" :disabled="index === 0" aria-label="Subir na lista" @click="move(product, -1)">
            <AppIcon name="arrow-up" :size="18" />
          </button>
          <button type="button" class="adm-iconbtn" :disabled="index === filtered.length - 1" aria-label="Descer na lista" @click="move(product, 1)">
            <AppIcon name="arrow-down" :size="18" />
          </button>
          <button type="button" class="adm-iconbtn" :aria-label="product.active ? 'Esconder do site' : 'Mostrar no site'" :title="product.active ? 'Esconder do site' : 'Mostrar no site'" @click="toggleActive(product)">
            <AppIcon name="check" :size="18" :style="{ opacity: product.active ? 1 : 0.25 }" />
          </button>
          <button type="button" class="adm-iconbtn" aria-label="Editar produto" @click="editingId = product.id">
            <AppIcon name="edit" :size="18" />
          </button>
          <button type="button" class="adm-iconbtn adm-iconbtn--danger" aria-label="Excluir produto" @click="removeProduct(product)">
            <AppIcon name="trash" :size="18" />
          </button>
        </div>
      </li>
    </ul>
    <p v-else class="adm-empty">
      {{ isFiltering ? 'Nenhum produto com esses filtros.' : 'Nenhum produto cadastrado ainda. Clique em “Novo produto”.' }}
    </p>
  </section>
</template>

<style scoped>
.editor-title {
  margin: 0;
  font-size: 1.2rem;
}
.sub {
  margin: 26px 0 12px;
  font-size: 1rem;
}
.adm-checks--row {
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}
.editor-footer {
  margin: 24px 0 0;
}
</style>

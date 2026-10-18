<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '../components/ProductCard.vue'
import AppIcon from '../components/AppIcon.vue'
import { useContent } from '../stores/content.js'
import { whatsappUrlGeneral } from '../../shared/whatsapp.js'

const { content } = useContent()
const route = useRoute()
const router = useRouter()
const search = ref('')

const normalize = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const activeProducts = computed(() => content.value.products.filter((p) => p.active))
const categories = computed(() => content.value.categories)

// A categoria escolhida fica no endereço (?categoria=bolos), então dá para compartilhar o link.
const selectedId = computed(() => {
  const id = String(route.query.categoria ?? '')
  return categories.value.some((c) => c.id === id) ? id : ''
})

function selectCategory(id) {
  router.replace({ query: id ? { categoria: id } : {} })
}

function countIn(categoryId) {
  return activeProducts.value.filter((p) => p.categoryId === categoryId).length
}

const results = computed(() => {
  const term = normalize(search.value.trim())
  return activeProducts.value.filter((product) => {
    if (selectedId.value && product.categoryId !== selectedId.value) return false
    if (!term) return true
    return normalize(`${product.name} ${product.description}`).includes(term)
  })
})

const selectedName = computed(() => categories.value.find((c) => c.id === selectedId.value)?.name ?? '')
const whatsappUrl = computed(() => whatsappUrlGeneral(content.value))

function clearFilters() {
  search.value = ''
  selectCategory('')
}
</script>

<template>
  <div class="page-header">
    <div class="container">
      <h1>Encomendas</h1>
      <p>Escolha o produto e envie o pedido pelo WhatsApp. A mensagem já vai pronta, é só conferir e enviar.</p>
    </div>
  </div>

  <section class="section section--tight">
    <div class="container">
      <div class="toolbar">
        <label class="search">
          <span class="visually-hidden">Buscar produto pelo nome</span>
          <AppIcon name="search" :size="20" />
          <input v-model="search" type="search" placeholder="Buscar produto pelo nome" autocomplete="off" />
        </label>
      </div>

      <div class="chips" role="group" aria-label="Filtrar por categoria">
        <button type="button" class="chip" :aria-pressed="selectedId === ''" @click="selectCategory('')">
          Todos <span>{{ activeProducts.length }}</span>
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          class="chip"
          :aria-pressed="selectedId === category.id"
          @click="selectCategory(category.id)"
        >
          {{ category.name }} <span>{{ countIn(category.id) }}</span>
        </button>
      </div>

      <p class="count" aria-live="polite">
        {{ results.length }} {{ results.length === 1 ? 'produto' : 'produtos' }}
        <template v-if="selectedName"> em {{ selectedName }}</template>
      </p>

      <div v-if="results.length" class="grid">
        <ProductCard v-for="product in results" :key="product.id" :product="product" />
      </div>

      <div v-else class="empty">
        <template v-if="search.trim()">
          <h2>Nenhum produto encontrado</h2>
          <p>Não achamos “{{ search }}”. Tente outra palavra ou limpe os filtros.</p>
        </template>
        <template v-else-if="selectedName">
          <h2>Ainda não há produtos em {{ selectedName }}</h2>
          <p>Mas você pode perguntar pelo WhatsApp se esse item está disponível.</p>
        </template>
        <template v-else>
          <h2>Catálogo em atualização</h2>
          <p>Em breve os produtos aparecem aqui. Enquanto isso, fale com a gente pelo WhatsApp.</p>
        </template>
        <div class="empty__actions">
          <button v-if="search.trim() || selectedId" type="button" class="btn btn--outline" @click="clearFilters">
            Limpar filtros
          </button>
          <a class="btn btn--whatsapp" :href="whatsappUrl" target="_blank" rel="noopener">
            <AppIcon name="whatsapp" :size="18" />
            Falar no WhatsApp
          </a>
        </div>
      </div>

      <p v-if="results.length" class="more">
        Não encontrou o que procura?
        <a :href="whatsappUrl" target="_blank" rel="noopener">Pergunte pelo WhatsApp</a>.
      </p>
    </div>
  </section>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}
.search {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 460px;
  padding: 0 14px;
  color: var(--ink-500);
  background: #fff;
  border: 1px solid var(--cream-200);
  border-radius: var(--radius);
}
.search:focus-within {
  border-color: var(--gold-500);
  box-shadow: 0 0 0 3px rgba(217, 154, 43, 0.25);
}
.search input {
  flex: 1;
  min-width: 0;
  padding: 12px 0;
  font: 400 1rem var(--font-body);
  color: var(--ink-900);
  background: transparent;
  border: 0;
  outline: none;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 6px 16px;
  font: 700 0.9rem var(--font-body);
  color: var(--ink-700);
  background: #fff;
  border: 1px solid var(--cream-200);
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
}
.chip span {
  font-weight: 400;
  font-size: 0.8rem;
  opacity: 0.7;
}
.chip:hover {
  border-color: var(--wine-700);
}
.chip[aria-pressed='true'] {
  color: #fff;
  background: var(--wine-700);
  border-color: var(--wine-700);
}

.count {
  margin: 22px 0 14px;
  font-size: 0.9rem;
  color: var(--ink-500);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.empty {
  padding: 48px 20px;
  text-align: center;
  background: var(--cream-100);
  border-radius: var(--radius-lg);
}
.empty p {
  max-width: 46ch;
  margin-left: auto;
  margin-right: auto;
}
.empty__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.more {
  margin-top: 32px;
  text-align: center;
  color: var(--ink-700);
}

@media (max-width: 560px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .chips {
    flex-wrap: nowrap;
    margin-right: -20px;
    padding-right: 20px;
    padding-bottom: 6px;
    overflow-x: auto;
  }
  .chip {
    flex: none;
  }
}
</style>

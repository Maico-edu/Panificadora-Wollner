<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'
import { useAdmin } from '../../stores/admin.js'
import { useConfirm } from '../../composables/useConfirm.js'

const { draft, newId } = useAdmin()
const { askConfirm } = useConfirm()

const categories = computed(() => draft.value.categories)

function usageCount(id) {
  return draft.value.products.filter((p) => p.categoryId === id).length
}

function addCategory() {
  categories.value.push({ id: newId('cat'), name: '' })
}

async function removeCategory(category, index) {
  const count = usageCount(category.id)
  const ok = await askConfirm({
    title: `Excluir a categoria "${category.name || 'sem nome'}"?`,
    message: count
      ? `${count} ${count === 1 ? 'produto fica' : 'produtos ficam'} sem categoria (continuam no catálogo, só aparecem em “Todos”).`
      : 'Nenhum produto usa esta categoria.',
    confirmText: 'Excluir categoria',
  })
  if (!ok) return
  for (const product of draft.value.products) if (product.categoryId === category.id) product.categoryId = ''
  categories.value.splice(index, 1)
}

function move(index, delta) {
  const target = index + delta
  if (target < 0 || target >= categories.value.length) return
  const list = categories.value
  ;[list[index], list[target]] = [list[target], list[index]]
}
</script>

<template>
  <section class="adm-card">
    <h2>Categorias</h2>
    <p class="adm-help">As categorias viram os filtros da página de encomendas, na ordem abaixo. Renomear não afeta os produtos.</p>

    <ul v-if="categories.length" class="adm-list">
      <li v-for="(category, index) in categories" :key="category.id" class="adm-row">
        <label class="adm-row__main adm-field">
          <span class="visually-hidden">Nome da categoria {{ index + 1 }}</span>
          <input v-model="category.name" type="text" maxlength="50" placeholder="Nome da categoria" />
          <small>{{ usageCount(category.id) }} {{ usageCount(category.id) === 1 ? 'produto' : 'produtos' }}</small>
        </label>
        <div class="adm-row__actions">
          <button type="button" class="adm-iconbtn" :disabled="index === 0" aria-label="Subir categoria" @click="move(index, -1)">
            <AppIcon name="arrow-up" :size="18" />
          </button>
          <button type="button" class="adm-iconbtn" :disabled="index === categories.length - 1" aria-label="Descer categoria" @click="move(index, 1)">
            <AppIcon name="arrow-down" :size="18" />
          </button>
          <button type="button" class="adm-iconbtn adm-iconbtn--danger" aria-label="Excluir categoria" @click="removeCategory(category, index)">
            <AppIcon name="trash" :size="18" />
          </button>
        </div>
      </li>
    </ul>
    <p v-else class="adm-empty">Nenhuma categoria. Os produtos aparecem todos juntos.</p>

    <button type="button" class="btn btn--primary" @click="addCategory">
      <AppIcon name="plus" :size="18" />
      Nova categoria
    </button>
  </section>
</template>

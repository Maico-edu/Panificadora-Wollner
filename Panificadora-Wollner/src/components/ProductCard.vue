<script setup>
import { computed, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import { useContent } from '../stores/content.js'
import { useOrder } from '../stores/order.js'
import {
  buttonLabelFor,
  categoryName,
  formatPrice,
  hasFixedPrice,
  productNeedsDialog,
  whatsappUrlForProduct,
} from '../../shared/whatsapp.js'

const props = defineProps({ product: { type: Object, required: true } })

const { content } = useContent()
const { openOrder } = useOrder()
const imageFailed = ref(false)

const category = computed(() => categoryName(content.value, props.product))
const priceText = computed(() => formatPrice(props.product))
const buttonText = computed(() => buttonLabelFor(content.value, props.product))
const needsDialog = computed(() => productNeedsDialog(props.product))
const directUrl = computed(() => whatsappUrlForProduct(content.value, props.product))
const showImage = computed(() => props.product.image && !imageFailed.value)
</script>

<template>
  <article class="card" :class="{ 'card--unavailable': !product.available }">
    <div class="card__media">
      <img
        v-if="showImage"
        :src="product.image"
        :alt="product.name"
        loading="lazy"
        width="480"
        height="360"
        @error="imageFailed = true"
      />
      <div v-else class="card__placeholder" role="img" :aria-label="`Sem foto disponível de ${product.name}`">
        <AppIcon name="wheat" :size="44" />
        <span>Foto em breve</span>
      </div>
      <span v-if="!product.available" class="card__badge">Indisponível no momento</span>
    </div>

    <div class="card__body">
      <span v-if="category" class="card__category">{{ category }}</span>
      <h3 class="card__name">{{ product.name }}</h3>
      <p v-if="product.description" class="card__description">{{ product.description }}</p>
      <p class="card__price" :class="{ 'card__price--fixed': hasFixedPrice(product) }">{{ priceText }}</p>

      <button v-if="!product.available" type="button" class="btn btn--outline card__button" disabled>
        Indisponível
      </button>
      <button v-else-if="needsDialog" type="button" class="btn btn--primary card__button" @click="openOrder(product)">
        <AppIcon name="whatsapp" :size="18" />
        {{ buttonText }}
      </button>
      <a v-else class="btn btn--primary card__button" :href="directUrl" target="_blank" rel="noopener">
        <AppIcon name="whatsapp" :size="18" />
        {{ buttonText }}
      </a>
    </div>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--cream-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, transform 0.2s;
}
.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.card__media {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--cream-100);
}
.card__media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.card--unavailable .card__media img {
  filter: grayscale(0.7);
  opacity: 0.7;
}
.card__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  color: var(--ink-500);
  font-size: 0.85rem;
}
.card__badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 10px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #fff;
  background: var(--ink-700);
  border-radius: 4px;
}
.card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 16px 18px 18px;
}
.card__category {
  margin-bottom: 4px;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gold-600);
}
.card__name {
  margin-bottom: 6px;
}
.card__description {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 10px;
  font-size: 0.93rem;
  color: var(--ink-700);
}
.card__price {
  margin: auto 0 14px;
  padding-top: 4px;
  font-weight: 700;
  color: var(--ink-500);
}
.card__price--fixed {
  font-family: var(--font-display);
  font-size: 1.3rem;
  color: var(--wine-800);
}
.card__button {
  width: 100%;
}
</style>

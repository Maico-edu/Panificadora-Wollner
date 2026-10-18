<script setup>
import { computed } from 'vue'
import HeroCarousel from '../components/HeroCarousel.vue'
import ProductCard from '../components/ProductCard.vue'
import LocationSection from '../components/LocationSection.vue'
import AppIcon from '../components/AppIcon.vue'
import { useContent } from '../stores/content.js'
import { yearsOfActivity } from '../../shared/company.js'
import { whatsappUrlGeneral } from '../../shared/whatsapp.js'

const { content } = useContent()
const home = computed(() => content.value.home)
const about = computed(() => content.value.about)

const slides = computed(() => home.value.slides.filter((s) => s.active && s.image))
const whatsappUrl = computed(() => whatsappUrlGeneral(content.value))
const featured = computed(() =>
  content.value.products.filter((p) => p.active && p.featured).slice(0, 6),
)

const years = computed(() => yearsOfActivity(about.value))

// Resumo curto da história: primeiro parágrafo, cortado em fim de frase quando possível.
const historyTeaser = computed(() => {
  const first = about.value.history.split(/\n\s*\n/)[0] ?? ''
  if (first.length <= 320) return first
  const cut = first.slice(0, 320)
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '))
  return end > 120 ? cut.slice(0, end + 1) : `${cut.trimEnd()}…`
})
</script>

<template>
  <HeroCarousel :slides="slides" :whatsapp-url="whatsappUrl" />

  <section class="section container intro">
    <div class="intro__text">
      <span class="eyebrow">{{ content.company.tagline || content.company.name }}</span>
      <h1 class="intro__title">{{ home.introTitle }}</h1>
      <p class="lead">{{ home.introText }}</p>
      <RouterLink to="/sobre" class="btn btn--outline">Conheça a Wollner</RouterLink>
    </div>
    <figure v-if="about.mainPhoto" class="intro__photo">
      <img :src="about.mainPhoto" :alt="`Produtos da ${content.company.name}`" loading="lazy" />
    </figure>
  </section>

  <section v-if="featured.length" class="section section--cream">
    <div class="container">
      <span class="eyebrow">Vitrine</span>
      <h2>{{ home.featuredTitle }}</h2>
      <div class="grid">
        <ProductCard v-for="product in featured" :key="product.id" :product="product" />
      </div>
    </div>
  </section>

  <section class="section section--wine cta">
    <div class="container cta__inner">
      <div>
        <h2>{{ home.ordersCtaTitle }}</h2>
        <p>{{ home.ordersCtaText }}</p>
      </div>
      <RouterLink to="/encomendas" class="btn btn--gold">
        {{ home.ordersCtaButton }}
        <AppIcon name="arrow-right" :size="18" />
      </RouterLink>
    </div>
  </section>

  <section v-if="historyTeaser" class="section container history">
    <span class="eyebrow">
      {{ years !== null ? `${years} ${years === 1 ? 'ano' : 'anos'} de atividade` : 'Sobre nós' }}
    </span>
    <h2>{{ home.historyTitle }}</h2>
    <p class="lead">{{ historyTeaser }}</p>
    <RouterLink to="/sobre" class="btn btn--outline">Ler a história completa</RouterLink>
  </section>

  <section class="section section--cream">
    <div class="container">
      <LocationSection :title="home.contactTitle" />
    </div>
  </section>

  <section class="section invite">
    <div class="container invite__inner">
      <h2>{{ home.whatsappInviteTitle }}</h2>
      <p class="lead">{{ home.whatsappInviteText }}</p>
      <a class="btn btn--whatsapp" :href="whatsappUrl" target="_blank" rel="noopener">
        <AppIcon name="whatsapp" :size="20" />
        {{ home.whatsappInviteButton }}
      </a>
    </div>
  </section>
</template>

<style scoped>
.intro {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 56px;
  align-items: center;
}
.intro__title {
  font-size: clamp(1.8rem, 3.6vw, 2.6rem);
}
.intro__photo {
  margin: 0;
  overflow: hidden;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  aspect-ratio: 5 / 4;
}
.intro__photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin-top: 28px;
}

.cta__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
}
.cta p {
  margin: 0;
  max-width: 52ch;
  color: rgba(253, 249, 241, 0.88);
}

.history {
  max-width: 820px;
}

.invite__inner {
  max-width: 640px;
  text-align: center;
}
.invite .lead {
  margin-left: auto;
  margin-right: auto;
}

@media (max-width: 860px) {
  .intro {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  .cta__inner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

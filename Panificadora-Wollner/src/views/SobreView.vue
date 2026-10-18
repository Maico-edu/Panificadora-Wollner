<script setup>
import { computed } from 'vue'
import LocationSection from '../components/LocationSection.vue'
import AppIcon from '../components/AppIcon.vue'
import { useContent } from '../stores/content.js'
import { yearsOfActivity } from '../../shared/company.js'
import { whatsappUrlGeneral } from '../../shared/whatsapp.js'

const { content } = useContent()
const about = computed(() => content.value.about)
const company = computed(() => content.value.company)

const years = computed(() => yearsOfActivity(about.value))
const paragraphs = computed(() =>
  about.value.history
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean),
)
const whatsappUrl = computed(() => whatsappUrlGeneral(content.value))
</script>

<template>
  <div class="page-header">
    <div class="container">
      <h1>{{ about.title }}</h1>
      <p v-if="about.intro">{{ about.intro }}</p>
    </div>
  </div>

  <section class="section container story">
    <figure v-if="about.mainPhoto" class="story__photo">
      <img :src="about.mainPhoto" :alt="`Produtos da ${company.name}`" />
    </figure>
    <div class="story__text">
      <template v-if="paragraphs.length">
        <span class="eyebrow">Nossa história</span>
        <h2>{{ company.name }}</h2>
        <p v-for="(paragraph, index) in paragraphs" :key="index" class="lead">{{ paragraph }}</p>
      </template>
      <template v-else>
        <span class="eyebrow">Quem somos</span>
        <h2>{{ company.name }}</h2>
        <p class="lead">{{ company.description }}</p>
      </template>

      <dl v-if="years !== null" class="facts">
        <div>
          <dt>Fundada em</dt>
          <dd>{{ about.foundedYear }}</dd>
        </div>
        <div>
          <dt>Tempo de atividade</dt>
          <dd>{{ years }} {{ years === 1 ? 'ano' : 'anos' }}</dd>
        </div>
      </dl>

      <div class="story__actions">
        <RouterLink to="/encomendas" class="btn btn--primary">Ver encomendas</RouterLink>
        <a class="btn btn--whatsapp" :href="whatsappUrl" target="_blank" rel="noopener">
          <AppIcon name="whatsapp" :size="18" />
          Chamar no WhatsApp
        </a>
      </div>
    </div>
  </section>

  <section v-if="about.differentials.length" class="section section--cream">
    <div class="container">
      <span class="eyebrow">Diferenciais</span>
      <h2>O que você encontra aqui</h2>
      <ul class="differentials">
        <li v-for="item in about.differentials" :key="item.id">
          <h3>{{ item.title }}</h3>
          <p v-if="item.text">{{ item.text }}</p>
        </li>
      </ul>
    </div>
  </section>

  <section v-if="about.photos.length" class="section container">
    <h2>Galeria</h2>
    <div class="gallery">
      <figure v-for="photo in about.photos" :key="photo.id">
        <img :src="photo.url" :alt="photo.caption || `Foto da ${company.name}`" loading="lazy" />
        <figcaption v-if="photo.caption">{{ photo.caption }}</figcaption>
      </figure>
    </div>
  </section>

  <section class="section section--cream">
    <div class="container">
      <LocationSection title="Endereço e contato" />
    </div>
  </section>
</template>

<style scoped>
.story {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 56px;
  align-items: start;
}
.story:not(:has(.story__photo)) {
  grid-template-columns: minmax(0, 760px);
}
.story__photo {
  margin: 0;
  overflow: hidden;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
.story__photo img {
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
}
.facts {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 40px;
  margin: 28px 0;
  padding: 18px 0;
  border-top: 1px solid var(--cream-200);
  border-bottom: 1px solid var(--cream-200);
}
.facts dt {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-500);
}
.facts dd {
  margin: 2px 0 0;
  font-family: var(--font-display);
  font-size: 1.8rem;
  color: var(--wine-800);
}
[data-theme='dark'] .facts dd {
  color: var(--gold-400);
}
.story__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
}

.differentials {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  margin: 28px 0 0;
  padding: 0;
  list-style: none;
}
.differentials li {
  padding: 20px;
  background: var(--surface-card);
  border: 1px solid var(--cream-200);
  border-left: 4px solid var(--gold-500);
  border-radius: var(--radius);
}
[data-theme='dark'] .differentials li h3 {
  color: #fff5ed;
}
.differentials p {
  margin: 0;
  color: var(--ink-700);
}

.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-top: 24px;
}
.gallery figure {
  margin: 0;
}
.gallery img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: var(--radius);
}
.gallery figcaption {
  margin-top: 6px;
  font-size: 0.88rem;
  color: var(--ink-500);
}

@media (max-width: 860px) {
  .story {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .story__photo img {
    aspect-ratio: 4 / 3;
  }
}
</style>

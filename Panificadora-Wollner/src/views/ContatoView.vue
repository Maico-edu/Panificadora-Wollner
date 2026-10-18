<script setup>
import { computed } from 'vue'
import LocationSection from '../components/LocationSection.vue'
import AppIcon from '../components/AppIcon.vue'
import { useContent } from '../stores/content.js'
import { formatWhatsappNumber, whatsappUrlGeneral } from '../../shared/whatsapp.js'

const { content } = useContent()
const company = computed(() => content.value.company)
const whatsappUrl = computed(() => whatsappUrlGeneral(content.value))
</script>

<template>
  <div class="page-header">
    <div class="container">
      <h1>Localização e contato</h1>
      <p>Venha nos visitar ou fale com a gente pelo WhatsApp para encomendas e informações.</p>
    </div>
  </div>

  <section class="section container">
    <LocationSection title="Onde estamos" />
  </section>

  <section class="section section--cream">
    <div class="container">
      <h2>Outras formas de contato</h2>
      <ul class="channels">
        <li>
          <AppIcon name="whatsapp" :size="26" />
          <div>
            <h3>WhatsApp</h3>
            <p>Encomendas e informações.</p>
            <a :href="whatsappUrl" target="_blank" rel="noopener">{{ formatWhatsappNumber(company.whatsapp) }}</a>
          </div>
        </li>
        <li v-if="company.social.instagram">
          <AppIcon name="instagram" :size="26" />
          <div>
            <h3>Instagram</h3>
            <p>Novidades e fotos da vitrine.</p>
            <a :href="company.social.instagram" target="_blank" rel="noopener">Abrir o Instagram</a>
          </div>
        </li>
        <li v-if="company.social.facebook">
          <AppIcon name="facebook" :size="26" />
          <div>
            <h3>Facebook</h3>
            <p>Acompanhe a página da Wollner.</p>
            <a :href="company.social.facebook" target="_blank" rel="noopener">Abrir o Facebook</a>
          </div>
        </li>
        <li v-if="company.email">
          <AppIcon name="mail" :size="26" />
          <div>
            <h3>E-mail</h3>
            <p>Para assuntos que não são urgentes.</p>
            <a :href="`mailto:${company.email}`">{{ company.email }}</a>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.channels {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}
.channels li {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: var(--surface-card);
  border: 1px solid var(--cream-200);
  border-radius: var(--radius-lg);
}
.channels svg {
  flex: none;
  margin-top: 4px;
  color: var(--gold-600);
}
.channels h3 {
  margin-bottom: 2px;
}
.channels p {
  margin-bottom: 6px;
  font-size: 0.93rem;
  color: var(--ink-700);
}
.channels a {
  font-weight: 700;
  overflow-wrap: anywhere;
}
</style>

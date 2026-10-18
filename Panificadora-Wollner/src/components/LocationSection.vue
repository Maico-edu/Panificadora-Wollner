<script setup>
import { computed, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import { useContent } from '../stores/content.js'
import { formatAddress, mapDirectionsUrl, mapEmbedUrl, mapOpenUrl } from '../../shared/company.js'
import { formatWhatsappNumber, whatsappUrlGeneral } from '../../shared/whatsapp.js'

defineProps({
  title: { type: String, default: 'Onde estamos' },
  headingLevel: { type: String, default: 'h2' },
})

const { content } = useContent()
const company = computed(() => content.value.company)
const origin = ref('')

const address = computed(() => formatAddress(company.value.address))
const embedUrl = computed(() => mapEmbedUrl(company.value))
const openUrl = computed(() => mapOpenUrl(company.value))
const directionsUrl = computed(() => mapDirectionsUrl(company.value, origin.value))
const currentLocationUrl = computed(() => mapDirectionsUrl(company.value))
const whatsappUrl = computed(() => whatsappUrlGeneral(content.value))
</script>

<template>
  <div class="location">
    <div class="location__info">
      <span class="eyebrow">Localização</span>
      <component :is="headingLevel">{{ title }}</component>

      <address class="location__address">
        <AppIcon name="map-pin" :size="22" />
        <span>
          <strong>{{ company.name }}</strong><br />
          {{ address }}
        </span>
      </address>

      <div class="location__hours">
        <AppIcon name="clock" :size="22" />
        <ul v-if="company.hours.length">
          <li v-for="hour in company.hours" :key="hour.label + hour.value">
            {{ hour.label }}: <strong>{{ hour.value }}</strong>
          </li>
          <li v-if="company.hoursNote" class="location__note">{{ company.hoursNote }}</li>
        </ul>
        <p v-else>Para confirmar os horários de funcionamento, fale com a gente pelo WhatsApp.</p>
      </div>

      <form class="location__route" @submit.prevent="$refs.routeLink.click()">
        <label for="route-origin">De onde você vai sair? <small>(opcional)</small></label>
        <div class="location__route-row">
          <input id="route-origin" v-model="origin" type="text" placeholder="Seu endereço ou bairro" autocomplete="street-address" />
          <a ref="routeLink" class="btn btn--primary" :href="directionsUrl" target="_blank" rel="noopener">
            <AppIcon name="navigation" :size="18" />
            Como chegar
          </a>
        </div>
        <a class="location__gps" :href="currentLocationUrl" target="_blank" rel="noopener">
          Ou trace a rota a partir da sua localização atual
        </a>
      </form>

      <div class="location__actions">
        <a class="btn btn--outline" :href="openUrl" target="_blank" rel="noopener">
          <AppIcon name="external" :size="18" />
          Abrir no Google Maps
        </a>
        <a class="btn btn--whatsapp" :href="whatsappUrl" target="_blank" rel="noopener">
          <AppIcon name="whatsapp" :size="18" />
          {{ formatWhatsappNumber(company.whatsapp) }}
        </a>
      </div>
    </div>

    <div class="location__map">
      <iframe
        :src="embedUrl"
        :title="`Mapa com a localização da ${company.name}`"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen
      />
    </div>
  </div>
</template>

<style scoped>
.location {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 40px;
  align-items: stretch;
}
.location__address,
.location__hours {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin: 0 0 16px;
  font-style: normal;
}
.location__address svg,
.location__hours svg {
  flex: none;
  margin-top: 3px;
  color: var(--gold-600);
}
.location__hours ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.location__hours p {
  margin: 0;
  color: var(--ink-700);
}
.location__note {
  font-size: 0.9rem;
  color: var(--ink-500);
}
.location__route {
  margin: 22px 0;
  padding: 16px;
  background: var(--cream-100);
  border-radius: var(--radius-lg);
}
.location__route label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.9rem;
  font-weight: 700;
}
.location__route small {
  font-weight: 400;
  color: var(--ink-500);
}
.location__route-row {
  display: flex;
  gap: 10px;
}
.location__route-row input {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  font: 400 1rem var(--font-body);
  background: #fff;
  border: 1px solid var(--cream-200);
  border-radius: var(--radius);
}
.location__gps {
  display: inline-block;
  margin-top: 10px;
  font-size: 0.9rem;
}
.location__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.location__map {
  min-height: 380px;
  overflow: hidden;
  border: 1px solid var(--cream-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.location__map iframe {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 380px;
  border: 0;
}

@media (max-width: 860px) {
  .location {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .location__route-row {
    flex-direction: column;
  }
}
</style>

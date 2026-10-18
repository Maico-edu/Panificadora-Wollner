<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'
import ImageField from './ImageField.vue'
import { useAdmin } from '../../stores/admin.js'
import { mapOpenUrl } from '../../../shared/company.js'
import { buildWhatsappUrl, formatWhatsappNumber, normalizeWhatsappNumber } from '../../../shared/whatsapp.js'

const { draft } = useAdmin()
const company = computed(() => draft.value.company)

const whatsappPreview = computed(() => formatWhatsappNumber(company.value.whatsapp))
const whatsappTest = computed(() => buildWhatsappUrl(normalizeWhatsappNumber(company.value.whatsapp)))
const mapTest = computed(() => mapOpenUrl(company.value))

function addHour() {
  if (company.value.hours.length < 12) company.value.hours.push({ label: '', value: '' })
}
</script>

<template>
  <section class="adm-card">
    <h2>Empresa</h2>
    <div class="adm-grid">
      <label class="adm-field">
        Nome da empresa *
        <input v-model="company.name" type="text" maxlength="80" required />
      </label>
      <label class="adm-field">
        Subtítulo (abaixo do nome no cabeçalho)
        <input v-model="company.tagline" type="text" maxlength="80" />
      </label>
      <label class="adm-field adm-span">
        Descrição curta (rodapé)
        <textarea v-model="company.description" rows="3" maxlength="300" />
      </label>
      <div class="adm-span">
        <ImageField v-model="company.logo" label="Logotipo" keep-transparency :max-side="600" :removable="false" hint="Imagem quadrada, de preferência PNG." />
      </div>
    </div>
  </section>

  <section class="adm-card">
    <h2>WhatsApp e e-mail</h2>
    <div class="adm-grid">
      <label class="adm-field">
        WhatsApp da empresa *
        <input v-model="company.whatsapp" type="text" inputmode="tel" placeholder="47 98809-6127" />
        <small>
          Com DDD. Fica salvo como: <strong>{{ whatsappPreview || '—' }}</strong>
          · <a :href="whatsappTest" target="_blank" rel="noopener">testar número</a>
        </small>
      </label>
      <label class="adm-field">
        E-mail (opcional)
        <input v-model="company.email" type="email" maxlength="120" />
      </label>
    </div>
  </section>

  <section class="adm-card">
    <h2>Endereço e mapa</h2>
    <div class="adm-grid">
      <label class="adm-field adm-span">
        Rua e número
        <input v-model="company.address.street" type="text" maxlength="120" />
      </label>
      <label class="adm-field">
        Bairro
        <input v-model="company.address.neighborhood" type="text" maxlength="80" />
      </label>
      <label class="adm-field">
        Cidade
        <input v-model="company.address.city" type="text" maxlength="80" />
      </label>
      <label class="adm-field">
        Estado (sigla)
        <input v-model="company.address.state" type="text" maxlength="2" />
      </label>
      <label class="adm-field">
        CEP
        <input v-model="company.address.zip" type="text" inputmode="numeric" maxlength="12" />
      </label>
      <label class="adm-field adm-span">
        Texto de busca do mapa <small>(opcional: deixe vazio para usar o endereço acima)</small>
        <input v-model="company.map.query" type="text" maxlength="200" />
        <small><a :href="mapTest" target="_blank" rel="noopener">Conferir no Google Maps</a></small>
      </label>
    </div>
  </section>

  <section class="adm-card">
    <h2>Horários de funcionamento</h2>
    <p class="adm-help">Só preencha quando os horários estiverem confirmados. Sem horários, o site pede para confirmar pelo WhatsApp.</p>
    <ul v-if="company.hours.length" class="adm-list">
      <li v-for="(hour, index) in company.hours" :key="index" class="adm-row">
        <div class="adm-row__main adm-grid">
          <label class="adm-field">
            Dias
            <input v-model="hour.label" type="text" maxlength="60" placeholder="Segunda a sexta" />
          </label>
          <label class="adm-field">
            Horário
            <input v-model="hour.value" type="text" maxlength="60" placeholder="6h às 19h" />
          </label>
        </div>
        <div class="adm-row__actions">
          <button type="button" class="adm-iconbtn adm-iconbtn--danger" aria-label="Remover horário" @click="company.hours.splice(index, 1)">
            <AppIcon name="trash" :size="18" />
          </button>
        </div>
      </li>
    </ul>
    <button type="button" class="btn btn--outline" :disabled="company.hours.length >= 12" @click="addHour">
      <AppIcon name="plus" :size="18" />
      Novo horário
    </button>
    <label class="adm-field note">
      Observação sobre horários (opcional)
      <input v-model="company.hoursNote" type="text" maxlength="200" placeholder="Ex.: Feriados: confirme pelo WhatsApp" />
    </label>
  </section>

  <section class="adm-card">
    <h2>Redes sociais</h2>
    <div class="adm-grid">
      <label class="adm-field">
        Instagram (link completo)
        <input v-model="company.social.instagram" type="url" placeholder="https://www.instagram.com/..." />
      </label>
      <label class="adm-field">
        Facebook (link completo)
        <input v-model="company.social.facebook" type="url" placeholder="https://www.facebook.com/..." />
      </label>
    </div>
  </section>
</template>

<style scoped>
.note {
  margin-top: 18px;
}
</style>

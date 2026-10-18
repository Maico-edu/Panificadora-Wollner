<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'
import ImageField from './ImageField.vue'
import { useAdmin } from '../../stores/admin.js'
import { yearsOfActivity } from '../../../shared/company.js'

const { draft, newId } = useAdmin()

const about = computed(() => draft.value.about)
const years = computed(() => yearsOfActivity(about.value))

function addPhoto() {
  if (about.value.photos.length < 12) about.value.photos.push({ id: newId('foto'), url: '', caption: '' })
}
function addDifferential() {
  if (about.value.differentials.length < 12) about.value.differentials.push({ id: newId('dif'), title: '', text: '' })
}
</script>

<template>
  <section class="adm-card">
    <h2>Apresentação</h2>
    <div class="adm-grid">
      <label class="adm-field adm-span">
        Título da página
        <input v-model="about.title" type="text" maxlength="100" />
      </label>
      <label class="adm-field adm-span">
        Texto de abertura
        <textarea v-model="about.intro" rows="3" maxlength="600" />
      </label>
      <div class="adm-span">
        <ImageField v-model="about.mainPhoto" label="Foto principal" hint="Aparece ao lado da história e na página inicial." />
      </div>
    </div>
  </section>

  <section class="adm-card">
    <h2>História e fundação</h2>
    <p class="adm-help">
      Escreva só o que for confirmado pela Wollner. Deixe em branco o que ainda não souber: a seção de história não aparece até haver texto, e o tempo de atividade só é mostrado com o ano de fundação preenchido.
    </p>
    <div class="adm-grid adm-grid--3">
      <label class="adm-field">
        Ano de fundação
        <input v-model.number="about.foundedYear" type="number" inputmode="numeric" min="1800" :max="new Date().getFullYear()" placeholder="Ex.: 1995" />
      </label>
      <label class="adm-field">
        Mês <small>(opcional)</small>
        <input v-model.number="about.foundedMonth" type="number" inputmode="numeric" min="1" max="12" :disabled="!about.foundedYear" />
      </label>
      <label class="adm-field">
        Dia <small>(opcional)</small>
        <input v-model.number="about.foundedDay" type="number" inputmode="numeric" min="1" max="31" :disabled="!about.foundedYear" />
      </label>
    </div>
    <p class="adm-help calc" aria-live="polite">
      <template v-if="years !== null">Tempo de atividade calculado hoje: <strong>{{ years }} {{ years === 1 ? 'ano' : 'anos' }}</strong>. Com mês e dia, o número muda no aniversário.</template>
      <template v-else>Informe o ano de fundação para calcular o tempo de atividade.</template>
    </p>
    <label class="adm-field">
      História da panificadora
      <textarea v-model="about.history" rows="9" maxlength="4000" />
      <small>Separe os parágrafos com uma linha em branco.</small>
    </label>
  </section>

  <section class="adm-card">
    <h2>Diferenciais confirmados</h2>
    <ul v-if="about.differentials.length" class="adm-list">
      <li v-for="(item, index) in about.differentials" :key="item.id" class="adm-row">
        <div class="adm-row__main adm-grid">
          <label class="adm-field">
            Título
            <input v-model="item.title" type="text" maxlength="80" />
          </label>
          <label class="adm-field">
            Explicação (opcional)
            <input v-model="item.text" type="text" maxlength="300" />
          </label>
        </div>
        <div class="adm-row__actions">
          <button type="button" class="adm-iconbtn adm-iconbtn--danger" aria-label="Remover diferencial" @click="about.differentials.splice(index, 1)">
            <AppIcon name="trash" :size="18" />
          </button>
        </div>
      </li>
    </ul>
    <p v-else class="adm-empty">Nenhum diferencial cadastrado. A seção não aparece no site.</p>
    <button type="button" class="btn btn--outline" :disabled="about.differentials.length >= 12" @click="addDifferential">
      <AppIcon name="plus" :size="18" />
      Novo diferencial
    </button>
  </section>

  <section class="adm-card">
    <h2>Galeria de fotos</h2>
    <ul v-if="about.photos.length" class="adm-list">
      <li v-for="(photo, index) in about.photos" :key="photo.id" class="adm-row photo-row">
        <ImageField v-model="photo.url" label="Foto" :removable="false" />
        <label class="adm-field adm-row__main">
          Legenda (opcional)
          <input v-model="photo.caption" type="text" maxlength="120" />
        </label>
        <div class="adm-row__actions">
          <button type="button" class="adm-iconbtn adm-iconbtn--danger" aria-label="Remover foto da galeria" @click="about.photos.splice(index, 1)">
            <AppIcon name="trash" :size="18" />
          </button>
        </div>
      </li>
    </ul>
    <p v-else class="adm-empty">Nenhuma foto na galeria. A seção não aparece no site.</p>
    <button type="button" class="btn btn--outline" :disabled="about.photos.length >= 12" @click="addPhoto">
      <AppIcon name="plus" :size="18" />
      Nova foto
    </button>
  </section>
</template>

<style scoped>
.calc {
  margin: 12px 0 18px;
}
.photo-row {
  align-items: flex-start;
}
</style>

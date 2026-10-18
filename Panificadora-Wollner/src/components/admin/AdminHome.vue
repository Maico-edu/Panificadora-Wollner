<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'
import ImageField from './ImageField.vue'
import { useAdmin } from '../../stores/admin.js'
import { useConfirm } from '../../composables/useConfirm.js'

const { draft, newId } = useAdmin()
const { askConfirm } = useConfirm()

const home = computed(() => draft.value.home)
const slides = computed(() => draft.value.home.slides)
const products = computed(() => draft.value.products)
const featuredCount = computed(() => products.value.filter((p) => p.active && p.featured).length)

const PRESET_TARGETS = ['/encomendas', '/sobre', '/contato', 'whatsapp', '']

function targetChoice(slide) {
  return PRESET_TARGETS.includes(slide.buttonTarget) ? slide.buttonTarget : 'custom'
}

function setTargetChoice(slide, value) {
  slide.buttonTarget = value === 'custom' ? 'https://' : value
}

function addSlide() {
  if (slides.value.length >= 12) return
  slides.value.push({
    id: newId('slide'),
    image: '',
    title: '',
    subtitle: '',
    buttonText: 'Ver encomendas',
    buttonTarget: '/encomendas',
    active: false,
  })
}

async function removeSlide(slide, index) {
  const ok = await askConfirm({
    title: `Excluir o slide ${index + 1}?`,
    message: 'A foto enviada para este slide é apagada quando você salvar.',
    confirmText: 'Excluir slide',
  })
  if (ok) slides.value.splice(index, 1)
}

function move(index, delta) {
  const target = index + delta
  if (target < 0 || target >= slides.value.length) return
  const list = slides.value
  ;[list[index], list[target]] = [list[target], list[index]]
}
</script>

<template>
  <section class="adm-card">
    <h2>Slides do carrossel</h2>
    <p class="adm-help">
      As fotos grandes do topo da página inicial, na ordem abaixo. Slides desativados ou sem foto não aparecem. Use fotos horizontais, de preferência com boa luz.
    </p>

    <ol class="slides">
      <li v-for="(slide, index) in slides" :key="slide.id" class="slide-card">
        <div class="slide-card__head">
          <strong>Slide {{ index + 1 }}</strong>
          <label class="adm-check">
            <input v-model="slide.active" type="checkbox" />
            <span>Mostrar no site</span>
          </label>
          <div class="adm-row__actions">
            <button type="button" class="adm-iconbtn" :disabled="index === 0" aria-label="Subir slide" @click="move(index, -1)">
              <AppIcon name="arrow-up" :size="18" />
            </button>
            <button type="button" class="adm-iconbtn" :disabled="index === slides.length - 1" aria-label="Descer slide" @click="move(index, 1)">
              <AppIcon name="arrow-down" :size="18" />
            </button>
            <button type="button" class="adm-iconbtn adm-iconbtn--danger" aria-label="Excluir slide" @click="removeSlide(slide, index)">
              <AppIcon name="trash" :size="18" />
            </button>
          </div>
        </div>

        <div class="adm-grid">
          <div class="adm-span">
            <ImageField v-model="slide.image" label="Foto do slide" :max-side="1920" />
          </div>
          <label class="adm-field">
            Título (curto)
            <input v-model="slide.title" type="text" maxlength="80" />
          </label>
          <label class="adm-field">
            Subtítulo (opcional)
            <input v-model="slide.subtitle" type="text" maxlength="160" />
          </label>
          <label class="adm-field">
            Texto do botão <small>(deixe vazio para não mostrar botão)</small>
            <input v-model="slide.buttonText" type="text" maxlength="40" />
          </label>
          <label class="adm-field">
            O botão leva para
            <select :value="targetChoice(slide)" @change="setTargetChoice(slide, $event.target.value)">
              <option value="/encomendas">Página de encomendas</option>
              <option value="/sobre">Sobre a Wollner</option>
              <option value="/contato">Localização e contato</option>
              <option value="whatsapp">WhatsApp (mensagem geral)</option>
              <option value="custom">Outro link</option>
              <option value="">Nenhum</option>
            </select>
          </label>
          <label v-if="targetChoice(slide) === 'custom'" class="adm-field adm-span">
            Link completo
            <input v-model="slide.buttonTarget" type="url" placeholder="https://" />
          </label>
        </div>
      </li>
    </ol>

    <button type="button" class="btn btn--primary" :disabled="slides.length >= 12" @click="addSlide">
      <AppIcon name="plus" :size="18" />
      Novo slide
    </button>
  </section>

  <section class="adm-card">
    <h2>Produtos em destaque</h2>
    <p class="adm-help">
      Marque os produtos que aparecem na vitrine da página inicial (a página mostra até 6; hoje há {{ featuredCount }} marcados).
    </p>
    <div v-if="products.length" class="adm-checks featured">
      <label v-for="product in products" :key="product.id" class="adm-check">
        <input v-model="product.featured" type="checkbox" />
        <span>
          {{ product.name || '(sem nome)' }}
          <small v-if="!product.active">Escondido do site, não aparece mesmo marcado</small>
        </span>
      </label>
    </div>
    <p v-else class="adm-empty">Cadastre produtos primeiro.</p>
  </section>

  <section class="adm-card">
    <h2>Textos da página inicial</h2>
    <div class="adm-grid">
      <label class="adm-field adm-span">
        Título da apresentação
        <input v-model="home.introTitle" type="text" maxlength="100" />
      </label>
      <label class="adm-field adm-span">
        Texto da apresentação
        <textarea v-model="home.introText" rows="4" maxlength="600" />
      </label>
      <label class="adm-field">
        Título dos destaques
        <input v-model="home.featuredTitle" type="text" maxlength="80" />
      </label>
      <label class="adm-field">
        Título da seção de contato
        <input v-model="home.contactTitle" type="text" maxlength="80" />
      </label>
      <label class="adm-field adm-span">
        Chamada para as encomendas: título
        <input v-model="home.ordersCtaTitle" type="text" maxlength="100" />
      </label>
      <label class="adm-field">
        Chamada para as encomendas: texto
        <input v-model="home.ordersCtaText" type="text" maxlength="300" />
      </label>
      <label class="adm-field">
        Chamada para as encomendas: botão
        <input v-model="home.ordersCtaButton" type="text" maxlength="40" />
      </label>
      <label class="adm-field">
        Título da seção “história”
        <input v-model="home.historyTitle" type="text" maxlength="80" />
        <small>O texto vem da aba Institucional. Sem história cadastrada, a seção não aparece.</small>
      </label>
      <span />
      <label class="adm-field">
        Convite do WhatsApp: título
        <input v-model="home.whatsappInviteTitle" type="text" maxlength="80" />
      </label>
      <label class="adm-field">
        Convite do WhatsApp: botão
        <input v-model="home.whatsappInviteButton" type="text" maxlength="40" />
      </label>
      <label class="adm-field adm-span">
        Convite do WhatsApp: texto
        <input v-model="home.whatsappInviteText" type="text" maxlength="300" />
      </label>
    </div>
  </section>
</template>

<style scoped>
.slides {
  display: grid;
  gap: 16px;
  margin: 0 0 18px;
  padding: 0;
  list-style: none;
}
.slide-card {
  padding: 16px;
  background: var(--cream-100);
  border: 1px solid var(--cream-200);
  border-radius: var(--radius-lg);
}
.slide-card__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}
.slide-card__head .adm-row__actions {
  margin-left: auto;
}
.featured {
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}
</style>

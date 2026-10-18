<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  slides: { type: Array, required: true },
  whatsappUrl: { type: String, default: '' },
})

const AUTOPLAY_MS = 6500
const current = ref(0)
const playing = ref(true)
const hovering = ref(false)
const focusInside = ref(false)
const reducedMotion = ref(false)
const failedImages = ref(new Set())
let timer = null
let startX = null

const total = computed(() => props.slides.length)
const shouldRun = computed(
  () => total.value > 1 && playing.value && !reducedMotion.value && !hovering.value && !focusInside.value,
)

function go(index) {
  if (total.value === 0) return
  current.value = (index + total.value) % total.value
}
const next = () => go(current.value + 1)
const prev = () => go(current.value - 1)

function restartTimer() {
  clearInterval(timer)
  timer = null
  if (shouldRun.value && !document.hidden) timer = setInterval(next, AUTOPLAY_MS)
}

function linkFor(slide) {
  const target = slide.buttonTarget
  if (target === 'whatsapp') return { kind: 'external', href: props.whatsappUrl }
  if (target?.startsWith('/')) return { kind: 'route', to: target }
  if (target) return { kind: 'external', href: target }
  return null
}

function onPointerDown(event) {
  startX = event.clientX
}
function onPointerUp(event) {
  if (startX === null) return
  const delta = event.clientX - startX
  startX = null
  if (Math.abs(delta) > 50) delta < 0 ? next() : prev()
}

function onKeydown(event) {
  if (event.key === 'ArrowRight') next()
  if (event.key === 'ArrowLeft') prev()
}

const onVisibility = () => restartTimer()

onMounted(() => {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = query.matches
  query.addEventListener?.('change', (e) => {
    reducedMotion.value = e.matches
  })
  document.addEventListener('visibilitychange', onVisibility)
  restartTimer()
})
onBeforeUnmount(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisibility)
})

watch([shouldRun, current], restartTimer)
watch(total, () => {
  if (current.value >= total.value) current.value = 0
})
</script>

<template>
  <section
    v-if="total > 0"
    class="hero"
    aria-roledescription="carrossel"
    aria-label="Destaques da panificadora"
    tabindex="0"
    @keydown="onKeydown"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
    @focusin="focusInside = true"
    @focusout="focusInside = false"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointercancel="startX = null"
  >
    <div class="hero__track" :style="{ transform: `translateX(-${current * 100}%)` }">
      <article
        v-for="(slide, index) in slides"
        :key="slide.id"
        class="slide"
        role="group"
        aria-roledescription="slide"
        :aria-label="`${index + 1} de ${total}`"
        :aria-hidden="index !== current"
        :inert="index !== current"
      >
        <img
          v-if="slide.image && !failedImages.has(slide.id)"
          class="slide__image"
          :src="slide.image"
          alt=""
          :loading="index === 0 ? 'eager' : 'lazy'"
          :fetchpriority="index === 0 ? 'high' : 'auto'"
          draggable="false"
          @error="failedImages = new Set(failedImages).add(slide.id)"
        />
        <div class="slide__shade" />
        <div class="container slide__content">
          <h2 class="slide__title">{{ slide.title }}</h2>
          <p v-if="slide.subtitle" class="slide__subtitle">{{ slide.subtitle }}</p>
          <template v-if="slide.buttonText && linkFor(slide)">
            <RouterLink v-if="linkFor(slide).kind === 'route'" :to="linkFor(slide).to" class="btn btn--gold">
              {{ slide.buttonText }}
              <AppIcon name="arrow-right" :size="18" />
            </RouterLink>
            <a v-else :href="linkFor(slide).href" class="btn btn--gold" target="_blank" rel="noopener">
              {{ slide.buttonText }}
              <AppIcon name="arrow-right" :size="18" />
            </a>
          </template>
        </div>
      </article>
    </div>

    <template v-if="total > 1">
      <button type="button" class="hero__arrow hero__arrow--prev" aria-label="Slide anterior" @click="prev">
        <AppIcon name="chevron-left" :size="26" />
      </button>
      <button type="button" class="hero__arrow hero__arrow--next" aria-label="Próximo slide" @click="next">
        <AppIcon name="chevron-right" :size="26" />
      </button>

      <div class="hero__controls">
        <div class="hero__dots">
          <button
            v-for="(slide, index) in slides"
            :key="slide.id"
            type="button"
            class="hero__dot"
            :class="{ 'hero__dot--active': index === current }"
            :aria-label="`Ir para o slide ${index + 1}`"
            :aria-current="index === current"
            @click="go(index)"
          />
        </div>
        <button
          v-if="!reducedMotion"
          type="button"
          class="hero__pause"
          :aria-label="playing ? 'Pausar troca automática' : 'Retomar troca automática'"
          @click="playing = !playing"
        >
          <AppIcon :name="playing ? 'pause' : 'play'" :size="14" />
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  background: var(--wine-900);
  touch-action: pan-y;
}
.hero:focus-visible {
  outline-offset: -4px;
}
.hero__track {
  display: flex;
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide {
  position: relative;
  flex: 0 0 100%;
  display: flex;
  align-items: center;
  min-height: clamp(420px, 68vh, 620px);
}
.slide__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
}
.slide__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(46, 10, 12, 0.88) 0%, rgba(46, 10, 12, 0.62) 45%, rgba(46, 10, 12, 0.12) 100%);
}
.slide__content {
  position: relative;
  padding-top: 40px;
  padding-bottom: 72px;
  color: var(--cream-50);
}
.slide__title {
  max-width: 14em;
  margin-bottom: 0.3em;
  font-size: clamp(1.9rem, 4.4vw, 3.1rem);
  color: var(--cream-50);
}
.slide__subtitle {
  max-width: 34em;
  margin-bottom: 1.4em;
  font-size: clamp(1rem, 1.6vw, 1.2rem);
  color: rgba(253, 249, 241, 0.92);
}

.hero__arrow {
  position: absolute;
  top: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  margin-top: -23px;
  color: var(--cream-50);
  background: rgba(46, 10, 12, 0.5);
  border: 1px solid rgba(253, 249, 241, 0.4);
  border-radius: 50%;
  cursor: pointer;
}
.hero__arrow:hover {
  background: rgba(46, 10, 12, 0.8);
}
.hero__arrow--prev {
  left: 14px;
}
.hero__arrow--next {
  right: 14px;
}

.hero__controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}
.hero__dots {
  display: flex;
  gap: 4px;
}
/* Área de toque de 24px, com a bolinha visível menor dentro. */
.hero__dot {
  position: relative;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: 0;
  cursor: pointer;
}
.hero__dot::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  margin: -5px 0 0 -5px;
  border-radius: 50%;
  background: rgba(253, 249, 241, 0.5);
  transition: background-color 0.2s, width 0.2s, margin 0.2s;
}
.hero__dot--active::before {
  width: 26px;
  margin-left: -13px;
  border-radius: 5px;
  background: var(--gold-400);
}
.hero__pause {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: var(--cream-50);
  background: rgba(46, 10, 12, 0.5);
  border: 1px solid rgba(253, 249, 241, 0.4);
  border-radius: 50%;
  cursor: pointer;
}

@media (max-width: 640px) {
  .hero__arrow {
    display: none;
  }
  .slide {
    min-height: 440px;
  }
  .slide__shade {
    background: linear-gradient(0deg, rgba(46, 10, 12, 0.9) 0%, rgba(46, 10, 12, 0.55) 55%, rgba(46, 10, 12, 0.25) 100%);
  }
  .slide {
    align-items: flex-end;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__track {
    transition: none;
  }
}
</style>

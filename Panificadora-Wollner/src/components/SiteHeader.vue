<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from './AppIcon.vue'
import { useContent } from '../stores/content.js'
import { whatsappUrlGeneral } from '../../shared/whatsapp.js'

const { content } = useContent()
const route = useRoute()
const menuOpen = ref(false)

const links = [
  { to: '/', label: 'Início' },
  { to: '/encomendas', label: 'Encomendas' },
  { to: '/sobre', label: 'Sobre a Wollner' },
  { to: '/contato', label: 'Localização e contato' },
]

const whatsappUrl = computed(() => whatsappUrlGeneral(content.value))

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

function onKeydown(event) {
  if (event.key === 'Escape') menuOpen.value = false
}
</script>

<template>
  <header class="site-header" @keydown="onKeydown">
    <div class="container site-header__bar">
      <RouterLink to="/" class="brand" aria-label="Panificadora Wollner — página inicial">
        <img
          v-if="content.company.logo"
          :src="content.company.logo"
          :alt="`Logotipo da ${content.company.name}`"
          width="48"
          height="48"
        />
        <span class="brand__text">
          <strong>{{ content.company.name }}</strong>
          <small v-if="content.company.tagline">{{ content.company.tagline }}</small>
        </span>
      </RouterLink>

      <nav id="main-nav" class="nav" :class="{ 'nav--open': menuOpen }" aria-label="Principal">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="nav__link">
          {{ link.label }}
        </RouterLink>
        <a class="btn btn--whatsapp btn--small nav__cta" :href="whatsappUrl" target="_blank" rel="noopener">
          <AppIcon name="whatsapp" :size="18" />
          Encomendar pelo WhatsApp
        </a>
      </nav>

      <button
        type="button"
        class="menu-button"
        :aria-expanded="menuOpen"
        aria-controls="main-nav"
        @click="menuOpen = !menuOpen"
      >
        <AppIcon :name="menuOpen ? 'close' : 'menu'" :size="26" />
        <span class="visually-hidden">{{ menuOpen ? 'Fechar menu' : 'Abrir menu' }}</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--cream-50);
  border-bottom: 1px solid var(--cream-200);
}

.site-header__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: var(--header-height);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--wine-900);
}
.brand img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}
.brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}
.brand__text strong {
  font-family: var(--font-display);
  font-size: 1.15rem;
}
.brand__text small {
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-500);
}

.nav {
  display: flex;
  align-items: center;
  gap: 6px;
}
.nav__link {
  padding: 8px 12px;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  color: var(--ink-700);
  border-bottom: 2px solid transparent;
}
.nav__link:hover {
  color: var(--wine-700);
}
.nav__link.router-link-exact-active {
  color: var(--wine-800);
  border-bottom-color: var(--gold-500);
}
.nav__cta {
  margin-left: 10px;
}

.menu-button {
  display: none;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  color: var(--wine-800);
  background: transparent;
  border: 1px solid var(--cream-200);
  border-radius: var(--radius);
  cursor: pointer;
}

@media (max-width: 920px) {
  .menu-button {
    display: inline-flex;
  }
  .nav {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    display: none;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 8px 20px 20px;
    background: var(--cream-50);
    border-bottom: 1px solid var(--cream-200);
    box-shadow: var(--shadow-md);
  }
  .nav--open {
    display: flex;
  }
  .nav__link {
    padding: 14px 4px;
    border-bottom: 1px solid var(--cream-200);
  }
  .nav__link.router-link-exact-active {
    border-bottom-color: var(--gold-500);
  }
  .nav__cta {
    margin: 16px 0 0;
    min-height: 48px;
  }
}
</style>

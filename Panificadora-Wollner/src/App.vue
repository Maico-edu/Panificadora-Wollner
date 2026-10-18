<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'
import WhatsAppFloat from './components/WhatsAppFloat.vue'
import OrderDialog from './components/OrderDialog.vue'
import { useContent } from './stores/content.js'

const route = useRoute()
const { loadContent, settled } = useContent()
const isAdmin = computed(() => route.meta.admin === true)

onMounted(loadContent)
</script>

<template>
  <RouterView v-if="isAdmin" />
  <div v-else-if="!settled" class="boot" role="status" aria-live="polite">
    <img src="/images/logo-wollner.png" alt="" width="96" height="96" />
    <span>Carregando…</span>
  </div>
  <template v-else>
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <SiteHeader />
    <main id="conteudo">
      <RouterView />
    </main>
    <SiteFooter />
    <WhatsAppFloat />
    <OrderDialog />
  </template>
</template>

<style>
.boot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 100vh;
  color: var(--ink-500);
}
.boot img {
  border-radius: 50%;
  animation: boot-pulse 1.6s ease-in-out infinite;
}
@keyframes boot-pulse {
  50% {
    opacity: 0.55;
  }
}
.skip-link {
  position: absolute;
  left: 12px;
  top: -60px;
  z-index: 100;
  padding: 10px 16px;
  color: #fff;
  background: var(--wine-800);
  border-radius: var(--radius);
}
.skip-link:focus {
  top: 12px;
}
</style>

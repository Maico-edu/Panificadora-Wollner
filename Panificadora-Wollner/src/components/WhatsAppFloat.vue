<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { useContent } from '../stores/content.js'
import { whatsappUrlGeneral } from '../../shared/whatsapp.js'

const { content } = useContent()
const url = computed(() => whatsappUrlGeneral(content.value, 'floating'))
</script>

<template>
  <a class="wa-float" :href="url" target="_blank" rel="noopener" aria-label="Falar com a Wollner no WhatsApp">
    <AppIcon name="whatsapp" :size="30" />
  </a>
</template>

<style scoped>
.wa-float {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  color: #fff;
  background: var(--whatsapp);
  border-radius: 50%;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
  transition: background-color 0.15s, transform 0.15s;
}
.wa-float:hover {
  background: var(--whatsapp-dark);
  transform: scale(1.06);
}
.wa-float::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--whatsapp);
  opacity: 0;
  animation: wa-ring 3.2s ease-out infinite;
}
@keyframes wa-ring {
  0% {
    transform: scale(1);
    opacity: 0.55;
  }
  60%,
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}
</style>

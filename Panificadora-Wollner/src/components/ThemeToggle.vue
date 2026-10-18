<script setup>
import { useTheme } from '../stores/theme.js'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'"
    :aria-pressed="isDark"
    :title="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'"
    @click="toggleTheme"
  >
    <span class="theme-toggle__emoji" aria-hidden="true">☀️</span>
    <span class="theme-toggle__emoji" aria-hidden="true">🌙</span>
    <span class="theme-toggle__thumb" :class="{ 'theme-toggle__thumb--dark': isDark }" aria-hidden="true" />
  </button>
</template>

<style scoped>
.theme-toggle {
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  width: 76px;
  height: 40px;
  padding: 4px;
  color: inherit;
  background: var(--cream-100);
  border: 1px solid var(--cream-200);
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.theme-toggle__emoji {
  z-index: 1;
  display: grid;
  width: 32px;
  height: 30px;
  place-items: center;
  font-size: 16px;
  line-height: 1;
}

.theme-toggle__thumb {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 32px;
  height: 30px;
  background: var(--surface-card);
  border-radius: 999px;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease;
}

.theme-toggle__thumb--dark {
  transform: translateX(34px);
}

@media (max-width: 480px) {
  .theme-toggle {
    width: 68px;
    height: 36px;
  }
  .theme-toggle__emoji {
    width: 28px;
    height: 26px;
  }
  .theme-toggle__thumb {
    width: 28px;
    height: 26px;
  }
  .theme-toggle__thumb--dark {
    transform: translateX(32px);
  }
}
</style>

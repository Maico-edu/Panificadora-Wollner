<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import AdminLogin from '../components/admin/AdminLogin.vue'
import AdminProducts from '../components/admin/AdminProducts.vue'
import AdminCategories from '../components/admin/AdminCategories.vue'
import AdminHome from '../components/admin/AdminHome.vue'
import AdminAbout from '../components/admin/AdminAbout.vue'
import AdminContact from '../components/admin/AdminContact.vue'
import AdminMessages from '../components/admin/AdminMessages.vue'
import ConfirmDialog from '../components/admin/ConfirmDialog.vue'
import { useAdmin } from '../stores/admin.js'
import { useConfirm } from '../composables/useConfirm.js'
import '../assets/styles/admin.css'

const admin = useAdmin()
const { askConfirm } = useConfirm()

const TABS = [
  { id: 'produtos', label: 'Produtos', component: AdminProducts },
  { id: 'categorias', label: 'Categorias', component: AdminCategories },
  { id: 'inicio', label: 'Página inicial', component: AdminHome },
  { id: 'institucional', label: 'Institucional', component: AdminAbout },
  { id: 'contato', label: 'Contato', component: AdminContact },
  { id: 'mensagens', label: 'Mensagens', component: AdminMessages },
]

const tab = ref('produtos')
const current = computed(() => TABS.find((t) => t.id === tab.value))

const savedLabel = computed(() => {
  if (!admin.savedAt.value) return 'Ainda não houve gravação pelo painel.'
  return `Última gravação: ${new Date(admin.savedAt.value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`
})

function warnBeforeLeaving(event) {
  if (admin.dirty.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}

let robots = null
onMounted(() => {
  robots = document.createElement('meta')
  robots.name = 'robots'
  robots.content = 'noindex, nofollow'
  document.head.appendChild(robots)
  window.addEventListener('beforeunload', warnBeforeLeaving)
  admin.checkSession()
})
onBeforeUnmount(() => {
  robots?.remove()
  window.removeEventListener('beforeunload', warnBeforeLeaving)
})

async function discardChanges() {
  const ok = await askConfirm({
    title: 'Descartar as alterações?',
    message: 'Tudo o que foi editado desde a última gravação será perdido.',
    confirmText: 'Descartar',
  })
  if (ok) admin.discard()
}

async function leave() {
  if (admin.dirty.value) {
    const ok = await askConfirm({
      title: 'Sair sem salvar?',
      message: 'Há alterações que ainda não foram salvas.',
      confirmText: 'Sair mesmo assim',
    })
    if (!ok) return
  }
  admin.logout()
}
</script>

<template>
  <div class="adm">
    <p v-if="admin.auth.value === 'checking'" class="state" role="status">Carregando painel…</p>

    <div v-else-if="admin.auth.value === 'unconfigured'" class="state state--card">
      <h1>Painel ainda não configurado</h1>
      <p>
        Faltam as variáveis de ambiente do login. Defina <code>ADMIN_USER</code>, <code>ADMIN_PASSWORD_HASH</code> e
        <code>SESSION_SECRET</code> (veja o passo a passo no README) e publique de novo.
      </p>
      <RouterLink to="/" class="btn btn--outline">Voltar ao site</RouterLink>
    </div>

    <div v-else-if="admin.auth.value === 'error'" class="state state--card">
      <h1>Não foi possível abrir o painel</h1>
      <p>{{ admin.authMessage.value }}</p>
      <button type="button" class="btn btn--primary" @click="admin.checkSession()">Tentar de novo</button>
    </div>

    <AdminLogin v-else-if="admin.auth.value === 'out'" />

    <template v-else>
      <header class="top">
        <div class="top__inner">
          <img src="/images/logo-wollner.png" alt="" width="40" height="40" />
          <div class="top__title">
            <strong>Painel da Wollner</strong>
            <small>Armazenamento: {{ admin.storage.value.label }}</small>
          </div>
          <RouterLink to="/" class="btn btn--outline btn--small" target="_blank">
            <AppIcon name="external" :size="16" />
            Ver o site
          </RouterLink>
          <button type="button" class="btn btn--outline btn--small" @click="leave">
            <AppIcon name="logout" :size="16" />
            Sair
          </button>
        </div>
        <nav class="tabs" aria-label="Seções do painel">
          <button
            v-for="t in TABS"
            :key="t.id"
            type="button"
            class="tabs__button"
            :aria-current="tab === t.id ? 'page' : undefined"
            @click="tab = t.id"
          >
            {{ t.label }}
          </button>
        </nav>
      </header>

      <main class="content">
        <p v-if="!admin.storage.value.ready" class="alert" role="alert">
          O armazenamento não está configurado neste ambiente: não é possível salvar nem enviar fotos. Veja o README (Vercel Blob).
        </p>
        <p v-if="admin.loading.value" class="state" role="status">Carregando dados…</p>
        <component :is="current.component" v-else-if="admin.draft.value" />
      </main>

      <div class="savebar" role="region" aria-label="Salvar alterações">
        <div class="savebar__inner">
          <p class="savebar__status" :class="{ 'savebar__status--dirty': admin.dirty.value }" aria-live="polite">
            <template v-if="admin.saving.value">Salvando…</template>
            <template v-else-if="admin.dirty.value">Há alterações não salvas</template>
            <template v-else>Tudo salvo</template>
            <small>{{ savedLabel }}</small>
          </p>
          <button type="button" class="btn btn--outline" :disabled="!admin.dirty.value || admin.saving.value" @click="discardChanges">
            Descartar
          </button>
          <button type="button" class="btn btn--primary" :disabled="!admin.dirty.value || admin.saving.value" @click="admin.save()">
            {{ admin.saving.value ? 'Salvando…' : 'Salvar alterações' }}
          </button>
        </div>
      </div>
    </template>

    <div v-if="admin.notice.value" class="toast" :class="`toast--${admin.notice.value.type}`" :role="admin.notice.value.type === 'error' ? 'alert' : 'status'">
      <div>
        <p>{{ admin.notice.value.text }}</p>
        <ul v-if="admin.notice.value.details.length">
          <li v-for="detail in admin.notice.value.details" :key="detail">{{ detail }}</li>
        </ul>
      </div>
      <button type="button" aria-label="Fechar aviso" @click="admin.dismissNotice()"><AppIcon name="close" :size="18" /></button>
    </div>

    <ConfirmDialog />
  </div>
</template>

<style scoped>
.state {
  padding: 60px 20px;
  text-align: center;
  color: var(--ink-500);
}
.state--card {
  max-width: 520px;
  margin: 12vh auto 0;
  padding: 32px;
  color: var(--ink-900);
  background: #fff;
  border: 1px solid var(--cream-200);
  border-radius: var(--radius-lg);
}
.state code {
  padding: 1px 6px;
  font-size: 0.9em;
  background: var(--cream-100);
  border-radius: 4px;
}

.top {
  position: sticky;
  top: 0;
  z-index: 30;
  background: var(--cream-50);
  border-bottom: 1px solid var(--cream-200);
}
.top__inner {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 1040px;
  margin: 0 auto;
  padding: 10px 16px;
}
.top__inner img {
  border-radius: 50%;
}
.top__title {
  display: flex;
  flex: 1;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
}
.top__title small {
  color: var(--ink-500);
}

.tabs {
  display: flex;
  gap: 4px;
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 12px;
  overflow-x: auto;
}
.tabs__button {
  flex: none;
  min-height: 44px;
  padding: 8px 16px;
  font: 700 0.92rem var(--font-body);
  color: var(--ink-700);
  background: transparent;
  border: 0;
  border-bottom: 3px solid transparent;
  cursor: pointer;
}
.tabs__button:hover {
  color: var(--wine-700);
}
.tabs__button[aria-current='page'] {
  color: var(--wine-800);
  border-bottom-color: var(--gold-500);
}

.content {
  max-width: 1040px;
  margin: 0 auto;
  padding: 22px 16px 120px;
}

.alert {
  margin: 0 0 18px;
  padding: 12px 16px;
  font-weight: 700;
  color: #7a2a00;
  background: #fde2c8;
  border-radius: var(--radius);
}

.savebar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 30;
  background: #fff;
  border-top: 1px solid var(--cream-200);
  box-shadow: 0 -4px 16px rgba(46, 10, 12, 0.1);
}
.savebar__inner {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 1040px;
  margin: 0 auto;
  padding: 10px 16px;
}
.savebar__status {
  display: flex;
  flex: 1;
  flex-direction: column;
  margin: 0;
  font-weight: 700;
  color: var(--success);
  line-height: 1.25;
}
.savebar__status--dirty {
  color: #9a4a00;
}
.savebar__status small {
  font-weight: 400;
  color: var(--ink-500);
}

.toast {
  position: fixed;
  right: 16px;
  bottom: 86px;
  left: 16px;
  z-index: 60;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  max-width: 560px;
  margin-left: auto;
  padding: 14px 16px;
  color: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
.toast--success {
  background: var(--success);
}
.toast--error {
  background: var(--danger);
}
.toast p {
  margin: 0;
  font-weight: 700;
}
.toast ul {
  margin: 8px 0 0;
  padding-left: 18px;
  font-size: 0.9rem;
}
.toast button {
  flex: none;
  display: flex;
  padding: 4px;
  color: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
}

@media (max-width: 640px) {
  .top__inner {
    flex-wrap: wrap;
  }
  .top__title {
    flex-basis: calc(100% - 52px);
  }
  .savebar__inner {
    flex-wrap: wrap;
  }
  .savebar__status {
    flex-basis: 100%;
  }
  .savebar__inner .btn {
    flex: 1;
  }
}
</style>

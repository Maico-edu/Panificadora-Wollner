<script setup>
import { ref } from 'vue'
import { useAdmin } from '../../stores/admin.js'

const { login, authMessage } = useAdmin()
const user = ref('')
const password = ref('')
const busy = ref(false)

async function submit() {
  if (busy.value) return
  busy.value = true
  const ok = await login(user.value.trim(), password.value)
  busy.value = false
  if (ok) password.value = ''
}
</script>

<template>
  <div class="login">
    <form class="login__card" @submit.prevent="submit">
      <img src="/images/logo-wollner.png" alt="" width="72" height="72" />
      <h1>Painel da Wollner</h1>
      <p class="login__help">Área restrita para editar o site.</p>

      <label class="adm-field">
        Usuário
        <input v-model="user" type="text" autocomplete="username" required />
      </label>
      <label class="adm-field">
        Senha
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>

      <p v-if="authMessage" class="login__error" role="alert">{{ authMessage }}</p>

      <button type="submit" class="btn btn--primary login__submit" :disabled="busy">
        {{ busy ? 'Entrando…' : 'Entrar' }}
      </button>
      <RouterLink to="/" class="login__back">Voltar ao site</RouterLink>
    </form>
  </div>
</template>

<style scoped>
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}
.login__card {
  display: grid;
  gap: 14px;
  width: min(400px, 100%);
  padding: 32px 28px;
  text-align: center;
  background: #fff;
  border: 1px solid var(--cream-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
.login__card img {
  margin: 0 auto;
  border-radius: 50%;
}
.login__card h1 {
  margin: 0;
  font-size: 1.6rem;
}
.login__help {
  margin: 0;
  color: var(--ink-500);
}
.login__card .adm-field {
  text-align: left;
}
.login__error {
  margin: 0;
  padding: 10px 12px;
  font-size: 0.9rem;
  text-align: left;
  color: var(--danger);
  background: #fdecea;
  border-radius: var(--radius);
}
.login__submit {
  width: 100%;
}
.login__back {
  font-size: 0.9rem;
}
</style>

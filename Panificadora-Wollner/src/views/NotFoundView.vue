<template>
  <section class="section container not-found">
    <span class="eyebrow">Erro 404</span>
    <h1>Página não encontrada</h1>
    <p class="lead">O endereço que você abriu não existe ou foi trocado.</p>
    <RouterLink to="/" class="btn btn--primary">Voltar ao início</RouterLink>
  </section>
</template>

<style scoped>
.not-found {
  min-height: 50vh;
}
</style>

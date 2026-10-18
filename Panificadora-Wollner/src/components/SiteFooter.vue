<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { useContent } from '../stores/content.js'
import { formatAddress } from '../../shared/company.js'
import { formatWhatsappNumber, whatsappUrlGeneral } from '../../shared/whatsapp.js'

const { content } = useContent()
const company = computed(() => content.value.company)
const year = new Date().getFullYear()
const address = computed(() => formatAddress(company.value.address))
const whatsappUrl = computed(() => whatsappUrlGeneral(content.value))
</script>

<template>
  <footer class="footer">
    <div class="container footer__grid">
      <div class="footer__about">
        <div class="footer__brand">
          <img v-if="company.logo" :src="company.logo" :alt="`Logotipo da ${company.name}`" width="56" height="56" />
          <strong>{{ company.name }}</strong>
        </div>
        <p v-if="company.description">{{ company.description }}</p>
      </div>

      <nav aria-label="Rodapé">
        <h2 class="footer__title">Navegação</h2>
        <ul>
          <li><RouterLink to="/">Início</RouterLink></li>
          <li><RouterLink to="/encomendas">Encomendas</RouterLink></li>
          <li><RouterLink to="/sobre">Sobre a Wollner</RouterLink></li>
          <li><RouterLink to="/contato">Localização e contato</RouterLink></li>
        </ul>
      </nav>

      <div>
        <h2 class="footer__title">Visite a loja</h2>
        <p class="footer__line">
          <AppIcon name="map-pin" :size="18" />
          <span>{{ address }}</span>
        </p>
        <ul v-if="company.hours.length" class="footer__hours">
          <li v-for="hour in company.hours" :key="hour.label + hour.value">
            <span>{{ hour.label }}</span> <strong>{{ hour.value }}</strong>
          </li>
        </ul>
      </div>

      <div>
        <h2 class="footer__title">Fale com a gente</h2>
        <p class="footer__line">
          <AppIcon name="whatsapp" :size="18" />
          <a :href="whatsappUrl" target="_blank" rel="noopener">{{ formatWhatsappNumber(company.whatsapp) }}</a>
        </p>
        <p v-if="company.email" class="footer__line">
          <AppIcon name="mail" :size="18" />
          <a :href="`mailto:${company.email}`">{{ company.email }}</a>
        </p>
        <div class="footer__social">
          <a v-if="company.social.instagram" :href="company.social.instagram" target="_blank" rel="noopener" aria-label="Instagram da Wollner">
            <AppIcon name="instagram" :size="22" />
          </a>
          <a v-if="company.social.facebook" :href="company.social.facebook" target="_blank" rel="noopener" aria-label="Facebook da Wollner">
            <AppIcon name="facebook" :size="22" />
          </a>
        </div>
      </div>
    </div>

    <div class="footer__bottom">
      <div class="container">© {{ year }} {{ company.name }}. Todos os direitos reservados.</div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--wine-950);
  color: rgba(253, 249, 241, 0.82);
  font-size: 0.95rem;
}
.footer a {
  color: inherit;
}
.footer a:hover {
  color: var(--gold-400);
}
.footer__grid {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 1.2fr 1fr;
  gap: 40px;
  padding-top: 56px;
  padding-bottom: 40px;
}
.footer__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--cream-50);
}
[data-theme='dark'] .footer__brand {
  color: #fff5ed;
}
.footer__brand img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}
.footer__title {
  margin: 0 0 14px;
  font-family: var(--font-body);
  font-size: 0.8rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gold-400);
}
.footer ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.footer li {
  margin-bottom: 8px;
}
.footer__line {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 10px;
}
.footer__line svg {
  flex: none;
  margin-top: 3px;
  color: var(--gold-400);
}
.footer__hours span {
  opacity: 0.8;
}
.footer__social {
  display: flex;
  gap: 14px;
  margin-top: 14px;
}
.footer__bottom {
  padding: 18px 0;
  font-size: 0.85rem;
  border-top: 1px solid rgba(253, 249, 241, 0.14);
}

@media (max-width: 920px) {
  .footer__grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 560px) {
  .footer__grid {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}
</style>

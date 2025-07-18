<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <!-- Animação do 404 -->
      <div class="error-animation">
        <div class="number-404">
          <span class="four">4</span>
          <span class="zero">0</span>
          <span class="four">4</span>
        </div>
        <div class="floating-elements">
          <div class="floating-dot dot-1"></div>
          <div class="floating-dot dot-2"></div>
          <div class="floating-dot dot-3"></div>
          <div class="floating-dot dot-4"></div>
        </div>
      </div>

      <!-- Mensagem -->
      <div class="error-message">
        <h1>Oops! Página não encontrada</h1>
        <p>A página que você está procurando não existe ou foi movida.</p>
        <p class="error-url">
          URL: <span>{{ currentUrl }}</span>
        </p>
      </div>

      <!-- Botões de ação -->
      <div class="action-buttons">
        <button @click="goHome" class="btn-home">
          <i class="icon-home">🏠</i>
          Voltar para Home
        </button>
        <button @click="goBack" class="btn-back">
          <i class="icon-back">↩️</i>
          Voltar
        </button>
      </div>

      <!-- Links úteis -->
      <div class="useful-links">
        <h3>Páginas disponíveis:</h3>
        <div class="links-grid">
          <router-link to="/" class="useful-link">
            <i class="icon">🏠</i>
            <span>Home</span>
          </router-link>
          <router-link to="/cv" class="useful-link">
            <i class="icon">📄</i>
            <span>Currículo</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import "./NotFound.css";

const router = useRouter();
const route = useRoute();
const currentUrl = ref("");

onMounted(() => {
  currentUrl.value = window.location.href;
});

const goHome = () => {
  router.push("/");
};

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    router.push("/");
  }
};
</script>

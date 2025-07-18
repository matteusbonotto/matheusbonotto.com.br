<template>
  <div id="app" :class="{ 'home-page': isHomePage }">
    <Header v-if="!isHomePage && !isCv && !isNotFound" />
    <main class="main-content">
      <router-view />
    </main>
    <Footer v-if="!isHomePage && !isCv && !isNotFound" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import Header from "./components/Header/Header.vue";
import Footer from "./components/Footer/Footer.vue";
import About from "./components/About/About.vue";

const route = useRoute();
const isHomePage = computed(() => route.path === "/");
const isCv = computed(() => route.name === "CV");
const isNotFound = computed(() => route.name === "NotFound");
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

body {
  overflow-y: auto !important;
}

#app {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

#app.home-page {
  overflow: hidden;
}

.main-content {
  flex: 1;
  width: 100%;
  overflow-y: auto;
}

/* Reset para páginas internas */
#app:not(.home-page) {
  overflow-y: auto;
  height: auto;
}
</style>

<template>
  <v-app>
    <Header v-if="!isHomePage" />
    <v-main>
      <router-view />
    </v-main>
    <Footer v-if="!isHomePage" />
  </v-app>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/Header/Header.vue'
import Footer from './components/Footer/Footer.vue'

const route = useRoute()
const isHomePage = computed(() => route.path === '/')
</script>

<style>
:root {
  --primary-color: #1976D2;
  --secondary-color: #424242;
  --success-color: #4CAF50;
  --warning-color: #FFC107;
  --error-color: #FF5252;
}

html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>

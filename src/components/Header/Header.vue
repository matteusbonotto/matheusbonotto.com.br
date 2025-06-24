<template>
  <v-app-bar app color="primary" dark>
    <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
    <v-app-bar-title>
      <router-link to="/" class="white--text text-decoration-none">
        Matheus Bonotto
      </router-link>
    </v-app-bar-title>
    <v-spacer></v-spacer>
    <v-btn icon @click="returnToHome">
      <v-icon>mdi-home</v-icon>
    </v-btn>
  </v-app-bar>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const drawer = ref(false)
const router = useRouter()

const returnToHome = () => {
  router.push('/')
}
</script>

<style scoped>
/* Estilos específicos do cabeçalho */
</style>
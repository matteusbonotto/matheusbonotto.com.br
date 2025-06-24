<template>
<header>
  <nav>
    <router-link to="/" class="logo">Matheus Bonotto</router-link>
    <div class="nav-links">
      <router-link to="/cv">CV</router-link>
      <router-link to="/qa">QA</router-link>
    </div>
  </nav>
</header>
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
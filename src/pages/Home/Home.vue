<template>
  <div class="home-page">
    <!-- Container para o background que ocupa a tela toda -->
    <div class="home-background"></div>
    <!-- Título fixo centralizado no topo -->
    <!-- <div class="welcome-title">
      <h2>Olá sou Matheus Bonotto</h2>
      <h1>Bem vindo, escolha um segmento</h1>
    </div> -->

    <div class="home-container">
      <div
        v-for="(option, index) in options"
        :key="index"
        class="menu-option"
        :class="[`bg-${option.color}`, { expanded: hoveredOption === index }]"
        @mouseover="setHoveredOption(index)"
        @mouseleave="hoveredOption = null"
        @touchstart="handleTouchStart(index)"
        @touchend="handleTouchEnd(index, option.route)"
        @click="navigateTo(option.route)"
      >
        <div class="option-content">
          <v-icon size="100" :color="option.iconColor">{{ option.icon }}</v-icon>
          <span class="option-title">{{ option.title }}</span>
          <span class="option-text">{{ option.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import "./Home.css";

const router = useRouter();
const hoveredOption = ref(null);

// Função aprimorada para controlar melhor o hover
const setHoveredOption = (index) => {
  hoveredOption.value = index;
};

const options = [
  {
    title: "QA",
    text: "Quality assurance, testes e automação",
    icon: "mdi-bug",
    color: "qa",
    iconColor: "white",
    route: "/qa",
  },
  {
    title: "DEV",
    text: "Desenvolvimentos, aplicações web, e projetos",
    icon: "mdi-code-tags",
    color: "dev",
    iconColor: "white",
    route: "/dev",
  },
  {
    title: "CV",
    text: "Currículo e contatos profissionais",
    icon: "mdi-file-document",
    color: "cv",
    iconColor: "white",
    route: "/cv",
  },
  {
    title: "OUTROS",
    text: "Outros projetos que tenho feito, por hobby ou interesse",
    icon: "mdi-dots-horizontal",
    color: "others",
    iconColor: "white",
    route: "/others",
  },
];

const touchStartTime = ref(0);
const touchTimeout = ref(null);
const isMobile = ref(false);

// Verificar se é um dispositivo móvel ao carregar o componente
import { onMounted } from "vue";

onMounted(() => {
  checkIfMobile();
  window.addEventListener("resize", checkIfMobile);
});

const checkIfMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// Função para lidar com eventos de toque
const handleTouchStart = (index) => {
  touchStartTime.value = Date.now();
  // Em dispositivos móveis, mostrar o efeito de hover ao tocar
  if (isMobile.value) {
    hoveredOption.value = index;
  }
};

const handleTouchEnd = (index, route) => {
  const touchDuration = Date.now() - touchStartTime.value;
  // Se o toque foi curto, navegue imediatamente
  if (touchDuration < 500) {
    navigateTo(route);
  }
};

const navigateTo = (route) => {
  // Adiciona pequeno atraso para permitir ver o efeito de hover antes de navegar
  setTimeout(() => {
    router.push(route);
  }, 200);
};
</script>

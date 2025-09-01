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
        @mouseenter="handleMouseEnter(index)"
        @mouseleave="clearHoverState(index)"
        @click="navigateTo(option.route)"
        @touchstart="handleTouchStart(index)"
        @touchend="handleTouchEnd(index, option.route)"
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
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import "./Home.css";

const router = useRouter();
const hoveredOption = ref(null);
const hoverTimer = ref(null);
const touchStartTime = ref(0);
const isMobile = ref(false);

// Opções do menu
const options = [
  // {
  //   title: "QA",
  //   text: "Quality assurance, testes e automação",
  //   icon: "mdi-bug",
  //   color: "qa",
  //   iconColor: "white",
  //   route: "/qa",
  // },
  // {
  //   title: "DEV",
  //   text: "Desenvolvimentos, aplicações web, e projetos",
  //   icon: "mdi-code-tags",
  //   color: "dev",
  //   iconColor: "white",
  //   route: "/dev",
  // },
  {
    title: "CURRÍCULO",
    text: "Currículo e contatos profissionais",
    icon: "mdi-file-document",
    color: "cv",
    iconColor: "white",
    route: "/cv",
  },
  {
    title: "COMPETÊNCIAS",
    text: "Sistema de habilidades e conquistas profissionais",
    icon: "mdi-chart-tree",
    color: "competence",
    iconColor: "white",
    route: "/competence",
  },
  // {
  //   title: "OUTROS",
  //   text: "Outros projetos que tenho feito, por hobby ou interesse",
  //   icon: "mdi-dots-horizontal",
  //   color: "others",
  //   iconColor: "white",
  //   route: "/others",
  // },
];

// Verificar se é um dispositivo móvel ao carregar o componente
onMounted(() => {
  checkIfMobile();
  window.addEventListener("resize", checkIfMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", checkIfMobile);
  clearTimeout(hoverTimer.value);
});

const checkIfMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// Função simplificada para lidar com mouse enter
const handleMouseEnter = (index) => {
  // Limpar qualquer timer pendente antes de criar um novo
  clearTimeout(hoverTimer.value);
  
  // Defina o timer para expandir após um pequeno delay
  hoverTimer.value = setTimeout(() => {
    hoveredOption.value = index;
  }, 150); // Delay curto para evitar expansões acidentais
};

// Função para limpar o estado do hover
const clearHoverState = (index) => {
  clearTimeout(hoverTimer.value);
  if (hoveredOption.value === index) {
    hoveredOption.value = null;
  }
};

// Funções para lidar com eventos de toque
const handleTouchStart = (index) => {
  touchStartTime.value = Date.now();
  if (isMobile.value) {
    // Em dispositivos móveis, mostrar o efeito de hover ao tocar
    // mas evitar expandir se já estiver expandido (toggle)
    if (hoveredOption.value === index) {
      hoveredOption.value = null;
    } else {
      hoveredOption.value = index;
    }
  }
};

const handleTouchEnd = (index, route) => {
  const touchDuration = Date.now() - touchStartTime.value;
  // Se o toque foi curto, navegue
  if (touchDuration < 300) {
    navigateTo(route);
  }
};

const navigateTo = (route) => {
  // Atraso reduzido para melhor experiência do usuário
  setTimeout(() => {
    router.push(route);
  }, 150);
};
</script>
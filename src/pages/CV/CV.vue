<template>
  <div class="cv-iframe-container">
    <iframe 
      src="/curriculo/index.html" 
      class="cv-iframe"
      frameborder="0"
      title="Currículo Matheus Bonotto"
    ></iframe>
  </div>
</template>

<script>
export default {
  name: 'CVPage',
  mounted() {
    // Remover qualquer margin/padding do body quando o componente for montado
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
  },
  
  beforeUnmount() {
    // Restaurar estilos originais quando o componente for desmontado
    document.body.style.margin = '';
    document.body.style.padding = '';
    document.body.style.overflow = '';
  }
};
</script>

<style scoped>
.cv-iframe-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.cv-iframe {
  width: 100%;
  height: 100%;
  border: none;
  margin: 0;
  padding: 0;
}
</style>
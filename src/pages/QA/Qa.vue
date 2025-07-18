<template>
  <div class="qa-page">
    <div class="qa-header">
      <h1 class="animate-title">Quality Assurance</h1>
      <p class="animate-subtitle">Garantindo qualidade em cada linha de código</p>
    </div>
    
    <section class="qa-section experience-section">
      <h2>Experiência em QA</h2>
      <p>
        Especialista em Quality Assurance com experiência na implementação de processos 
        que garantem a entrega de software de alta qualidade. Minha abordagem combina 
        testes manuais e automatizados para detectar problemas cedo no ciclo de desenvolvimento.
      </p>
      <div class="qa-highlights">
        <div class="highlight-card">
          <i class="fas fa-check-circle"></i>
          <h3>Testes Automatizados</h3>
          <p>Desenvolvimento de frameworks robustos de automação</p>
        </div>
        <div class="highlight-card">
          <i class="fas fa-bug"></i>
          <h3>Detecção de Bugs</h3>
          <p>Identificação e documentação precisa de problemas</p>
        </div>
        <div class="highlight-card">
          <i class="fas fa-code-branch"></i>
          <h3>Integração Contínua</h3>
          <p>Implementação de testes em pipelines CI/CD</p>
        </div>
      </div>
    </section>
    
    <section class="qa-section work-section">
      <h2>Últimos Trabalhos</h2>
      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <h3>Empresa XYZ</h3>
            <span class="date">2022 - Presente</span>
            <p>Liderança de equipe de QA, implementação de testes E2E com Cypress</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <h3>Empresa ABC</h3>
            <span class="date">2020 - 2022</span>
            <p>Desenvolvimento de framework de testes automatizados, redução de bugs em 40%</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <h3>Empresa DEF</h3>
            <span class="date">2018 - 2020</span>
            <p>Implementação de cultura de qualidade, testes de integração</p>
          </div>
        </div>
      </div>
    </section>
    
    <section class="qa-section skills-section">
      <h2>Habilidades</h2>
      <div class="skills-container">
        <div class="skill">
          <label>Testes Automatizados</label>
          <div class="skill-bar">
            <div class="skill-level" style="width: 95%"></div>
          </div>
        </div>
        <div class="skill">
          <label>Selenium</label>
          <div class="skill-bar">
            <div class="skill-level" style="width: 90%"></div>
          </div>
        </div>
        <div class="skill">
          <label>Cypress</label>
          <div class="skill-bar">
            <div class="skill-level" style="width: 85%"></div>
          </div>
        </div>
        <div class="skill">
          <label>Jest/Mocha</label>
          <div class="skill-bar">
            <div class="skill-level" style="width: 80%"></div>
          </div>
        </div>
        <div class="skill">
          <label>Agile Testing</label>
          <div class="skill-bar">
            <div class="skill-level" style="width: 90%"></div>
          </div>
        </div>
      </div>
    </section>
    
    <section class="qa-section projects-section">
      <h2>Projetos</h2>
      <div class="projects-grid">
        <div class="project-card">
          <div class="project-header">
            <h3>Framework de Automação</h3>
          </div>
          <div class="project-body">
            <p>Framework personalizado para automação de testes usando Python e Selenium</p>
          </div>
          <div class="project-tech">
            <span>Python</span>
            <span>Selenium</span>
            <span>Docker</span>
          </div>
        </div>
        <div class="project-card">
          <div class="project-header">
            <h3>Dashboard de Qualidade</h3>
          </div>
          <div class="project-body">
            <p>Dashboard para monitoramento em tempo real da qualidade e resultados de testes</p>
          </div>
          <div class="project-tech">
            <span>React</span>
            <span>Node.js</span>
            <span>MongoDB</span>
          </div>
        </div>
        <div class="project-card">
          <div class="project-header">
            <h3>CI/CD Pipeline</h3>
          </div>
          <div class="project-body">
            <p>Integração de testes automatizados em pipelines de integração contínua</p>
          </div>
          <div class="project-tech">
            <span>Jenkins</span>
            <span>GitHub Actions</span>
            <span>AWS</span>
          </div>
        </div>
      </div>
    </section>
    
    <section class="qa-section contact-section">
      <h2>Vamos conversar sobre Qualidade?</h2>
      <p>Estou sempre interessado em discutir como melhorar processos de QA e implementar soluções inovadoras.</p>
      <button class="contact-button">Entre em contato</button>
    </section>
  </div>
</template>

<script>
import './Qa.css';
export default {
  name: 'QaPage',
  mounted() {
    // Ativar animações quando os elementos entrarem na viewport
    this.setupScrollAnimations();
  },
  methods: {
    setupScrollAnimations() {
      const observerOptions = {
        threshold: 0.1
      };
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);
      
      const sections = document.querySelectorAll('.qa-section');
      sections.forEach(section => {
        observer.observe(section);
      });
    }
  }
}
</script>
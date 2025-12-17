# Matheus Bonotto - Portfólio Profissional

<div align="center">
  <img src="assets/logo-branco.png" alt="Logo" width="120" height="120" style="background: #212529; border-radius: 50%; padding: 20px;">
  
  <h3>Portfólio interativo com gamificação de competências</h3>
  
  <p>
    <a href="https://matheusbonotto.com.br">🌐 Ver Online</a> •
    <a href="#funcionalidades">✨ Funcionalidades</a> •
    <a href="#tecnologias">🛠️ Tecnologias</a> •
    <a href="#instalação">📦 Instalação</a>
  </p>
  
  ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
  ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
  ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
  ![Alpine.js](https://img.shields.io/badge/Alpine.js-8BC0D0?style=flat&logo=alpine.js&logoColor=black)
  ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
  ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)
</div>

---

## 📋 Sobre o Projeto

Portfólio profissional desenvolvido para apresentar trajetória, projetos e competências de forma interativa e visualmente atrativa. O sistema utiliza conceitos de gamificação para exibir habilidades em formato de árvore de skills e conquistas desbloqueáveis.

### Principais Diferenciais

- **Timeline Interativa**: Visualização cronológica da trajetória profissional e acadêmica
- **Árvore de Habilidades**: Sistema gamificado inspirado em RPGs para apresentar competências
- **Conquistas**: Certificações e marcos profissionais como achievements desbloqueáveis
- **Currículo Multilíngue**: Versão do CV em português, inglês e espanhol
- **Design Responsivo**: Interface adaptada para desktop, tablet e mobile
- **PWA Ready**: Instalável como aplicativo em dispositivos móveis

---

## ✨ Funcionalidades

| Página | Descrição |
|--------|-----------|
| **Home** | Menu fullscreen com navegação visual por colunas |
| **História** | Timeline interativa com filtros por período, tipo e modalidade |
| **Portfólio** | Grid de projetos com filtros por categoria e busca |
| **Competências** | Árvore de habilidades + sistema de conquistas gamificado |
| **Currículo** | CV completo com opção de impressão e seleção de idioma |
| **Contato** | Formulário integrado com envio de email |
| **Admin** | Painel administrativo para gerenciar todo o conteúdo |

---

## 🛠️ Tecnologias

### Frontend
- **HTML5** + **CSS3** (variáveis CSS, Grid, Flexbox)
- **Bootstrap 5.3** - Framework CSS responsivo
- **Alpine.js 3.x** - Reatividade leve para interações
- **D3.js** - Visualização de dados (timeline)

### Backend & Serviços
- **Supabase** - Banco de dados PostgreSQL + Auth + Storage
- **EmailJS** - Envio de emails do formulário de contato
- **Firebase Hosting** - Deploy e CDN

### Ferramentas
- Git + GitHub
- PWA (Progressive Web App)

---

## 📦 Instalação

### Pré-requisitos
- Conta no [Supabase](https://supabase.com)
- Conta no [EmailJS](https://emailjs.com)
- Conta no [Firebase](https://firebase.google.com) (opcional, para deploy)

### Configuração

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/mabs.git
cd mabs
```

2. **Configure as credenciais**
```bash
cp config.example.js config.js
```

3. **Edite `config.js`** com suas credenciais:
```javascript
window.CONFIG = {
  SUPABASE_URL: 'https://seu-projeto.supabase.co',
  SUPABASE_ANON_KEY: 'sua-anon-key',
  EMAILJS_SERVICE_ID: 'seu-service-id',
  EMAILJS_TEMPLATE_ID: 'seu-template-id',
  EMAILJS_PUBLIC_KEY: 'sua-public-key',
  ADMIN_EMAIL: 'seu-email@exemplo.com'
};
```

4. **Execute localmente**
```bash
# Python
python -m http.server 8000

# Node.js
npx http-server -p 8000

# Firebase
firebase serve
```

5. **Acesse**: http://localhost:8000

---

## 🗄️ Estrutura do Projeto

```
mabs/
├── index.html              # Home - Menu principal
├── historia.html           # Timeline profissional/acadêmica
├── portfolio.html          # Grid de projetos
├── competencias.html       # Árvore de habilidades + conquistas
├── cv.html                 # Currículo multilíngue
├── contato.html            # Formulário de contato
├── sw.js                   # Service Worker (PWA)
├── config.example.js       # Template de configuração
├── firebase.json           # Configuração Firebase Hosting
│
├── admin/                  # Painel administrativo
│   ├── login.html
│   ├── dashboard.html
│   ├── historico.html
│   ├── projetos.html
│   ├── competencias.html
│   ├── conquistas.html
│   ├── mensagens.html
│   └── perfil.html
│
├── assets/
│   ├── css/               # Estilos por página
│   ├── js/                # JavaScript modular
│   ├── favicon/           # Ícones PWA
│   ├── images/            # Logos de instituições
│   ├── projects/          # Imagens de projetos
│   ├── achievements/      # Imagens de conquistas
│   └── evidences/         # Evidências de certificações
│
└── supabase/
    └── functions/         # Edge Functions (opcional)
```

---

## 🔐 Segurança

- **Credenciais**: O arquivo `config.js` está no `.gitignore` e nunca é commitado
- **Supabase RLS**: Row Level Security habilitado em todas as tabelas
- **Anon Key**: Apenas a chave pública (anon) é usada no frontend
- **Admin**: Acesso restrito por email autorizado via políticas RLS
- **HTTPS**: Deploy via Firebase com SSL automático

---

## 🚀 Deploy

### Firebase Hosting
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy
firebase deploy --only hosting
```

---

## 📄 Licença

Este projeto é de uso pessoal. Todos os direitos reservados.

---

<div align="center">
  <p>Desenvolvido por <strong>Matheus Bonotto</strong></p>
  <p>
    <a href="https://linkedin.com/in/matheusbonotto">LinkedIn</a> •
    <a href="https://github.com/matheusbonotto">GitHub</a>
  </p>
</div>

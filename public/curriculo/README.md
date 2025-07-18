# 🌍 Currículo Multilíngue - Matheus Bonotto

Sistema completo de currículo dinâmico com tradução automática para múltiplos idiomas, desenvolvido com **JavaScript puro** e **Bootstrap**.

## 🚀 Funcionalidades

✅ **Currículo Dinâmico** - Gerado automaticamente a partir de JSON  
✅ **Tradução Automática** - Sistema 100% JavaScript com API gratuita  
✅ **Múltiplos Idiomas** - Português, Inglês e Espanhol  
✅ **Interface Intuitiva** - Seletor de idioma e botão de tradução  
✅ **Responsivo** - Funciona perfeitamente em desktop e mobile  
✅ **Impressão Otimizada** - Layout A4 pronto para PDF  
✅ **Paginação Inteligente** - Quebra automática de páginas  

## 🛠️ Tecnologias Utilizadas

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)
![API](https://img.shields.io/badge/API-MyMemory-4CAF50?style=for-the-badge)


## 🚀 Funcionalidades

- **Currículo Multilíngue**: Português, Inglês e Espanhol
- **Layout A4**: Formatação profissional para impressão
- **Tradução Dinâmica**: Sistema de tradução integrado
- **Responsivo**: Adaptável a diferentes tamanhos de tela
- **Impressão PDF**: Configurações otimizadas para PDF

## 📁 Estrutura do Projeto

```
curriculo/
├── index.html                    # Página principal
├── data.json                     # Dados do currículo
├── package.json                  # Dependências e scripts
├── css/                         # Estilos CSS
│   ├── style.css               # Estilos gerais e controles
│   ├── page.css                # Layout da página A4
│   ├── document.css            # Formatação do documento
│   ├── text-format.css         # Formatação de texto
│   └── print.css               # Configurações de impressão
├── js/                         # Scripts JavaScript
│   ├── script.js               # Lógica principal
│   └── translate.js            # Sistema de tradução completo
└── README.md                   # Documentação
```

## 🌍 Sistema de Tradução

O projeto inclui um sistema completo de tradução integrado ao `translate.js`:

### 🔥 Funcionalidades
- **100% JavaScript** no navegador
- **API MyMemory gratuita**
- **Interface visual intuitiva**
- **Sem dependências externas**
- **Cache de traduções** para performance
- **Download automático** do JSON traduzido

## 🚀 Como Usar

### 1. Modo Simples (Recomendado)

```bash
# Apenas abra o index.html no navegador
# O sistema funciona 100% no frontend!
```

1. **Abra** `index.html` no seu navegador
2. **Clique** no botão "Traduzir" 
3. **Selecione** o idioma de origem
4. **Aguarde** a tradução automática
5. **Baixe** o arquivo JSON traduzido

### 2. Modo Avançado (Opcional)

```bash
# Servir projeto localmente
npm run serve
```

## 💡 Funcionalidades Principais

### 🎯 Currículo Dinâmico
- Geração automática a partir de `data.json`
- Paginação inteligente para formato A4
- Cálculo automático de idade
- QR Code para contato

### 🌍 Tradução Automática
- **3 idiomas**: Português, Inglês, Espanhol
- **API gratuita** MyMemory
- **Cache inteligente** para performance
- **Tradução em tempo real**

### 📱 Interface Responsiva
- **Bootstrap 5** para responsividade
- **Seletor de idioma** com bandeiras
- **Botão de impressão** otimizado
- **Design moderno** e profissional

### 🖨️ Impressão Otimizada
- **Layout A4** perfeito para PDF
- **Quebra de páginas** automática
- **Numeração** de páginas
- **Margens** otimizadas

## 📊 Exemplo de Dados

### Formato Original (data.json)
```json
{
  "individuo": {
    "nome": "Matheus Bonotto",
    "ocupacao": "QA (Quality Assurance)",
    "descricao": "QA com experiência em testes manuais e automação..."
  }
}
```

### Formato Traduzido (data_translated.json)
```json
{
  "individuo": {
    "nome": {
      "pt-br": "Matheus Bonotto",
      "en": "Matheus Bonotto",
      "es": "Matheus Bonotto"
    },
    "ocupacao": {
      "pt-br": "QA (Quality Assurance)",
      "en": "QA (Quality Assurance)",
      "es": "QA (Control de Calidad)"
    },
    "descricao": {
      "pt-br": "QA com experiência em testes manuais e automação...",
      "en": "QA with experience in manual and automated testing...",
      "es": "QA con experiencia en pruebas manuales y automatizadas..."
    }
  }
}
```

## 🔧 Personalização

### Adicionar Novos Idiomas
```javascript
// Em js/translate-browser.js
const LANGUAGES = {
    'pt-br': 'pt',
    'en': 'en',
    'es': 'es',
    'fr': 'fr'  // Adicionar francês
};
```

### Modificar Dados
```json
// Edite o arquivo data.json
{
  "individuo": {
    "nome": "Seu Nome",
    "ocupacao": "Sua Ocupação",
    "descricao": "Sua descrição..."
  }
}
```

### Personalizar Estilos
```css
/* Em css/style.css */
.controls-container {
    /* Seus estilos personalizados */
}
```

## 🎨 Demonstração

![Currículo em Português](https://via.placeholder.com/800x600/007bff/ffffff?text=Currículo+Português)
![Currículo em Inglês](https://via.placeholder.com/800x600/28a745/ffffff?text=Currículo+English)
![Currículo em Espanhol](https://via.placeholder.com/800x600/dc3545/ffffff?text=Currículo+Español)

## 🚦 Solução de Problemas

### ❌ Tradução não funciona?
- Verifique sua conexão com a internet
- Tente novamente após alguns minutos
- Verifique o console do navegador

### ❌ Layout quebrado?
- Certifique-se de que o Bootstrap está carregando
- Verifique se todos os arquivos CSS estão no lugar
- Teste em diferentes navegadores

### ❌ Erro de CORS?
- Serve o arquivo via HTTP server
- Use: `npx http-server -p 8080`
- Acesse: `http://localhost:8080`

## 🔗 Links Úteis

- [API MyMemory](https://mymemory.translated.net/)
- [Bootstrap Documentation](https://getbootstrap.com/)
- [JavaScript Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## 📝 Licença

MIT License - Use livremente em seus projetos!

---

**Desenvolvido com ❤️ por Matheus Bonotto**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/matheusbonotto)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/matteusbonotto)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:contato@matheusbonotto.com.br)
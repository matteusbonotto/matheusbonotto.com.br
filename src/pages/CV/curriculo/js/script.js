// script.js - Funcionalidades principais do currículo

let curriculumData = null;
let currentPage = 1;
let totalPages = 1;

// Função para calcular idade
function calcularIdade(dataNascimento) {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento.split("/").reverse().join("-"));
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();

  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }

  return idade;
}

// Função para formatar data
function formatarData(data, targetLanguage = "pt-br") {
  if (!data) return "";

  const partes = data.split("/");
  const meses = {
    "pt-br": [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ],
    en: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    es: [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ],
  };

  const mesesArray = meses[targetLanguage] || meses["pt-br"];
  const preposicao =
    targetLanguage === "pt-br" ? "de" : targetLanguage === "en" ? "" : "de";

  if (targetLanguage === "en") {
    return `${mesesArray[parseInt(partes[1]) - 1]} ${partes[2]}`;
  } else {
    return `${mesesArray[parseInt(partes[1]) - 1]} ${preposicao} ${partes[2]}`;
  }
}

// Função para carregar dados do JSON
async function carregarDados() {
  try {
    const response = await fetch("data.json");
    curriculumData = await response.json();

    // Remover mensagem de loading
    const loadingMessage = document.querySelector(".loading-message");
    if (loadingMessage) {
      loadingMessage.remove();
    }

    await renderizarCurriculo();
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    const container = document.getElementById("curriculum-container");
    if (container) {
      container.innerHTML =
        '<div class="loading-message text-center"><p>Erro ao carregar dados do currículo.</p></div>';
    }
  }
}

// Função para gerar QR Code
function generateQRCode(url) {
  // Usando uma API pública gratuita para gerar QR Code
  return `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
    url
  )}`;
}

// Função para criar cabeçalho simples (todas as páginas)
function createPageHeader(data) {
  return `
        <div class="page-header">${data.individuo.nomeCompleto} | ${data.individuo.email} | ${data.individuo.telefone} | ${data.individuo.local}, ${data.individuo.pais}</div>
    `;
}

// Função para criar cabeçalho com informações pessoais (apenas primeira página)
function createPersonHeader(data) {
  const idade = calcularIdade(data.individuo.dataNasc);
  const qrCodeUrl = generateQRCode("https://matheusbonotto.com.br/curriculo/index.html");

  return `
        <div class="person-header">
            <div class="row">
                <div class="col-5">
                    <div class="name-title">${data.individuo.nomeCompleto}
                    </div>
                    <div class="occupation">${data.individuo.ocupacao}</div>
                    <span class="age">(${idade} ${getSectionTitle("anos")})</span>
                </div>
                <div class="col-7">
                    <div class="contact-info-container">
                        <div class="qr-code-container">
                            <img src="${qrCodeUrl}" alt="QR Code" class="qr-code-header">
                        </div>
                        <div class="contact-info">
                            <i class="bi bi-envelope"></i> <a href="mailto:${data.individuo.email
    }">${data.individuo.email}</a><br>
                            <i class="bi bi-whatsapp"></i> <a href="https://wa.me/${data.individuo.telefone.replace(
      /\D/g,
      ""
    )}">${data.individuo.telefone}</a><br>
                            <i class="bi bi-github"></i> <a href="${data.individuo.github
    }" target="_blank">${data.individuo.github}</a><br>
                            <i class="bi bi-linkedin"></i> <a href="${data.individuo.linkedin
    }" target="_blank">${data.individuo.linkedin
    }</a><br>
                            <i class="bi bi-file-earmark-text"></i> <a href="${data.individuo.apresentacao
    }" target="_blank">${data.individuo.apresentacao
    }</a> <p style="font-size: 0.8em; display: inline;">(apresentação)</p>
                            <i class="bi bi-geo-alt"></i> ${data.individuo.local
    }, ${data.individuo.pais}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Função para criar rodapé da página
function createPageFooter(pageNumber, totalPages) {
  return `
        <div class="page-footer">
            <div class="page-number">${pageNumber}/${totalPages}</div>
        </div>
    `;
}

// Função para criar uma nova página
function createNewPage(pageNumber, isFirstPage = false) {
  const newPage = document.createElement("div");
  newPage.className = "a4-page";
  newPage.id = `page${pageNumber}`;

  const dataToRender = translatedData || curriculumData;

  // Estrutura da página
  let pageHTML = createPageHeader(dataToRender);

  // Adicionar person-header apenas na primeira página
  if (isFirstPage) {
    pageHTML += createPersonHeader(dataToRender);
  }

  // Container para conteúdo
  pageHTML += `
        <div class="container-fluid">
            <div class="row">
                <div class="col-12" id="curriculum-content-${pageNumber}">
                    <!-- Conteúdo da página ${pageNumber} -->
                </div>
            </div>
        </div>
    `;

  // Rodapé será adicionado depois
  newPage.innerHTML = pageHTML;

  return newPage;
}

// Função para calcular altura disponível na página
function getAvailablePageHeight(isFirstPage = false) {
  const pageHeight = 37.0; // ###################################   cm altura estendida para comportar mais texto
  const headerHeight = 1.0; // cm altura do header (reduzido ainda mais)
  const personHeaderHeight = isFirstPage ? 1.8 : 0; // cm altura do person-header (reduzido)
  const footerHeight = 1.0; // cm altura do footer (reduzido ainda mais)
  const margin = 0.2; // cm margem de segurança (reduzido para aproveitar mais espaço)

  return pageHeight - headerHeight - personHeaderHeight - footerHeight - margin;
}

// Função para estimar altura do conteúdo em cm
function estimateContentHeight(element) {
  const pixelHeight = element.offsetHeight;
  return pixelHeight / 37.795; // conversão px para cm (96 DPI)
}

// Função para gerenciar paginação inteligente
function managePagination(contentSections) {
  const pages = [];
  let currentPageNumber = 1;
  let currentPageContent = [];
  let currentPageHeight = 0;

  const availableHeight = getAvailablePageHeight(true);
  const maxHeight = availableHeight * 0.98; // 98% da altura disponível (aumentado para aproveitar mais espaço)

  contentSections.forEach((section, index) => {
    // Criar elemento temporário para medir altura
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = section;
    tempDiv.style.visibility = "hidden";
    tempDiv.style.position = "absolute";
    tempDiv.style.width = "17cm"; // Largura aproximada do conteúdo A4
    document.body.appendChild(tempDiv);

    const sectionHeight = estimateContentHeight(tempDiv);
    document.body.removeChild(tempDiv);

    // Verificar se precisa quebrar página
    if (
      currentPageHeight + sectionHeight > maxHeight &&
      currentPageContent.length > 0
    ) {
      // Criar e finalizar página atual
      const currentPage = createNewPage(
        currentPageNumber,
        currentPageNumber === 1
      );
      const currentPageContentEl = currentPage.querySelector(
        `#curriculum-content-${currentPageNumber}`
      );
      currentPageContentEl.innerHTML = currentPageContent.join("");
      currentPage.innerHTML += createPageFooter(currentPageNumber, 0); // totalPages será atualizado depois
      pages.push(currentPage);

      // Resetar para nova página
      currentPageNumber++;
      currentPageContent = [section];
      currentPageHeight = sectionHeight;
    } else {
      // Adicionar à página atual
      currentPageContent.push(section);
      currentPageHeight += sectionHeight;
    }

    // Se é o último item, finalizar a página
    if (index === contentSections.length - 1) {
      const finalPage =
        currentPageNumber === 1
          ? createNewPage(currentPageNumber, true)
          : createNewPage(currentPageNumber, false);
      const finalPageContent = finalPage.querySelector(
        `#curriculum-content-${currentPageNumber}`
      );
      finalPageContent.innerHTML = currentPageContent.join("");
      finalPage.innerHTML += createPageFooter(currentPageNumber, 0);
      pages.push(finalPage);
    }
  });

  // Atualizar total de páginas nos rodapés
  const totalPagesCount = pages.length;
  pages.forEach((page, index) => {
    const footer = page.querySelector(".page-footer");
    if (footer) {
      footer.innerHTML = `
                <div class="page-number">${index + 1}/${totalPagesCount}</div>
            `;
    }
  });

  return pages;
}

// Função para gerar seções de conteúdo
async function generateContentSections(data) {
  const {
    individuo,
    historicoAcademico,
    historicoProfissional,
    idiomas,
    certificacoes,
    projetos,
  } = data;
  const sections = [];

  // Seção Resumo
  sections.push(`
        <div class="curriculum-section">
            <h2>${getSectionTitle("resumo")}</h2>
            <p class="justified-text">${individuo.descricao}</p>
            ${individuo.keywords
      ? `<p class="keywords-section"><strong>${getSectionTitle(
        "palavrasChave"
      )}:</strong> ${individuo.keywords}</p>`
      : ""
    }
        </div>
    `);

  // Seção Experiência Profissional - Cada experiência como seção separada
  if (historicoProfissional && historicoProfissional.length > 0) {
    // Adicionar cabeçalho da seção de experiências
    sections.push(`
        <div class="curriculum-section">
            <h2>${getSectionTitle("experienciaProfissional")}</h2>
        </div>
    `);

    // Cada experiência como uma seção separada
    for (const exp of historicoProfissional) {
      const dataInicio = await formatarData(exp.inicio, currentLanguage);
      const dataFim = exp.atual
        ? getSectionTitle("atualmente")
        : await formatarData(exp.fim, currentLanguage);

      sections.push(`
                <div class="experience-item">
                    <div class="experience-header">
                        <h3 class="experience-title">${exp.titulo} | ${exp.instituicao} (${exp.regime})</h3>
                        <p class="experience-period">${dataInicio} - ${dataFim} | ${exp.local} (${exp.tipoLocal})</p>
                    </div>
                    <div class="experience-details">
                        <span class="experience-company"></span> 
                        <span class="experience-location"></span>
                    </div>
                    <div class="experience-description">
                        <p>${exp.descricao}</p>
                    </div>
                </div>
            `);
    }
  }

  // Seção Formação Acadêmica
  if (historicoAcademico && historicoAcademico.length > 0) {
    let educacaoHTML = `
            <div class="curriculum-section">
                <h2>${getSectionTitle("formacaoAcademica")}</h2>
        `;

    for (const edu of historicoAcademico) {
      const dataInicio = await formatarData(edu.inicio, currentLanguage);
      const dataFim = edu.atual
        ? getSectionTitle("emAndamento")
        : await formatarData(edu.fim, currentLanguage);

      educacaoHTML += `
                <div class="education-item">
                    <div class="education-header">
                        <h3 class="education-title">${edu.curso} | ${edu.instituicao
        } | ${edu.tipo} </h3>
                        <p class="education-period">${dataInicio} - ${dataFim}</p>
                    </div>
                    <div class="education-details">

                        ${edu.atual
          ? `<span>${getSectionTitle("cursando")}</span>`
          : ""
        }
                    </div>
                    <div class="education-description">
                        <p>${edu.descricao}</p>
                    </div>
                </div>
            `;
    }

    educacaoHTML += `</div>`;
    sections.push(educacaoHTML);
  }

  // Seção Idiomas
  if (idiomas && idiomas.length > 0) {
    let idiomasHTML = `
            <div class="curriculum-section">
                <h2>${getSectionTitle("idiomas")}</h2>
        `;

    idiomas.forEach((idioma) => {
      idiomasHTML += `
                <div class="language-item">
                    <div class="language-header">
                        <span class="language-title">${idioma.idioma} | ${idioma.nivel
        } ${idioma.cursando
          ? `${getSectionTitle("- cursando")} | ${idioma.instituicao ? `${idioma.instituicao}` : ""
          }`
          : ""
        }</span>
                    </div>
                </div>
            `;
    });

    idiomasHTML += `</div>`;
    sections.push(idiomasHTML);
  }

  // Seção Certificações
  // if (certificacoes && certificacoes.length > 0) {
  //   let certHTML = `
  //           <div class="curriculum-section">
  //               <h2>${getSectionTitle("certificacoes")}</h2>
  //       `;

  //   certificacoes.forEach((cert) => {
  //     certHTML += `
  //               <div class="certification-item">
  //                   <div class="certification-name">${cert.nome} | ${cert.instituicao}</div>
  //                   <div class="certification-details">
  //                       ${cert.data} | ${cert.validade}
  //                   </div>
  //               </div>
  //           `;
  //   });

  //   certHTML += `</div>`;
  //   sections.push(certHTML);
  // }

  // Seção Projetos Relevantes
  // if (projetos && projetos.length > 0) {
  //   let projetosHTML = `
  //           <div class="curriculum-section">
  //               <h2>${getSectionTitle("projetosRelevantes")}</h2>
  //       `;

  //   projetos.forEach((projeto) => {
  //     projetosHTML += `
  //               <div class="project-item">
  //                   <div class="project-header">
  //                       <h3 class="project-title">${projeto.nome}</h3>
  //                       <p class="project-period">${projeto.data}</p>
  //                   </div>
  //                   <div class="project-technologies">
  //                       ${projeto.tecnologias.join(", ")}
  //                   </div>
  //                   <div class="project-description">
  //                       <p>${projeto.descricao}</p>
  //                   </div>
  //               </div>
  //           `;
  //   });

  //   projetosHTML += `</div>`;
  //   sections.push(projetosHTML);
  // }

  return sections;
}

// Função principal para renderizar o currículo
async function renderizarCurriculo() {
  if (!curriculumData) return;

  const dataToRender = translatedData || curriculumData;
  const { individuo } = dataToRender;

  if (!individuo) return;

  // Limpar container e páginas existentes
  const container = document.getElementById("curriculum-container");
  if (container) {
    container.innerHTML = "";
  }

  const existingPages = document.querySelectorAll(".a4-page");
  existingPages.forEach((page) => page.remove());

  // Gerar seções de conteúdo
  const contentSections = await generateContentSections(dataToRender);

  // Gerenciar paginação
  const pages = managePagination(contentSections);

  // Adicionar páginas ao container
  pages.forEach((page) => {
    if (container) {
      container.appendChild(page);
    } else {
      document.body.appendChild(page);
    }
  });

  // Atualizar contadores
  totalPages = pages.length;
}

// Função para imprimir documento
function printDocument() {
  // Adicionar classe para ocultar elementos específicos na impressão
  document.body.classList.add("printing");

  // Forçar renderização de todas as páginas
  const pages = document.querySelectorAll(".a4-page");
  pages.forEach((page) => {
    page.style.display = "block";
    page.style.pageBreakAfter = "always";
    page.style.pageBreakInside = "avoid";
  });

  // Garantir que a última página não tenha quebra após
  if (pages.length > 0) {
    pages[pages.length - 1].style.pageBreakAfter = "avoid";
  }

  // Otimizar para PDF
  const optimizePrint = () => {
    // Configurar meta viewport para impressão
    let viewport = document.querySelector('meta[name="viewport"]');
    const originalViewport = viewport ? viewport.content : null;

    if (viewport) {
      viewport.content =
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
    }

    // Configurar estilos temporários para impressão
    const printStyles = document.createElement("style");
    printStyles.id = "temp-print-styles";
    printStyles.textContent = `
      @media print {
        @page {
          size: A4 portrait;
          margin: 0;
        }
        
        body {
          font-size: 10pt !important;
          line-height: 1.2 !important;
          color: #000 !important;
          background: white !important;
        }
        
        .a4-page {
          width: 210mm !important;
          height: 297mm !important;
          margin: 0 !important;
          padding: 20mm !important;
          box-shadow: none !important;
          page-break-after: always !important;
          background: white !important;
        }
        
        .a4-page:last-child {
          page-break-after: avoid !important;
        }
        
        .controls-container {
          display: none !important;
        }
        
        .loading-message {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(printStyles);

    // Aguardar renderização
    setTimeout(() => {
      // Configurar evento para detectar quando a impressão termina
      const afterPrint = () => {
        document.body.classList.remove("printing");

        // Remover estilos temporários
        const tempStyles = document.getElementById("temp-print-styles");
        if (tempStyles) {
          tempStyles.remove();
        }

        // Restaurar viewport original
        if (viewport && originalViewport) {
          viewport.content = originalViewport;
        }

        window.removeEventListener("afterprint", afterPrint);
      };

      window.addEventListener("afterprint", afterPrint);

      // Iniciar impressão
      window.print();

      // Fallback para remover classe caso o evento não funcione
      setTimeout(() => {
        document.body.classList.remove("printing");

        // Remover estilos temporários
        const tempStyles = document.getElementById("temp-print-styles");
        if (tempStyles) {
          tempStyles.remove();
        }

        // Restaurar viewport original
        if (viewport && originalViewport) {
          viewport.content = originalViewport;
        }
      }, 5000);
    }, 300);
  };

  // Aguardar um pouco para garantir que os estilos sejam aplicados
  setTimeout(optimizePrint, 100);
}

// Inicializar quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", async () => {
  // Carregar dados originais
  await carregarDados();
});

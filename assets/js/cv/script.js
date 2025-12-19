// script.js - Funcionalidades principais do currículo

let curriculumData = null;
let currentPage = 1;
let totalPages = 1;

// Helper: aguardar cliente Supabase global
async function getSupabaseClient() {
  const maxAttempts = 30;
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      attempts++;
      if (window.__supabaseClient) {
        clearInterval(interval);
        resolve(window.__supabaseClient);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        reject(new Error('Supabase client não inicializado (window.__supabaseClient).'));
      }
    }, 200);
  });
}

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

// Converter data ISO (YYYY-MM-DD) para "DD/MM/YYYY"
function formatDateToBR(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

// Função para carregar dados a partir do Supabase
async function carregarDados() {
  try {
    const supabase = await getSupabaseClient();

    // Carrega perfil único
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      throw new Error("Nenhum perfil encontrado na tabela 'profiles'.");
    }

    const profileId = profile.id;

    // Carrega coleções relacionadas em paralelo
    const [
      academicResult,
      professionalResult,
      languagesResult,
      certsResult,
      hardSkillsResult,
      softSkillsResult,
      projectsResult,
    ] = await Promise.all([
      supabase
        .from("academic_history")
        .select("*")
        .eq("profile_id", profileId)
        .order("data_inicio", { ascending: false }),
      supabase
        .from("professional_history")
        .select("*")
        .eq("profile_id", profileId)
        .order("data_inicio", { ascending: false }),
      supabase
        .from("languages")
        .select("*")
        .eq("profile_id", profileId)
        .order("ordem", { ascending: true }),
      supabase
        .from("certifications")
        .select("*")
        .eq("profile_id", profileId)
        .order("ordem", { ascending: true }),
      supabase
        .from("hard_skills")
        .select("*")
        .eq("profile_id", profileId)
        .order("ordem", { ascending: true }),
      supabase
        .from("soft_skills")
        .select("*")
        .eq("profile_id", profileId)
        .order("ordem", { ascending: true }),
      supabase
        .from("projects")
        .select("*")
        .eq("categoria", "cv")
        .eq("ativo", true)
        .order("ordem", { ascending: true }),
    ]);

    if (academicResult.error) {
      console.error('Erro ao carregar histórico acadêmico:', academicResult.error);
    }
    if (professionalResult.error) {
      console.error('Erro ao carregar histórico profissional:', professionalResult.error);
    }
    if (languagesResult.error) {
      console.error('Erro ao carregar idiomas:', languagesResult.error);
    }
    if (certsResult.error) {
      console.error('Erro ao carregar certificações:', certsResult.error);
    }
    if (hardSkillsResult.error) {
      console.error('Erro ao carregar hard skills:', hardSkillsResult.error);
    }
    if (softSkillsResult.error) {
      console.error('Erro ao carregar soft skills:', softSkillsResult.error);
    }
    if (projectsResult.error) {
      console.error('Erro ao carregar projetos:', projectsResult.error);
    } 

    const academicHistory = academicResult.data || [];
    const professionalHistory = professionalResult.data || [];
    const languages = languagesResult.data || [];
    const certifications = certsResult.data || [];
    const hardSkills = hardSkillsResult.data || [];
    const softSkills = softSkillsResult.data || [];
    const projects = projectsResult.data || [];

    // Monta objeto curriculumData no mesmo formato do antigo data.json
    curriculumData = {
      individuo: {
        nomeCompleto: profile.nome_completo || profile.nomeCompleto || "",
        ocupacao: profile.ocupacao || "",
        descricao: profile.descricao || "",
        keywords: profile.keywords || "",
        email: profile.email || "",
        telefone: profile.telefone || "",
        local: profile.local || "",
        pais: profile.pais || "",
        dataNasc: profile.data_nascimento
          ? formatDateToBR(profile.data_nascimento)
          : profile.dataNasc || "",
        github: profile.github_url || profile.github || "",
        linkedin: profile.linkedin_url || profile.linkedin || "",
        apresentacao: profile.apresentacao || profile.apresentacao_url || "",
        hardSkills: hardSkills.map((s) => s.nome || "").filter(Boolean),
        softSkills: softSkills.map((s) => s.nome || "").filter(Boolean),
      },
      historicoProfissional: professionalHistory.map((exp) => ({
        titulo: exp.titulo || "",
        instituicao: exp.instituicao || "",
        regime: exp.regime || "",
        inicio: exp.data_inicio
          ? formatDateToBR(exp.data_inicio)
          : exp.inicio || "",
        fim: exp.data_fim
          ? formatDateToBR(exp.data_fim)
          : exp.fim || "",
        atual: !!exp.atual,
        local: exp.local || "",
        tipoLocal: exp.tipo_local || exp.tipoLocal || "",
        descricao: exp.descricao || "",
      })),
      historicoAcademico: academicHistory.map((acad) => ({
        curso: acad.curso || "",
        instituicao: acad.instituicao || "",
        tipo: acad.tipo || "",
        inicio: acad.data_inicio
          ? formatDateToBR(acad.data_inicio)
          : acad.inicio || "",
        fim: acad.data_fim
          ? formatDateToBR(acad.data_fim)
          : acad.fim || "",
        atual: !!acad.atual,
        descricao: acad.descricao || "",
      })),
      idiomas: languages.map((lang) => ({
        idioma: lang.idioma || "",
        nivel: lang.nivel || "",
        cursando: !!lang.cursando,
        instituicao: lang.instituicao || "",
      })),
      certificacoes: certifications.map((cert) => ({
        nome: cert.nome || "",
        instituicao: cert.instituicao || "",
        data: cert.data_certificacao
          ? formatDateToBR(cert.data_certificacao)
          : cert.data || "",
        validade: cert.validade || "",
      })),
      projetos: projects.map((proj) => ({
        nome: proj.titulo || proj.nome || "",
        descricao: proj.descricao_curta || proj.descricao_completa || proj.descricao || "",
        tecnologias: Array.isArray(proj.tecnologias)
          ? proj.tecnologias
          : typeof proj.tecnologias === "string" && proj.tecnologias.length > 0
          ? proj.tecnologias.split(",").map((t) => t.trim())
          : [],
        data: proj.data_projeto 
          ? formatDateToBR(proj.data_projeto)
          : proj.data || "",
      })),
    };

    // Remover mensagem de loading
    const loadingMessage = document.querySelector(".loading-message");
    if (loadingMessage) {
      loadingMessage.remove();
    }

    await renderizarCurriculo();
  } catch (error) {
    
    const container = document.getElementById("curriculum-container");
    if (container) {
      container.innerHTML =
        '<div class="loading-message text-center"><p>Erro ao carregar currículo do Supabase. Verifique o console do navegador.</p></div>';
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
                    <div class="name-title">${data.individuo.nomeCompleto}</div>
                    <div class="occupation">${data.individuo.ocupacao}</div>
                    <span class="age">(${idade} ${getSectionTitle("anos")})</span>
                </div>
                <div class="col-7">
                    <div class="contact-info-container">
                        <div class="qr-code-container">
                            <img src="${qrCodeUrl}" alt="QR Code" class="qr-code-header">
                        </div>
                        <div class="contact-info">
                            <span class="contact-line"><i class="bi bi-envelope"></i> <a href="mailto:${data.individuo.email}">${data.individuo.email}</a></span><br>
                            <span class="contact-line"><i class="bi bi-whatsapp"></i> <a href="https://wa.me/${data.individuo.telefone.replace(/\D/g, "")}">${data.individuo.telefone}</a></span><br>
                            <span class="contact-line"><i class="bi bi-github"></i> <a href="${data.individuo.github}" target="_blank">${data.individuo.github}</a></span><br>
                            <span class="contact-line"><i class="bi bi-linkedin"></i> <a href="${data.individuo.linkedin}" target="_blank">${data.individuo.linkedin}</a></span><br>
                            <span class="contact-line"><i class="bi bi-file-earmark-text"></i> <a href="${data.individuo.apresentacao}" target="_blank">${data.individuo.apresentacao}</a> <small>(apresentação)</small></span><br>
                            <span class="contact-line"><i class="bi bi-geo-alt"></i> ${data.individuo.local}, ${data.individuo.pais}</span>
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
  // Usamos 90% da altura disponível para reduzir o risco do texto
  // ultrapassar o limite físico da página na impressão.
  const maxHeight = availableHeight * 0.9;

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

    // Se a seção é maior que o espaço disponível, ela deve ir para uma nova página
    // (mesmo que a página atual esteja vazia, para evitar corte)
    if (sectionHeight > maxHeight) {
      // Se já tem conteúdo na página atual, finalizar ela primeiro
      if (currentPageContent.length > 0) {
        const currentPage = createNewPage(
          currentPageNumber,
          currentPageNumber === 1
        );
        const currentPageContentEl = currentPage.querySelector(
          `#curriculum-content-${currentPageNumber}`
        );
        currentPageContentEl.innerHTML = currentPageContent.join("");
        currentPage.innerHTML += createPageFooter(currentPageNumber, 0);
        pages.push(currentPage);

        currentPageNumber++;
        currentPageContent = [];
        currentPageHeight = 0;
      }
      // Seção grande vai para uma página nova (mesmo que seja a primeira)
      const newPage = createNewPage(
        currentPageNumber,
        currentPageNumber === 1
      );
      const newPageContentEl = newPage.querySelector(
        `#curriculum-content-${currentPageNumber}`
      );
      newPageContentEl.innerHTML = section;
      newPage.innerHTML += createPageFooter(currentPageNumber, 0);
      pages.push(newPage);

      currentPageNumber++;
      currentPageContent = [];
      currentPageHeight = 0;
    } else if (
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
      currentPage.innerHTML += createPageFooter(currentPageNumber, 0);
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
  if (projetos && projetos.length > 0) {
    let projetosHTML = `
            <div class="curriculum-section">
                <h2>${getSectionTitle("projetosRelevantes")}</h2>
        `;

    projetos.forEach((projeto) => {
      const tecnologias = projeto.tecnologias && Array.isArray(projeto.tecnologias) 
        ? projeto.tecnologias.join(", ")
        : (projeto.tecnologias || "");
      
      const descricao = projeto.descricao_curta || projeto.descricao_completa || projeto.descricao || "";
      
      const dataProjeto = projeto.data_projeto 
        ? formatarData(projeto.data_projeto.split("-").reverse().join("/"), currentLanguage)
        : "";
      
      projetosHTML += `
                <div class="project-item">
                    <div class="project-header">
                        <h3 class="project-title">${projeto.titulo || projeto.nome || "Projeto"}</h3>
                        ${dataProjeto ? `<p class="project-period">${dataProjeto}</p>` : ""}
                    </div>
                    ${tecnologias ? `<div class="project-technologies">${tecnologias}</div>` : ""}
                    ${descricao ? `<div class="project-description"><p>${descricao}</p></div>` : ""}
                </div>
            `;
    });

    projetosHTML += `</div>`;
    sections.push(projetosHTML);
  }

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

// assets/js/emailjs.js
// Integração com EmailJS

// Verificar se config.js foi carregado
if (typeof window.CONFIG === 'undefined') {
  
  window.CONFIG = {
    EMAILJS_PUBLIC_KEY: 'RwbMtTkmt6WKcNGMv',
    EMAILJS_SERVICE_ID: 'service',
    EMAILJS_TEMPLATE_ID: 'template'
  };
}

// Inicializar EmailJS
(function(){
  const publicKey = window.CONFIG.EMAILJS_PUBLIC_KEY || 'RwbMtTkmt6WKcNGMv';
  if (typeof emailjs !== 'undefined') {
    emailjs.init(publicKey);
  } else {
    
  }
})();

/**
 * Enviar email via EmailJS
 */
export async function sendEmail(templateParams) {
  try {
    const serviceId = window.CONFIG.EMAILJS_SERVICE_ID || 'service';
    const templateId = window.CONFIG.EMAILJS_TEMPLATE_ID || 'template';
    
    if (typeof emailjs === 'undefined') {
      throw new Error('EmailJS não está carregado');
    }
    
    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams
    );
    
    return { success: true, response };
  } catch (error) {
    
    // Tratar diferentes tipos de erro do EmailJS
    let errorMessage = 'Erro ao enviar mensagem. Tente novamente.';
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error.text === 'string') {
      errorMessage = error.text;
    } else if (error && typeof error.message === 'string') {
      errorMessage = error.message;
    } else if (error && typeof error.status === 'number') {
      errorMessage = `Erro ${error.status}: Falha ao enviar email`;
    }
    return { success: false, error: errorMessage };
  }
}

/**
 * Enviar mensagem de contato
 */
export async function sendContactMessage(formData) {
  const templateParams = {
    from_name: formData.nome,
    from_email: formData.email,
    subject: formData.assunto || 'Mensagem do Portfólio',
    message: formData.mensagem,
    to_email: window.CONFIG.ADMIN_EMAIL || 'contato@matheusbonotto.com.br'
  };
  
  return await sendEmail(templateParams);
}


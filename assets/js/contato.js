// assets/js/contato.js
// Componente de Contato

import { sendContactMessage } from './emailjs.js';
import { getSupabaseClient } from './supabase.js';

function contactForm() {
  return {
    form: {
      nome: '',
      email: '',
      assunto: '',
      mensagem: ''
    },
    loading: false,
    error: null,
    success: false,
    successMessage: 'Mensagem enviada com sucesso! Entrarei em contato em breve.',
    
    async submitForm() {
      this.loading = true;
      this.error = null;
      this.success = false;
      
      try {
        // Enviar email via EmailJS
        const emailResult = await sendContactMessage(this.form);
        
        if (!emailResult.success) {
          throw new Error(emailResult.error || 'Erro ao enviar email');
        }
        
        // Salvar no Supabase
        const supabase = getSupabaseClient();
        if (supabase) {
          const { error: dbError } = await supabase
          .from('contact_messages')
            .from('contact_messages')
            .insert([{
              nome: this.form.nome,
              email: this.form.email,
              assunto: this.form.assunto || null,
              mensagem: this.form.mensagem,
              lida: false
            }]);
          
          if (dbError) {
            console.warn('Aviso: Erro ao salvar mensagem no banco:', dbError);
            // Não falhar se apenas o banco der erro (email já foi enviado)
          }
        }
        
        // Sucesso
        this.success = true;
        this.resetForm();
        
        // Limpar mensagem de sucesso após 5 segundos
        setTimeout(() => {
          this.success = false;
        }, 5000);
        
      } catch (error) {
        
        // Tratar diferentes tipos de erro
        if (typeof error === 'string') {
          this.error = error;
        } else if (error && typeof error.text === 'string') {
          this.error = error.text;
        } else if (error && typeof error.message === 'string') {
          this.error = error.message;
        } else {
          this.error = 'Erro ao enviar mensagem. Tente novamente.';
        }
      } finally {
        this.loading = false;
      }
    },
    
    resetForm() {
      this.form = {
        nome: '',
        email: '',
        assunto: '',
        mensagem: ''
      };
    }
  };
}

// Registrar globalmente para o Alpine.js
window.contactForm = contactForm;

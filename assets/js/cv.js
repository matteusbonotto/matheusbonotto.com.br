// assets/js/cv.js
// Componente Alpine.js para CV

import { getSupabaseClient } from './supabase.js';
import { translateText } from './translate.js';

function cvPage() {
  return {
    profile: null,
    hardSkills: [],
    softSkills: [],
    professionalHistory: [],
    academicHistory: [],
    languages: [],
    certifications: [],
    loading: true,
    selectedLanguage: 'pt',
    originalContent: null,
    
    async loadProfile() {
      try {
        this.loading = true;
        
        const supabase = getSupabaseClient();
        if (!supabase) {
          throw new Error('Supabase não está disponível');
        }
        
        // Carregar perfil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
          .maybeSingle();
        
        if (profileError && profileError.code !== 'PGRST116') {
          
          throw profileError;
        }
        
        this.profile = profileData || {};
        
        
        // Carregar dados relacionados
        const profileId = this.profile.id;
        
        if (profileId) {
          const [hardSkillsResult, softSkillsResult, languagesResult, certsResult] = await Promise.all([
            supabase.from('hard_skills').select('*').eq('profile_id', profileId).order('ordem'),
            supabase.from('soft_skills').select('*').eq('profile_id', profileId).order('ordem'),
            supabase.from('languages').select('*').eq('profile_id', profileId).order('ordem'),
            supabase.from('certifications').select('*').eq('profile_id', profileId).order('ordem')
          ]);
          
          if (hardSkillsResult.error) {
            console.error('Erro ao carregar hard skills:', hardSkillsResult.error);
          }
          if (softSkillsResult.error) {
            console.error('Erro ao carregar soft skills:', softSkillsResult.error);
          }
          if (languagesResult.error) {
            console.error('Erro ao carregar idiomas:', languagesResult.error);
          }
          if (certsResult.error) {
            console.error('Erro ao carregar certificações:', certsResult.error);
          } 
          
          this.hardSkills = hardSkillsResult.data || [];
          this.softSkills = softSkillsResult.data || [];
          this.languages = languagesResult.data || [];
          this.certifications = certsResult.data || [];
        }
        
        // Carregar histórico
        const [academicResult, professionalResult] = await Promise.all([
          supabase.from('academic_history').select('*').order('data_inicio', { ascending: false }),
          supabase.from('professional_history').select('*').order('data_inicio', { ascending: false })
        ]);
        
        if (academicResult.error) {
          console.error('Erro ao carregar histórico acadêmico:', academicResult.error);
        }
        if (professionalResult.error) {
          console.error('Erro ao carregar histórico profissional:', professionalResult.error);
        } 
        
        this.academicHistory = academicResult.data || [];
        this.professionalHistory = professionalResult.data || [];
        
        
        
        // Salvar conteúdo original para tradução
        this.originalContent = {
          profile: { ...this.profile },
          hardSkills: [...this.hardSkills],
          softSkills: [...this.softSkills],
          professionalHistory: [...this.professionalHistory],
          academicHistory: [...this.academicHistory]
        };
        
      } catch (error) {
        
        
        alert('Erro ao carregar currículo. Verifique o console do navegador (F12).');
      } finally {
        this.loading = false;
      }
    },
    
    async translateCV() {
      if (this.selectedLanguage === 'pt') {
        // Restaurar original
        this.profile = { ...this.originalContent.profile };
        this.hardSkills = [...this.originalContent.hardSkills];
        this.softSkills = [...this.originalContent.softSkills];
        this.professionalHistory = [...this.originalContent.professionalHistory];
        this.academicHistory = [...this.originalContent.academicHistory];
        return;
      }
      
      // Traduzir (simplificado - traduz apenas campos principais)
      try {
        if (this.profile.descricao) {
          this.profile.descricao = await translateText(this.profile.descricao, this.selectedLanguage);
        }
        
        // Traduzir descrições de histórico
        for (const exp of this.professionalHistory) {
          if (exp.descricao) {
            exp.descricao = await translateText(exp.descricao, this.selectedLanguage);
          }
        }
        
        for (const acad of this.academicHistory) {
          if (acad.descricao) {
            acad.descricao = await translateText(acad.descricao, this.selectedLanguage);
          }
        }
      } catch (error) {
        
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'long' 
      });
    }
  };
}

// Registrar globalmente para o Alpine.js
window.cvPage = cvPage;

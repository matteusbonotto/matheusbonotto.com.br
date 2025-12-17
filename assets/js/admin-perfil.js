// assets/js/admin-perfil.js
// CRUD de Perfil

import { protectAdminRoute, logout } from '../auth.js';
import { supabase } from '../supabase.js';

export function profileCRUD() {
  return {
    sidebarOpen: false,
    loading: false,
    error: null,
    success: false,
    successMessage: 'Perfil salvo com sucesso!',
    form: {
      id: null,
      primeiro_nome: '',
      sobrenome: '',
      nome_completo: '',
      data_nascimento: '',
      local: '',
      pais: 'Brasil',
      ocupacao: '',
      descricao: '',
      keywords: '',
      github_url: '',
      linkedin_url: '',
      email: '',
      telefone: '',
      avatar_url: ''
    },
    
    async initAdmin() {
      const hasAccess = await protectAdminRoute();
      if (!hasAccess) return;
      await this.loadProfile();
    },
    
    async loadProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          this.form = { ...data };
        }
      } catch (error) {
        
        // Não mostrar erro se não houver perfil ainda
      }
    },
    
    async saveProfile() {
      try {
        this.loading = true;
        this.error = null;
        this.success = false;
        
        if (this.form.id) {
          // Update
          const { error } = await supabase
            .from('profiles')
            .update(this.form)
            .eq('id', this.form.id);
          
          if (error) throw error;
        } else {
          // Create
          const { data, error } = await supabase
            .from('profiles')
            .insert([this.form])
            .select()
            .single();
          
          if (error) throw error;
          this.form.id = data.id;
        }
        
        this.success = true;
        setTimeout(() => {
          this.success = false;
        }, 3000);
      } catch (error) {
        
        this.error = error.message || 'Erro ao salvar perfil.';
      } finally {
        this.loading = false;
      }
    },
    
    async handleLogout() {
      if (confirm('Tem certeza que deseja sair?')) {
        await logout();
      }
    }
  };
}


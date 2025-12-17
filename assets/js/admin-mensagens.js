// assets/js/admin-mensagens.js
// CRUD de Mensagens

import { protectAdminRoute, logout } from '../auth.js';
import { supabase } from '../supabase.js';

export function messagesCRUD() {
  return {
    sidebarOpen: false,
    messages: [],
    filteredMessages: [],
    selectedMessage: null,
    statusFilter: 'all',
    searchQuery: '',
    
    async initAdmin() {
      const hasAccess = await protectAdminRoute();
      if (!hasAccess) return;
      await this.loadMessages();
    },
    
    async loadMessages() {
      try {
        const { data, error } = await supabase
          .from('contact_messages')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        this.messages = data || [];
        this.filteredMessages = [...this.messages];
      } catch (error) {
        
        alert('Erro ao carregar mensagens. Verifique o console.');
      }
    },
    
    filterMessages() {
      let filtered = [...this.messages];
      
      // Filtrar por status
      if (this.statusFilter === 'unread') {
        filtered = filtered.filter(m => !m.lida);
      } else if (this.statusFilter === 'read') {
        filtered = filtered.filter(m => m.lida);
      }
      
      // Filtrar por busca
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(m => 
          m.nome?.toLowerCase().includes(query) ||
          m.email?.toLowerCase().includes(query) ||
          m.assunto?.toLowerCase().includes(query) ||
          m.mensagem?.toLowerCase().includes(query)
        );
      }
      
      this.filteredMessages = filtered;
    },
    
    viewMessage(message) {
      this.selectedMessage = message;
      const modal = new bootstrap.Modal(document.getElementById('messageModal'));
      modal.show();
    },
    
    async markAsRead(messageId) {
      try {
        const { error } = await supabase
          .from('contact_messages')
          .update({ lida: true })
          .eq('id', messageId);
        
        if (error) throw error;
        
        await this.loadMessages();
        
        // Atualizar mensagem selecionada
        if (this.selectedMessage?.id === messageId) {
          this.selectedMessage.lida = true;
        }
      } catch (error) {
        
        alert('Erro ao marcar como lida. Verifique o console.');
      }
    },
    
    async deleteMessage(messageId) {
      if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;
      
      try {
        const { error } = await supabase
          .from('contact_messages')
          .delete()
          .eq('id', messageId);
        
        if (error) throw error;
        
        await this.loadMessages();
      } catch (error) {
        
        alert('Erro ao excluir mensagem. Verifique o console.');
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    async handleLogout() {
      if (confirm('Tem certeza que deseja sair?')) {
        await logout();
      }
    }
  };
}


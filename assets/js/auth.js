// assets/js/auth.js
// Sistema de Autenticação

import { supabase } from './supabase.js';

// ⚠️ EMAIL AUTORIZADO - Verificar se config.js foi carregado
const ADMIN_EMAIL = window.CONFIG?.ADMIN_EMAIL || 'contato@matheusbonotto.com.br';

/**
 * Verifica se o usuário está autenticado e autorizado
 */
export async function verifyAdminAccess() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { authorized: false, reason: 'Não autenticado' };
  }
  
  const userEmail = session.user.email;
  
  if (userEmail !== ADMIN_EMAIL) {
    return { 
      authorized: false, 
      reason: `Email ${userEmail} não está autorizado para acesso admin` 
    };
  }
  
  return { authorized: true, email: userEmail, session };
}

/**
 * Protege rotas admin - redireciona se não autorizado
 */
export async function protectAdminRoute() {
  const { authorized, reason, email } = await verifyAdminAccess();
  
  if (!authorized) {
    if (reason.includes('não está autorizado')) {
      alert(`Acesso negado.\n${reason}\n\nApenas o email ${ADMIN_EMAIL} tem permissão.`);
      await supabase.auth.signOut();
    }
    window.location.href = '/admin/login.html';
    return false;
  }
  
  
  return true;
}

/**
 * Verifica autenticação básica (sem verificação de email)
 */
export async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    if (window.location.pathname.startsWith('/admin') && 
        !window.location.pathname.includes('login')) {
      window.location.href = '/admin/login.html';
    }
    return false;
  }
  
  return true;
}

/**
 * Login com email e senha
 */
export async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    // Verificar se o email é autorizado
    if (data.user.email !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      throw new Error(`Email ${data.user.email} não está autorizado. Apenas ${ADMIN_EMAIL} tem permissão.`);
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    
    return { success: false, error: error.message };
  }
}

/**
 * Logout
 */
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.href = '/admin/login.html';
  } catch (error) {
    
  }
}

/**
 * Obter sessão atual
 */
export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Obter usuário atual
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Listener de mudanças de autenticação
 */
export function setupAuthListener() {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      if (window.location.pathname.startsWith('/admin') && 
          !window.location.pathname.includes('login')) {
        window.location.href = '/admin/login.html';
      }
      return;
    }
    
    // Verificar email autorizado ao fazer login ou refresh
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      const userEmail = session.user.email;
      if (userEmail !== ADMIN_EMAIL) {
        alert('Acesso negado. Este email não está autorizado.');
        await supabase.auth.signOut();
        window.location.href = '/admin/login.html';
      }
    }
  });
}

// Inicializar listener ao carregar o módulo
setupAuthListener();


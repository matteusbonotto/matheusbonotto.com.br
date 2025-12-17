// assets/js/supabase.js
// Cliente Supabase - Usa versão UMD (script tag)

// Verificar se config.js foi carregado
if (typeof window.CONFIG === 'undefined') {
  
  // Fallback para desenvolvimento
  window.CONFIG = {
    SUPABASE_URL: 'https://rncpbkzszbbqqipkqcgs.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuY3Bia3pzemJicXFpcGtxY2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTQ2NDcsImV4cCI6MjA4MDk3MDY0N30.qeRXwovfdf4sRhhQtzsVGlbhR4zOmUpEl0ZB7lW5HX4'
  };
}

const supabaseUrl = window.CONFIG?.SUPABASE_URL;
const supabaseAnonKey = window.CONFIG?.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  
  
}

// ⚠️ NUNCA usar Service Role Key aqui! Apenas Anon Key
// Usar Supabase UMD (carregado via script tag no HTML)
let supabase = null;

// Função para inicializar Supabase
function initSupabase() {
  if (supabase) {
    return supabase;
  }

  // Primeiro, verificar se já foi inicializado globalmente
  if (window.__supabaseClient && typeof window.__supabaseClient.from === 'function') {
    
    return window.__supabaseClient;
  }
  
  // Verificar diferentes formas que o Supabase UMD pode expor
  let createClientFn = null;
  
  if (typeof window.supabase !== 'undefined') {
    // Tentar diferentes formas
    if (window.supabase.createClient && typeof window.supabase.createClient === 'function') {
      createClientFn = window.supabase.createClient;
    } else if (typeof window.supabase === 'function') {
      // Pode ser que window.supabase já seja o createClient
      createClientFn = window.supabase;
    } else if (window.supabase.default && typeof window.supabase.default.createClient === 'function') {
      createClientFn = window.supabase.default.createClient;
    }
  }
  
  if (!createClientFn) {
    
    
    
    if (window.supabase) {
      );
    }
    // Criar mock para evitar quebrar
    supabase = {
      from: () => ({
        select: () => Promise.resolve({ data: null, error: { message: 'Supabase não carregado' } }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Supabase não carregado' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Supabase não carregado' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Supabase não carregado' } })
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null })
      }
    };
    return supabase;
  }

  try {
    supabase = createClientFn(supabaseUrl, supabaseAnonKey);
    // Armazenar globalmente para reutilizar
    window.__supabaseClient = supabase;
    console.log('🔌 Supabase inicializado:', {
      url: supabaseUrl,
      hasKey: !!supabaseAnonKey
    });
    return supabase;
  } catch (error) {
    
    
    // Criar mock
    supabase = {
      from: () => ({
        select: () => Promise.resolve({ data: null, error: { message: 'Erro ao inicializar Supabase: ' + error.message } }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Erro ao inicializar Supabase' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Erro ao inicializar Supabase' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Erro ao inicializar Supabase' } })
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null })
      }
    };
    return supabase;
  }
}

// Inicializar Supabase
// O script UMD está no <head>, então deve estar disponível
supabase = initSupabase();

// Se retornou mock (Supabase UMD não estava disponível), tentar novamente após um delay
if (supabase && supabase.from) {
  // Verificar se é mock testando se tem a propriedade auth corretamente
  if (!supabase.auth || typeof supabase.auth.getSession !== 'function') {
    // Provavelmente é mock, tentar novamente
    setTimeout(() => {
      const retry = initSupabase();
      if (retry && retry.auth && typeof retry.auth.getSession === 'function') {
        supabase = retry;
        ');
      }
    }, 200);
  }
}

// Exportar
export { supabase };

// Helper para verificar conexão
export async function checkConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    return { connected: true };
  } catch (error) {
    
    return { connected: false, error };
  }
}


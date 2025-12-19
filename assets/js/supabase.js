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
    console.warn('⚠️ Supabase UMD não encontrado. Verificando window.supabase...');
    
    if (window.supabase) {
      console.warn('⚠️ window.supabase existe mas createClient não encontrado:', window.supabase);
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

// Inicializar Supabase quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    supabase = initSupabase();
    ensureSupabaseReady();
  });
} else {
  // DOM já está pronto
  supabase = initSupabase();
  ensureSupabaseReady();
}

// Função para garantir que Supabase esteja pronto
function ensureSupabaseReady() {
  if (supabase && supabase.from) {
    // Verificar se é mock testando se tem a propriedade auth corretamente
    if (!supabase.auth || typeof supabase.auth.getSession !== 'function') {
      // Provavelmente é mock, tentar novamente após delay
      setTimeout(() => {
        const retry = initSupabase();
        if (retry && retry.auth && typeof retry.auth.getSession === 'function') {
          supabase = retry;
          window.__supabaseClient = retry;
          console.log('✅ Supabase inicializado após retry');
        } else {
          // Tentar mais uma vez após 500ms
          setTimeout(() => {
            const finalRetry = initSupabase();
            if (finalRetry && finalRetry.auth && typeof finalRetry.auth.getSession === 'function') {
              supabase = finalRetry;
              window.__supabaseClient = finalRetry;
              console.log('✅ Supabase inicializado após retry final');
            }
          }, 500);
        }
      }, 200);
    } else {
      // Supabase está OK, garantir que está no global
      window.__supabaseClient = supabase;
    }
  } else {
    // Tentar inicializar após um pequeno delay
    setTimeout(() => {
      supabase = initSupabase();
      if (supabase && supabase.auth && typeof supabase.auth.getSession === 'function') {
        window.__supabaseClient = supabase;
        console.log('✅ Supabase inicializado via ensureSupabaseReady');
      }
    }, 100);
  }
}

// Exportar - usar getter para garantir que retorne o cliente atualizado
export { supabase };

// Função helper para obter supabase (garante que está inicializado)
export function getSupabaseClient() {
  // Verificar se já temos um cliente válido
  if (window.__supabaseClient && typeof window.__supabaseClient.from === 'function') {
    return window.__supabaseClient;
  }
  
  // Tentar inicializar agora
  const client = initSupabase();
  if (client && client.from && client.auth) {
    window.__supabaseClient = client;
    return client;
  }
  
  // Retornar o exportado (pode ser null se ainda não inicializou)
  return supabase;
}

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


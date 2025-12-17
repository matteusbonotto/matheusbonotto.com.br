// assets/js/translate.js
// Sistema de Tradução (Google Translate API gratuita)

/**
 * Traduzir texto usando Google Translate API (gratuita)
 */
export async function translateText(text, targetLang = 'en') {
  if (!text || text.trim() === '') return text;
  
  try {
    // Cache no localStorage
    const cacheKey = `trans_${targetLang}_${text.substring(0, 50)}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Usar Google Translate API gratuita
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    );
    
    if (!response.ok) {
      throw new Error('Erro na API de tradução');
    }
    
    const data = await response.json();
    const translatedText = data[0][0][0];
    
    // Salvar no cache
    localStorage.setItem(cacheKey, translatedText);
    
    return translatedText;
  } catch (error) {
    
    // Fallback: retornar texto original
    return text;
  }
}

/**
 * Traduzir objeto completo (recursivo)
 */
export async function translateObject(obj, targetLang = 'en') {
  if (typeof obj === 'string') {
    return await translateText(obj, targetLang);
  }
  
  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => translateObject(item, targetLang)));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const translated = {};
    for (const [key, value] of Object.entries(obj)) {
      translated[key] = await translateObject(value, targetLang);
    }
    return translated;
  }
  
  return obj;
}

/**
 * Limpar cache de traduções
 */
export function clearTranslationCache() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('trans_')) {
      localStorage.removeItem(key);
    }
  });
}


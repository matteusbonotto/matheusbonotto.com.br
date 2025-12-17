// supabase/functions/send-email/index.ts
// Edge Function para enviar emails via EmailJS (mantém credenciais seguras)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verificar se é admin
    const { data: { user } } = await supabaseClient.auth.getUser()
    const adminEmail = Deno.env.get('ADMIN_EMAIL')
    
    if (!user || user.email !== adminEmail) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obter dados da requisição
    const { to_email, subject, message, from_name, from_email } = await req.json()

    // Configurações do EmailJS (do env)
    const emailjsServiceId = Deno.env.get('EMAILJS_SERVICE_ID')
    const emailjsTemplateId = Deno.env.get('EMAILJS_TEMPLATE_ID')
    const emailjsPublicKey = Deno.env.get('EMAILJS_PUBLIC_KEY')
    const emailjsUserId = Deno.env.get('EMAILJS_USER_ID') // Opcional

    if (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração do EmailJS incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enviar email via EmailJS API
    const emailjsUrl = `https://api.emailjs.com/api/v1.0/email/send`
    
    const emailjsPayload = {
      service_id: emailjsServiceId,
      template_id: emailjsTemplateId,
      user_id: emailjsUserId || emailjsPublicKey,
      template_params: {
        to_email: to_email || adminEmail,
        from_name: from_name || 'Portfólio',
        from_email: from_email || 'noreply@matheusbonotto.com.br',
        subject: subject || 'Nova mensagem do portfólio',
        message: message,
      }
    }

    const emailjsResponse = await fetch(emailjsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailjsPayload),
    })

    if (!emailjsResponse.ok) {
      const errorText = await emailjsResponse.text()
      throw new Error(`EmailJS error: ${errorText}`)
    }

    const result = await emailjsResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email enviado com sucesso',
        result 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro na Edge Function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao enviar email' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})


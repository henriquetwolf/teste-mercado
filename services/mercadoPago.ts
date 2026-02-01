
import { supabase } from './supabase';

export const createPreference = async (course: any, user: any) => {
  try {
    // 1. Buscar as configurações do Mercado Pago no Banco
    const { data: configData } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'mercadopago_config')
      .single();

    if (!configData?.value?.accessToken) {
      throw new Error("Access Token do Mercado Pago não configurado no Admin.");
    }

    const accessToken = configData.value.accessToken;

    // 2. Criar a preferência na API do Mercado Pago
    // Nota: Em produção, isso deve ser feito em uma Edge Function por segurança.
    // Aqui fazemos direto para demonstração da funcionalidade.
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            id: course.id,
            title: course.title,
            unit_price: course.price,
            quantity: 1,
            currency_id: 'BRL'
          }
        ],
        payer: {
          email: user.email,
        },
        back_urls: {
          success: window.location.origin + '/#/my-courses?status=success',
          failure: window.location.origin + '/#/checkout/' + course.id + '?status=failure',
          pending: window.location.origin + '/#/my-courses?status=pending'
        },
        auto_return: 'approved',
        external_reference: `${user.id}---${course.id}`
      })
    });

    const preference = await response.json();
    return preference.id;
  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    throw error;
  }
};

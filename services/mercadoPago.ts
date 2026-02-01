
import { supabase } from './supabase';

/**
 * Busca o Access Token configurado no banco de dados
 */
const getAccessToken = async () => {
  const { data: configData } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'mercadopago_config')
    .single();

  if (!configData?.value?.accessToken) {
    throw new Error("Access Token não configurado.");
  }
  return configData.value.accessToken;
};

/**
 * Cria a preferência de pagamento (Checkout Pro)
 */
export const createPreference = async (course: any, user: any) => {
  try {
    const accessToken = await getAccessToken();

    // Nota: Usamos query params simplificados para o back_url
    // O Mercado Pago adicionará: collection_id, collection_status, payment_id, status, external_reference, etc.
    const baseUrl = window.location.origin + window.location.pathname + (window.location.pathname.endsWith('/') ? '' : '/') + '#/my-courses';

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
          success: `${baseUrl}?origin=mercadopago`,
          failure: `${window.location.origin}/#/checkout/${course.id}?payment_status=error`,
          pending: `${baseUrl}?origin=mercadopago`
        },
        auto_return: 'approved',
        external_reference: `${user.id}---${course.id}`
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erro ao criar preferência no Mercado Pago");
    }

    const preference = await response.json();
    return preference.id;
  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    throw error;
  }
};

/**
 * Consulta a API do Mercado Pago para confirmar se o pagamento foi aprovado
 */
export const verifyPaymentStatus = async (paymentId: string) => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) return { approved: false, error: 'Pagamento não encontrado na API do Mercado Pago' };

    const paymentData = await response.json();
    
    return {
      approved: paymentData.status === 'approved',
      status: paymentData.status,
      external_reference: paymentData.external_reference,
      amount: paymentData.transaction_amount
    };
  } catch (error) {
    console.error("Erro na verificação do pagamento:", error);
    return { approved: false, error: 'Falha na comunicação com o gateway' };
  }
};

/**
 * BUSCA INTEGRADA: Lista os pagamentos recentes da conta do Mercado Pago
 */
export const searchPayments = async (limit = 50) => {
  try {
    const accessToken = await getAccessToken();
    
    // Busca pagamentos ordenados pelos mais recentes
    const response = await fetch(`https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) throw new Error("Não foi possível buscar os pagamentos.");

    const data = await response.json();
    return data.results; // Array de pagamentos
  } catch (error) {
    console.error("Erro ao buscar pagamentos no MP:", error);
    return [];
  }
};

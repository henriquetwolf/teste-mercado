
import { supabase } from './supabase';

/**
 * Busca o Access Token configurado. Se houver um instructorId, busca as chaves dele.
 * Caso contrário, busca as chaves globais da plataforma.
 */
const getAccessToken = async (instructorId?: string) => {
  if (instructorId) {
    // Busca credenciais específicas do professor na tabela profiles ou instructor_settings
    const { data: instructorData } = await supabase
      .from('profiles')
      .select('payment_config')
      .eq('id', instructorId)
      .single();

    if (instructorData?.payment_config?.accessToken) {
      return instructorData.payment_config.accessToken;
    }
  }

  // Fallback para configuração global
  const { data: configData } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'mercadopago_config')
    .single();

  if (!configData?.value?.accessToken) {
    throw new Error("Meio de pagamento não configurado pelo instrutor nem pela plataforma.");
  }
  return configData.value.accessToken;
};

/**
 * Cria a preferência de pagamento (Checkout Pro)
 */
export const createPreference = async (course: any, user: any, finalPrice?: number) => {
  try {
    // Usamos o instructorId do curso para determinar qual conta recebe o valor
    const accessToken = await getAccessToken(course.instructorId);
    
    const rawPrice = finalPrice !== undefined ? finalPrice : course.price;
    const price = Number(Number(rawPrice).toFixed(2));

    if (isNaN(price) || price <= 0) {
      throw new Error("Preço inválido para processamento.");
    }

    const baseUrl = window.location.origin + window.location.pathname + (window.location.pathname.endsWith('/') ? '' : '/') + '#/my-courses';
    const attemptId = Date.now().toString().slice(-6);
    const externalReference = `${user.id}---${course.id}---${attemptId}`;

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            id: course.id.toString(),
            title: course.title,
            unit_price: price,
            quantity: 1,
            currency_id: 'BRL'
          }
        ],
        payer: {
          email: user.email,
        },
        back_urls: {
          success: `${baseUrl}?origin=payment`,
          failure: `${window.location.origin}/#/checkout/${course.id}?payment_status=error`,
          pending: `${baseUrl}?origin=payment`
        },
        auto_return: 'approved',
        external_reference: externalReference
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erro ao comunicar com o gateway de pagamento");
    }

    const preference = await response.json();
    return preference.id;
  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    throw error;
  }
};

export const verifyPaymentStatus = async (paymentId: string, instructorId?: string) => {
  try {
    const accessToken = await getAccessToken(instructorId);
    
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) return { approved: false, status: 'not_found' };

    const paymentData = await response.json();
    return {
      approved: paymentData.status === 'approved',
      status: paymentData.status,
      external_reference: paymentData.external_reference,
      amount: paymentData.transaction_amount,
      id: paymentData.id
    };
  } catch (error) {
    return { approved: false, status: 'error' };
  }
};

export const searchPayments = async (limit = 50, instructorId?: string) => {
  try {
    const accessToken = await getAccessToken(instructorId);
    const response = await fetch(`https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=${limit}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error("Erro ao buscar pagamentos.");
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    return [];
  }
};

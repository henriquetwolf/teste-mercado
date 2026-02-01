
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
    throw new Error("Access Token não configurado no painel administrativo.");
  }
  return configData.value.accessToken;
};

/**
 * Cria a preferência de pagamento (Checkout Pro)
 */
export const createPreference = async (course: any, user: any, finalPrice?: number) => {
  try {
    const accessToken = await getAccessToken();
    
    // Garantir que o preço seja um número e esteja arredondado para 2 casas decimais
    const rawPrice = finalPrice !== undefined ? finalPrice : course.price;
    const price = Number(Number(rawPrice).toFixed(2));

    if (isNaN(price) || price <= 0) {
      throw new Error("Preço inválido para processamento.");
    }

    // Nota: Usamos query params simplificados para o back_url
    const baseUrl = window.location.origin + window.location.pathname + (window.location.pathname.endsWith('/') ? '' : '/') + '#/my-courses';

    // Gerar uma referência externa única para esta tentativa de compra específica
    // Isso evita que o Mercado Pago recupere uma preferência antiga com preço diferente
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
          success: `${baseUrl}?origin=mercadopago`,
          failure: `${window.location.origin}/#/checkout/${course.id}?payment_status=error`,
          pending: `${baseUrl}?origin=mercadopago`
        },
        auto_return: 'approved',
        external_reference: externalReference
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("MP API Error Details:", errorData);
      throw new Error(errorData.message || "Erro ao comunicar com Mercado Pago");
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

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        approved: false, 
        error: errorData.message || 'Pagamento não encontrado',
        status: 'error'
      };
    }

    const paymentData = await response.json();
    
    return {
      approved: paymentData.status === 'approved',
      status: paymentData.status,
      // A referência externa agora tem 3 partes: [userId, courseId, attemptId]
      external_reference: paymentData.external_reference,
      amount: paymentData.transaction_amount,
      id: paymentData.id
    };
  } catch (error) {
    console.error("Erro na verificação do pagamento:", error);
    return { approved: false, error: 'Falha na comunicação', status: 'offline' };
  }
};

/**
 * Busca pagamentos recentes para tentar reconciliar compras pendentes
 */
export const searchPayments = async (limit = 50) => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(`https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) throw new Error("Não foi possível buscar os pagamentos.");

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Erro ao buscar pagamentos no MP:", error);
    return [];
  }
};

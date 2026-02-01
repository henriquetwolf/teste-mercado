
import { supabase } from './supabase';

/**
 * Busca o Access Token do Admin Master (para coletar a comissão)
 */
const getAdminConfig = async () => {
  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'mercadopago_config')
    .single();
  return data?.value || {};
};

/**
 * Busca o Access Token do Professor
 */
const getInstructorAccessToken = async (instructorId?: string) => {
  if (!instructorId) return null;
  
  const { data } = await supabase
    .from('profiles')
    .select('payment_config')
    .eq('id', instructorId)
    .single();

  return data?.payment_config?.mercadopagoAccessToken || null;
};

/**
 * Cria a preferência de pagamento com Split de 1% (Marketplace Fee)
 */
export const createPreference = async (course: any, user: any, finalPrice?: number) => {
  try {
    const adminConfig = await getAdminConfig();
    // Ajuste para instructor_id vindo do banco ou instructorId vindo de constantes legadas
    const instructorToken = await getInstructorAccessToken(course.instructor_id || course.instructorId);
    
    const accessToken = instructorToken || adminConfig.accessToken;
    
    if (!accessToken) {
      throw new Error("Sistema de pagamento indisponível para este instrutor.");
    }

    const rawPrice = finalPrice !== undefined ? finalPrice : course.price;
    const price = Number(Number(rawPrice).toFixed(2));
    const platformCommission = Number((price * 0.01).toFixed(2));

    const baseUrl = window.location.origin + window.location.pathname + (window.location.pathname.endsWith('/') ? '' : '/') + '#/my-courses';
    const attemptId = Date.now().toString().slice(-6);
    const externalReference = `${user.id}---${course.id}---${attemptId}`;

    const preferenceBody: any = {
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
      external_reference: externalReference,
      marketplace_fee: platformCommission, 
      statement_descriptor: "EDUVANTAGE CURSOS"
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erro ao gerar checkout");
    }

    const preference = await response.json();
    return preference.id;
  } catch (error) {
    console.error("Erro MP Preference:", error);
    throw error;
  }
};

export const verifyPaymentStatus = async (paymentId: string, instructorId?: string) => {
  try {
    const instructorToken = await getInstructorAccessToken(instructorId);
    const adminConfig = await getAdminConfig();
    const accessToken = instructorToken || adminConfig.accessToken;
    
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
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
    const instructorToken = await getInstructorAccessToken(instructorId);
    const adminConfig = await getAdminConfig();
    const accessToken = instructorToken || adminConfig.accessToken;

    const response = await fetch(`https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=${limit}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    return [];
  }
};

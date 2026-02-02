
import { supabase } from './supabase';

/**
 * Busca a configuração Master do Admin (Dono da Plataforma)
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
 * Cria a preferência de pagamento DIRETO para o Admin.
 * 100% do valor cai na conta vinculada ao Access Token do Admin Master.
 */
export const createPreference = async (course: any, user: any, finalPrice?: number) => {
  try {
    const adminConfig = await getAdminConfig();
    const accessToken = adminConfig.accessToken;
    const publicKey = adminConfig.publicKey;
    
    if (!accessToken) {
      throw new Error("Sistema de pagamentos não configurado pelo administrador.");
    }

    const price = Number(Number(finalPrice !== undefined ? finalPrice : course.price).toFixed(2));
    const baseUrl = window.location.origin + window.location.pathname + (window.location.pathname.endsWith('/') ? '' : '/') + '#/my-courses';
    const externalReference = `${user.id}---${course.id}---${Date.now()}`;

    const preferenceBody = {
      items: [
        {
          id: course.id.toString(),
          title: course.title,
          unit_price: price,
          quantity: 1,
          currency_id: 'BRL',
          picture_url: course.thumbnail
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
      statement_descriptor: "EDUVANTAGE",
      binary_mode: true
      // Nota: marketplace_fee e collector_id removidos para garantir venda direta ao Admin Master.
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceBody)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Erro API Mercado Pago:", responseData);
      throw new Error(responseData.message || "Erro ao gerar link de pagamento.");
    }
    
    return {
      id: responseData.id,
      publicKey: publicKey 
    };
  } catch (error: any) {
    console.error("Erro MP Preference:", error);
    throw error;
  }
};

export const verifyPaymentStatus = async (paymentId: string) => {
  try {
    const adminConfig = await getAdminConfig();
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminConfig.accessToken}` }
    });
    const paymentData = await response.json();
    return {
      approved: paymentData.status === 'approved',
      status: paymentData.status,
      external_reference: paymentData.external_reference,
      amount: paymentData.transaction_amount
    };
  } catch (error) {
    return { approved: false, status: 'error' };
  }
};

export const searchPayments = async (limit: number = 20) => {
  try {
    const adminConfig = await getAdminConfig();
    if (!adminConfig.accessToken) return [];

    const response = await fetch(`https://api.mercadopago.com/v1/payments/search?limit=${limit}&sort=date_created&criteria=desc`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminConfig.accessToken}` }
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Erro ao buscar pagamentos Mercado Pago:", error);
    return [];
  }
};

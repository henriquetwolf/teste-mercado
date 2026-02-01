
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
 * Busca o ID de Recebedor (Collector ID) do Professor
 */
const getInstructorMPId = async (instructorId: string) => {
  const { data } = await supabase
    .from('profiles')
    .select('payment_config')
    .eq('id', instructorId)
    .single();
  
  return data?.payment_config?.mercadopagoUserId || null;
};

/**
 * Cria a preferência de pagamento com SPLIT REAL.
 * 1. Autentica com o Access Token do ADMIN.
 * 2. Define o Professor (collector_id) como recebedor principal.
 * 3. Define a comissão (marketplace_fee) que fica com o ADMIN.
 */
export const createPreference = async (course: any, user: any, finalPrice?: number) => {
  try {
    const adminConfig = await getAdminConfig();
    const instructorMpId = await getInstructorMPId(course.instructor_id);
    
    const accessToken = adminConfig.accessToken;
    const publicKey = adminConfig.publicKey;
    const commissionRate = adminConfig.commissionRate || 1; // % da plataforma
    
    if (!accessToken) {
      throw new Error("Sistema de pagamentos indisponível: Admin não configurado.");
    }

    if (!instructorMpId) {
      throw new Error("Este professor ainda não configurou sua conta de recebimento Mercado Pago.");
    }

    const rawPrice = finalPrice !== undefined ? finalPrice : course.price;
    const price = Number(Number(rawPrice).toFixed(2));
    
    // Calcula a comissão do ADMIN (Ex: 10% de R$ 100 = R$ 10)
    const platformFee = Number((price * (commissionRate / 100)).toFixed(2));

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
      // CONFIGURAÇÃO DE SPLIT MARKETPLACE:
      marketplace_fee: platformFee, // Valor que vai para a conta do ADMIN (dono do Access Token)
      collector_id: Number(instructorMpId), // ID da conta do PROFESSOR (onde o resto do dinheiro cai)
      statement_descriptor: "EDUVANTAGE",
      binary_mode: true
    };

    // A chamada deve ser feita usando o Access Token do ADMIN
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
      console.error("MP Error Detail:", errorData);
      throw new Error(errorData.message || "Erro ao configurar divisão de pagamento.");
    }

    const preference = await response.json();
    
    return {
      id: preference.id,
      publicKey: publicKey // Frontend usa a chave pública do ADMIN
    };
  } catch (error) {
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

// Fixed: Added searchPayments export to fix error in views/MyCourses.tsx on line 7
/**
 * Busca pagamentos recentes na API do Mercado Pago para sincronização manual de bibliotecas de usuários.
 */
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


import { supabase } from './supabase';

/**
 * Busca a configuração Master do Admin
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
 * Busca a configuração de pagamento do Professor dono do curso
 */
const getInstructorConfig = async (instructorId?: string) => {
  if (!instructorId) return null;
  
  const { data } = await supabase
    .from('profiles')
    .select('payment_config')
    .eq('id', instructorId)
    .single();

  return {
    accessToken: data?.payment_config?.mercadopagoAccessToken || null,
    publicKey: data?.payment_config?.mercadopagoPublicKey || null
  };
};

/**
 * Cria a preferência de pagamento com Split dinâmico (Marketplace Fee)
 * Retorna { id, publicKey } para garantir que o frontend use a chave correta
 */
export const createPreference = async (course: any, user: any, finalPrice?: number) => {
  try {
    const adminConfig = await getAdminConfig();
    const instructorId = course.instructor_id || course.instructorId;
    const instructorConfig = await getInstructorConfig(instructorId);
    
    // Prioriza as chaves do instrutor. Se não houver, usa as do admin.
    const accessToken = instructorConfig?.accessToken || adminConfig.accessToken;
    const publicKey = instructorConfig?.publicKey || adminConfig.publicKey;
    
    // Taxa dinâmica definida pelo admin (default 1%)
    const commissionRate = adminConfig.commissionRate ?? 1;
    
    if (!accessToken || !publicKey) {
      throw new Error("As credenciais de pagamento para este curso não foram configuradas corretamente pelo instrutor.");
    }

    const rawPrice = finalPrice !== undefined ? finalPrice : course.price;
    const price = Number(Number(rawPrice).toFixed(2));
    
    // Taxa dinâmica que vai para o dono da plataforma (Admin Master)
    const platformFee = Number((price * (commissionRate / 100)).toFixed(2));

    const baseUrl = window.location.origin + window.location.pathname + (window.location.pathname.endsWith('/') ? '' : '/') + '#/my-courses';
    const attemptId = Date.now().toString().slice(-6);
    const externalReference = `${user.id}---${course.id}---${attemptId}`;

    const preferenceBody = {
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
      marketplace_fee: platformFee, 
      statement_descriptor: "EDUVANTAGE"
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
      throw new Error(errorData.message || "Erro ao gerar checkout do Mercado Pago");
    }

    const preference = await response.json();
    
    // Retornamos o ID e a Public Key que deve ser usada para abrir esse ID específico
    return {
      id: preference.id,
      publicKey: publicKey
    };
  } catch (error) {
    console.error("Erro MP Preference:", error);
    throw error;
  }
};

export const verifyPaymentStatus = async (paymentId: string, instructorId?: string) => {
  try {
    const instructorConfig = await getInstructorConfig(instructorId);
    const adminConfig = await getAdminConfig();
    const accessToken = (instructorConfig?.accessToken) || adminConfig.accessToken;
    
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
    const instructorConfig = await getInstructorConfig(instructorId);
    const adminConfig = await getAdminConfig();
    const accessToken = (instructorConfig?.accessToken) || adminConfig.accessToken;

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

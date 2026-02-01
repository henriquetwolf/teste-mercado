
import { supabase } from './supabase';

/**
 * Busca as credenciais do PagSeguro do professor no Supabase
 */
const getInstructorPagSeguro = async (instructorId: string) => {
  const { data } = await supabase
    .from('profiles')
    .select('payment_config')
    .eq('id', instructorId)
    .single();

  return data?.payment_config || null;
};

/**
 * Gera o link de checkout do PagSeguro.
 * Como o PagSeguro exige uma chamada de servidor para gerar o ID de checkout,
 * esta função simula o redirecionamento com os parâmetros básicos de identificação
 * que seriam enviados para o backend.
 */
export const createPagSeguroCheckout = async (course: any, user: any, finalPrice: number) => {
  const instructorId = course.instructor_id || course.instructorId;
  const config = await getInstructorPagSeguro(instructorId);

  if (!config || !config.pagseguroEmail) {
    throw new Error("O instrutor não configurou os dados do PagSeguro.");
  }

  console.log("Iniciando fluxo PagSeguro para:", config.pagseguroEmail);

  // No fluxo real, você chamaria sua API/Edge Function que faria:
  // POST https://ws.pagseguro.uol.com.br/v2/checkout?email=...&token=...
  
  // Para fins de demonstração na plataforma, simulamos o redirecionamento:
  // Em uma integração real via "Checkout Transparente" ou "Lightbox", isso seria diferente.
  
  const baseUrl = "https://pagseguro.uol.com.br/v2/checkout/payment.html";
  
  // Exemplo de como os parâmetros seriam passados (URL de exemplo pedagógico)
  const params = new URLSearchParams({
    receiverEmail: config.pagseguroEmail,
    currency: 'BRL',
    itemId1: course.id.toString(),
    itemDescription1: course.title,
    itemAmount1: finalPrice.toFixed(2),
    itemQuantity1: '1',
    reference: `${user.id}---${course.id}---${Date.now()}`,
    senderEmail: user.email
  });

  // Retornamos a URL de simulação (em produção seria o retorno da API do PagSeguro)
  // Como estamos no ambiente frontend, orientamos o usuário a simular a compra.
  return `${baseUrl}?${params.toString()}`;
};

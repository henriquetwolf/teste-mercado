
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, CreditCard, ChevronLeft, AlertTriangle, Loader2, ExternalLink, Info, Wallet, CheckCircle2 } from 'lucide-react';
import { COURSES } from '../constants';
import { supabase } from '../services/supabase';

interface Props {
  onComplete: (id: string) => void;
}

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export default function Checkout({ onComplete }: Props) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mpInitialized, setMpInitialized] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCourseAndSettings();
  }, []);

  async function fetchCourseAndSettings() {
    try {
      // 1. Buscar curso
      const { data: courseData } = await supabase.from('courses').select('*').eq('id', courseId).maybeSingle();
      const finalCourse = courseData || COURSES.find(c => c.id === courseId);
      setCourse(finalCourse);

      // 2. Tentar inicializar Mercado Pago se houver Public Key no banco
      const { data: configData } = await supabase.from('platform_settings').select('value').eq('key', 'mercadopago_config').maybeSingle();
      
      if (configData?.value?.publicKey && window.MercadoPago) {
        new window.MercadoPago(configData.value.publicKey, { locale: 'pt-BR' });
        setMpInitialized(true);
      }
    } catch (err) {
      console.error("Erro no checkout:", err);
    } finally {
      setLoading(false);
    }
  }

  const handlePaymentInitiation = async () => {
    if (!course) return;
    setIsProcessing(true);

    try {
      // Registrar intenção de compra no banco
      await onComplete(course.id);

      if (course.payment_link) {
        // Se já temos um link direto (preferência criada manualmente ou via API externa)
        window.location.href = course.payment_link;
      } else {
        // Simulação de criação de preferência via API caso o link não esteja setado
        alert("Iniciando Checkout Seguro... Você será redirecionado para o ambiente de pagamento do Mercado Pago.");
        // Em um sistema real, aqui chamaríamos uma Edge Function para gerar o preferenceId
        // Por enquanto, usamos o redirecionamento para o link configurado no Admin
        alert("Aviso: O link de pagamento não foi configurado para este curso no painel admin.");
      }
    } catch (err) {
      console.error("Erro ao processar pagamento:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-sky-600" /></div>;
  if (!course) return <div className="p-20 text-center">Curso não encontrado</div>;

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-medium mb-8 hover:text-sky-600 transition-colors group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Voltar
        </button>

        <div className="bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          {/* Lado Esquerdo: Resumo */}
          <div className="flex-1 p-12 bg-sky-50/50 border-r border-slate-100">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-8 border border-sky-100">
               <Wallet className="text-sky-600" size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Finalizar Matrícula</h2>
            <p className="text-slate-500 mb-8 text-sm">Você está a um passo de transformar sua carreira com o curso <strong>{course.title}</strong>.</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-slate-400 text-[10px] font-black uppercase">
                <span>Investimento</span>
                <span>R$ {course.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end text-slate-900">
                <span className="text-sm font-bold">Total a pagar</span>
                <span className="text-4xl font-black text-sky-600">R$ {course.price.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-3 text-emerald-600 bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
                  <ShieldCheck size={20} />
                  <span className="text-xs font-bold uppercase tracking-tight">Pagamento 100% Protegido</span>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 text-[10px] text-slate-400 font-bold text-center">
                    PIX INSTANTÂNEO
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 text-[10px] text-slate-400 font-bold text-center">
                    CARTÃO EM 12X
                  </div>
               </div>
            </div>
          </div>

          {/* Lado Direito: Ação */}
          <div className="flex-1 p-12 flex flex-col justify-center items-center text-center">
            <img 
              src="https://imgmp.mlstatic.com/resources/frontend/statics/ml-uikit/resources/utils/checkouts/mercadopago-logo.png" 
              alt="Mercado Pago" 
              className="h-8 mb-8 grayscale opacity-50"
            />
            
            {!course.payment_link ? (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl text-amber-700 max-w-xs">
                <AlertTriangle className="mx-auto mb-3" />
                <h4 className="font-bold text-sm mb-1">Ação Requerida</h4>
                <p className="text-[10px] leading-relaxed">O administrador precisa vincular um link de pagamento do Mercado Pago a este curso no painel.</p>
              </div>
            ) : (
              <div className="w-full space-y-6">
                <div className="space-y-2">
                   <h3 className="text-xl font-bold text-slate-900">Método Escolhido</h3>
                   <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 px-4 py-2 rounded-full text-xs font-black">
                      <CreditCard size={14} /> MERCADO PAGO CHECKOUT
                   </div>
                </div>

                <button 
                  onClick={handlePaymentInitiation}
                  disabled={isProcessing}
                  className="w-full bg-[#009EE3] text-white py-6 rounded-3xl font-black text-xl hover:bg-[#007db3] shadow-xl shadow-sky-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 group"
                >
                  {isProcessing ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      PAGAR AGORA
                      <ExternalLink size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-slate-400 font-medium">
                  Ao clicar em pagar, você será levado ao ambiente seguro do Mercado Pago para concluir a transação com PIX, Cartão ou Boleto.
                </p>
              </div>
            )}

            <div className="mt-12 flex items-center gap-4 grayscale opacity-30">
               <Lock size={16} />
               <span className="text-[10px] font-bold uppercase tracking-widest">SSL Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

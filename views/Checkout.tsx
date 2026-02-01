
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, CreditCard, ChevronLeft, CheckCircle, AlertTriangle, Zap, Loader2, ExternalLink, Info, Wallet } from 'lucide-react';
import { COURSES } from '../constants';
import { supabase } from '../services/supabase';

interface Props {
  onComplete: (id: string) => void;
}

export default function Checkout({ onComplete }: Props) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSimulated, setIsSimulated] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCourse();
  }, []);

  async function fetchCourse() {
    try {
      const { data } = await supabase.from('courses').select('*').eq('id', courseId).maybeSingle();
      if (data) {
        setCourse(data);
        setIsSimulated(!data.payment_link);
      } else {
        const staticC = COURSES.find(c => c.id === courseId);
        setCourse(staticC);
        setIsSimulated(true);
      }
    } catch (err) {
      console.error("Erro ao carregar checkout:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleRealPayment = async () => {
    if (course?.payment_link) {
      await onComplete(course.id);
      window.open(course.payment_link, '_blank');
      alert("Redirecionando para o Mercado Pago. Após o pagamento, sua aula será liberada em alguns instantes!");
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-sky-600" /></div>;
  if (!course) return <div className="p-20 text-center">Curso não encontrado</div>;

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-medium mb-8 hover:text-sky-600 transition-colors group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Voltar aos detalhes
        </button>

        <div className="bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Esquerda: Informações do Curso */}
            <div className="p-10 bg-sky-50/30 border-r border-slate-100">
               <div className="inline-flex items-center gap-2 bg-[#FFF159] text-sky-900 px-3 py-1 rounded-full text-[10px] font-black uppercase mb-6 shadow-sm">
                 <Wallet size={12} /> Mercado Pago Checkout
               </div>
               <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">{course.title}</h2>
               <p className="text-slate-500 mb-8 leading-relaxed text-sm">Acesso vitalício aos módulos, suporte e atualizações. Pagamento 100% seguro.</p>
               
               <div className="space-y-4">
                 <div className="flex justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                   <span>Valor do Curso</span>
                   <span>R$ {course.price.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-3xl font-black text-sky-600 border-t border-slate-200 pt-4">
                   <span className="text-slate-900">Total</span>
                   <span>R$ {course.price.toFixed(2)}</span>
                 </div>
               </div>

               <div className="mt-12 space-y-4">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-bold uppercase">
                     <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <ShieldCheck size={18} />
                     </div>
                     Compra Garantida
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-bold uppercase">
                     <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
                        <Lock size={18} />
                     </div>
                     Dados Criptografados
                  </div>
               </div>
            </div>

            {/* Direita: Ação do Mercado Pago */}
            <div className="p-10 flex flex-col justify-center text-center">
               {isSimulated ? (
                 <div className="space-y-6">
                    <div className="bg-amber-50 border border-amber-200 p-8 rounded-3xl text-amber-700">
                       <AlertTriangle className="mx-auto mb-4" size={40} />
                       <h3 className="font-black text-lg mb-2 uppercase">Aguardando Configuração</h3>
                       <p className="text-xs opacity-80 leading-relaxed">
                         O administrador ainda não configurou o link de pagamento do Mercado Pago para este curso.
                       </p>
                    </div>
                    <button 
                      disabled
                      className="w-full bg-slate-100 text-slate-400 py-6 rounded-3xl font-black text-xl cursor-not-allowed border-2 border-dashed border-slate-200"
                    >
                      LINK INDISPONÍVEL
                    </button>
                 </div>
               ) : (
                 <div className="space-y-8">
                    <div className="text-center">
                       <div className="w-20 h-20 bg-sky-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <CreditCard className="text-sky-600" size={40} />
                       </div>
                       <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Finalizar Agora</h3>
                       <p className="text-slate-500 mt-2 text-sm">Pague com PIX, Cartão de Crédito ou Boleto através do Mercado Pago.</p>
                    </div>

                    <button 
                      onClick={handleRealPayment}
                      className="w-full bg-[#009EE3] text-white py-6 rounded-3xl font-black text-xl hover:bg-[#007db3] shadow-2xl shadow-sky-200 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                    >
                      PAGAR COM MERCADO PAGO 
                      <ExternalLink size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>

                    <div className="bg-sky-50 p-6 rounded-3xl border border-sky-100 flex gap-4 text-left">
                       <Info className="text-sky-600 shrink-0" size={20} />
                       <div>
                          <p className="text-[11px] text-sky-800 font-bold uppercase mb-1">Dica de Acesso</p>
                          <p className="text-[10px] text-sky-700 font-medium leading-relaxed">
                             Utilize PIX ou Cartão para liberação <strong>imediata</strong> do curso em sua conta.
                          </p>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

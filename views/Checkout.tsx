
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, CreditCard, ChevronLeft, CheckCircle, AlertTriangle, Zap, Loader2, ExternalLink, Info } from 'lucide-react';
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

  const handleRealPayment = () => {
    if (course?.payment_link) {
      // Abre o link real do Mercado Pago em outra aba
      window.open(course.payment_link, '_blank');
      
      // Avisa o aluno o que fazer depois
      alert("Você foi redirecionado para o checkout oficial do Mercado Pago. Após o pagamento, o acesso será liberado em sua conta (necessita liberação manual pelo administrador nesta versão).");
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-sky-600" /></div>;
  if (!course) return <div className="p-20 text-center">Curso não encontrado</div>;

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-medium mb-8 hover:text-sky-600">
          <ChevronLeft size={20} /> Voltar
        </button>

        <div className="bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Esquerda: Informações */}
            <div className="p-10 bg-slate-50 border-r border-slate-200">
               <div className="inline-flex items-center gap-2 bg-[#009EE3] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase mb-6">
                 Mercado Pago Oficial
               </div>
               <h2 className="text-3xl font-black text-slate-900 mb-4">{course.title}</h2>
               <p className="text-slate-500 mb-8 leading-relaxed">Você está prestes a adquirir acesso vitalício ao conteúdo, incluindo suporte da IA Tutor e atualizações.</p>
               
               <div className="space-y-4">
                 <div className="flex justify-between items-center text-slate-400 text-sm font-bold uppercase tracking-widest">
                   <span>Preço Unitário</span>
                   <span>R$ {course.price.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-3xl font-black text-slate-900 border-t border-slate-200 pt-4">
                   <span>Total</span>
                   <span>R$ {course.price.toFixed(2)}</span>
                 </div>
               </div>

               <div className="mt-12 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-bold uppercase">
                     <ShieldCheck className="text-emerald-500" size={18} /> Compra 100% Protegida
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-bold uppercase">
                     <Lock className="text-sky-500" size={18} /> Dados Criptografados
                  </div>
               </div>
            </div>

            {/* Direita: Ação */}
            <div className="p-10 flex flex-col justify-center text-center">
               {isSimulated ? (
                 <div className="space-y-6">
                    <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl text-amber-700">
                       <AlertTriangle className="mx-auto mb-4" size={40} />
                       <h3 className="font-black text-lg mb-2 uppercase">Modo de Simulação</h3>
                       <p className="text-sm opacity-80 leading-relaxed">
                         Este curso ainda não possui um **Link de Pagamento Real** configurado pelo administrador. Dinheiro real não será processado.
                       </p>
                    </div>
                    <button 
                      disabled
                      className="w-full bg-slate-200 text-slate-400 py-6 rounded-3xl font-black text-xl cursor-not-allowed"
                    >
                      PAGAMENTO INDISPONÍVEL
                    </button>
                    <p className="text-[10px] text-slate-400 font-bold uppercase italic">O administrador deve configurar o link real no Painel Admin para receber pagamentos.</p>
                 </div>
               ) : (
                 <div className="space-y-8">
                    <div className="text-center">
                       <Zap className="mx-auto text-sky-500 mb-4" size={56} />
                       <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Pagamento Real</h3>
                       <p className="text-slate-500 mt-2">Clique no botão abaixo para ir ao checkout seguro do Mercado Pago.</p>
                    </div>

                    <button 
                      onClick={handleRealPayment}
                      className="w-full bg-[#009EE3] text-white py-6 rounded-3xl font-black text-2xl hover:bg-[#0089c7] shadow-2xl shadow-sky-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      PAGAR AGORA <ExternalLink size={24} />
                    </button>

                    <div className="bg-sky-50 p-6 rounded-3xl border border-sky-100 flex gap-4 text-left">
                       <Info className="text-sky-600 shrink-0" />
                       <p className="text-[11px] text-sky-800 font-medium leading-relaxed">
                          <strong>Atenção:</strong> Como esta é uma versão integrada, após pagar no Mercado Pago, envie seu comprovante ao administrador para que ele mude seu status de compra no banco de dados para "Aprovado" e seu curso seja liberado em "Meus Cursos".
                       </p>
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

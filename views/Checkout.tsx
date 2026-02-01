
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, CreditCard, ChevronLeft, Loader2, Wallet, CheckCircle2, ArrowRight } from 'lucide-react';
import { COURSES } from '../constants';
import { supabase } from '../services/supabase';
import { createPreference } from '../services/mercadoPago';

export default function Checkout({ onComplete }: { onComplete: (id: string) => void }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user);

      const { data: courseData } = await supabase.from('courses').select('*').eq('id', courseId).maybeSingle();
      const finalCourse = courseData || COURSES.find(c => c.id === courseId);
      setCourse(finalCourse);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleStartPayment = async () => {
    if (!course || !user) return;
    setIsGenerating(true);
    try {
      const id = await createPreference(course, user);
      setPreferenceId(id);
      
      // Registrar intenção de compra
      await supabase.from('sales').insert({
        user_id: user.id,
        course_id: course.id,
        amount: course.price,
        status: 'Iniciado',
        mp_preference_id: id
      });

      // Redirecionar para o Checkout Pro do Mercado Pago
      window.location.href = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${id}`;
    } catch (err: any) {
      alert("Erro ao gerar pagamento: " + err.message);
    } finally {
      setIsGenerating(false);
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
          <div className="flex-1 p-12 bg-slate-900 text-white">
            <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-sky-500/20">
               <Wallet size={32} />
            </div>
            <h2 className="text-3xl font-black mb-2">Resumo do Pedido</h2>
            <p className="text-slate-400 mb-8 text-sm">Você está adquirindo acesso vitalício ao treinamento.</p>
            
            <div className="space-y-6 mb-12">
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                <div>
                  <div className="text-xs font-bold text-sky-400 uppercase mb-1">Produto</div>
                  <div className="text-sm font-bold line-clamp-1">{course.title}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">Preço</div>
                  <div className="text-sm font-bold">R$ {course.price.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-white/10 pt-6">
                <span className="text-sm font-bold text-slate-400">Total a pagar agora</span>
                <span className="text-4xl font-black text-sky-400">R$ {course.price.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
               <div className="flex items-center gap-3 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                  <ShieldCheck size={16} /> Pagamento Processado pelo Mercado Pago
               </div>
            </div>
          </div>

          <div className="flex-1 p-12 flex flex-col justify-center items-center text-center bg-white">
            <div className="mb-10">
              <img 
                src="https://imgmp.mlstatic.com/resources/frontend/statics/ml-uikit/resources/utils/checkouts/mercadopago-logo.png" 
                alt="Mercado Pago" 
                className="h-6 mx-auto mb-2"
              />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Ambiente Seguro & Criptografado</p>
            </div>

            <div className="w-full space-y-6">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left">
                <h4 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500" /> 
                  O que acontece após o pagamento?
                </h4>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-[11px] text-slate-500 font-medium">
                    <div className="w-5 h-5 rounded-full bg-white border flex items-center justify-center shrink-0">1</div>
                    Aprovação instantânea via PIX ou Cartão.
                  </li>
                  <li className="flex gap-3 text-[11px] text-slate-500 font-medium">
                    <div className="w-5 h-5 rounded-full bg-white border flex items-center justify-center shrink-0">2</div>
                    Acesso imediato à área de membros.
                  </li>
                </ul>
              </div>

              <button 
                onClick={handleStartPayment}
                disabled={isGenerating}
                className="w-full bg-[#009EE3] text-white py-6 rounded-3xl font-black text-xl hover:bg-[#007db3] shadow-xl shadow-sky-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 group"
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    GERAR PAGAMENTO
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 grayscale opacity-40">
                <div className="px-2 py-1 border rounded text-[8px] font-black uppercase">PIX</div>
                <div className="px-2 py-1 border rounded text-[8px] font-black uppercase">Visa</div>
                <div className="px-2 py-1 border rounded text-[8px] font-black uppercase">Master</div>
                <div className="px-2 py-1 border rounded text-[8px] font-black uppercase">Boleto</div>
              </div>
            </div>

            <div className="mt-12 flex items-center gap-2 text-slate-300">
               <Lock size={12} />
               <span className="text-[9px] font-bold uppercase tracking-widest">SSL 256-bit Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

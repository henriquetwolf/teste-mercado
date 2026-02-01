
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PlayCircle, Award, BookOpen, Clock, Loader2, Sparkles, CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { COURSES } from '../constants';
import { supabase } from '../services/supabase';
import { verifyPaymentStatus } from '../services/mercadoPago';

export default function MyCourses() {
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    checkPaymentReturn();
    fetchMyEnrollments();
  }, []);

  async function checkPaymentReturn() {
    const params = new URLSearchParams(location.search);
    
    // O Mercado Pago pode enviar como payment_id ou collection_id dependendo da versão
    const paymentId = params.get('payment_id') || params.get('collection_id');
    const statusFromMP = params.get('status') || params.get('collection_status');

    console.log("Verificando retorno de pagamento:", { paymentId, statusFromMP });

    // Só inicia a verificação se houver um ID de pagamento na URL
    if (paymentId) {
      setVerifyingPayment(true);
      setVerificationError(null);
      
      try {
        // ETAPA DE SEGURANÇA: Consultar o Mercado Pago diretamente via API Server-side (simulada pelo fetch no service)
        const verification = await verifyPaymentStatus(paymentId);

        if (verification.approved && verification.external_reference) {
          const [userId, courseId] = verification.external_reference.split('---');

          // Validar se o usuário logado é o mesmo que pagou (segurança extra)
          const { data: sessionData } = await supabase.auth.getSession();
          const session = sessionData.session;
          
          if (session?.user.id !== userId) {
            console.error("Divergência de usuário:", { sessionUserId: session?.user.id, paymentUserId: userId });
            throw new Error("Este pagamento pertence a outra conta de usuário.");
          }

          // 1. Verificar se já está matriculado
          const { data: existing } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .maybeSingle();

          if (!existing) {
            console.log("Criando nova matrícula para o curso:", courseId);
            // 2. Liberar o curso no banco de dados (Tabela enrollments)
            const { error: enrollError } = await supabase.from('enrollments').insert({
              user_id: userId,
              course_id: courseId
            });

            if (enrollError) throw enrollError;

            // 3. Atualizar log de vendas para 'Pago'
            await supabase.from('sales')
              .update({ status: 'Pago', mp_payment_id: paymentId })
              .eq('mp_preference_id', params.get('preference_id') || params.get('merchant_order_id'));
            
            console.log("Curso liberado com sucesso!");
          }

          // Limpa os parâmetros da URL para evitar re-processamento em refresh
          navigate('/my-courses', { replace: true });
          await fetchMyEnrollments();
        } else if (statusFromMP === 'pending' || statusFromMP === 'in_process') {
          setVerificationError("Seu pagamento está sendo processado pelo Mercado Pago. O curso será liberado assim que for aprovado.");
        } else {
          setVerificationError(`O pagamento não pôde ser confirmado como aprovado. Status: ${verification.status || statusFromMP || 'Desconhecido'}`);
        }
      } catch (err: any) {
        console.error("Erro detalhado na liberação:", err);
        setVerificationError(err.message || "Não foi possível validar seu pagamento. Entre em contato com o suporte.");
      } finally {
        setVerifyingPayment(false);
      }
    }
  }

  async function fetchMyEnrollments() {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) return;

      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', session.user.id);

      if (error) throw error;
      if (data) {
        setPurchasedIds(data.map(item => item.course_id));
      }
    } catch (err) {
      console.error("Erro ao buscar matrículas:", err);
    } finally {
      setLoading(false);
    }
  }

  const [allAvailableCourses, setAllAvailableCourses] = useState<any[]>(COURSES);
  
  useEffect(() => {
    async function fetchAllCourses() {
      try {
        const { data } = await supabase.from('courses').select('*');
        if (data && data.length > 0) {
          setAllAvailableCourses(prev => {
            const combined = [...data, ...prev.filter(p => !data.find(d => d.id === p.id))];
            return combined;
          });
        }
      } catch (e) {
        console.error("Erro ao carregar lista de cursos:", e);
      }
    }
    fetchAllCourses();
  }, []);

  const myCourses = allAvailableCourses.filter(c => purchasedIds.includes(c.id));

  if (loading || verifyingPayment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <div className="relative mb-8">
          <div className="w-24 h-24 border-4 border-slate-100 border-t-sky-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <ShieldCheck className="text-sky-600" size={32} />
          </div>
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">
          {verifyingPayment ? 'Confirmando Pagamento...' : 'Carregando sua biblioteca...'}
        </h2>
        <p className="text-slate-500 text-center max-w-xs text-sm">
          {verifyingPayment 
            ? 'Estamos verificando com o Mercado Pago para liberar seu acesso instantaneamente.' 
            : 'Organizando seus cursos adquiridos.'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {verificationError && (
        <div className="max-w-7xl mx-auto px-4 pt-8">
          <div className="bg-amber-50 border border-amber-100 p-6 rounded-[24px] flex items-center gap-4 text-amber-800 animate-fade-in">
             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
               <ShieldAlert className="text-amber-500" />
             </div>
             <div>
               <h4 className="font-black text-sm uppercase tracking-tight">Status do Pagamento</h4>
               <p className="text-xs opacity-80">{verificationError}</p>
             </div>
             <button onClick={() => setVerificationError(null)} className="ml-auto text-amber-400 hover:text-amber-600 font-bold text-xs">Ocultar</button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 pt-16 pb-24 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
               <BookOpen size={24} />
            </div>
            <h1 className="text-4xl font-black tracking-tight">Meus Cursos</h1>
          </div>
          <p className="text-slate-400 font-medium">Sua biblioteca de conhecimento pessoal.</p>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12">
        {myCourses.length === 0 ? (
          <div className="bg-white rounded-[40px] p-20 text-center shadow-xl border border-slate-100">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100">
              <BookOpen className="text-slate-200" size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">Nenhum curso por aqui</h2>
            <p className="text-slate-500 mb-10 max-w-sm mx-auto">Após a confirmação do pagamento pelo gateway, seus treinamentos aparecerão automaticamente nesta área.</p>
            <Link to="/" className="bg-sky-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-sky-700 transition-all inline-flex items-center gap-2 shadow-xl">
              Ver Cursos Disponíveis <Sparkles size={18} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myCourses.map(course => (
              <div key={course.id} className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-500 group flex flex-col">
                <div className="aspect-video relative overflow-hidden">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                    <Link to={`/classroom/${course.id}`} className="bg-white text-sky-600 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                      <PlayCircle size={40} />
                    </Link>
                  </div>
                </div>
                <div className="p-8 flex-grow flex flex-col">
                  <h3 className="text-xl font-black text-slate-900 mb-6 group-hover:text-sky-600 transition-colors leading-tight line-clamp-2">{course.title}</h3>
                  <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      <Clock size={14} />
                      <span>Acesso Vitalício</span>
                    </div>
                    <Link to={`/classroom/${course.id}`} className="text-sm font-black text-sky-600 flex items-center gap-2 group/btn">
                      ASSISTIR <PlayCircle size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

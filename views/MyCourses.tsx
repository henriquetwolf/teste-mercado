
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PlayCircle, BookOpen, Clock, Loader2, Sparkles, ShieldAlert, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { COURSES } from '../constants';
import { supabase } from '../services/supabase';
import { verifyPaymentStatus, searchPayments } from '../services/mercadoPago';

export default function MyCourses() {
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [allAvailableCourses, setAllAvailableCourses] = useState<any[]>(COURSES);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await checkPaymentReturn(session.user);
        await fetchMyEnrollments(session.user.id);
        await fetchAllCourses();
      } else {
        navigate('/auth');
      }
      setLoading(false);
    };

    initialize();
  }, [location.search]);

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

  async function checkPaymentReturn(user: any) {
    const params = new URLSearchParams(location.search);
    const paymentId = params.get('payment_id') || params.get('collection_id');
    const statusFromMP = params.get('status') || params.get('collection_status');

    if (paymentId) {
      setVerifyingPayment(true);
      setVerificationError(null);
      
      try {
        const verification = await verifyPaymentStatus(paymentId);

        if (verification.approved && verification.external_reference) {
          const [userId, courseId] = verification.external_reference.split('---');

          if (user.id !== userId) {
            throw new Error("Este pagamento pertence a outra conta de usuário.");
          }

          await enrollUser(userId, courseId, paymentId);
          
          // Limpa a URL
          navigate('/my-courses', { replace: true });
        } else if (statusFromMP === 'pending' || statusFromMP === 'in_process') {
          setVerificationError("Seu pagamento está em análise. Assim que aprovado, o curso aparecerá aqui.");
        } else {
          // Se o gateway disse que deu erro, mas o usuário acha que pagou, damos a opção de sync manual
          setVerificationError(`O status atual do pagamento é: ${verification.status || statusFromMP || 'não identificado'}.`);
        }
      } catch (err: any) {
        console.error("Erro na liberação:", err);
        setVerificationError(err.message || "Erro ao validar pagamento automático.");
      } finally {
        setVerifyingPayment(false);
      }
    }
  }

  async function enrollUser(userId: string, courseId: string, paymentId: string) {
    // 1. Verificar se já está matriculado
    const { data: existing } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!existing) {
      // 2. Criar matrícula
      const { error: enrollError } = await supabase.from('enrollments').insert({
        user_id: userId,
        course_id: courseId
      });

      if (enrollError) throw enrollError;

      // 3. Atualizar venda
      await supabase.from('sales')
        .update({ status: 'Pago', mp_payment_id: paymentId })
        .match({ user_id: userId, course_id: courseId });
      
      console.log("Matrícula realizada com sucesso para o curso:", courseId);
    }
  }

  async function fetchMyEnrollments(userId: string) {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', userId);

      if (error) throw error;
      if (data) {
        setPurchasedIds(data.map(item => item.course_id));
      }
    } catch (err) {
      console.error("Erro ao buscar matrículas:", err);
    }
  }

  // Função para sincronizar pagamentos que podem ter falhado no retorno automático
  async function syncPurchases() {
    setSyncing(true);
    setVerificationError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const user = session.user;
      const mpPayments = await searchPayments(20);
      
      let enrolledCount = 0;

      for (const payment of mpPayments) {
        if (payment.status === 'approved' && payment.external_reference) {
          const [userId, courseId] = payment.external_reference.split('---');
          
          // Verifica se o pagamento é deste usuário e se ele ainda não tem o curso
          if (userId === user.id && !purchasedIds.includes(courseId)) {
            await enrollUser(userId, courseId, payment.id.toString());
            enrolledCount++;
          }
        }
      }

      if (enrolledCount > 0) {
        await fetchMyEnrollments(user.id);
        alert(`${enrolledCount} curso(s) novo(s) foram sincronizados com sucesso!`);
      } else {
        alert("Nenhum novo pagamento aprovado foi encontrado para sua conta.");
      }
    } catch (err: any) {
      alert("Erro ao sincronizar: " + err.message);
    } finally {
      setSyncing(false);
    }
  }

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
          {verifyingPayment ? 'Confirmando sua Compra...' : 'Carregando sua biblioteca...'}
        </h2>
        <p className="text-slate-500 text-center max-w-xs text-sm">
          Aguarde um momento enquanto validamos seu acesso com o Mercado Pago.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {verificationError && (
        <div className="max-w-7xl mx-auto px-4 pt-8">
          <div className="bg-white border border-slate-200 p-6 rounded-[32px] flex flex-col md:flex-row items-center gap-6 shadow-xl animate-fade-in">
             <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
               <AlertCircle className="text-amber-500" size={28} />
             </div>
             <div className="flex-grow text-center md:text-left">
               <h4 className="font-black text-slate-900">Problemas com sua compra?</h4>
               <p className="text-xs text-slate-500">{verificationError} Se você já pagou e o curso não aparece, tente sincronizar manualmente.</p>
             </div>
             <button 
               onClick={syncPurchases} 
               disabled={syncing}
               className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
             >
               {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
               SINCRONIZAR AGORA
             </button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 pt-16 pb-24 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
                 <BookOpen size={24} />
              </div>
              <h1 className="text-4xl font-black tracking-tight italic">MEUS CURSOS</h1>
            </div>
            <p className="text-slate-400 font-medium">Você tem {myCourses.length} curso(s) em sua biblioteca.</p>
          </div>
          
          <button 
            onClick={syncPurchases}
            disabled={syncing}
            className="bg-white/10 backdrop-blur-md border border-white/10 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2"
          >
            {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Sincronizar Biblioteca
          </button>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12">
        {myCourses.length === 0 ? (
          <div className="bg-white rounded-[40px] p-20 text-center shadow-xl border border-slate-100">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100">
              <BookOpen className="text-slate-200" size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">Sua estante está vazia</h2>
            <p className="text-slate-500 mb-10 max-w-sm mx-auto">Explore nosso catálogo e comece sua jornada de aprendizado hoje mesmo.</p>
            <Link to="/" className="bg-sky-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-sky-700 transition-all inline-flex items-center gap-2 shadow-xl">
              Explorar Cursos <Sparkles size={18} />
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

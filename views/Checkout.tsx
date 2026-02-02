
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, ChevronLeft, Loader2, Wallet, CheckCircle2, ArrowRight, Tag, X } from 'lucide-react';
import { COURSES } from '../constants';
import { supabase } from '../services/supabase';
import { createPreference } from '../services/mercadoPago';

export default function Checkout({ onComplete }: { onComplete: (id: string) => void }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isApplying, setIsApplying] = useState(false);

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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplying(true);
    setCouponError('');
    try {
      const { data } = await supabase.from('coupons').select('*').eq('code', couponCode.toUpperCase().trim()).eq('active', true).maybeSingle();
      if (!data) {
        setCouponError('Cupom inválido.');
        return;
      }
      setAppliedCoupon({ code: data.code, discount: data.discount_percent });
    } catch (err) {
      setCouponError('Erro ao validar.');
    } finally {
      setIsApplying(false);
    }
  };

  const calculateTotal = () => {
    if (!course) return 0;
    if (!appliedCoupon) return course.price;
    const discountAmount = (course.price * appliedCoupon.discount) / 100;
    return Math.max(0, course.price - discountAmount);
  };

  const handleStartPayment = async () => {
    if (!course || !user) return;
    setIsGenerating(true);
    const finalPrice = calculateTotal();
    
    try {
      const preferenceId = await createPreference(course, user, finalPrice);
      
      // Registrar intenção de compra no banco
      await supabase.from('sales').insert({
        user_id: user.id,
        course_id: course.id,
        amount: finalPrice,
        status: 'Iniciado',
        mp_preference_id: preferenceId,
        coupon_code: appliedCoupon?.code || null
      });

      // Abrir checkout do Mercado Pago
      const mp = new (window as any).MercadoPago(user.user_metadata?.mp_public_key || 'APP_USR-70131102-0943-4e4b-97e3-085e35384666'); // Fallback ou do perfil
      window.location.href = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`;
    } catch (err: any) {
      alert("Erro Mercado Pago: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" /></div>;
  if (!course) return <div className="p-20 text-center">Curso não encontrado</div>;

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-medium mb-8 hover:text-indigo-600 group transition-colors">
          <ChevronLeft size={20} /> Voltar
        </button>

        <div className="bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 p-12 bg-slate-900 text-white">
            <h2 className="text-3xl font-black mb-8 italic uppercase tracking-tighter">Pagamento Seguro</h2>
            <div className="space-y-6">
              <div className="flex justify-between items-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-sm font-bold">{course.title}</span>
                <span className="font-black text-indigo-400">R$ {calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck size={16} /> Protegido por Mercado Pago
              </div>
            </div>
          </div>

          <div className="flex-1 p-12 bg-white flex flex-col justify-center">
            <div className="mb-10 text-center">
              <img src="https://logodownload.org/wp-content/uploads/2017/06/mercado-pago-logo-1.png" className="h-6 mx-auto mb-4" alt="Mercado Pago" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gateway de Transação Certificado</p>
            </div>

            <button 
              onClick={handleStartPayment}
              disabled={isGenerating}
              className="w-full bg-[#009ee3] text-white py-6 rounded-3xl font-black text-xl hover:bg-[#0081ba] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-xl shadow-blue-100"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <>PAGAR COM MERCADO PAGO <ArrowRight size={20} /></>}
            </button>
            
            <p className="mt-8 text-[9px] text-slate-400 font-bold uppercase text-center leading-relaxed">
              Pagamento processado em ambiente criptografado. Seus dados estão 100% seguros.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
